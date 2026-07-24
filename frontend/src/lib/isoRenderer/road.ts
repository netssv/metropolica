import { ISO_TILE_W, ISO_TILE_H } from '../isoMath';
import { PROCEDURAL_DETAIL_ZOOM } from '../buildingSprites';
import { TileMap } from './types.ts';
import { isRoadAt, isPlainRoadAt, isBridgeAt } from './helpers.ts';
import { genericTune } from '../buildings/genericTuneState.ts';
import { T } from '../constants';

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
  const bridgeTune = bridge ? genericTune.getParams('bridge') : null;
  const scaleX = bridgeTune ? (bridgeTune.scaleX ?? 1.0) : 1.0;
  const scaleY = bridgeTune ? (bridgeTune.scaleY ?? 1.0) : 1.0;

  const hw = (ISO_TILE_W / 2) * zoom * scaleX;
  const hh = (ISO_TILE_H / 2) * zoom * scaleY;
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

    // 1. Heavy 3D Concrete Support Pillars (Únicamente sobre agua profunda, nunca si colinda directamente con carretera)
    const neighborTypes = [
      map?.[row - 1]?.[col]?.type,
      map?.[row + 1]?.[col]?.type,
      map?.[row]?.[col - 1]?.type,
      map?.[row]?.[col + 1]?.type,
    ];
    const isOverWater = neighborTypes.includes(T.WATER);

    if (isOverWater && !joinsRoad) {
      const basePilarH = bridgeTune ? (bridgeTune.height ?? 6) : 6;
      const pierW = Math.max(4, zoom * 7);
      const pierH = Math.max(10, zoom * (basePilarH * 2.6));
      ctx.fillStyle = bridgeTune?.accentColor || '#495057';
      ctx.fillRect(px + hw - pierW, py + hh + 4 * zoom, pierW * 2, pierH);
      ctx.fillStyle = '#6c757d';
      ctx.fillRect(px + hw - pierW / 2, py + hh + 4 * zoom, pierW, pierH);
    }

    // 2. Thick 3D Concrete Deck Base (Solo si es un tramo de puente flotante sobre agua)
    const deckBaseMult = bridgeTune ? (bridgeTune.baseH ?? 44) / 44 : 1.0;
    const deckH = joinsRoad ? 0 : Math.max(4, zoom * 6) * deckBaseMult;
    
    if (deckH > 0) {
      // Dibujar base 3D inferior del muelle
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

      // Caras laterales de concreto 3D
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
    }

    // Asfalto continuo igualado al tono estándar de carretera (#30363b)
    ctx.fillStyle = '#30363b';
    ctx.beginPath();
    ctx.moveTo(px + hw, py);
    ctx.lineTo(px + hw * 2, py + hh);
    ctx.lineTo(px + hw, py + hh * 2);
    ctx.lineTo(px, py + hh);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(7, 25, 38, 0.2)';
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
  const isIntersection = connectedCount >= 3 || (connectedCount >= 2 && !((connections.north && connections.south) || (connections.east && connections.west)));

  // Si es intersección o cruce, renderizar limpia la zona central sin cruce de líneas discontinuas
  ctx.strokeStyle = '#737b82';
  ctx.lineWidth = Math.max(1, zoom * 1.5);
  ctx.setLineDash([Math.max(2, zoom * 3), Math.max(2, zoom * 2)]);

  for (const [connected, end] of arms) {
    if (!connected) continue;
    // Detener la línea antes de ingresar a la caja central de la intersección
    const startX = isIntersection ? center.x + (end.x - center.x) * 0.42 : center.x;
    const startY = isIntersection ? center.y + (end.y - center.y) * 0.42 : center.y;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}
