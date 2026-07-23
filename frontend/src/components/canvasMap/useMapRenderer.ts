import { useEffect, useRef } from 'react';
import { ensureSpritesLoaded, drawIsoHover } from '../../lib/isoRenderer';
import { createCitizenTransit } from '../../lib/citizens';
import { toolColor } from '../../lib/constants';
import { recordRenderDiagnostic } from '../../lib/renderDiagnostics';
import { drawDecorativePedestrians, getPedestrianAt } from '../../lib/pedestrianSprites';
import { drawSidewalkInfrastructure } from '../../lib/sidewalkSystem';
import type { MapCamera } from './useMapCamera';
import { gridToView } from '../../lib/projection';
import { computeHouseRoles } from '../../lib/buildings/houseCluster';
import { computeHousingByTile, computeMarkerSet } from './mapStatePreprocessors';
import { drawBaseTerrainAndRoads, repaintBridges, drawTrafficSignals } from './mapTileRenderers';
import { drawBuildingsLayer } from './buildingLayerRenderer';
import { updateTransitAndOverlays } from './renderLoopHelpers';

type Props = {
  canvasRef: any;
  miniMapRef: any;
  tileMapRef: any;
  simStateRef: any;
  mapCols: number;
  mapRows: number;
  camera: MapCamera;
  currentToolRef: any;
  selectedEntityRef: any;
  hoverRef: any;
};

export function useMapRenderer({
  canvasRef,
  miniMapRef,
  tileMapRef,
  simStateRef,
  mapCols,
  mapRows,
  camera,
  currentToolRef,
  selectedEntityRef,
  hoverRef,
}: Props) {
  const transitRef = useRef<ReturnType<typeof createCitizenTransit> | null>(null);

  const handles = useRef<any>({
    traffic: { getCarAt: () => undefined, getPosition: () => undefined },
    citizenTransit: {
      getCitizenAt: (...args: any[]) => (transitRef.current?.getCitizenAt as any)(...args),
      getCommuteDelayState: (citizen: any) => transitRef.current?.getCommuteDelayState?.(citizen),
    },
    pedestrian: { getAt: (x: number, y: number, citizens: any[]) => getPedestrianAt(x, y, citizens) },
  });

  useEffect(() => {
    ensureSpritesLoaded();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const transit = createCitizenTransit();
    transitRef.current = transit;

    const minimapBase = document.createElement('canvas');
    minimapBase.width = 288;
    minimapBase.height = 216;

    let frameId = 0;
    let lastLowZoomFrame = 0;
    let frameSamples = 0;
    let sampleStart = performance.now();
    let timingState = {
      timingStart: performance.now(),
      timingFrames: 0,
      tileDrawMs: 0,
      proceduralBuildingMs: 0,
      citizenMs: 0,
      minimapMs: 0,
    };

    const draw = (time: number) => {
      try {
        const { zoom, ox, oy, rotation } = camera.values();
        if (zoom < 0.6 && time - lastLowZoomFrame < 32) {
          frameId = requestAnimationFrame(draw);
          return;
        }
        if (zoom < 0.6) lastLowZoomFrame = time;

        ctx.fillStyle = '#07100d';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const map = tileMapRef.current;
        if (!map?.length) {
          frameId = requestAnimationFrame(draw);
          return;
        }

        const project = camera.project;
        const margin = 180 * Math.max(1, zoom);
        const tileStart = performance.now();

        // Depth sorting
        const drawOrder = map
          .flatMap((tiles: any[], row: number) =>
            (tiles ?? []).map((tile: any, col: number) => {
              const view = gridToView(col, row, mapCols, mapRows, rotation);
              return {
                tile,
                col,
                row,
                projected: project(col, row),
                depth: view.col + view.row,
                depthSub: view.col,
              };
            })
          )
          .sort((a: any, b: any) => a.depth - b.depth || a.depthSub - b.depthSub);

        const houseRoles = computeHouseRoles(map, mapRows, mapCols);
        const housingByTile = computeHousingByTile(simStateRef.current);
        const markerSet = computeMarkerSet(map);

        // 1-3. Terrain, Bridges, Sidewalks & Pedestrians
        drawBaseTerrainAndRoads(ctx, drawOrder, canvas.width, canvas.height, zoom, margin, map, project, time, ox, oy, rotation);
        repaintBridges(ctx, drawOrder, canvas.width, canvas.height, zoom, margin, map, project, time, ox, oy);
        drawSidewalkInfrastructure(ctx, map, project, zoom, time);
        drawDecorativePedestrians(
          ctx,
          map,
          project,
          zoom,
          time,
          (simStateRef.current?.citizens ? Object.values(simStateRef.current.citizens).flat() : []) as any[]
        );

        // 4. Buildings Layer
        const bldgResult = drawBuildingsLayer(
          ctx,
          drawOrder,
          canvas.width,
          canvas.height,
          zoom,
          margin,
          map,
          project,
          time,
          ox,
          oy,
          rotation,
          simStateRef.current,
          housingByTile,
          houseRoles,
          markerSet
        );

        // 5. Traffic Signals
        drawTrafficSignals(ctx, drawOrder, canvas.width, canvas.height, zoom, margin, map, project, time);

        timingState.tileDrawMs += performance.now() - tileStart;
        timingState.proceduralBuildingMs += bldgResult.proceduralBuildingMs;
        timingState.timingFrames++;
        frameSamples++;

        if (frameSamples >= 120) {
          const elapsed = performance.now() - sampleStart;
          const b = {
            fps: Math.round((frameSamples * 1000) / elapsed),
            frameMs: +(elapsed / frameSamples).toFixed(2),
            visibleTiles: bldgResult.visibleTiles,
            totalTiles: mapCols * mapRows,
            zoom: +zoom.toFixed(2),
          };
          console.info('[render-benchmark]', b);
          recordRenderDiagnostic('[render-benchmark]', b);
          frameSamples = 0;
          sampleStart = performance.now();
        }

        // 6-9. Transit, Overlays & Diagnostics
        const transitRes = updateTransitAndOverlays(
          ctx,
          canvas,
          transit,
          time,
          { ox, oy, zoom },
          map,
          simStateRef.current,
          project,
          selectedEntityRef.current,
          miniMapRef,
          minimapBase,
          mapCols,
          mapRows,
          timingState
        );
        timingState.citizenMs = transitRes.citizenMs;
        timingState.minimapMs = transitRes.minimapMs;
        timingState.timingStart = transitRes.timingStart;
        timingState.timingFrames = transitRes.timingFrames;
        timingState.tileDrawMs = transitRes.tileDrawMs;
        timingState.proceduralBuildingMs = transitRes.proceduralBuildingMs;

        // 10. Hover Outline
        const hover = hoverRef.current;
        if (
          hover.col >= 0 &&
          hover.col < mapCols &&
          hover.row >= 0 &&
          hover.row < mapRows &&
          currentToolRef.current !== 'cursor'
        ) {
          drawIsoHover(ctx, hover.col, hover.row, ox, oy, zoom, toolColor(currentToolRef.current), project);
        }
      } catch (err) {
        console.error('[renderFrame-error]', err);
      }
      frameId = requestAnimationFrame(draw);
    };

    frameId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frameId);
      transitRef.current = null;
    };
  }, [canvasRef, miniMapRef, tileMapRef, simStateRef, mapCols, mapRows, camera, currentToolRef, selectedEntityRef, hoverRef]);

  return handles.current;
}
