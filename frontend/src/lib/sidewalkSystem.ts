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

  // 1. Clip region for non-intersection tiles
  drawIntersectionHolesClip(ctx, graph, project, zoom);

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
        const mixedApproach = isBridgeNode(from) !== isBridgeNode(to);

        if (mixedApproach) {
          const roadNode = isBridgeNode(from) ? to : from;
          const bridgeNode = isBridgeNode(from) ? from : to;
          const roadPoint = isBridgeNode(from) ? b : a;
          const bridgePoint = isBridgeNode(from) ? a : b;
          const roadCenter = project(roadNode.col, roadNode.row);
          const bridgeCenter = project(bridgeNode.col, bridgeNode.row);
          const edgeCenter = {
            x: (roadCenter.x + bridgeCenter.x) / 2 + (ISO_TILE_W * zoom) / 2,
            y: (roadCenter.y + bridgeCenter.y) / 2 + (ISO_TILE_H * zoom) / 2,
          };
          const roadEdge = {
            x: edgeCenter.x + (roadPoint.x - (roadCenter.x + (ISO_TILE_W * zoom) / 2)),
            y: edgeCenter.y + (roadPoint.y - (roadCenter.y + (ISO_TILE_H * zoom) / 2)),
          };
          const bridgeEdge = {
            x: edgeCenter.x + (bridgePoint.x - (bridgeCenter.x + (ISO_TILE_W * zoom) / 2)),
            y: edgeCenter.y + (bridgePoint.y - (bridgeCenter.y + (ISO_TILE_H * zoom) / 2)),
          };

          ctx.lineWidth = Math.max(3, zoom * 3.5);
          ctx.strokeStyle = 'rgba(226, 218, 194, .82)';
          ctx.beginPath();
          ctx.moveTo(roadPoint.x, roadPoint.y);
          ctx.lineTo(roadEdge.x, roadEdge.y);
          ctx.stroke();

          ctx.lineWidth = Math.max(1.25, zoom * 1.65);
          ctx.strokeStyle = 'rgba(181, 193, 201, .78)';
          ctx.beginPath();
          ctx.moveTo(bridgeEdge.x, bridgeEdge.y);
          ctx.lineTo(bridgePoint.x, bridgePoint.y);
          ctx.stroke();
          continue;
        }

        ctx.lineWidth = bridgeSegment ? Math.max(1.25, zoom * 1.65) : Math.max(3, zoom * 3.5);
        ctx.strokeStyle = bridgeSegment ? 'rgba(181, 193, 201, .78)' : 'rgba(226, 218, 194, .82)';
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
