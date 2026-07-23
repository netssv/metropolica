import { useEffect, useRef } from 'react';
import { ensureSpritesLoaded, drawIsoTile, drawIsoHover, drawTrafficSignalHeads } from '../../lib/isoRenderer';
import { gridToIso, ISO_TILE_H, ISO_TILE_W } from '../../lib/isoMath';
import { createCitizenTransit } from '../../lib/citizens';
import { PROCEDURAL_DETAIL_ZOOM } from '../../lib/buildingSprites';
import { T, toolColor } from '../../lib/constants';
import { recordRenderDiagnostic } from '../../lib/renderDiagnostics';
import { selectBusinessMarkers } from '../../lib/businessAccents';
import { drawDecorativePedestrians, getPedestrianAt } from '../../lib/pedestrianSprites';
import { drawSidewalkInfrastructure } from '../../lib/sidewalkSystem';
import type { MapCamera } from './useMapCamera';

import { computeHouseRoles } from '../../lib/buildings/houseCluster';

type Props = { canvasRef: any; miniMapRef: any; tileMapRef: any; simStateRef: any; mapCols: number; mapRows: number; camera: MapCamera; currentToolRef: any; selectedEntityRef: any; hoverRef: any; };
export function useMapRenderer({ canvasRef, miniMapRef, tileMapRef, simStateRef, mapCols, mapRows, camera, currentToolRef, selectedEntityRef, hoverRef }: Props) {
  const transitRef = useRef<ReturnType<typeof createCitizenTransit> | null>(null);
  const handles = useRef<any>({ traffic: { getCarAt: (..._args: any[]) => undefined, getPosition: (..._args: any[]) => undefined }, citizenTransit: { getCitizenAt: (...args: any[]) => (transitRef.current?.getCitizenAt as any)(...args), getCommuteDelayState: (citizen: any) => transitRef.current?.getCommuteDelayState?.(citizen) }, pedestrian: { getAt: (x: number, y: number, citizens: any[]) => getPedestrianAt(x, y, citizens) } });
  useEffect(() => {
    ensureSpritesLoaded(); const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d'); if (!ctx) return;
    const transit = createCitizenTransit(); transitRef.current = transit;
    const minimapBase = document.createElement('canvas'); minimapBase.width = 288; minimapBase.height = 216; let minimapBaseMap: any = null;
    let frameId = 0, lastLowZoomFrame = 0, frameSamples = 0, sampleStart = performance.now(), timingFrames = 0, timingStart = performance.now();
    let tileDrawMs = 0, proceduralBuildingMs = 0, citizenMs = 0, minimapMs = 0;
    const draw = (time: number) => {
      const { zoom, ox, oy } = camera.values(); if (zoom < .6 && time - lastLowZoomFrame < 32) { frameId = requestAnimationFrame(draw); return; } if (zoom < .6) lastLowZoomFrame = time;
      ctx.fillStyle = '#07100d'; ctx.fillRect(0, 0, canvas.width, canvas.height); const map = tileMapRef.current; if (!map?.length) { frameId = requestAnimationFrame(draw); return; } const project = camera.project; const margin = 180 * Math.max(1, zoom); let visibleTiles = 0; const tileStart = performance.now();
      // Painter order must follow the rotated projected depth, otherwise a building
      // can incorrectly paint over a nearer tile after a quarter-turn.
      const drawOrder: { tile: any; col: number; row: number; projected: { x: number; y: number } }[] = map.flatMap((tiles: any[], row: number) => (tiles ?? []).map((tile: any, col: number) => ({ tile, col, row, projected: project(col, row) }))).sort((a: { projected: { x: number; y: number } }, b: { projected: { x: number; y: number } }) => a.projected.y - b.projected.y || a.projected.x - b.projected.x);
      const houseRoles = computeHouseRoles(map, mapRows, mapCols);
      const housingByTile = new Map<string, { income: number; householdSize: number }>(); const stateForHousing = simStateRef.current; for (const [districtId, districtCitizens] of Object.entries(stateForHousing?.citizens ?? {})) for (const citizen of districtCitizens as any[]) { if (!citizen.homeTile) continue; const index = Number(String(citizen.householdId ?? '').split('-').pop()); const income = (stateForHousing?.districts ?? []).find((d: any) => d.id === districtId)?.cohorts?.[index]?.income ?? 0; const key = `${districtId}:${citizen.homeTile.col}:${citizen.homeTile.row}`; const previous = housingByTile.get(key); housingByTile.set(key, { income: Math.max(previous?.income ?? 0, income), householdSize: (previous?.householdSize ?? 0) + 1 }); } const markerSet = new Set<string>(); const markerTilesByDistrict = new Map<string, any[]>(); for (const row of map) for (const tile of row ?? []) { const key = tile.owner ?? ''; const list = markerTilesByDistrict.get(key) ?? []; list.push(tile); markerTilesByDistrict.set(key, list); } for (const tiles of markerTilesByDistrict.values()) for (const service of ['gasoline', 'supermarket'] as const) for (const tile of selectBusinessMarkers(tiles, service)) markerSet.add(`${tile.type}:${tile.col}:${tile.row}`);
      // 1. Draw base terrain & roads
      for (const { tile, col, row, projected } of drawOrder) {
        if (!tile) continue;
        if (projected.x > canvas.width + margin || projected.x + ISO_TILE_W * zoom < -margin || projected.y > canvas.height + margin || projected.y + ISO_TILE_H * zoom * 3.5 < -margin) continue;
        if (tile.type === T.BLDG_R || tile.type === T.BLDG_C || tile.type === T.BLDG_I || tile.type === T.ZONE_R || tile.type === T.ZONE_C || tile.type === T.ZONE_I || tile.type === T.POWER || tile.type === T.PARK) {
          // Draw terrain base only during the first terrain pass
          const terrainColor = tile.type === T.PARK ? '#3a7a4a' : '#315b42';
          drawIsoTile(ctx, { type: T.GRASS }, col, row, ox, oy, zoom, map, project, time);
          continue;
        }
        drawIsoTile(ctx, tile, col, row, ox, oy, zoom, map, project, time);
      }

      // 2. Repaint bridge decks so water doesn't cover them
      for (const { tile, col, row, projected } of drawOrder) {
        if (!tile || tile.type !== T.BRIDGE) continue;
        if (projected.x > canvas.width + margin || projected.x + ISO_TILE_W * zoom < -margin || projected.y > canvas.height + margin || projected.y + ISO_TILE_H * zoom * 3.5 < -margin) continue;
        drawIsoTile(ctx, tile, col, row, ox, oy, zoom, map, project, time);
      }

      // 3. Draw Sidewalks & Crosswalks OVER road/bridge asphalt
      drawSidewalkInfrastructure(ctx, map, project, zoom, time);

      // Draw pedestrians before buildings so building facades occlude them
      // whenever their sidewalk path is behind the structure.
      drawDecorativePedestrians(ctx, map, project, zoom, time, (stateForHousing?.citizens ? Object.values(stateForHousing.citizens).flat() : []) as any[]);

      // 4. Draw Buildings in Isometric back-to-front order OVER terrain & sidewalks
      for (const { tile, col, row, projected } of drawOrder) {
        if (!tile) continue;
        if (!tile.type.startsWith('bldg-') && !tile.type.startsWith('zone-') && tile.type !== T.POWER && tile.type !== T.PARK) continue;
        if (projected.x > canvas.width + margin || projected.x + ISO_TILE_W * zoom < -margin || projected.y > canvas.height + margin || projected.y + ISO_TILE_H * zoom * 3.5 < -margin) continue;
        visibleTiles++;
        const district = simStateRef.current?.districts?.find((d: any) => d.id === tile.owner);
        const growthTier = !district ? 0 : district.population >= 2000 && district.economy?.averageIncome >= 2000 && district.approval >= .65 ? 2 : district.population >= 700 && district.economy?.averageIncome >= 1000 && district.approval >= .45 ? 1 : 0;
        const housing = tile.type === T.BLDG_R || tile.type === T.ZONE_R ? housingByTile.get(`${tile.owner ?? ''}:${col}:${row}`) : undefined;
        const occupiedResidentialTier = !housing ? 0 : housing.householdSize >= 2 ? 2 : 1;
        // Seeded buildings represent operating businesses/factories and must be
        // visible from day one. Fresh zones remain lots until the economic
        // development system promotes them.
        const builtStructureTier = tile.type.startsWith('bldg-') ? Math.max(1, growthTier) : growthTier;
        const effectiveGrowthTier = tile.type === T.BLDG_R || tile.type === T.ZONE_R ? occupiedResidentialTier : builtStructureTier;
        const houseRole = houseRoles.get(`${col}:${row}`);
        const start = performance.now();
        drawIsoTile(ctx, { ...tile, housing, houseRole, businessAccentTiles: markerSet.has(`${tile.type}:${col}:${row}`) ? [tile] : [], inCrisis: district?.social?.atRisk ?? false, growthTier: effectiveGrowthTier }, col, row, ox, oy, zoom, map, project, time);
        proceduralBuildingMs += performance.now() - start;
      }

      // 5. Draw Traffic and Signal heads over roads and buildings
      for (const { tile, col, row, projected } of drawOrder) { if (!tile) continue; if (projected.x > canvas.width + margin || projected.x + ISO_TILE_W * zoom < -margin || projected.y > canvas.height + margin || projected.y + ISO_TILE_H * zoom * 3.5 < -margin) continue; drawTrafficSignalHeads(ctx, projected.x, projected.y, zoom, map, col, row, time, project); }
      tileDrawMs += performance.now() - tileStart; timingFrames++; frameSamples++; if (frameSamples >= 120) { const elapsed = performance.now() - sampleStart; const b = { fps: Math.round(frameSamples * 1000 / elapsed), frameMs: +(elapsed / frameSamples).toFixed(2), visibleTiles, totalTiles: mapCols * mapRows, zoom: +zoom.toFixed(2) }; console.info('[render-benchmark]', b); recordRenderDiagnostic('[render-benchmark]', b); frameSamples = 0; sampleStart = performance.now(); }
      const state = simStateRef.current; const start = performance.now(); transit.syncState(state?.day ?? 1, state?.hour ?? 0); const householdIncomes: Record<string, number> = {}; for (const district of state?.districts ?? []) for (const [index, cohort] of (district.cohorts ?? []).entries()) householdIncomes[`${district.id}-cohort-${index}`] = cohort.income ?? 0; transit.updateAndDraw(ctx, time, ox, oy, zoom, map, (state?.citizens ? Object.values(state.citizens).flat() : []) as any[], state?.day ?? 1, state?.hour ?? 0, state?.speed ?? 1, zoom >= PROCEDURAL_DETAIL_ZOOM, project, selectedEntityRef.current?.kind === 'citizen' ? selectedEntityRef.current.value.id : undefined, command => fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(command) }), householdIncomes); citizenMs += performance.now() - start;
      const hour = state?.hour ?? 0;
      if (hour < 6 || hour >= 19) {
        ctx.save();
        ctx.fillStyle = 'rgba(5, 12, 35, 0.38)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(255, 246, 190, 0.9)'; ctx.beginPath(); ctx.arc(canvas.width - 90, 92, 24, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(5, 12, 35, 0.38)'; ctx.beginPath(); ctx.arc(canvas.width - 80, 84, 24, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(220, 232, 255, 0.75)';
        for (const [x, y] of [[.12, .16], [.3, .1], [.52, .2], [.72, .12], [.88, .28]]) { ctx.fillRect(canvas.width * x, canvas.height * y, 2, 2); }
        ctx.restore();
      }
      const mini = miniMapRef.current; if (mini) { const startMini = performance.now(); const miniCtx = mini.getContext('2d'); if (miniCtx) { const sx = mini.width / mapCols, sy = mini.height / mapRows; if (map !== minimapBaseMap) { const base = minimapBase.getContext('2d'); if (base) { base.fillStyle = '#10251d'; base.fillRect(0, 0, 288, 216); for (let r = 0; r < map.length; r++) for (let c = 0; c < (map[r]?.length ?? 0); c++) { const type = map[r]?.[c]?.type; base.fillStyle = type === T.WATER ? '#26749a' : type === T.ROAD || type === T.BRIDGE ? '#b9b5a8' : type?.startsWith('bldg') ? '#b87333' : type === T.TREE ? '#276d42' : '#315b42'; base.fillRect(c * sx, r * sy, Math.ceil(sx), Math.ceil(sy)); } minimapBaseMap = map; } } miniCtx.clearRect(0, 0, mini.width, mini.height); miniCtx.drawImage(minimapBase, 0, 0, mini.width, mini.height); } minimapMs += performance.now() - startMini; }
      const elapsed = performance.now() - timingStart; if (elapsed >= 1000) { const d = Math.max(1, timingFrames); const timing = { tileDrawMs: +(tileDrawMs / d).toFixed(3), proceduralBuildingMs: +(proceduralBuildingMs / d).toFixed(3), citizenMs: +(citizenMs / d).toFixed(3), minimapMs: +(minimapMs / d).toFixed(3), frames: timingFrames }; console.info('[render-subsystem-timing]', timing); recordRenderDiagnostic('[render-subsystem-timing]', timing); timingFrames = 0; timingStart = performance.now(); tileDrawMs = proceduralBuildingMs = citizenMs = minimapMs = 0; }
      const hover = hoverRef.current; if (hover.col >= 0 && hover.col < mapCols && hover.row >= 0 && hover.row < mapRows && currentToolRef.current !== 'cursor') drawIsoHover(ctx, hover.col, hover.row, ox, oy, zoom, toolColor(currentToolRef.current), project);
      frameId = requestAnimationFrame(draw);
    };
    frameId = requestAnimationFrame(draw); return () => { cancelAnimationFrame(frameId); transitRef.current = null; };
  }, [canvasRef, miniMapRef, tileMapRef, simStateRef, mapCols, mapRows, camera, currentToolRef, selectedEntityRef]);
  return handles.current;
}
