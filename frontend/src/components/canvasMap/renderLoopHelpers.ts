import { PROCEDURAL_DETAIL_ZOOM } from '../../lib/buildingSprites';
import { drawNightOverlay, renderMinimap } from './minimapAndOverlay';
import { recordRenderDiagnostic } from '../../lib/renderDiagnostics';

export function prepareTransitUpdate(
  ctx: CanvasRenderingContext2D,
  transit: any,
  time: number,
  cameraValues: { ox: number; oy: number; zoom: number },
  map: any[][],
  simState: any,
  project: any,
  selectedEntity: any
): { householdIncomes: Record<string, number>; startTransit: number } {
  const { ox, oy, zoom } = cameraValues;
  const state = simState;
  const startTransit = performance.now();

  transit.syncState(state?.day ?? 1, state?.hour ?? 0);
  const householdIncomes: Record<string, number> = {};
  for (const district of state?.districts ?? []) {
    for (const [index, cohort] of (district.cohorts ?? []).entries()) {
      householdIncomes[`${district.id}-cohort-${index}`] = cohort.income ?? 0;
    }
  }

  // Run vehicle update and bucket per-tile render tasks
  transit.updateAndDraw(
    ctx,
    time,
    ox,
    oy,
    zoom,
    map,
    (state?.citizens ? Object.values(state.citizens).flat() : []) as any[],
    state?.day ?? 1,
    state?.hour ?? 0,
    state?.speed ?? 1,
    zoom >= PROCEDURAL_DETAIL_ZOOM,
    project,
    selectedEntity?.kind === 'citizen' ? selectedEntity.value.id : undefined,
    (command: any) =>
      fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command),
      }),
    householdIncomes,
    'UPDATE_ONLY'
  );

  return { householdIncomes, startTransit };
}

export function finishOverlaysAndDiagnostics(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  startTransit: number,
  cameraValues: { ox: number; oy: number; zoom: number },
  map: any[][],
  simState: any,
  project: any,
  selectedEntity: any,
  miniMapRef: any,
  minimapBase: HTMLCanvasElement,
  mapCols: number,
  mapRows: number,
  timingState: {
    timingStart: number;
    timingFrames: number;
    tileDrawMs: number;
    proceduralBuildingMs: number;
    citizenMs: number;
    minimapMs: number;
  }
): { citizenMs: number; minimapMs: number; timingStart: number; timingFrames: number; tileDrawMs: number; proceduralBuildingMs: number } {
  const { zoom } = cameraValues;
  const state = simState;

  const citizenMs = timingState.citizenMs + (performance.now() - startTransit);

  // 1. Night Overlay
  drawNightOverlay(ctx, canvas.width, canvas.height, state?.hour ?? 0);

  // 2. DevMode Highlight Box
  if (selectedEntity?.value && (selectedEntity.value.col !== undefined || selectedEntity.value.isoPos)) {
    const col = selectedEntity.value.col ?? selectedEntity.value.gridPos?.col;
    const row = selectedEntity.value.row ?? selectedEntity.value.gridPos?.row;
    if (col !== undefined && row !== undefined && project) {
      const p = project(col, row);
      const hw = 32 * zoom;
      const hh = 16 * zoom;

      const nameStr = (selectedEntity.value.name || '').toLowerCase();
      const typeStr = (selectedEntity.value.type || '').toLowerCase();
      const state = selectedEntity.value.state || {};
      const isVert = nameStr.includes('vertical') || typeStr.includes('vertical') || state.orientation === 'vertical';
      const isHoriz = nameStr.includes('horizontal') || typeStr.includes('horizontal') || state.orientation === 'horizontal';

      let nX = p.x + hw, nY = p.y;
      let eX = p.x + hw * 2, eY = p.y + hh;
      let sX = p.x + hw, sY = p.y + hh * 2;
      let wX = p.x, wY = p.y + hh;

      if (isVert) {
        const pB = project(col, row + 1);
        sX = pB.x + hw;     sY = pB.y + hh * 2;
        wX = pB.x;          wY = pB.y + hh;
      } else if (isHoriz) {
        const pB = project(col + 1, row);
        eX = pB.x + hw * 2; eY = pB.y + hh;
        sX = pB.x + hw;     sY = pB.y + hh * 2;
      }

      ctx.save();
      ctx.strokeStyle = '#00e6b4';
      ctx.lineWidth = Math.max(2, 3 * zoom);
      ctx.shadowColor = '#00e6b4';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(nX, nY);
      ctx.lineTo(eX, eY);
      ctx.lineTo(sX, sY);
      ctx.lineTo(wX, wY);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }
  }

  // 3. Minimap Render
  const minimapMs = timingState.minimapMs + renderMinimap(miniMapRef, minimapBase, map, mapCols, mapRows);

  // 4. Diagnostics
  const elapsed = performance.now() - timingState.timingStart;
  let timingStart = timingState.timingStart;
  let timingFrames = timingState.timingFrames;
  let tileDrawMs = timingState.tileDrawMs;
  let proceduralBuildingMs = timingState.proceduralBuildingMs;

  if (elapsed >= 1000) {
    const d = Math.max(1, timingFrames);
    const timing = {
      tileDrawMs: +(tileDrawMs / d).toFixed(3),
      proceduralBuildingMs: +(proceduralBuildingMs / d).toFixed(3),
      citizenMs: +(citizenMs / d).toFixed(3),
      minimapMs: +(minimapMs / d).toFixed(3),
      frames: timingFrames,
    };
    console.info('[render-subsystem-timing]', timing);
    recordRenderDiagnostic('[render-subsystem-timing]', timing);
    timingFrames = 0;
    timingStart = performance.now();
    tileDrawMs = 0;
    proceduralBuildingMs = 0;
  }

  return { citizenMs, minimapMs, timingStart, timingFrames, tileDrawMs, proceduralBuildingMs };
}
