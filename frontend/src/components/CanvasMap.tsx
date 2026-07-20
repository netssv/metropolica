'use client';
import { useEffect, useRef, useState } from 'react';
import { useGameContext } from '../hooks/GameContext';
import { T, toolColor, TOOL_COSTS } from '../lib/constants';
import { ISO_TILE_W, ISO_TILE_H, gridToIso, isoToGrid } from '../lib/isoMath';
import { ensureSpritesLoaded, drawIsoTile, drawIsoHover, drawOverviewMap } from '../lib/isoRenderer';
import { createTrafficSystem } from '../lib/trafficSystem';
import { createCitizenTransit } from '../lib/citizenTransit';
import { PROCEDURAL_DETAIL_ZOOM } from '../lib/buildingSprites';

const OVERVIEW_ZOOM = 0.35;
import { copyRenderDiagnostics, recordRenderDiagnostic } from '../lib/renderDiagnostics';

/** Total isometric canvas extent for initial camera centering */
export default function CanvasMap() {
  const { tileMapRef, currentTool, setCurrentTool, fetchState, simState, mapCols, mapRows } = useGameContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overviewCanvasRef = useRef<HTMLCanvasElement>(null);
  const miniMapRef = useRef<HTMLCanvasElement>(null);
  const miniDraggingRef = useRef(false);
  const miniWindowDragRef = useRef<{ dx: number; dy: number } | null>(null);
  const [miniVisible, setMiniVisible] = useState(false);
  const [overviewMode, setOverviewMode] = useState(false);
  const [miniPosition, setMiniPosition] = useState<{ x: number | null; y: number }>({ x: null, y: 58 });
  const currentToolRef = useRef(currentTool);
  const simStateRef = useRef(simState);
  const selectedEntityRef = useRef<any>(null);
  const fetchStateRef = useRef(fetchState);
  currentToolRef.current = currentTool;
  simStateRef.current = simState;
  fetchStateRef.current = fetchState;
  // Camera: offsetX/Y is the isometric world-origin in canvas space
  const cameraRef = useRef({ ox: 0, oy: 0, zoom: 1 });
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  selectedEntityRef.current = selectedEntity;

  useEffect(() => {
    ensureSpritesLoaded();
    const canvas = canvasRef.current;
    const overviewCanvas = overviewCanvasRef.current;
    if (!canvas || !overviewCanvas) return;
    const ctx = canvas.getContext('2d');
    const overviewCtx = overviewCanvas.getContext('2d');
    if (!ctx || !overviewCtx) return;
    const traffic = createTrafficSystem(tileMapRef);
    const citizenTransit = createCitizenTransit();
    const minimapBase = document.createElement('canvas');
    minimapBase.width = 288; minimapBase.height = 216;
    let minimapBaseMap: any[][] | null = null;

    let isDragging = false;
    let dragX = 0, dragY = 0;
    let hoverCol = -1, hoverRow = -1;
    let lastLowZoomFrame = 0;
    let frameSamples = 0;
    let frameSampleStart = performance.now();
    let timingFrames = 0;
    let timingStart = performance.now();
    let tileDrawMs = 0;
    let proceduralBuildingMs = 0;
    let trafficMs = 0;
    let citizenMs = 0;
    let minimapMs = 0;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      overviewCanvas.width = window.innerWidth;
      overviewCanvas.height = window.innerHeight;
      // Centre on the isometric world-space midpoint of the grid.
      // gridToIso(mapCols/2, mapRows/2) gives the screen-space origin of the
      // center tile BEFORE zoom/offset; we subtract that from canvas-center.
      const z = cameraRef.current.zoom;
      cameraRef.current.ox = canvas.width  / 2 - (mapCols / 2 - mapRows / 2) * (ISO_TILE_W / 2) * z;
      cameraRef.current.oy = canvas.height / 2 - (mapCols / 2 + mapRows / 2) * (ISO_TILE_H / 2) * z;
    };
    window.addEventListener('resize', resize);
    resize();

    /** Screen px → world-space iso (before zoom/offset) */
    const screenToIsoWorld = (sx: number, sy: number) => ({
      ix: (sx - cameraRef.current.ox) / cameraRef.current.zoom,
      iy: (sy - cameraRef.current.oy) / cameraRef.current.zoom,
    });

    const drawMap = (time: number) => {
      // At overview scale the eye cannot resolve 60 separate redraws per
      // second. Cap only the low-zoom view to reduce CPU/GPU pressure.
      if (cameraRef.current.zoom < 0.6 && time - lastLowZoomFrame < 32) return;
      if (cameraRef.current.zoom < 0.6) lastLowZoomFrame = time;
      ctx.fillStyle = '#07100d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const map = tileMapRef.current;
      if (!map || map.length === 0) return;

      const { ox, oy, zoom } = cameraRef.current;
      const projectionT = Math.max(0, Math.min(1, (.55 - zoom) / (.55 - OVERVIEW_ZOOM)));
      overviewCanvas.style.opacity = String(projectionT);
      canvas.style.opacity = String(1 - projectionT);
      if (projectionT > 0) drawOverviewMap(overviewCtx, canvas, projectionT, zoom, ox, oy, mapCols, mapRows);
      const margin = 180 * Math.max(1, zoom);
      let visibleTiles = 0;
      const tileStart = performance.now();
      let proceduralStart = 0;

      // Depth-sort: draw back-to-front (painter's algorithm for isometric)
      // In isometric, tiles with lower (col+row) are drawn first (farther away)
      for (let sum = 0; sum <= mapCols + mapRows - 2; sum++) {
        for (let row = Math.max(0, sum - mapCols + 1); row <= Math.min(sum, mapRows - 1); row++) {
          const col = sum - row;
          if (col < 0 || col >= mapCols) continue;
          const tile = map[row]?.[col];
          if (!tile) continue;
          const iso = gridToIso(col, row);
          const tileX = iso.x * zoom + ox;
          const tileY = iso.y * zoom + oy;
          if (tileX > canvas.width + margin || tileX + ISO_TILE_W * zoom < -margin ||
              tileY > canvas.height + margin || tileY + ISO_TILE_H * zoom * 3.5 < -margin) continue;
          visibleTiles++;
          
          const district = simStateRef.current?.districts?.find((d: any) => d.id === tile.owner);
          const inCrisis = district ? district.social?.atRisk : false;
          // First-pass growth formula: population, income, and approval must
          // all clear simple district thresholds before a tile reaches tier 2.
          // Tier 0 remains an undeveloped lot; this is intentionally tunable.
          const growthTier = !district ? 0 :
            district.population >= 2000 && district.economy?.averageIncome >= 2000 && district.approval >= 0.65 ? 2 :
            district.population >= 700 && district.economy?.averageIncome >= 1000 && district.approval >= 0.45 ? 1 : 0;
          
          const isProcedural = tile.type.startsWith('bldg-') || tile.type.startsWith('zone-') || tile.type === T.POWER || tile.type === T.PARK;
          if (isProcedural) proceduralStart = performance.now();
          drawIsoTile(ctx, { ...tile, inCrisis, growthTier }, col, row, ox, oy, zoom, map);
          if (isProcedural) proceduralBuildingMs += performance.now() - proceduralStart;
        }
      }
      tileDrawMs += performance.now() - tileStart;
      timingFrames++;
      frameSamples++;
      if (frameSamples >= 120) {
        const elapsed = performance.now() - frameSampleStart;
        const benchmark = { fps: Math.round(frameSamples * 1000 / elapsed), frameMs: +(elapsed / frameSamples).toFixed(2), visibleTiles, totalTiles: mapCols * mapRows, zoom: +zoom.toFixed(2) };
        console.info('[render-benchmark]', benchmark);
        recordRenderDiagnostic('[render-benchmark]', benchmark);
        frameSamples = 0; frameSampleStart = performance.now();
      }

      const simulationSpeed = simStateRef.current?.speed ?? 1;
      let subsystemStart = performance.now();
      traffic.updateAndDraw(ctx, time, ox, oy, zoom, simulationSpeed, zoom >= PROCEDURAL_DETAIL_ZOOM);
      trafficMs += performance.now() - subsystemStart;
      const followedCar = selectedEntityRef.current?.kind === 'traffic-car' ? traffic.getPosition(selectedEntityRef.current.value.id) : undefined;
      if (followedCar) {
        const followedIso = gridToIso(followedCar.col, followedCar.row);
        cameraRef.current.ox = canvas.width / 2 - (followedIso.x + ISO_TILE_W / 2) * zoom;
        cameraRef.current.oy = canvas.height / 2 - (followedIso.y + ISO_TILE_H / 2) * zoom;
      }
      subsystemStart = performance.now();
      citizenTransit.updateAndDraw(ctx, time, ox, oy, zoom, map, simStateRef.current?.citizens ? Object.values(simStateRef.current.citizens).flat() as any[] : [], simStateRef.current?.day ?? 1, simulationSpeed, zoom >= PROCEDURAL_DETAIL_ZOOM);
      citizenMs += performance.now() - subsystemStart;
      const mini = miniMapRef.current;
      if (mini) {
        subsystemStart = performance.now();
        const miniCtx = mini.getContext('2d');
        if (miniCtx) {
          const sx = mini.width / mapCols, sy = mini.height / mapRows;
          if (map !== minimapBaseMap) {
            const baseCtx = minimapBase.getContext('2d');
            if (baseCtx) {
              baseCtx.fillStyle = '#10251d'; baseCtx.fillRect(0, 0, minimapBase.width, minimapBase.height);
              for (let r = 0; r < map.length; r++) for (let c = 0; c < (map[r]?.length ?? 0); c++) {
                const type = map[r]?.[c]?.type;
                baseCtx.fillStyle = type === T.WATER ? '#26749a' : type === T.ROAD || type === T.BRIDGE ? '#b9b5a8' : type?.startsWith('bldg') ? '#b87333' : type === T.TREE ? '#276d42' : '#315b42';
                baseCtx.fillRect(c * sx, r * sy, Math.ceil(sx), Math.ceil(sy));
              }
              minimapBaseMap = map;
            }
          }
          miniCtx.clearRect(0, 0, mini.width, mini.height);
          miniCtx.drawImage(minimapBase, 0, 0, mini.width, mini.height);
          const citizens = simStateRef.current?.citizens ? Object.values(simStateRef.current.citizens).flat() as any[] : [];
          for (const citizen of citizens.filter(c => c.level === 3 && c.homeTile && c.workTile)) {
            miniCtx.strokeStyle = '#f5c542'; miniCtx.beginPath();
            miniCtx.moveTo((citizen.homeTile.col + .5) * sx, (citizen.homeTile.row + .5) * sy);
            miniCtx.lineTo((citizen.workTile.col + .5) * sx, (citizen.workTile.row + .5) * sy); miniCtx.stroke();
            miniCtx.fillStyle = '#25b7a7'; miniCtx.beginPath(); miniCtx.arc((citizen.homeTile.col + .5) * sx, (citizen.homeTile.row + .5) * sy, 3, 0, Math.PI * 2); miniCtx.fill();
            miniCtx.fillStyle = '#f5c542'; miniCtx.beginPath(); miniCtx.arc((citizen.workTile.col + .5) * sx, (citizen.workTile.row + .5) * sy, 3, 0, Math.PI * 2); miniCtx.fill();
          }
        }
        minimapMs += performance.now() - subsystemStart;
      }

      const timingElapsed = performance.now() - timingStart;
      if (timingElapsed >= 1000) {
        const divisor = Math.max(1, timingFrames);
        const timing = {
          tileDrawMs: +(tileDrawMs / divisor).toFixed(3),
          proceduralBuildingMs: +(proceduralBuildingMs / divisor).toFixed(3),
          trafficMs: +(trafficMs / divisor).toFixed(3),
          citizenMs: +(citizenMs / divisor).toFixed(3),
          minimapMs: +(minimapMs / divisor).toFixed(3),
          frames: timingFrames,
        };
        console.info('[render-subsystem-timing]', timing);
        recordRenderDiagnostic('[render-subsystem-timing]', timing);
        timingFrames = 0; timingStart = performance.now();
        tileDrawMs = 0; proceduralBuildingMs = 0; trafficMs = 0; citizenMs = 0; minimapMs = 0;
      }

      // Hover highlight
      if (hoverCol >= 0 && hoverCol < mapCols && hoverRow >= 0 && hoverRow < mapRows && currentToolRef.current !== 'cursor') {
        drawIsoHover(ctx, hoverCol, hoverRow, ox, oy, zoom, toolColor(currentToolRef.current));
      }
    };

    let frameId: number;
    const loop = (time: number) => { drawMap(time); frameId = requestAnimationFrame(loop); };
    frameId = requestAnimationFrame(loop);

    // ── Event handlers ──
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 2 || currentToolRef.current === 'cursor') {
        isDragging = true; dragX = e.clientX; dragY = e.clientY;
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        cameraRef.current.ox += e.clientX - dragX;
        cameraRef.current.oy += e.clientY - dragY;
        dragX = e.clientX; dragY = e.clientY;
      }
      const { ix, iy } = screenToIsoWorld(e.clientX, e.clientY);
      const g = isoToGrid(ix, iy);
      hoverCol = g.col; hoverRow = g.row;
    };

    const onMouseUp = () => { isDragging = false; };

    const onClick = async (e: MouseEvent) => {
      if (isDragging) return;
      const citizens = simStateRef.current?.citizens ? Object.values(simStateRef.current.citizens).flat() as any[] : [];
      if (currentToolRef.current === 'cursor') {
        const citizen = citizenTransit.getCitizenAt(e.clientX, e.clientY, citizens);
        const car = traffic.getCarAt(e.clientX, e.clientY);
        if (citizen) setSelectedEntity({ kind: 'citizen', value: citizen });
        else if (car) setSelectedEntity({ kind: 'traffic-car', value: car });
        else {
          const { ix, iy } = screenToIsoWorld(e.clientX, e.clientY);
          const { col, row } = isoToGrid(ix, iy);
          const tile = tileMapRef.current[row]?.[col];
          setSelectedEntity(tile ? { kind: 'tile', value: { ...tile, col, row } } : null);
        }
        return;
      }
      const { ix, iy } = screenToIsoWorld(e.clientX, e.clientY);
      const { col, row } = isoToGrid(ix, iy);
      if (col < 0 || col >= mapCols || row < 0 || row >= mapRows) return;

      const tile = tileMapRef.current[row]?.[col];
      if (!tile) return;

      const tool = currentToolRef.current;
      const cost = TOOL_COSTS[tool];
      const type = tool === 'demolish' ? 'DEMOLISH_TILE' : 'PLACE_ZONE';
      try {
        await fetch('/api/command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, zoneType: tool !== 'demolish' ? tool : undefined, district: tile.owner || 'centro', cost, col, row }),
        });
        await fetchStateRef.current();
      } catch (err) { console.error(err); }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      const oldZoom = cameraRef.current.zoom;
      const newZoom = Math.max(0.3, Math.min(4, oldZoom * factor));
      // Zoom towards mouse position
      const { ix, iy } = screenToIsoWorld(e.clientX, e.clientY);
      cameraRef.current.zoom = newZoom;
      setOverviewMode(newZoom < OVERVIEW_ZOOM);
      cameraRef.current.ox = e.clientX - ix * newZoom;
      cameraRef.current.oy = e.clientY - iy * newZoom;
    };

    const centerOnMiniPoint = (e: PointerEvent) => {
      const rect = miniMapRef.current?.getBoundingClientRect();
      if (!rect) return;
      const col = ((e.clientX - rect.left) / rect.width) * mapCols;
      const row = ((e.clientY - rect.top) / rect.height) * mapRows;
      const iso = gridToIso(col, row);
      cameraRef.current.ox = canvas.width / 2 - (iso.x + ISO_TILE_W / 2) * cameraRef.current.zoom;
      cameraRef.current.oy = canvas.height / 2 - (iso.y + ISO_TILE_H / 2) * cameraRef.current.zoom;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCurrentTool('cursor');
        setSelectedEntity(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    overviewCanvas.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('wheel', onWheel);
      overviewCanvas.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [tileMapRef, mapCols, mapRows]);

  return <>
    <canvas ref={canvasRef} id="city-canvas" className={overviewMode ? 'map-overview-hidden' : ''} tabIndex={0} />
    <canvas ref={overviewCanvasRef} id="city-overview-canvas" className={overviewMode ? 'overview-active' : ''} aria-hidden="true" />
    <button className="render-diagnostics-copy" onClick={() => copyRenderDiagnostics().catch(() => undefined)} title="Copiar benchmarks y timings del render">Copiar diagnóstico</button>
    {!miniVisible && <button className="minimap-show" onClick={() => setMiniVisible(true)}>Mostrar minimapa</button>}
    {miniVisible && <div className="test-minimap" style={{ left: miniPosition.x ?? undefined, right: miniPosition.x === null ? 16 : undefined, top: miniPosition.y }}>
      <div className="minimap-header"
        onPointerDown={e => { const rect = e.currentTarget.parentElement!.getBoundingClientRect(); miniWindowDragRef.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top }; e.currentTarget.setPointerCapture(e.pointerId); }}
        onPointerMove={e => { if (miniWindowDragRef.current) setMiniPosition({ x: Math.max(0, e.clientX - miniWindowDragRef.current.dx), y: Math.max(0, e.clientY - miniWindowDragRef.current.dy) }); }}
        onPointerUp={() => { miniWindowDragRef.current = null; }}
        onPointerCancel={() => { miniWindowDragRef.current = null; }}>
        <span>MINIMAP · clic/arrastre</span><button onPointerDown={e => e.stopPropagation()} onClick={() => setMiniVisible(false)}>Ocultar</button>
      </div>
      <canvas ref={miniMapRef} width={288} height={216}
      onWheel={e => { e.preventDefault(); e.stopPropagation(); const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1; const oldZoom = cameraRef.current.zoom; const newZoom = Math.max(0.3, Math.min(4, oldZoom * factor)); const ix = (e.clientX - cameraRef.current.ox) / oldZoom; const iy = (e.clientY - cameraRef.current.oy) / oldZoom; cameraRef.current.zoom = newZoom; cameraRef.current.ox = e.clientX - ix * newZoom; cameraRef.current.oy = e.clientY - iy * newZoom; setOverviewMode(newZoom < OVERVIEW_ZOOM); }}
      onPointerDown={e => { miniDraggingRef.current = true; e.currentTarget.setPointerCapture(e.pointerId); const rect = e.currentTarget.getBoundingClientRect(); const iso = gridToIso(((e.clientX - rect.left) / rect.width) * mapCols, ((e.clientY - rect.top) / rect.height) * mapRows); cameraRef.current.ox = window.innerWidth / 2 - (iso.x + ISO_TILE_W / 2) * cameraRef.current.zoom; cameraRef.current.oy = window.innerHeight / 2 - (iso.y + ISO_TILE_H / 2) * cameraRef.current.zoom; }}
      onPointerMove={e => { if (!miniDraggingRef.current) return; const rect = e.currentTarget.getBoundingClientRect(); const iso = gridToIso(((e.clientX - rect.left) / rect.width) * mapCols, ((e.clientY - rect.top) / rect.height) * mapRows); cameraRef.current.ox = window.innerWidth / 2 - (iso.x + ISO_TILE_W / 2) * cameraRef.current.zoom; cameraRef.current.oy = window.innerHeight / 2 - (iso.y + ISO_TILE_H / 2) * cameraRef.current.zoom; }}
      onPointerUp={() => { miniDraggingRef.current = false; }} onPointerCancel={() => { miniDraggingRef.current = false; }} /></div>}
    {selectedEntity && <div className="citizen-inspector">
      <button onClick={() => setSelectedEntity(null)} aria-label="Cerrar">×</button>
      <strong>{selectedEntity.kind === 'citizen' ? 'Vehículo ciudadano' : selectedEntity.kind === 'traffic-car' ? 'Vehículo ambiental' : 'Elemento del mapa'}</strong>
      {selectedEntity.kind === 'citizen' && <>
        <span>ID: {selectedEntity.value.id}</span>
        <span>Distrito: {selectedEntity.value.districtId ?? selectedEntity.value.id?.split('-citizen-')[0] ?? '—'}</span>
        <span>Hogar: {selectedEntity.value.householdId ?? '—'}</span>
        <span>Edad: {selectedEntity.value.age ?? '—'}</span>
        <span>Ocupación: {selectedEntity.value.occupation ?? '—'}</span>
        <span>Destino: {selectedEntity.value.workplaceType ?? '—'}</span>
        <span>Educación: {selectedEntity.value.education ?? '—'}</span>
        <span>Municipio: {selectedEntity.value.municipality ?? '—'}</span>
        <span>Región: {selectedEntity.value.region ?? '—'}</span>
        <span>Idioma: {selectedEntity.value.language ?? '—'}</span>
        <span>Intereses: {selectedEntity.value.interests?.join(', ') || '—'}</span>
        <span>Nivel: {selectedEntity.value.level} · Estado: activo</span>
        <span>Causa: {selectedEntity.value.activeCause ?? '—'}</span>
        <span>Problema actual: {selectedEntity.value.currentProblem ?? '—'}</span>
        <span>Vive: ({selectedEntity.value.homeTile?.col ?? '—'}, {selectedEntity.value.homeTile?.row ?? '—'})</span>
        <span>Propósito: ir al trabajo</span>
        <span>Turno: {selectedEntity.value.workShift ? `${String(selectedEntity.value.workShift.startHour).padStart(2, '0')}:00–${String(selectedEntity.value.workShift.endHour).padStart(2, '0')}:00` : '—'}</span>
        <span>Trabajo: ({selectedEntity.value.workTile?.col ?? '—'}, {selectedEntity.value.workTile?.row ?? '—'})</span>
        <span>Habilidades: {selectedEntity.value.skills?.map((value: number) => value.toFixed(2)).join(', ') || '—'}</span>
        <span>Aspiraciones: {selectedEntity.value.aspirations?.map((value: number) => value.toFixed(2)).join(', ') || '—'}</span>
        <span>Rasgos: {selectedEntity.value.traits?.map((value: number) => value.toFixed(2)).join(', ') || '—'}</span>
        <span>Relaciones: {selectedEntity.value.relationships?.join(', ') || '—'}</span>
      </>}
      {selectedEntity.kind === 'traffic-car' && <>
        <span>Tipo: tráfico ambiental · {selectedEntity.value.vehicleType ?? 'car'}</span>
        <span>Conductor: no asignado</span>
        <span>Taxi: {selectedEntity.value.vehicleType === 'taxi' ? 'sí' : 'no'}</span>
        <span>Viene de: {selectedEntity.value.from}</span>
        <span>Va hacia: {selectedEntity.value.to}</span>
        <span>Posición de carretera: {selectedEntity.value.location}</span>
      </>}
      {selectedEntity.kind === 'tile' && <>
        <span>Tipo: {selectedEntity.value.type}</span>
        <span>Coordenadas: ({selectedEntity.value.col}, {selectedEntity.value.row})</span>
        <span>Distrito: {selectedEntity.value.owner ?? '—'}</span>
      </>}
    </div>}
  </>;
}
