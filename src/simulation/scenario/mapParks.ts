import { SeededRandom } from "../../core/random/index.ts";

type MapTile = { type: string; col: number; row: number; owner: string };
type MapGrid = MapTile[][];

/**
 * Spawn random park clusters across all districts.
 *
 * All districts can get 4-tile parks; frequency differs per district:
 *   - periferia:      many large parks (2-4 tiles)
 *   - centro:         mixed parks (1-4 tiles)
 *   - zona_industrial: mostly small (1-2 tiles), occasional 3-4
 *
 * Parks are only placed on grass tiles near a road so they are visible.
 * Each cluster grows organically via BFS into adjacent grass tiles.
 */
export function spawnParks(
  map: MapGrid,
  rows: number,
  cols: number,
  random: SeededRandom
): void {
  const isRoad = (r: number, c: number) => {
    const t = map[r]?.[c]?.type;
    return t === 'road' || t === 'bridge';
  };

  const nearRoad = (r: number, c: number, d: number): boolean => {
    for (let dr = -d; dr <= d; dr++)
      for (let dc = -d; dc <= d; dc++)
        if (isRoad(r + dr, c + dc)) return true;
    return false;
  };

  const scale = (cols * rows) / (96 * 72);

  /**
   * Weighted cluster size picker — always includes 4 in all districts,
   * but frequency weight differs. For periferia 4-tile parks are common.
   */
  const pickSize = (district: string): number => {
    const roll = random.next();
    if (district === 'periferia') {
      if (roll < 0.15) return 1;
      if (roll < 0.35) return 2;
      if (roll < 0.60) return 3;
      return 4;                    // 40% of periferia parks are 4-tile
    }
    if (district === 'centro') {
      if (roll < 0.20) return 1;
      if (roll < 0.45) return 2;
      if (roll < 0.70) return 3;
      return 4;                    // 30% of centro parks are 4-tile
    }
    // zona_industrial
    if (roll < 0.35) return 1;
    if (roll < 0.65) return 2;
    if (roll < 0.85) return 3;
    return 4;                      // 15% chance of surprise 4-tile industrial park
  };

  const clusterCounts: Record<string, number> = {
    periferia:       Math.round(6 + random.next() * 4) * scale,
    centro:          Math.round(5 + random.next() * 4) * scale,
    zona_industrial: Math.round(3 + random.next() * 3) * scale,
  };

  for (const [district, count] of Object.entries(clusterCounts)) {
    let attempts = 0;
    let placed = 0;
    const target = Math.round(count);

    while (placed < target && attempts < target * 40) {
      attempts++;
      const r = Math.floor(random.next() * rows);
      const c = Math.floor(random.next() * cols);
      const seed = map[r]?.[c];
      if (!seed || seed.type !== 'grass' || seed.owner !== district) continue;
      if (!nearRoad(r, c, 3)) continue; // slightly wider road search

      const targetSize = pickSize(district);
      const frontier: [number, number][] = [[r, c]];
      const inFrontier = new Set<string>([`${r}:${c}`]);
      const cluster: [number, number][] = [];

      while (frontier.length && cluster.length < targetSize) {
        // pick random from frontier for organic shape
        const idx = Math.floor(random.next() * frontier.length);
        const [cr, cc] = frontier.splice(idx, 1)[0];
        inFrontier.delete(`${cr}:${cc}`);
        if (map[cr]?.[cc]?.type !== 'grass') continue;
        cluster.push([cr, cc]);
        // expand frontier
        for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]] as const) {
          const nr = cr + dr, nc = cc + dc;
          const nk = `${nr}:${nc}`;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
              !inFrontier.has(nk) &&
              map[nr][nc].type === 'grass' &&
              map[nr][nc].owner === district) {
            frontier.push([nr, nc]);
            inFrontier.add(nk);
          }
        }
      }

      if (cluster.length === 0) continue;
      cluster.forEach(([gr, gc]) => { map[gr][gc].type = 'park'; });
      placed++;
    }
  }
}
