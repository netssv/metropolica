import { T } from '../constants';

declare let tileMap: any[][];

export function nearRoad(col: number, row: number, radius: number): boolean {
  for (let dc = -radius; dc <= radius; dc++) {
    for (let dr = -radius; dr <= radius; dr++) {
      const t = tileMap[row + dr]?.[col + dc];
      if (t && (t.type === T.ROAD || t.type === T.BRIDGE)) return true;
    }
  }
  return false;
}

export function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 43758.5453123;
  return x - Math.floor(x);
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
