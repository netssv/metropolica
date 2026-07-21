import type { CityState } from '../models.ts';
import type { Citizen } from './index.ts';
import { workplaceFor } from './classification.ts';
function stableIndex(id: string, length: number): number { let hash = 2166136261; for (const char of id) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619); return (hash >>> 0) % Math.max(1, length); }
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
    return [districtId, citizens.map(citizen => {
      if (citizen.level !== 3) return citizen;
      const workplace = workplaceFor(citizen);
      const commercial = commercialWorks[stableIndex(citizen.id, commercialWorks.length)];
      const refuel = industrialWorks[stableIndex(`${citizen.id}:refuel`, industrialWorks.length)] ?? commercial;
      if (citizen.homeTile && citizen.workTile && citizen.workShift && citizen.workplaceType === workplace.label) return { ...citizen, commercialTile: citizen.commercialTile ?? (commercial && { col: commercial.col, row: commercial.row }), refuelTile: citizen.refuelTile ?? (refuel && { col: refuel.col, row: refuel.row }) };
      if (citizen.homeTile && citizen.workTile) return { ...citizen, workShift: { startHour: 8, endHour: 16 }, workplaceType: workplace.label, commercialTile: commercial && { col: commercial.col, row: commercial.row }, refuelTile: refuel && { col: refuel.col, row: refuel.row } };
      const home = homes[stableIndex(citizen.id, homes.length)] ?? fallbackHomes[stableIndex(citizen.id, fallbackHomes.length)];
      const dedicatedWorks = workplace.specialty === 'hospital' ? hospitalWorks : workplace.specialty === 'mall-government' ? governmentWorks : [];
      const preferredWorks = dedicatedWorks.length ? dedicatedWorks : workplace.zone === 'bldg-i' ? industrialWorks : commercialWorks;
      const alternateWorks = workplace.zone === 'bldg-i' ? commercialWorks : industrialWorks;
      const work = preferredWorks[stableIndex(citizen.id, preferredWorks.length)] ?? alternateWorks[stableIndex(citizen.id, alternateWorks.length)] ?? fallbackWorks[stableIndex(citizen.id, fallbackWorks.length)];
      return home && work ? { ...citizen, homeTile: { col: home.col, row: home.row }, workTile: { col: work.col, row: work.row }, commercialTile: commercial && { col: commercial.col, row: commercial.row }, refuelTile: refuel && { col: refuel.col, row: refuel.row }, workShift: { startHour: 8, endHour: 16 }, workplaceType: workplace.label } : citizen;
    })];
  }));
}
