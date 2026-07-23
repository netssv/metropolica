import type { Point } from './roadTrafficTypes.ts';

/** Two-lane right-hand traffic for the isometric screen. */
export function laneOffset(from: Point | undefined, to: Point | undefined, zoom: number, project?: (col: number, row: number) => { x: number; y: number }) {
  if (!from || !to) return { x: 0, y: 0 };
  const dx = to.col - from.col, dy = to.row - from.row;
  const a = project?.(from.col, from.row);
  const b = project?.(to.col, to.row);
  const screenDx = a && b ? b.x - a.x : (dx - dy) * 32;
  const screenDy = a && b ? b.y - a.y : (dx + dy) * 16;
  const length = Math.max(1, Math.hypot(screenDx, screenDy));
  const laneWidth = 7 * zoom;
  return { x: (-screenDy / length) * laneWidth, y: (screenDx / length) * laneWidth };
}
