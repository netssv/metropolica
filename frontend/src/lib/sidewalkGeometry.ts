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
  const bridgeSegment = map?.[from.row]?.[from.col]?.type === 'bridge';
  const sidewalkOffset = bridgeSegment ? 1.55 : 2.0;

  return {
    x: center.x + (ISO_TILE_W * zoom) / 2 + road.x * sidewalkOffset * sign,
    y: center.y + (ISO_TILE_H * zoom) / 2 + road.y * sidewalkOffset * sign,
  };
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
