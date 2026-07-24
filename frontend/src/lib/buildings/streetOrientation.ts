/**
 * Helper to determine adjacent street directions for a building tile.
 *
 * Map Directions in Isometric Grid:
 *   - South (SE in screen at rot 0): (col, row + 1)
 *   - West  (SW in screen at rot 0): (col - 1, row)
 *   - North (NW in screen at rot 0): (col, row - 1)
 *   - East  (NE in screen at rot 0): (col + 1, row)
 */

export type StreetOrientation = 'south' | 'west' | 'north' | 'east';

function isRoad(map: any[][] | undefined, col: number, row: number): boolean {
  if (!map || row < 0 || row >= map.length || col < 0 || col >= (map[0]?.length ?? 0)) return false;
  const tile = map[row]?.[col];
  if (!tile) return false;
  const t = tile.type ?? tile;
  return typeof t === 'string' && (t === 'road' || t.startsWith('road') || t.startsWith('r-') || t === 'r');
}

/**
 * Detects adjacent streets and returns the primary face the entrance door
 * should point toward ('south', 'west', 'north', or 'east').
 * In isometric projection at rot 0:
 *   - 'south': road is at (col, row+1) -> door renders on SE face
 *   - 'west':  road is at (col-1, row) -> door renders on SW face
 *   - 'east':  road is at (col+1, row) -> door renders on SE face
 *   - 'north': road is at (col, row-1) -> door renders on SW face
 */
export function getBuildingFacing(map: any[][] | undefined, col: number, row: number): StreetOrientation {
  // In Metropolica's gridToIso projection:
  //   (col, row + 1) is SW on screen (the main diagonal road in the user's screenshot)
  //   (col + 1, row) is SE on screen
  //   (col, row - 1) is NE on screen
  //   (col - 1, row) is NW on screen
  if (isRoad(map, col, row + 1)) return 'west';   // Road is on SW side -> door faces SW
  if (isRoad(map, col + 1, row)) return 'south';  // Road is on SE side -> door faces SE
  if (isRoad(map, col - 1, row)) return 'north';  // Road is on NW side -> door faces NW
  if (isRoad(map, col, row - 1)) return 'east';   // Road is on NE side -> door faces NE
  return 'west';
}
