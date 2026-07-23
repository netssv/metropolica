import {
  crosswalkCenter,
  sidewalkEdge,
  sidewalkPoint,
  type Side
} from '../sidewalkSystem.ts';
import type { Point, MapTile, ScreenPoint } from './types.ts';
import { clamp01 } from './utils.ts';

export function visualSidewalkPath(
  path: Point[],
  side: Side,
  project: (col: number, row: number) => ScreenPoint,
  zoom: number,
  map: MapTile[][]
): ScreenPoint[] {
  if (path.length < 2) return [];
  const pts: ScreenPoint[] = [];

  for (let i = 0; i < path.length; i++) {
    const prev = path[i - 1];
    const node = path[i];
    const next = path[i + 1];

    if (!prev) {
      pts.push(sidewalkPoint(project, node, next!, side, zoom, map));
    } else if (!next) {
      pts.push(
        sidewalkPoint(
          project,
          node,
          prev,
          side === 'left' ? 'right' : 'left',
          zoom,
          map
        )
      );
    } else {
      const dx1 = node.col - prev.col;
      const dy1 = node.row - prev.row;
      const dx2 = next.col - node.col;
      const dy2 = next.row - node.row;
      if (dx1 === dx2 && dy1 === dy2) continue;

      const cross = dx1 * dy2 - dy1 * dx2;
      const isRightTurn =
        (side === 'right' && cross > 0) || (side === 'left' && cross < 0);

      pts.push(sidewalkEdge(project, prev, node, side, zoom, 0.45));
      if (!isRightTurn) pts.push(crosswalkCenter(project, node, zoom));
      pts.push(sidewalkEdge(project, node, next, side, zoom, 0.05));
    }
  }

  return pts.filter(
    (p, i) =>
      i === 0 || Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y) > 0.01
  );
}

export function interpolatePath(
  points: ScreenPoint[],
  progress: number
): { point: ScreenPoint; direction: ScreenPoint } {
  if (points.length < 2) {
    return { point: points[0] ?? { x: 0, y: 0 }, direction: { x: 0, y: 0 } };
  }
  const lengths = points
    .slice(1)
    .map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y));
  const total = lengths.reduce((sum, length) => sum + length, 0);
  let distance = clamp01(progress) * total;
  for (let i = 0; i < lengths.length; i++) {
    if (distance <= lengths[i] || i === lengths.length - 1) {
      const t = lengths[i] ? distance / lengths[i] : 0;
      const from = points[i];
      const to = points[i + 1];
      return {
        point: { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t },
        direction: { x: to.x - from.x, y: to.y - from.y }
      };
    }
    distance -= lengths[i];
  }
  return { point: points[points.length - 1], direction: { x: 0, y: 0 } };
}
