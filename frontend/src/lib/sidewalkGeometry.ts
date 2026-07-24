import { ISO_TILE_H, ISO_TILE_W } from './isoMath.ts';
import { type RoadNode } from './trafficSystem.ts';
import { laneOffset } from './citizens/roadTraffic.ts';

export type Tile = { type?: string } | null;
export type Side = 'left' | 'right';
export type SidewalkNode = RoadNode & { side: Side };

export function oppositeSide(side: Side): Side {
  return side === 'left' ? 'right' : 'left';
}

export function sidewalkNodeKey(node: SidewalkNode): string {
  return `${node.col},${node.row},${node.side}`;
}

/** Center of the walkable crossing shared by every arm of an intersection. */
export function crosswalkCenter(
  project: (col: number, row: number) => { x: number; y: number },
  node: RoadNode,
  zoom: number
) {
  const point = project(node.col, node.row);
  return {
    x: point.x + (ISO_TILE_W * zoom) / 2,
    y: point.y + (ISO_TILE_H * zoom) / 2,
  };
}

/** Screen-space sidewalk position parallel to a road edge. */
export function sidewalkPoint(
  project: (col: number, row: number) => { x: number; y: number },
  from: RoadNode,
  to: RoadNode,
  side: Side,
  zoom: number,
  map?: Tile[][]
) {
  const center = project(from.col, from.row);
  const road = laneOffset(from, to, zoom, project);
  const sign = side === 'left' ? -1 : 1;
  const sidewalkOffset = 2.0;

  let x = center.x + (ISO_TILE_W * zoom) / 2 + road.x * sidewalkOffset * sign;
  let y = center.y + (ISO_TILE_H * zoom) / 2 + road.y * sidewalkOffset * sign;

  if (map && map.length > 0 && map[0]) {
    const maxRow = map.length - 1;
    const maxCol = map[0].length - 1;
    const dc = from.col - to.col;
    const dr = from.row - to.row;

    const touchesMapEdge =
      (from.col === 0 && dc < 0) ||
      (from.row === 0 && dr < 0) ||
      (from.col === maxCol && dc > 0) ||
      (from.row === maxRow && dr > 0);

    if (touchesMapEdge) {
      const pFrom = project(from.col, from.row);
      const pTo = project(to.col, to.row);
      const stepX = pFrom.x - pTo.x;
      const stepY = pFrom.y - pTo.y;
      x += stepX * 0.75;
      y += stepY * 0.75;
    }
  }

  return { x, y };
}

/** Sidewalk point at fraction t along segment from→to. */
export function sidewalkEdge(
  project: (col: number, row: number) => { x: number; y: number },
  from: RoadNode,
  to: RoadNode,
  side: Side,
  zoom: number,
  t: number
) {
  const pFrom = project(from.col, from.row);
  const pTo = project(to.col, to.row);
  const road = laneOffset(from, to, zoom, project);
  const sign = side === 'left' ? -1 : 1;

  return {
    x: pFrom.x + (pTo.x - pFrom.x) * t + (ISO_TILE_W * zoom) / 2 + road.x * 2.0 * sign,
    y: pFrom.y + (pTo.y - pFrom.y) * t + (ISO_TILE_H * zoom) / 2 + road.y * 2.0 * sign,
  };
}
