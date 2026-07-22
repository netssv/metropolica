import type { CityState } from '../models.ts';
import type { Citizen } from './index.ts';
import { workplaceFor } from './classification.ts';
import { residentialCapacity } from '../tileCensus.ts';
function stableIndex(id: string, length: number): number { let hash = 2166136261; for (const char of id) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619); return (hash >>> 0) % Math.max(1, length); }
function tileCapacity(tile: { type?: string; level?: number }): number {
  if (tile.type === 'bldg-r' || tile.type === 'zone-r') return residentialCapacity({ type: tile.type, level: tile.level ?? 0 } as any);
  return tile.level && tile.level >= 2 ? 3 : 1;
}
function assignTile<T extends { type?: string; level?: number }>(tiles: T[], id: string, usage: Map<T, number>): T | undefined {
  if (!tiles.length) return undefined;
  const start = stableIndex(id, tiles.length);
  for (let offset = 0; offset < tiles.length; offset++) {
    const tile = tiles[(start + offset) % tiles.length];
    if ((usage.get(tile) ?? 0) < tileCapacity(tile)) { usage.set(tile, (usage.get(tile) ?? 0) + 1); return tile; }
  }
  const fallback = tiles[start]; usage.set(fallback, (usage.get(fallback) ?? 0) + 1); return fallback;
}
export function assignCommuteLocations(assigned: Record<string, Citizen[]>, districts: CityState['districts']): Record<string, Citizen[]> {
  return Object.fromEntries(Object.entries(assigned).map(([districtId, citizens]) => {
    const tiles = districts.find(d => d.id === districtId)?.tiles ?? [];
    const homes = tiles.filter(t => t.type === 'bldg-r' || t.type === 'zone-r');
    const commercialWorks = tiles.filter(t => t.type === 'bldg-c' || t.type === 'zone-c');
    const hospitalWorks = commercialWorks.filter(t => t.specialty === 'hospital');
    const governmentWorks = commercialWorks.filter(t => t.specialty === 'mall-government');
    const industrialWorks = tiles.filter(t => t.type === 'bldg-i' || t.type === 'zone-i');
    const fallbackHomes = tiles.filter(t => t.type === 'grass');
      const fallbackWorks = tiles.filter(t => t.type === 'bldg-c' || t.type === 'bldg-i' || t.type === 'grass');
    const homeUsage = new Map<typeof tiles[number], number>(), workUsage = new Map<typeof tiles[number], number>();
    const householdHomes = new Map<string, typeof tiles[number]>();
    for (const citizen of citizens) {
      if (!citizen.homeTile) continue;
      const existing = homes.find(tile => tile.col === citizen.homeTile!.col && tile.row === citizen.homeTile!.row);
      if (existing && !householdHomes.has(citizen.householdId)) {
        householdHomes.set(citizen.householdId, existing);
        homeUsage.set(existing, (homeUsage.get(existing) ?? 0) + 1);
      }
    }
    return [districtId, citizens.map(citizen => {
      const assignedHome = householdHomes.get(citizen.householdId) ?? assignTile(homes, citizen.householdId, homeUsage) ?? (homes.length ? homes[stableIndex(citizen.id, homes.length)] : undefined);
      if (assignedHome) householdHomes.set(citizen.householdId, assignedHome);
      if (citizen.level !== 3) return assignedHome ? { ...citizen, homeTile: citizen.homeTile ?? { col: assignedHome.col, row: assignedHome.row } } : citizen;
      const workplace = workplaceFor(citizen);
      const commercial = assignTile(commercialWorks, citizen.id, workUsage);
      const refuel = assignTile(industrialWorks, `${citizen.id}:refuel`, workUsage) ?? commercial;
      if (citizen.homeTile && citizen.workTile && citizen.workShift && citizen.workplaceType === workplace.label) return { ...citizen, commercialTile: citizen.commercialTile ?? (commercial && { col: commercial.col, row: commercial.row }), refuelTile: citizen.refuelTile ?? (refuel && { col: refuel.col, row: refuel.row }) };
      if (citizen.homeTile && citizen.workTile) return { ...citizen, workShift: { startHour: 8, endHour: 16 }, workplaceType: workplace.label, commercialTile: commercial && { col: commercial.col, row: commercial.row }, refuelTile: refuel && { col: refuel.col, row: refuel.row } };
      const home = assignedHome ?? (homes.length ? undefined : fallbackHomes[stableIndex(citizen.id, fallbackHomes.length)]);
      const dedicatedWorks = workplace.specialty === 'hospital' ? hospitalWorks : workplace.specialty === 'mall-government' ? governmentWorks : [];
      const preferredWorks = dedicatedWorks.length ? dedicatedWorks : workplace.zone === 'bldg-i' ? industrialWorks : commercialWorks;
      const alternateWorks = workplace.zone === 'bldg-i' ? commercialWorks : industrialWorks;
      const work = assignTile(preferredWorks, citizen.id, workUsage) ?? assignTile(alternateWorks, `${citizen.id}:alternate`, workUsage) ?? assignTile(fallbackWorks, `${citizen.id}:fallback`, workUsage);
      return home && work ? { ...citizen, homeTile: { col: home.col, row: home.row }, workTile: { col: work.col, row: work.row }, commercialTile: commercial && { col: commercial.col, row: commercial.row }, refuelTile: refuel && { col: refuel.col, row: refuel.row }, workShift: { startHour: 8, endHour: 16 }, workplaceType: workplace.label } : citizen;
    })];
  }));
}
