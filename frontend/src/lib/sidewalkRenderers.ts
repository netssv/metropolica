import { ISO_TILE_H, ISO_TILE_W } from './isoMath.ts';
import { type RoadNode, type RoadGraph } from './trafficSystem.ts';
import { crosswalkCenter } from './sidewalkGeometry.ts';

export function drawIntersectionHolesClip(
  ctx: CanvasRenderingContext2D,
  graph: RoadGraph,
  project: (col: number, row: number) => { x: number; y: number },
  zoom: number,
  map?: any[][]
) {
  const hw = (ISO_TILE_W * zoom) / 2;
  const hh = (ISO_TILE_H * zoom) / 2;

  ctx.save();
  ctx.beginPath();
  if (map && map.length > 0 && map[0] && map[0].length > 0) {
    const maxRow = map.length - 1;
    const maxCol = map[0].length - 1;

    const p00 = project(0, 0);
    const pMaxC0 = project(maxCol, 0);
    const pMaxCMaxR = project(maxCol, maxRow);
    const p0MaxR = project(0, maxRow);

    ctx.moveTo(p00.x + hw, p00.y);
    ctx.lineTo(pMaxC0.x + hw * 2, pMaxC0.y + hh);
    ctx.lineTo(pMaxCMaxR.x + hw, pMaxCMaxR.y + hh * 2);
    ctx.lineTo(p0MaxR.x, p0MaxR.y + hh);
    ctx.closePath();
  } else {
    ctx.rect(-8000, -8000, 16000, 16000);
  }

  for (const [nodeKey, neighbors] of graph) {
    if (neighbors.length < 3) continue;
    const [c, r] = nodeKey.split(',').map(Number);
    const p = project(c, r);
    const cx = p.x + hw;
    const cy = p.y + hh;
    ctx.moveTo(cx, cy - hh);
    ctx.lineTo(cx + hw, cy);
    ctx.lineTo(cx, cy + hh);
    ctx.lineTo(cx - hw, cy);
    ctx.closePath();
  }
  ctx.clip('evenodd');
}

export function drawCrosswalkStripes(
  ctx: CanvasRenderingContext2D,
  graph: RoadGraph,
  map: any[][],
  project: (col: number, row: number) => { x: number; y: number },
  zoom: number,
  time: number
) {
  const isBridgeNode = (node: RoadNode) => map[node.row]?.[node.col]?.type === 'bridge';

  for (const [nodeKey, neighbors] of graph) {
    if (neighbors.length < 3) continue;
    const [col, row] = nodeKey.split(',').map(Number);
    if (isBridgeNode({ col, row })) continue;
    const center = crosswalkCenter(project, { col, row }, zoom);
    const pCenter = project(col, row);

    const opacity = 0.85 + Math.sin(time / 500) * 0.1;
    ctx.save();
    ctx.fillStyle = `rgba(245, 245, 245, ${opacity})`;

    for (const n of neighbors) {
      const dc = n.col - col;
      const dr = n.row - row;

      const pNeighbor = project(n.col, n.row);
      const rX = pNeighbor.x - pCenter.x;
      const rY = pNeighbor.y - pCenter.y;
      const rLen = Math.hypot(rX, rY);
      if (rLen === 0) continue;

      const uDirX = rX / rLen;
      const uDirY = rY / rLen;

      const pCross = dc !== 0 ? project(col, row + 1) : project(col + 1, row);
      const cX = pCross.x - pCenter.x;
      const cY = pCross.y - pCenter.y;
      const cLen = Math.hypot(cX, cY);
      if (cLen === 0) continue;

      const uCrossX = cX / cLen;
      const uCrossY = cY / cLen;

      const armDist = 20 * zoom;
      const armX = center.x + uDirX * armDist;
      const armY = center.y + uDirY * armDist;

      const numStripes = 4;
      const stripeW = 3 * zoom;
      const stripeL = 8 * zoom;
      const roadWidthSpan = 18 * zoom;

      for (let i = 0; i < numStripes; i++) {
        const offsetCross = -roadWidthSpan / 2 + (i / (numStripes - 1)) * roadWidthSpan;
        const sx = armX + uCrossX * offsetCross;
        const sy = armY + uCrossY * offsetCross;

        ctx.beginPath();
        ctx.moveTo(
          sx - uDirX * (stripeW / 2) - uCrossX * (stripeL / 2),
          sy - uDirY * (stripeW / 2) - uCrossY * (stripeL / 2)
        );
        ctx.lineTo(
          sx + uDirX * (stripeW / 2) - uCrossX * (stripeL / 2),
          sy + uDirY * (stripeW / 2) - uCrossY * (stripeL / 2)
        );
        ctx.lineTo(
          sx + uDirX * (stripeW / 2) + uCrossX * (stripeL / 2),
          sy + uDirY * (stripeW / 2) + uCrossY * (stripeL / 2)
        );
        ctx.lineTo(
          sx - uDirX * (stripeW / 2) + uCrossX * (stripeL / 2),
          sy - uDirY * (stripeW / 2) + uCrossY * (stripeL / 2)
        );
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
  }
}
