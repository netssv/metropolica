'use client';
import { useEffect, useRef, useState } from 'react';
import { useGameContext } from '../hooks/GameContext';
import { MAP_COLS, MAP_ROWS, T, toolColor, TOOL_COSTS } from '../lib/constants';
import { ISO_TILE_W, ISO_TILE_H, gridToIso, isoToGrid } from '../lib/isoMath';
import { ensureSpritesLoaded, drawIsoTile, drawIsoHover } from '../lib/isoRenderer';
import { createTrafficSystem } from '../lib/trafficSystem';
import { createCitizenTransit } from '../lib/citizenTransit';

/** Total isometric canvas extent for initial camera centering */
const ISO_MAP_W = (MAP_COLS + MAP_ROWS) * (ISO_TILE_W / 2);
const ISO_MAP_H = (MAP_COLS + MAP_ROWS) * (ISO_TILE_H / 2);

export default function CanvasMap() {
  const { tileMapRef, currentTool, setCurrentTool, fetchState, simState } = useGameContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const miniMapRef = useRef<HTMLCanvasElement>(null);
  const miniDraggingRef = useRef(false);
  const miniWindowDragRef = useRef<{ dx: number; dy: number } | null>(null);
  const [miniVisible, setMiniVisible] = useState(true);
  const [miniPosition, setMiniPosition] = useState<{ x: number | null; y: number }>({ x: null, y: 58 });
  const currentToolRef = useRef(currentTool);
  const simStateRef = useRef(simState);
  const fetchStateRef = useRef(fetchState);
  currentToolRef.current = currentTool;
  simStateRef.current = simState;
  fetchStateRef.current = fetchState;
  // Camera: offsetX/Y is the isometric world-origin in canvas space
  const cameraRef = useRef({ ox: 0, oy: 0, zoom: 1 });
  const [selectedEntity, setSelectedEntity] = useState<any>(null);

  useEffect(() => {
    console.log('%c[CANVASMAP MOUNT]', 'background: red; color: white; font-size: 20px');
    ensureSpritesLoaded();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const traffic = createTrafficSystem(tileMapRef);
    const citizenTransit = createCitizenTransit();

    let isDragging = false;
    let dragX = 0, dragY = 0;
    let hoverCol = -1, hoverRow = -1;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      // Centre on the isometric world-space midpoint of the grid.
      // gridToIso(MAP_COLS/2, MAP_ROWS/2) gives the screen-space origin of the
      // center tile BEFORE zoom/offset; we subtract that from canvas-center.
      const z = cameraRef.current.zoom;
      cameraRef.current.ox = canvas.width  / 2 - (MAP_COLS / 2 - MAP_ROWS / 2) * (ISO_TILE_W / 2) * z;
      cameraRef.current.oy = canvas.height / 2 - (MAP_COLS / 2 + MAP_ROWS / 2) * (ISO_TILE_H / 2) * z;
    };
    window.addEventListener('resize', resize);
    resize();

    /** Screen px → world-space iso (before zoom/offset) */
    const screenToIsoWorld = (sx: number, sy: number) => ({
      ix: (sx - cameraRef.current.ox) / cameraRef.current.zoom,
      iy: (sy - cameraRef.current.oy) / cameraRef.current.zoom,
    });

    const drawMap = (time: number) => {
      ctx.fillStyle = '#07100d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const map = tileMapRef.current;
      if (!map || map.length === 0) return;

      const { ox, oy, zoom } = cameraRef.current;

      // Depth-sort: draw back-to-front (painter's algorithm for isometric)
      // In isometric, tiles with lower (col+row) are drawn first (farther away)
      for (let sum = 0; sum <= MAP_COLS + MAP_ROWS - 2; sum++) {
        for (let row = Math.max(0, sum - MAP_COLS + 1); row <= Math.min(sum, MAP_ROWS - 1); row++) {
          const col = sum - row;
          if (col < 0 || col >= MAP_COLS) continue;
          const tile = map[row]?.[col];
          if (!tile) continue;
          
          const district = simStateRef.current?.districts?.find((d: any) => d.id === tile.owner);
          const inCrisis = district ? district.social?.atRisk : false;
          
          drawIsoTile(ctx, { ...tile, inCrisis }, col, row, ox, oy, zoom, map);
        }
      }

      const simulationSpeed = simStateRef.current?.speed ?? 1;
      traffic.updateAndDraw(ctx, time, ox, oy, zoom, simulationSpeed);
      citizenTransit.updateAndDraw(ctx, time, ox, oy, zoom, map, simStateRef.current?.citizens ? Object.values(simStateRef.current.citizens).flat() as any[] : [], simStateRef.current?.day ?? 1, simulationSpeed);
      const mini = miniMapRef.current;
      if (mini) {
        const miniCtx = mini.getContext('2d');
        if (miniCtx) {
          const sx = mini.width / MAP_COLS, sy = mini.height / MAP_ROWS;
          miniCtx.fillStyle = '#10251d'; miniCtx.fillRect(0, 0, mini.width, mini.height);
          for (let r = 0; r < map.length; r++) for (let c = 0; c < (map[r]?.length ?? 0); c++) {
            const type = map[r]?.[c]?.type;
            miniCtx.fillStyle = type === T.WATER ? '#26749a' : type === T.ROAD || type === T.BRIDGE ? '#b9b5a8' : type?.startsWith('bldg') ? '#b87333' : type === T.TREE ? '#276d42' : '#315b42';
            miniCtx.fillRect(c * sx, r * sy, Math.ceil(sx), Math.ceil(sy));
          }
          const citizens = simStateRef.current?.citizens ? Object.values(simStateRef.current.citizens).flat() as any[] : [];
          for (const citizen of citizens.filter(c => c.level === 3 && c.homeTile && c.workTile)) {
            miniCtx.strokeStyle = '#f5c542'; miniCtx.beginPath();
            miniCtx.moveTo((citizen.homeTile.col + .5) * sx, (citizen.homeTile.row + .5) * sy);
            miniCtx.lineTo((citizen.workTile.col + .5) * sx, (citizen.workTile.row + .5) * sy); miniCtx.stroke();
            miniCtx.fillStyle = '#25b7a7'; miniCtx.beginPath(); miniCtx.arc((citizen.homeTile.col + .5) * sx, (citizen.homeTile.row + .5) * sy, 3, 0, Math.PI * 2); miniCtx.fill();
            miniCtx.fillStyle = '#f5c542'; miniCtx.beginPath(); miniCtx.arc((citizen.workTile.col + .5) * sx, (citizen.workTile.row + .5) * sy, 3, 0, Math.PI * 2); miniCtx.fill();
          }
        }
      }

      // Hover highlight
      if (hoverCol >= 0 && hoverCol < MAP_COLS && hoverRow >= 0 && hoverRow < MAP_ROWS && currentToolRef.current !== 'cursor') {
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
      if (col < 0 || col >= MAP_COLS || row < 0 || row >= MAP_ROWS) return;

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
      cameraRef.current.ox = e.clientX - ix * newZoom;
      cameraRef.current.oy = e.clientY - iy * newZoom;
    };

    const centerOnMiniPoint = (e: PointerEvent) => {
      const rect = miniMapRef.current?.getBoundingClientRect();
      if (!rect) return;
      const col = ((e.clientX - rect.left) / rect.width) * MAP_COLS;
      const row = ((e.clientY - rect.top) / rect.height) * MAP_ROWS;
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

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [tileMapRef]);

  return <>
    <canvas ref={canvasRef} id="city-canvas" tabIndex={0} />
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
      onPointerDown={e => { miniDraggingRef.current = true; e.currentTarget.setPointerCapture(e.pointerId); const rect = e.currentTarget.getBoundingClientRect(); const iso = gridToIso(((e.clientX - rect.left) / rect.width) * MAP_COLS, ((e.clientY - rect.top) / rect.height) * MAP_ROWS); cameraRef.current.ox = window.innerWidth / 2 - (iso.x + ISO_TILE_W / 2) * cameraRef.current.zoom; cameraRef.current.oy = window.innerHeight / 2 - (iso.y + ISO_TILE_H / 2) * cameraRef.current.zoom; }}
      onPointerMove={e => { if (!miniDraggingRef.current) return; const rect = e.currentTarget.getBoundingClientRect(); const iso = gridToIso(((e.clientX - rect.left) / rect.width) * MAP_COLS, ((e.clientY - rect.top) / rect.height) * MAP_ROWS); cameraRef.current.ox = window.innerWidth / 2 - (iso.x + ISO_TILE_W / 2) * cameraRef.current.zoom; cameraRef.current.oy = window.innerHeight / 2 - (iso.y + ISO_TILE_H / 2) * cameraRef.current.zoom; }}
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
        <span>Tipo: tráfico ambiental</span>
        <span>Conductor: no asignado</span>
        <span>Taxi: no</span>
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
