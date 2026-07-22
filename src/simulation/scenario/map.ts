import { SeededRandom } from "../../core/random/index.ts";
import type { TileState } from "../models.ts";

export const MAP_COLS = 96;
export const MAP_ROWS = 72;
/** The scenario seeds 20 citizens in each district; start with one home plot per citizen. */
export const MIN_RESIDENTIAL_TILES_PER_DISTRICT = 20;
const INITIAL_DISTRICT_POPULATION: Record<string, number> = { centro: 800, periferia: 1200, zona_industrial: 700 };
const INITIAL_RESIDENTIAL_TILES_PER_DISTRICT = 20;

function initialBuildingLimit(type: string, district: string): number | undefined {
  const population = INITIAL_DISTRICT_POPULATION[district];
  if (type === 'bldg-r') return INITIAL_RESIDENTIAL_TILES_PER_DISTRICT;
  if (type === 'bldg-c') return Math.max(4, Math.ceil(population / 40));
  if (type === 'bldg-i') return Math.max(4, Math.ceil(population / 30));
  return undefined;
}

export function generateInitialMap(seed = 1, cols = MAP_COLS, rows = MAP_ROWS): Record<string, TileState[]> {
  const random = new SeededRandom(seed);
  const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

  const tilesByOwner: Record<string, TileState[]> = {
    centro: [], periferia: [], zona_industrial: []
  };

  const ownerForCol = (c: number) => {
    if (c < Math.floor(cols * 0.35)) return 'periferia';
    if (c < Math.floor(cols * 0.65)) return 'centro';
    return 'zona_industrial';
  };

  const map: Array<Array<{ type: string; owner: string; level: number; age: number; col: number; row: number; specialty?: TileState["specialty"] }>> = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ({
      type: 'grass', owner: ownerForCol(c), level: 0, age: 0, col: c, row: r, specialty: undefined
    }))
  );

  // Every seed chooses a different water/terrain profile. This keeps random
  // cities from always having the same river in the same place.
  const terrainProfile = Math.floor(random.next() * 4);
  const lagoonCol = Math.floor(cols * (0.25 + random.next() * 0.5));
  const lagoonRow = Math.floor(rows * (0.25 + random.next() * 0.5));
  const lagoonRadius = Math.max(3, Math.floor(Math.min(cols, rows) * 0.2));
  let riverCenter = Math.floor(cols * (0.25 + random.next() * 0.5));
  for (let row = 0; row < rows; row++) {
    riverCenter = clamp(riverCenter + Math.round(random.centered(1.2)), Math.floor(cols * 0.25), Math.floor(cols * 0.7));
    const riverWidth = 2 + Math.floor(random.next() * 3);
    for (let col = 0; col < cols; col++) {
      const localWave = Math.sin(row * 0.16) * 3 + Math.sin(row * 0.43) * 1.5;
      const terrainNoise = random.next();
      const riverDistance = Math.abs(col - (riverCenter + Math.round(localWave)));
      const lagoonDistance = Math.hypot(col - lagoonCol, row - lagoonRow);
      const ocean = col < Math.max(2, Math.floor(cols * 0.12)) || row < Math.max(2, Math.floor(rows * 0.1));
      const tile = map[row][col];
      const isWater = terrainProfile === 0
        ? riverDistance <= riverWidth
        : terrainProfile === 1
          ? lagoonDistance <= lagoonRadius
          : terrainProfile === 2
            ? ocean
            : false;
      if (isWater) tile.type = 'water';
      else if (terrainProfile === 3 && terrainNoise < 0.42) tile.type = 'sand';
      else if (riverDistance <= riverWidth + 2 || terrainNoise < 0.08) tile.type = 'sand';
      else if (terrainNoise < 0.16) tile.type = 'tree';
      else tile.type = 'grass';
    }
  }

  const hRoads: number[] = []; const vRoads: number[] = [];
  for (let r = 6; r < rows; r += 9) hRoads.push(r);
  for (let c = 7; c < cols; c += 11) vRoads.push(c);

  hRoads.forEach(row => {
    for (let c = 0; c < cols; c++) {
      map[row][c].type = (map[row][c].type === 'water') ? 'bridge' : 'road';
    }
  });
  vRoads.forEach(col => {
    for (let r = 0; r < rows; r++) {
      if (map[r][col].type !== 'road') map[r][col].type = (map[r][col].type === 'water') ? 'bridge' : 'road';
    }
  });

  for (let i = 0; i < 45; i++) {
    const cc = Math.floor(random.next() * Math.floor(cols * 0.32));
    const rr = Math.floor(random.next() * rows);
    if (map[rr]?.[cc]?.type === 'grass') {
      map[rr][cc].type = 'tree';
      [[0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, -1]].forEach(([dc, dr]) => {
        const nc = cc + dc, nr = rr + dr;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && map[nr][nc].type === 'grass' && random.next() > 0.45)
          map[nr][nc].type = 'tree';
      });
    }
  }

  const nearRoad = (c: number, r: number, d: number) => {
    for (let dr = -d; dr <= d; dr++) {
      for (let dc = -d; dc <= d; dc++) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && (map[nr][nc].type === 'road' || map[nr][nc].type === 'bridge'))
          return true;
      }
    }
    return false;
  };



  const pwCol = Math.floor(cols * 0.66);
  for (let row = 0; row < rows; row += 4) {
    if (map[row][pwCol]?.type === 'grass') map[row][pwCol].type = 'power';
  }

  // Populate road-accessible plots with district-appropriate structures.
  // Each placement samples independently; no single zone type is repeated by
  // an entire row as in the previous power-column placeholder.
  for (let row = 1; row < rows - 1; row++) {
    for (let col = 1; col < cols - 1; col++) {
      const tile = map[row][col];
      if (tile.type !== 'grass' || !nearRoad(col, row, 2) || random.next() > 0.24) continue;
      const district = tile.owner;
      const roll = random.next();
      if (district === 'zona_industrial') tile.type = roll < 0.62 ? 'bldg-i' : 'bldg-c';
      else if (district === 'centro') tile.type = roll < 0.62 ? 'bldg-c' : 'bldg-r';
      else tile.type = roll < 0.78 ? 'bldg-r' : 'park';
    }
  }

  // Map dimensions describe available land, not starting demand. Keep the seeded stock
  // proportional to the scenario population so large maps do not begin with empty buildings.
  for (const district of Object.keys(tilesByOwner)) {
    for (const type of ['bldg-r', 'bldg-c', 'bldg-i']) {
      const limit = initialBuildingLimit(type, district);
      if (limit === undefined) continue;
      const buildings = map.flat().filter(tile => tile.owner === district && tile.type === type);
      buildings.slice(limit).forEach(tile => { tile.type = 'grass'; tile.specialty = undefined; });
    }
  }

  // Guarantee residential pockets without changing the seeded placement rolls.
  for (const district of Object.keys(tilesByOwner)) {
    const residential = () => map.flat().filter(tile => tile.owner === district && tile.type === 'bldg-r').length;
    const eligible = map.flat()
      .filter(tile => tile.owner === district && ['grass', 'sand', 'tree'].includes(tile.type))
      .sort((a, b) => Number(nearRoad(b.col, b.row, 2)) - Number(nearRoad(a.col, a.row, 2))
        || Number(b.type === 'grass') - Number(a.type === 'grass') || a.row - b.row || a.col - b.col);
    const needed = Math.max(0, MIN_RESIDENTIAL_TILES_PER_DISTRICT - residential());
    eligible.slice(0, needed).forEach(tile => { tile.type = 'bldg-r'; });
    if (needed > eligible.length) {
      console.warn(`[map] district ${district} has only ${residential()} residential tiles; map too small for minimum ${MIN_RESIDENTIAL_TILES_PER_DISTRICT}`);
    }
  }

  const adjacentToWater = (col: number, row: number) => {
    for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
      if (Math.abs(dc) + Math.abs(dr) > 2) continue;
      if (map[row + dr]?.[col + dc]?.type === 'water') return true;
    }
    return false;
  };

  // Ensure water-adjacent districts have a small, visible waterfront economy.
  // Ensure water-adjacent districts have a small, visible waterfront economy.
  for (const district of Object.keys(tilesByOwner)) {
    const waterfrontType = district === 'zona_industrial' ? 'bldg-i' : 'bldg-c';
    const limit = initialBuildingLimit(waterfrontType, district) ?? 0;
    const existingBuildings = map.flat().filter(tile => tile.owner === district && tile.type === waterfrontType);
    const existing = existingBuildings.length;
    const candidates = map.flat().filter(tile => tile.owner === district && ['grass', 'sand', 'tree'].includes(tile.type) && adjacentToWater(tile.col, tile.row))
      .sort((a, b) => Number(nearRoad(b.col, b.row, 2)) - Number(nearRoad(a.col, a.row, 2)) || a.row - b.row || a.col - b.col);
    const selected = candidates.slice(0, Math.min(2, candidates.length));
    if (selected.length && existing >= limit) {
      const demoted = existingBuildings.find(tile => !tile.specialty);
      if (demoted) { demoted.type = 'grass'; demoted.specialty = undefined; }
    }
    selected.slice(0, Math.max(0, limit - existing + (existing >= limit ? 1 : 0))).forEach((tile, index) => {
      tile.type = waterfrontType;
      tile.specialty = waterfrontType === 'bldg-i' ? (index % 2 ? 'customs' : 'water-treatment') : (index % 2 ? 'pier' : 'fish-market');
    });
  }

  // Dedicated Phase 1 service variants reuse commercial building tiles.
  for (const district of Object.keys(tilesByOwner)) {
    const commercial = map.flat().filter(tile => tile.owner === district && tile.type === 'bldg-c')
      .sort((a, b) => a.row - b.row || a.col - b.col);
    if (commercial[0]) commercial[0].specialty = 'hospital';
    if (commercial[1]) commercial[1].specialty = 'mall-government';
  }

  // Waterfront plots prefer uses that make sense next to water. Keep the role in
  // tile metadata so the renderer and future economy loops can recognize it.
  for (const district of Object.keys(tilesByOwner)) {
    const waterfront = map.flat().filter(tile => tile.owner === district && adjacentToWater(tile.col, tile.row)
      && (tile.type === 'bldg-c' || tile.type === 'bldg-i'))
      .sort((a, b) => a.row - b.row || a.col - b.col);
    waterfront.forEach((tile, index) => {
      if (tile.specialty === 'hospital' || tile.specialty === 'mall-government') return;
      if (tile.type === 'bldg-i') tile.specialty = index % 3 === 0 ? 'water-treatment' : 'customs';
      else tile.specialty = index % 3 === 0 ? 'fish-market' : index % 3 === 1 ? 'pier' : 'customs';
    });
  }

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const t = map[row][col];
      tilesByOwner[t.owner].push({ col: t.col, row: t.row, type: t.type, level: t.level, age: t.age, specialty: t.specialty });
    }
  }

  return tilesByOwner;
}
