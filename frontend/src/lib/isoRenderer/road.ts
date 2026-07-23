import { ISO_TILE_W, ISO_TILE_H } from '../isoMath';
import { PROCEDURAL_DETAIL_ZOOM } from '../buildingSprites';
import { TileMap } from './types.ts';
import { isRoadAt, isPlainRoadAt } from './helpers.ts';

function roadConnections(map: TileMap | undefined, col: number, row: number) {
  return {
    north: isRoadAt(map, col, row - 1),
    east: isRoadAt(map, col + 1, row),
    south: isRoadAt(map, col, row + 1),
    west: isRoadAt(map, col - 1, row),
  };
}

export function drawRoad(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  zoom: number,
  bridge = false,
  col = 0,
  row = 0,
  map?: TileMap,
  project?: (col: number, row: number) => { x: number; y: number }
) {
  const hw = (ISO_TILE_W / 2) * zoom;
  const hh = (ISO_TILE_H / 2) * zoom;
  const connections = roadConnections(map, col, row);
  const horizontal = connections.east || connections.west;
  const joinsRoad =
    bridge &&
    (isPlainRoadAt(map, col, row - 1) ||
      isPlainRoadAt(map, col + 1, row) ||
      isPlainRoadAt(map, col, row + 1) ||
      isPlainRoadAt(map, col - 1, row));

  if (bridge) {
    // Water backdrop
    ctx.fillStyle = '#1a5f8a';
    ctx.beginPath();
    ctx.moveTo(px + hw, py);
    ctx.lineTo(px + hw * 2, py + hh);
    ctx.lineTo(px + hw, py + hh * 2);
    ctx.lineTo(px, py + hh);
    ctx.closePath();
    ctx.fill();

    // 1. Heavy 3D Concrete Support Pillars underneath
    const pierW = Math.max(4, zoom * 7);
    const pierH = Math.max(10, zoom * 16);
    ctx.fillStyle = '#495057';
    ctx.fillRect(px + hw - pierW, py + hh + 4 * zoom, pierW * 2, pierH);
    ctx.fillStyle = '#6c757d';
    ctx.fillRect(px + hw - pierW / 2, py + hh + 4 * zoom, pierW, pierH);

    // 2. Thick 3D Concrete Deck Base
    const deckH = joinsRoad ? Math.max(1, zoom * 1.6) : Math.max(4, zoom * 6);
    ctx.fillStyle = '#343a40';
    ctx.beginPath();
    ctx.moveTo(px, py + hh + deckH);
    ctx.lineTo(px + hw, py + hh * 2 + deckH);
    ctx.lineTo(px + hw * 2, py + hh + deckH);
    ctx.lineTo(px + hw * 2, py + hh);
    ctx.lineTo(px + hw, py + hh * 2);
    ctx.lineTo(px, py + hh);
    ctx.closePath();
    ctx.fill();

    // Side fascia face (light concrete)
    ctx.fillStyle = '#6c757d';
    ctx.beginPath();
    ctx.moveTo(px, py + hh);
    ctx.lineTo(px + hw, py + hh * 2);
    ctx.lineTo(px + hw, py + hh * 2 + deckH);
    ctx.lineTo(px, py + hh + deckH);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#868e96';
    ctx.beginPath();
    ctx.moveTo(px + hw, py + hh * 2);
    ctx.lineTo(px + hw * 2, py + hh);
    ctx.lineTo(px + hw * 2, py + hh + deckH);
    ctx.lineTo(px + hw, py + hh * 2 + deckH);
    ctx.closePath();
    ctx.fill();

    // Top concrete deck border rim
    ctx.fillStyle = '#adb5bd';
    ctx.beginPath();
    ctx.moveTo(px + hw, py);
    ctx.lineTo(px + hw * 2, py + hh);
    ctx.lineTo(px + hw, py + hh * 2);
    ctx.lineTo(px, py + hh);
    ctx.closePath();
    ctx.fill();

    // Asphalt surface
    ctx.fillStyle = '#2c3238';
    ctx.beginPath();
    ctx.moveTo(px + hw, py + hh * 0.12);
    ctx.lineTo(px + hw * 1.88, py + hh);
    ctx.lineTo(px + hw, py + hh * 1.88);
    ctx.lineTo(px + hw * 0.12, py + hh);
    ctx.closePath();
    ctx.fill();

    const paintRoadApproach = (
      a: [number, number],
      b: [number, number],
      ia: [number, number],
      ib: [number, number]
    ) => {
      ctx.beginPath();
      ctx.moveTo(px + a[0] * hw, py + a[1] * hh);
      ctx.lineTo(px + b[0] * hw, py + b[1] * hh);
      ctx.lineTo(px + ib[0] * hw, py + ib[1] * hh);
      ctx.lineTo(px + ia[0] * hw, py + ia[1] * hh);
      ctx.closePath();
      ctx.fill();
    };

    ctx.fillStyle = '#2c3238';
    if (isPlainRoadAt(map, col, row - 1)) {
      paintRoadApproach([1, 0], [2, 1], [1, 0.12], [1.88, 1]);
    }
    if (isPlainRoadAt(map, col + 1, row)) {
      paintRoadApproach([2, 1], [1, 2], [1.88, 1], [1, 1.88]);
    }
    if (isPlainRoadAt(map, col, row + 1)) {
      paintRoadApproach([1, 2], [0, 1], [1, 1.88], [0.12, 1]);
    }
    if (isPlainRoadAt(map, col - 1, row)) {
      paintRoadApproach([0, 1], [1, 0], [0.12, 1], [1, 0.12]);
    }

    ctx.fillStyle = 'rgba(7, 25, 38, 0.34)';
    ctx.beginPath();
    ctx.moveTo(px + hw * 0.16, py + hh * 1.06);
    ctx.lineTo(px + hw, py + hh * 1.82);
    ctx.lineTo(px + hw * 1.84, py + hh * 1.06);
    ctx.lineTo(px + hw, py + hh * 1.52);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillStyle = '#30363b';
    ctx.beginPath();
    ctx.moveTo(px + hw, py);
    ctx.lineTo(px + hw * 2, py + hh);
    ctx.lineTo(px + hw, py + hh * 2);
    ctx.lineTo(px, py + hh);
    ctx.closePath();
    ctx.fill();
  }

  if (zoom < PROCEDURAL_DETAIL_ZOOM) return;

  const center = { x: px + hw, y: py + hh };
  const projectedArm = (c: number, r: number, fallback: {x:number;y:number}) => {
    const p = project?.(c, r); const self = project?.(col, row);
    return p && self ? { x: center.x + (p.x - self.x), y: center.y + (p.y - self.y) } : fallback;
  };
  const arms = [
    [connections.north, projectedArm(col, row - 1, { x: px + hw * 1.5, y: py + hh * 0.5 })],
    [connections.east, projectedArm(col + 1, row, { x: px + hw * 1.5, y: py + hh * 1.5 })],
    [connections.south, projectedArm(col, row + 1, { x: px + hw * 0.5, y: py + hh * 1.5 })],
    [connections.west, projectedArm(col - 1, row, { x: px + hw * 0.5, y: py + hh * 0.5 })]
  ] as const;

  const connectedCount =
    (connections.north ? 1 : 0) +
    (connections.east ? 1 : 0) +
    (connections.south ? 1 : 0) +
    (connections.west ? 1 : 0);
  const isIntersection = connectedCount >= 3;

  ctx.strokeStyle = bridge ? '#f8f9fa' : '#737b82';
  ctx.lineWidth = Math.max(1, zoom * 1.5);
  ctx.setLineDash(
    bridge
      ? [Math.max(3, zoom * 4), Math.max(3, zoom * 3)]
      : [Math.max(2, zoom * 3), Math.max(2, zoom * 2)]
  );

  for (const [connected, end] of arms) {
    if (!connected) continue;
    const startX = isIntersection ? center.x + (end.x - center.x) * 0.38 : center.x;
    const startY = isIntersection ? center.y + (end.y - center.y) * 0.38 : center.y;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  if (bridge && !isIntersection) {
    const spanArms = horizontal ? [arms[1], arms[3]] : [arms[0], arms[2]];
    const hasValidSpan = spanArms.every(([connected]) => connected);

    if (hasValidSpan) {
      const armA = spanArms[0][1];
      const armB = spanArms[1][1];
      const dx = armB.x - armA.x;
      const dy = armB.y - armA.y;
      const len = Math.max(1, Math.hypot(dx, dy));

      const nx = (-dy / len) * (hw * 0.47);
      const ny = (dx / len) * (hh * 0.47);

      for (const side of [-1, 1]) {
        const start = { x: armA.x + nx * side, y: armA.y + ny * side };
        const finish = { x: armB.x + nx * side, y: armB.y + ny * side };

        ctx.strokeStyle = '#3e4a54';
        ctx.lineWidth = Math.max(2, zoom * 2.4);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y - 3 * zoom);
        ctx.lineTo(finish.x, finish.y - 3 * zoom);
        ctx.stroke();

        ctx.strokeStyle = '#c9d1d8';
        ctx.lineWidth = Math.max(1, zoom * 0.85);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y - 3.7 * zoom);
        ctx.lineTo(finish.x, finish.y - 3.7 * zoom);
        ctx.stroke();

        for (const t of [0, 0.5]) {
          const x = start.x + (finish.x - start.x) * t;
          const y = start.y + (finish.y - start.y) * t;
          ctx.strokeStyle = '#697782';
          ctx.lineWidth = Math.max(1, zoom * 1.15);
          ctx.beginPath();
          ctx.moveTo(x, y + 1 * zoom);
          ctx.lineTo(x, y - 4 * zoom);
          ctx.stroke();
        }
      }
    }
  }
}
