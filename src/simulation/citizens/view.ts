import type { Citizen } from './index.ts';
import { cachedCitizenRoutine } from './routine/cache.ts';

export function citizenViewState(citizens: Record<string, Citizen[]>, day: number) {
  return Object.fromEntries(Object.entries(citizens).map(([districtId, list]) => [
    districtId,
    list.map(citizen => citizen.level === 3
      ? { ...citizen, routine: cachedCitizenRoutine(citizen, day) }
      : citizen)
  ]));
}
