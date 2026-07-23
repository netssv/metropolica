import { PROCEDURAL_DETAIL_ZOOM } from '../../lib/buildingSprites';
import { drawNightOverlay, renderMinimap } from './minimapAndOverlay';
import { recordRenderDiagnostic } from '../../lib/renderDiagnostics';

export function updateTransitAndOverlays(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  transit: any,
  time: number,
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
  const { ox, oy, zoom } = cameraValues;
  const state = simState;

  // 1. Transit update
  const startTransit = performance.now();
  transit.syncState(state?.day ?? 1, state?.hour ?? 0);
  const householdIncomes: Record<string, number> = {};
  for (const district of state?.districts ?? []) {
    for (const [index, cohort] of (district.cohorts ?? []).entries()) {
      householdIncomes[`${district.id}-cohort-${index}`] = cohort.income ?? 0;
    }
  }
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
    householdIncomes
  );
  const citizenMs = timingState.citizenMs + (performance.now() - startTransit);

  // 2. Night Overlay
  drawNightOverlay(ctx, canvas.width, canvas.height, state?.hour ?? 0);

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
