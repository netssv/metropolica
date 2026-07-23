import { selectBusinessMarkers } from '../../lib/businessAccents';

export function computeHousingByTile(simState: any): Map<string, { income: number; householdSize: number }> {
  const housingByTile = new Map<string, { income: number; householdSize: number }>();
  if (!simState?.citizens) return housingByTile;

  for (const [districtId, districtCitizens] of Object.entries(simState.citizens)) {
    for (const citizen of districtCitizens as any[]) {
      if (!citizen.homeTile) continue;
      const index = Number(String(citizen.householdId ?? '').split('-').pop());
      const income =
        (simState?.districts ?? []).find((d: any) => d.id === districtId)?.cohorts?.[index]?.income ?? 0;
      const key = `${districtId}:${citizen.homeTile.col}:${citizen.homeTile.row}`;
      const previous = housingByTile.get(key);
      housingByTile.set(key, {
        income: Math.max(previous?.income ?? 0, income),
        householdSize: (previous?.householdSize ?? 0) + 1,
      });
    }
  }
  return housingByTile;
}

export function computeMarkerSet(map: any[][]): Set<string> {
  const markerSet = new Set<string>();
  const markerTilesByDistrict = new Map<string, any[]>();

  for (const row of map) {
    for (const tile of row ?? []) {
      const key = tile.owner ?? '';
      const list = markerTilesByDistrict.get(key) ?? [];
      list.push(tile);
      markerTilesByDistrict.set(key, list);
    }
  }

  for (const tiles of markerTilesByDistrict.values()) {
    for (const service of ['gasoline', 'supermarket'] as const) {
      for (const tile of selectBusinessMarkers(tiles, service)) {
        markerSet.add(`${tile.type}:${tile.col}:${tile.row}`);
      }
    }
  }
  return markerSet;
}
