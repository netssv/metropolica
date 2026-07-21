import { T } from './constants.ts';

export type BusinessAccentType = 'gasoline' | 'supermarket';
export type AccentTile = { type: string; col: number; row: number };
const BUSINESS_ACCENT_MIN_DISTANCE = 6;
const CANDIDATE_PERIOD = 16;

export function selectBusinessMarkers(tiles: AccentTile[], service: BusinessAccentType): AccentTile[] {
  const building = service === 'gasoline' ? 'bldg-i' : 'bldg-c';
  const accepted: AccentTile[] = [];
  const candidates = tiles
    .filter(t => t.type === building && (((t.col * 31 + t.row * 17) >>> 0) % CANDIDATE_PERIOD === 0))
    .sort((a, b) => a.row - b.row || a.col - b.col);
  for (const tile of candidates) {
    if (accepted.every(other => Math.abs(tile.col - other.col) + Math.abs(tile.row - other.row) >= BUSINESS_ACCENT_MIN_DISTANCE)) {
      accepted.push(tile);
    }
  }
  return accepted;
}

export function isBusinessMarker(tiles: AccentTile[], service: BusinessAccentType, col: number, row: number): boolean {
  return selectBusinessMarkers(tiles, service).some(t => t.col === col && t.row === row);
}

export function hasBusinessAccent(type: string, col: number, row: number, tiles: AccentTile[] = []): boolean {
  if (type !== T.BLDG_C && type !== T.BLDG_I) return false;
  const source = tiles.length ? tiles : [{ type, col, row }];
  return isBusinessMarker(source, type === T.BLDG_I ? 'gasoline' : 'supermarket', col, row);
}
