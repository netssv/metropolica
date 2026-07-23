type MapTile = {
  type: string; col: number; row: number; owner: string;
  specialty?: string | undefined;
};
type MapGrid = MapTile[][];

function adjacentToWater(map: MapGrid, col: number, row: number): boolean {
  for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
    if (Math.abs(dc) + Math.abs(dr) > 2) continue;
    if (map[row + dr]?.[col + dc]?.type === 'water') return true;
  }
  return false;
}

function nearRoad(map: MapGrid, c: number, r: number, d: number): boolean {
  for (let dr = -d; dr <= d; dr++)
    for (let dc = -d; dc <= d; dc++) {
      const t = map[r + dr]?.[c + dc]?.type;
      if (t === 'road' || t === 'bridge') return true;
    }
  return false;
}

function buildingLimit(type: string, district: string): number {
  const pop: Record<string, number> = { centro: 800, periferia: 1200, zona_industrial: 700 };
  const p = pop[district] ?? 700;
  if (type === 'bldg-c') return Math.max(4, Math.ceil(p / 40));
  if (type === 'bldg-i') return Math.max(4, Math.ceil(p / 30));
  return 0;
}

/** Assign waterfront building types + hospital/mall specialties. */
export function assignSpecialties(map: MapGrid, districts: string[]): void {
  // Waterfront economy
  for (const district of districts) {
    const waterfrontType = district === 'zona_industrial' ? 'bldg-i' : 'bldg-c';
    const limit = buildingLimit(waterfrontType, district);
    const existing = map.flat().filter(t => t.owner === district && t.type === waterfrontType);
    const candidates = map.flat()
      .filter(t => t.owner === district && ['grass','sand','tree'].includes(t.type) && adjacentToWater(map, t.col, t.row))
      .sort((a, b) => Number(nearRoad(map, b.col, b.row, 2)) - Number(nearRoad(map, a.col, a.row, 2)) || a.row - b.row || a.col - b.col);
    const selected = candidates.slice(0, Math.min(2, candidates.length));
    if (selected.length && existing.length >= limit) {
      const demoted = existing.find(t => !t.specialty);
      if (demoted) { demoted.type = 'grass'; demoted.specialty = undefined; }
    }
    selected.slice(0, Math.max(0, limit - existing.length + (existing.length >= limit ? 1 : 0))).forEach((t, i) => {
      t.type = waterfrontType;
      t.specialty = waterfrontType === 'bldg-i' ? (i % 2 ? 'customs' : 'water-treatment') : (i % 2 ? 'pier' : 'fish-market');
    });
  }

  // Service specialties (hospital + mall)
  for (const district of districts) {
    const commercial = map.flat().filter(t => t.owner === district && t.type === 'bldg-c')
      .sort((a, b) => a.row - b.row || a.col - b.col);
    if (commercial[0]) commercial[0].specialty = 'hospital';
    if (commercial[1]) commercial[1].specialty = 'mall-government';
  }

  // Remaining waterfront buildings get water-related specialties
  for (const district of districts) {
    const waterfront = map.flat()
      .filter(t => t.owner === district && adjacentToWater(map, t.col, t.row) && (t.type === 'bldg-c' || t.type === 'bldg-i'))
      .sort((a, b) => a.row - b.row || a.col - b.col);
    waterfront.forEach((t, i) => {
      if (t.specialty === 'hospital' || t.specialty === 'mall-government') return;
      if (t.type === 'bldg-i') t.specialty = i % 3 === 0 ? 'water-treatment' : 'customs';
      else t.specialty = i % 3 === 0 ? 'fish-market' : i % 3 === 1 ? 'pier' : 'customs';
    });
  }
}
