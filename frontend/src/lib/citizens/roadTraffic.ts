import type { Point } from './roadTrafficTypes.ts';

/** Two-lane right-hand traffic for the isometric screen. */
export function laneOffset(from: Point | undefined, to: Point | undefined, zoom: number) {
  if (!from || !to) return { x: 0, y: 0 };
  const dx = to.col - from.col, dy = to.row - from.row;
  const screenDx = (dx - dy) * 32, screenDy = (dx + dy) * 16;
  const length = Math.max(1, Math.hypot(screenDx, screenDy));
  const laneWidth = 7 * zoom;
  return { x: (-screenDy / length) * laneWidth, y: (screenDx / length) * laneWidth };
}

