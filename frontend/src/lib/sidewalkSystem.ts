import { ISO_TILE_H, ISO_TILE_W } from './isoMath.ts';
import { buildRoadGraph, type RoadNode } from './trafficSystem.ts';
import {
  type Tile,
  type Side,
  type SidewalkNode,
  sidewalkNodeKey as keyFunc,
  oppositeSide,
  crosswalkCenter,
  sidewalkPoint,
  sidewalkEdge,
} from './sidewalkGeometry.ts';
import {
  drawIntersectionHolesClip,
  drawCrosswalkStripes,
} from './sidewalkRenderers.ts';

export type { Tile, Side, SidewalkNode };
export { crosswalkCenter, sidewalkPoint, sidewalkEdge };

export function sidewalkNodeKey(node: SidewalkNode) {
  return keyFunc(node);
}

/** Draws sidewalk strips and zebra crossings from the road graph. */
export function drawSidewalkInfrastructure(
  ctx: CanvasRenderingContext2D,
  map: Tile[][],
  project: (col: number, row: number) => { x: number; y: number },
  zoom: number,
  time: number
) {
  if (zoom < 0.45) return;
  const graph = buildRoadGraph(map);
  const isBridgeNode = (node: RoadNode) => map[node.row]?.[node.col]?.type === 'bridge';

  // 1. Clip region for non-intersection tiles & map boundary
  drawIntersectionHolesClip(ctx, graph, project, zoom, map);

  // 2. Draw sidewalk segments
  for (const [fromKey, neighbors] of graph) {
    const [col, row] = fromKey.split(',').map(Number);
    const from = { col, row };
    for (const to of neighbors) {
      if (`${to.col},${to.row}` < fromKey) continue;
      const bridgeSegment = isBridgeNode(from) || isBridgeNode(to);
      for (const side of ['left', 'right'] as Side[]) {
        const a = sidewalkPoint(project, from, to, side, zoom, map);
        const b = sidewalkPoint(project, to, from, oppositeSide(side), zoom, map);

        ctx.lineWidth = Math.max(2.5, zoom * 3.2);
        ctx.strokeStyle = 'rgba(226, 218, 194, .85)';
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }
  ctx.restore();

  // 3. Draw zebra crossings
  drawCrosswalkStripes(ctx, graph, map, project, zoom, time);
}
