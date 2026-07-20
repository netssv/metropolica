import { SeededRandom } from "../../core/random/index.ts";
import type { TileState } from "../models.ts";

export const MAP_COLS = 96;
export const MAP_ROWS = 72;

export function generateInitialMap(seed = 1): Record<string, TileState[]> {
  const random = new SeededRandom(seed);
  const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

  const tilesByOwner: Record<string, TileState[]> = {
    centro: [], periferia: [], zona_industrial: []
  };

  const ownerForCol = (c: number) => {
    if (c < Math.floor(MAP_COLS * 0.35)) return 'periferia';
    if (c < Math.floor(MAP_COLS * 0.65)) return 'centro';
    return 'zona_industrial';
  };

  const map = Array.from({ length: MAP_ROWS }, (_, r) =>
    Array.from({ length: MAP_COLS }, (_, c) => ({
      type: 'grass', owner: ownerForCol(c), level: 0, age: 0, col: c, row: r
    }))
  );

  // Per-cell terrain noise avoids the old two-region diagonal split. A
  // meandering river is layered on top so water remains contiguous without
  // becoming a repeated vertical strip.
  let riverCenter = Math.floor(MAP_COLS * 0.46);
  for (let row = 0; row < MAP_ROWS; row++) {
    riverCenter = clamp(riverCenter + Math.round(random.centered(1.2)), 28, 58);
    const riverWidth = 2 + Math.floor(random.next() * 3);
    for (let col = 0; col < MAP_COLS; col++) {
      const localWave = Math.sin(row * 0.16) * 3 + Math.sin(row * 0.43) * 1.5;
      const terrainNoise = random.next();
      const riverDistance = Math.abs(col - (riverCenter + Math.round(localWave)));
      const tile = map[row][col];
      if (riverDistance <= riverWidth) tile.type = 'water';
      else if (riverDistance <= riverWidth + 2 || terrainNoise < 0.08) tile.type = 'sand';
      else if (terrainNoise < 0.16) tile.type = 'tree';
      else tile.type = 'grass';
    }
  }

  const hRoads: number[] = []; const vRoads: number[] = [];
  for (let r = 6; r < MAP_ROWS; r += 9) hRoads.push(r);
  for (let c = 7; c < MAP_COLS; c += 11) vRoads.push(c);

  hRoads.forEach(row => {
    for (let c = 0; c < MAP_COLS; c++) {
      map[row][c].type = (map[row][c].type === 'water') ? 'bridge' : 'road';
    }
  });
  vRoads.forEach(col => {
    for (let r = 0; r < MAP_ROWS; r++) {
      if (map[r][col].type !== 'road') map[r][col].type = (map[r][col].type === 'water') ? 'bridge' : 'road';
    }
  });

  for (let i = 0; i < 45; i++) {
    const cc = Math.floor(random.next() * Math.floor(MAP_COLS * 0.32));
    const rr = Math.floor(random.next() * MAP_ROWS);
    if (map[rr]?.[cc]?.type === 'grass') {
      map[rr][cc].type = 'tree';
      [[0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, -1]].forEach(([dc, dr]) => {
        const nc = cc + dc, nr = rr + dr;
        if (nr >= 0 && nr < MAP_ROWS && nc >= 0 && nc < MAP_COLS && map[nr][nc].type === 'grass' && random.next() > 0.45)
          map[nr][nc].type = 'tree';
      });
    }
  }

  const nearRoad = (c: number, r: number, d: number) => {
    for (let dr = -d; dr <= d; dr++) {
      for (let dc = -d; dc <= d; dc++) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < MAP_ROWS && nc >= 0 && nc < MAP_COLS && (map[nr][nc].type === 'road' || map[nr][nc].type === 'bridge'))
          return true;
      }
    }
    return false;
  };



  const pwCol = Math.floor(MAP_COLS * 0.66);
  for (let row = 0; row < MAP_ROWS; row += 4) {
    if (map[row][pwCol]?.type === 'grass') map[row][pwCol].type = 'power';
  }

  // Populate road-accessible plots with district-appropriate structures.
  // Each placement samples independently; no single zone type is repeated by
  // an entire row as in the previous power-column placeholder.
  for (let row = 1; row < MAP_ROWS - 1; row++) {
    for (let col = 1; col < MAP_COLS - 1; col++) {
      const tile = map[row][col];
      if (tile.type !== 'grass' || !nearRoad(col, row, 2) || random.next() > 0.24) continue;
      const district = tile.owner;
      const roll = random.next();
      if (district === 'zona_industrial') tile.type = roll < 0.62 ? 'bldg-i' : 'bldg-c';
      else if (district === 'centro') tile.type = roll < 0.62 ? 'bldg-c' : 'bldg-r';
      else tile.type = roll < 0.78 ? 'bldg-r' : 'park';
    }
  }

  for (let row = 0; row < MAP_ROWS; row++) {
    for (let col = 0; col < MAP_COLS; col++) {
      const t = map[row][col];
      tilesByOwner[t.owner].push({ col: t.col, row: t.row, type: t.type, level: t.level, age: t.age });
    }
  }

  return tilesByOwner;
}
