import type { Citizen } from '../index.ts';
import { deriveCitizenRoutine, type RoutineActivity } from './derive.ts';

const cache = new Map<string, { day: number; signature: string; routine: RoutineActivity[] }>();
const signature = (citizen: Citizen) => JSON.stringify([
  citizen.level, citizen.occupation, citizen.interests, citizen.householdType,
  citizen.homeTile, citizen.workTile, citizen.workShift, citizen.workplaceType
]);

export function cachedCitizenRoutine(citizen: Citizen, day: number): RoutineActivity[] {
  const currentSignature = signature(citizen), previous = cache.get(citizen.id);
  if (previous?.day === day && previous.signature === currentSignature) return previous.routine;
  const routine = deriveCitizenRoutine(citizen, day);
  cache.set(citizen.id, { day, signature: currentSignature, routine });
  return routine;
}

export function invalidateCitizenRoutine(citizenId: string): void { cache.delete(citizenId); }
