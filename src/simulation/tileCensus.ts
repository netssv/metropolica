import type { Citizen } from './citizens/index.ts';
import type { TileState } from './models.ts';

export interface TileCensus {
  residencial: { total: number; casa: number; duplex: number; apartamento: number };
  comercial: number;
  mallGovernment: number;
  banco: number;
  industrial: number;
  parque: number;
  calle: number;
  centralElectrica: number;
  agua: number;
  terreno: number;
  hogaresAsignados: number;
  residencialesOcupados: number;
}

export const emptyTileCensus = (): TileCensus => ({
  residencial: { total: 0, casa: 0, duplex: 0, apartamento: 0 },
  comercial: 0, mallGovernment: 0, banco: 0, industrial: 0, parque: 0, calle: 0,
  centralElectrica: 0, agua: 0, terreno: 0, hogaresAsignados: 0, residencialesOcupados: 0
});

export function residentialCapacity(tile: Pick<TileState, 'type' | 'level'>): number {
  if (tile.type !== 'bldg-r' && tile.type !== 'zone-r') return 0;
  return tile.level >= 3 ? 4 : tile.level >= 2 ? 2 : 1;
}

export function censusTiles(tiles: TileState[], citizens: Pick<Citizen, 'householdId' | 'homeTile'>[] = []): TileCensus {
  const result = emptyTileCensus();
  const residential = new Map<string, TileState>();
  for (const tile of tiles) {
    const type = tile.type;
    if (type === 'bldg-r' || type === 'zone-r') {
      result.residencial.total++;
      if (tile.level >= 3) result.residencial.apartamento++;
      else if (tile.level >= 2) result.residencial.duplex++;
      else result.residencial.casa++;
      residential.set(`${tile.col},${tile.row}`, tile);
    } else if (type === 'bldg-c' || type === 'zone-c') {
      if (tile.specialty === 'mall-government') result.mallGovernment++;
      else if (tile.specialty === 'bank') result.banco++;
      else result.comercial++;
    } else if (type === 'bldg-i' || type === 'zone-i') result.industrial++;
    else if (type === 'park') result.parque++;
    else if (type === 'road' || type === 'bridge') result.calle++;
    else if (type === 'power') result.centralElectrica++;
    else if (type === 'water') result.agua++;
    else result.terreno++;
  }
  const assigned = new Map<string, Set<string>>();
  for (const citizen of citizens) {
    if (!citizen.homeTile) continue;
    const key = `${citizen.homeTile.col},${citizen.homeTile.row}`;
    if (!residential.has(key)) continue;
    if (!assigned.has(key)) assigned.set(key, new Set());
    assigned.get(key)!.add(citizen.householdId);
  }
  result.hogaresAsignados = [...assigned.values()].reduce((n, homes) => n + homes.size, 0);
  result.residencialesOcupados = assigned.size;
  return result;
}

export function censusCity(districts: Array<{ id: string; tiles: TileState[] }>, citizens: Record<string, Pick<Citizen, 'householdId' | 'homeTile'>[]> = {}) {
  const byDistrict = districts.map(d => ({ id: d.id, census: censusTiles(d.tiles, citizens[d.id] ?? []) }));
  const citywide = emptyTileCensus();
  for (const { census } of byDistrict) {
    for (const key of Object.keys(citywide) as Array<keyof TileCensus>) {
      if (key === 'residencial') for (const sub of Object.keys(citywide.residencial) as Array<keyof TileCensus['residencial']>) citywide.residencial[sub] += census.residencial[sub];
      else citywide[key] += census[key] as never;
    }
  }
  return { districts: byDistrict, citywide };
}
