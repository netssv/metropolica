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
export function sidewalkPoint(project: (col: number, row: number) => { x: number; y: number }, from: RoadNode, to: RoadNode, side: Side, zoom: number, map?: Tile[][]) {
  const center = project(from.col, from.row);
  const road = laneOffset(from, to, zoom, project);
  const sign = side === 'left' ? -1 : 1;
  // The road occupies the centre of the isometric diamond. Push the
  // sidewalk beyond the asphalt edge, rather than leaving it in the lane.
  // On a bridge, retain a walkable lane inside the guardrail. The normal
  // city offset sits on the outer edge and would place the sprite in a rail.
  // This point belongs to `from`. A road approach must retain the street
  // sidewalk offset even when its next node is a bridge; the narrower bridge
  // walkway starts only at the shared edge.
  const bridgeSegment = map?.[from.row]?.[from.col]?.type === 'bridge';
  const sidewalkOffset = bridgeSegment ? 1.55 : 2.0;
  return { x: center.x + ISO_TILE_W * zoom / 2 + road.x * sidewalkOffset * sign, y: center.y + ISO_TILE_H * zoom / 2 + road.y * sidewalkOffset * sign };
}

/** Draws sidewalk strips and zebra crossings from the same road graph used by traffic. */
export function drawSidewalkInfrastructure(ctx: CanvasRenderingContext2D, map: Tile[][], project: (col: number, row: number) => { x: number; y: number }, zoom: number, time: number) {
  if (zoom < .45) return;
  const graph = buildRoadGraph(map);
  const hw = (ISO_TILE_W * zoom) / 2;
  const hh = (ISO_TILE_H * zoom) / 2;
  const isBridgeNode = (node: RoadNode) => map[node.row]?.[node.col]?.type === 'bridge';

  // Clip region: full canvas minus every intersection tile diamond.
  // Even-odd rule: the large outer rect (path 1) minus each intersection diamond (path 2)
  // ensures sidewalks can never render inside an intersection tile — no trim params needed.
  ctx.save();
  ctx.beginPath();
  ctx.rect(-8000, -8000, 16000, 16000); // outer rect (clockwise = filled)
  for (const [nodeKey, neighbors] of graph) {
    if (neighbors.length < 3) continue;
    const [c, r] = nodeKey.split(',').map(Number);
    const p = project(c, r);
    const cx = p.x + hw, cy = p.y + hh;
    // Clockwise diamond: even-odd makes it a "hole" subtracting from the outer rect
    ctx.moveTo(cx,      cy - hh);
    ctx.lineTo(cx + hw, cy);
    ctx.lineTo(cx,      cy + hh);
    ctx.lineTo(cx - hw, cy);
    ctx.closePath();
  }
  ctx.clip('evenodd');

  ctx.lineWidth = Math.max(3, zoom * 3.5);
  ctx.strokeStyle = 'rgba(226, 218, 194, .82)';
  for (const [fromKey, neighbors] of graph) {
    const [col, row] = fromKey.split(',').map(Number); const from = { col, row };
    for (const to of neighbors) {
      if (`${to.col},${to.row}` < fromKey) continue;
      const bridgeSegment = isBridgeNode(from) || isBridgeNode(to);
      for (const side of ['left', 'right'] as Side[]) {
        const a = sidewalkPoint(project, from, to, side, zoom, map);
        const b = sidewalkPoint(project, to, from, opposite(side), zoom, map);
        const mixedApproach = isBridgeNode(from) !== isBridgeNode(to);
        if (mixedApproach) {
          // Keep the width change on the shared tile edge. Interpolating from
          // one tile centre to the other creates a conspicuous diagonal slash
          // across the roadway in an isometric view.
          const roadNode = isBridgeNode(from) ? to : from;
          const bridgeNode = isBridgeNode(from) ? from : to;
          const roadPoint = isBridgeNode(from) ? b : a;
          const bridgePoint = isBridgeNode(from) ? a : b;
          const roadCenter = project(roadNode.col, roadNode.row);
          const bridgeCenter = project(bridgeNode.col, bridgeNode.row);
          const edgeCenter = { x: (roadCenter.x + bridgeCenter.x) / 2 + ISO_TILE_W * zoom / 2, y: (roadCenter.y + bridgeCenter.y) / 2 + ISO_TILE_H * zoom / 2 };
          const roadEdge = { x: edgeCenter.x + (roadPoint.x - (roadCenter.x + ISO_TILE_W * zoom / 2)), y: edgeCenter.y + (roadPoint.y - (roadCenter.y + ISO_TILE_H * zoom / 2)) };
          const bridgeEdge = { x: edgeCenter.x + (bridgePoint.x - (bridgeCenter.x + ISO_TILE_W * zoom / 2)), y: edgeCenter.y + (bridgePoint.y - (bridgeCenter.y + ISO_TILE_H * zoom / 2)) };

          ctx.lineWidth = Math.max(3, zoom * 3.5); ctx.strokeStyle = 'rgba(226, 218, 194, .82)';
          ctx.beginPath(); ctx.moveTo(roadPoint.x, roadPoint.y); ctx.lineTo(roadEdge.x, roadEdge.y); ctx.stroke();
          ctx.lineWidth = Math.max(1.25, zoom * 1.65); ctx.strokeStyle = 'rgba(181, 193, 201, .78)';
          ctx.beginPath(); ctx.moveTo(bridgeEdge.x, bridgeEdge.y); ctx.lineTo(bridgePoint.x, bridgePoint.y); ctx.stroke();
          continue;
        }
        // A bridge uses a narrow interior walkway. Its points are inset by
        // sidewalkPoint(), so the line joins the street sidewalk at the
        // approach but never crosses the bridge guardrail.
        ctx.lineWidth = bridgeSegment ? Math.max(1.25, zoom * 1.65) : Math.max(3, zoom * 3.5);
        ctx.strokeStyle = bridgeSegment ? 'rgba(181, 193, 201, .78)' : 'rgba(226, 218, 194, .82)';
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
  }
  ctx.restore();


  // Draw clean isometric zebra crosswalk stripes on each arm of the intersection
  for (const [nodeKey, neighbors] of graph) {
    if (neighbors.length < 3) continue;
    const [col, row] = nodeKey.split(',').map(Number);
    if (isBridgeNode({ col, row })) continue;
    const center = crosswalkCenter(project, { col, row }, zoom);
    const hw = (ISO_TILE_W * zoom) / 2;
    const hh = (ISO_TILE_H * zoom) / 2;

    const opacity = 0.85 + Math.sin(time / 500) * 0.1;

    ctx.save();
    ctx.fillStyle = `rgba(245, 245, 245, ${opacity})`;

    for (const n of neighbors) {
      const dc = n.col - col;
      const dr = n.row - row;

      // In isometric projection:
      // Grid unit (1, 0) -> screen vector (+hw, +hh)
      // Grid unit (0, 1) -> screen vector (-hw, +hh)
      // Unit vector Along the road axis (road Vector):
      const neighbor = project(n.col, n.row);
      const rX = neighbor.x - center.x;
      const rY = neighbor.y - center.y;
      const rLen = Math.hypot(rX, rY);
      const uX = rX / rLen;
      const uY = rY / rLen;

      // Perpendicular screen vector, derived from the active projection.
      const cX = -rY;
      const cY = rX;
      const cLen = Math.hypot(cX, cY);
      const perpX = cX / cLen;
      const perpY = cY / cLen;

      // Crosswalk position along the arm (near intersection edge, inside asphalt)
      const armDist = hw * 0.72;
      const armX = center.x + uX * armDist;
      const armY = center.y + uY * armDist;

      // Draw 4 distinct zebra block stripes aligned with the road direction
      const numStripes = 4;
      const roadWidth = hw * 0.55; // Keep strictly within asphalt bounds
      const stripeLen = 6 * zoom;  // Stripe length along the street
      const gap = (roadWidth * 2) / (numStripes * 2 - 1);

      for (let i = 0; i < numStripes; i++) {
        const offsetAcross = -roadWidth + i * (gap * 2);

        // Center of individual stripe
        const sx = armX + perpX * offsetAcross;
        const sy = armY + perpY * offsetAcross;

        // Quad vertices for isometric stripe
        const halfLen = stripeLen / 2;
        const halfWidth = (gap * 0.75) / 2;

        ctx.beginPath();
        ctx.moveTo(
          sx - uX * halfLen - perpX * halfWidth,
          sy - uY * halfLen - perpY * halfWidth
        );
        ctx.lineTo(
          sx + uX * halfLen - perpX * halfWidth,
          sy + uY * halfLen - perpY * halfWidth
        );
        ctx.lineTo(
          sx + uX * halfLen + perpX * halfWidth,
          sy + uY * halfLen + perpY * halfWidth
        );
        ctx.lineTo(
          sx - uX * halfLen + perpX * halfWidth,
          sy - uY * halfLen + perpY * halfWidth
        );
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
  }
  ctx.restore();
}

export function sidewalkNodeKey(node: SidewalkNode) { return key(node); }

/**
 * Sidewalk point at fraction t along the segment from→to (0 = at `from` center, 1 = at `to` center).
 * Using t < 0.5 keeps the point outside the intersection diamond at `to`.
 */
export function sidewalkEdge(
  project: (col: number, row: number) => { x: number; y: number },
  from: RoadNode, to: RoadNode, side: Side, zoom: number, t: number
) {
  const pFrom = project(from.col, from.row);
  const pTo   = project(to.col,   to.row);
      const road  = laneOffset(from, to, zoom, project);
  const sign  = side === 'left' ? -1 : 1;
  return {
    x: pFrom.x + (pTo.x - pFrom.x) * t + ISO_TILE_W * zoom / 2 + road.x * 2.0 * sign,
    y: pFrom.y + (pTo.y - pFrom.y) * t + ISO_TILE_H * zoom / 2 + road.y * 2.0 * sign,
  };
}
