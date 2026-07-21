import { SeededRandom } from '../../../core/random/index.ts';
import { ROUTINE_TEMPLATES, type RoutineTemplate } from '../../../../content/citizens/routine_templates.ts';
import type { Citizen } from '../index.ts';

export type RoutineActivity = { activity: string; label: string; startHour: number; endHour: number; location: 'home' | 'work' | 'commercial' | 'refuel' };
function matches(citizen: Citizen, template: RoutineTemplate): boolean {
  const interests = (citizen.interests ?? []).map(value => value.toLowerCase());
  const household = (citizen.householdType ?? '').toLowerCase();
  return Boolean(template.interests?.some(value => interests.some(item => item.includes(value))) || template.householdTypes?.some(value => household.includes(value)));
}
function pickTemplate(citizen: Citizen, day: number): RoutineTemplate | undefined {
  const candidates = ROUTINE_TEMPLATES.filter(template => matches(citizen, template));
  if (!candidates.length) return undefined;
  const key = `${citizen.id}:${citizen.occupation}:${day}`;
  const seed = [...key].reduce((sum, value) => (sum * 31 + value.charCodeAt(0)) >>> 0, 7);
  return candidates[Math.floor(new SeededRandom(seed).next() * candidates.length)];
}
export function deriveCitizenRoutine(citizen: Citizen, day: number): RoutineActivity[] {
  if (citizen.level !== 3 || !citizen.homeTile || !citizen.workTile || !citizen.workShift) return [];
  const shift = citizen.workShift, midday = pickTemplate(citizen, day);
  return [
    { activity: 'sueño', label: 'Sueño', startHour: 0, endHour: 7, location: 'home' },
    { activity: 'preparación', label: 'Preparación en casa', startHour: 7, endHour: shift.startHour, location: 'home' },
    { activity: 'traslado al trabajo', label: 'Traslado al trabajo', startHour: shift.startHour, endHour: shift.startHour + 1, location: 'work' },
    ...(midday ? [{ ...midday, location: midday.activity === 'compras' ? 'commercial' as const : midday.activity === 'refuel' ? 'refuel' as const : 'work' as const }] : []),
    { activity: 'trabajo', label: `Trabajo · ${citizen.workplaceType ?? 'ocupación'}`, startHour: shift.startHour + 1, endHour: shift.endHour - 1, location: 'work' },
    { activity: 'regreso a casa', label: 'Regreso a casa', startHour: shift.endHour, endHour: shift.endHour + 1, location: 'home' },
    { activity: 'ocio en casa', label: 'Ocio en casa', startHour: shift.endHour + 1, endHour: 22, location: 'home' },
    { activity: 'sueño', label: 'Sueño', startHour: 22, endHour: 24, location: 'home' },
  ];
}
export function currentRoutineActivity(routine: RoutineActivity[], hour: number): RoutineActivity | undefined { return routine.find(block => hour >= block.startHour && hour < block.endHour); }
