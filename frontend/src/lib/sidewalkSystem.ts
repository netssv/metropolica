import { ISO_TILE_H, ISO_TILE_W } from './isoMath.ts';
import { buildRoadGraph, type RoadGraph, type RoadNode } from './trafficSystem.ts';
import { laneOffset } from './citizens/roadTraffic.ts';

type Tile = { type?: string } | null;
export type Side = 'left' | 'right';
export type SidewalkNode = RoadNode & { side: Side };

const key = (node: SidewalkNode) => `${node.col},${node.row},${node.side}`;
function opposite(side: Side): Side { return side === 'left' ? 'right' : 'left'; }

/** Center of the walkable crossing shared by every arm of an intersection. */
export function crosswalkCenter(project: (col: number, row: number) => { x: number; y: number }, node: RoadNode, zoom: number) {
  const point = project(node.col, node.row);
  return { x: point.x + ISO_TILE_W * zoom / 2, y: point.y + ISO_TILE_H * zoom / 2 };
}

/** Screen-space sidewalk position parallel to a road edge. */
export function sidewalkPoint(project: (col: number, row: number) => { x: number; y: number }, from: RoadNode, to: RoadNode, side: Side, zoom: number) {
  const center = project(from.col, from.row);
  const road = laneOffset(from, to, zoom);
  const sign = side === 'left' ? -1 : 1;
  // The road occupies the centre of the isometric diamond. Push the
  // sidewalk beyond the asphalt edge, rather than leaving it in the lane.
  const sidewalkOffset = 2.8;
  return { x: center.x + ISO_TILE_W * zoom / 2 + road.x * sidewalkOffset * sign, y: center.y + ISO_TILE_H * zoom / 2 + road.y * sidewalkOffset * sign };
}

/** Draws sidewalk strips and zebra crossings from the same road graph used by traffic. */
export function drawSidewalkInfrastructure(ctx: CanvasRenderingContext2D, map: Tile[][], project: (col: number, row: number) => { x: number; y: number }, zoom: number, time: number) {
  if (zoom < .45) return;
  const graph = buildRoadGraph(map);
  // Pedestrians are drawn at 0.58× zoom; a sidewalk about six sprite-body
  // widths wide remains readable as a walkable strip at every zoom level.
  ctx.save(); ctx.lineWidth = Math.max(3, zoom * 3.5);
  for (const [fromKey, neighbors] of graph) {
    const [col, row] = fromKey.split(',').map(Number); const from = { col, row };
    for (const to of neighbors) {
      if (`${to.col},${to.row}` < fromKey) continue;
      for (const side of ['left', 'right'] as Side[]) {
        // Reverse the side at the reversed endpoint because sidewalkPoint's
        // perpendicular vector follows the segment direction.
        const a = sidewalkPoint(project, from, to, side, zoom); const b = sidewalkPoint(project, to, from, opposite(side), zoom);
        // Keep the intersection interior clear: crosswalks own that space.
        const fromIsIntersection = (graph.get(fromKey)?.length ?? 0) >= 3;
        const toIsIntersection = (graph.get(`${to.col},${to.row}`)?.length ?? 0) >= 3;
        const start = fromIsIntersection ? .38 : 0;
        const end = toIsIntersection ? .62 : 1;
        const startX = a.x + (b.x - a.x) * start, startY = a.y + (b.y - a.y) * start;
        const endX = a.x + (b.x - a.x) * end, endY = a.y + (b.y - a.y) * end;
        ctx.strokeStyle = 'rgba(226, 218, 194, .72)'; ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(endX, endY); ctx.stroke();
      }
    }
  }
  // Crosswalks appear at intersections and use the current signal phase only
  // for visual timing; pedestrian movement owns the actual crossing state.
  for (const [nodeKey, neighbors] of graph) {
    if (neighbors.length < 3) continue;
    const [col, row] = nodeKey.split(',').map(Number); const center = crosswalkCenter(project, { col, row }, zoom);
    const pulse = .65 + Math.sin(time / 500) * .08;
    // One shared square per intersection tile. Drawing one strip set per
    // arm creates a plus sign; the square is the common crossing area where
    // a pedestrian changes from one sidewalk to another.
    const size = Math.min(ISO_TILE_H * zoom * .72, ISO_TILE_W * zoom * .36);
    ctx.save();
    // A small isometric rotation makes the four square corners face the four
    // connected street shoulders instead of presenting a flat screen-aligned
    // box at the junction.
    ctx.translate(center.x, center.y);
    ctx.rotate(Math.PI * 3 / 16);
    ctx.fillStyle = `rgba(248, 242, 207, ${pulse * .28})`;
    ctx.fillRect(-size / 2, -size / 2, size, size);
    ctx.strokeStyle = `rgba(248, 242, 207, ${pulse})`;
    ctx.lineWidth = Math.max(1, zoom);
    ctx.strokeRect(-size / 2, -size / 2, size, size);
    ctx.restore();
  }
  ctx.restore();
}

export function sidewalkNodeKey(node: SidewalkNode) { return key(node); }
