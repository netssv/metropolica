import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveCitizenRoutine, currentRoutineActivity } from '../src/simulation/citizens/routines.ts';
import type { Citizen } from '../src/simulation/citizens/index.ts';
import { citizenViewState } from '../src/simulation/citizens/view.ts';

const citizen: Citizen = {
  id: 'centro-citizen-1', householdId: 'centro-cohort-1', age: 31, occupation: 'comerciante',
  skills: [], aspirations: [], traits: [], relationships: [], interests: ['compras'], householdType: 'pareja',
  level: 3, homeTile: { col: 1, row: 1 }, workTile: { col: 4, row: 4 },
  workShift: { startHour: 8, endHour: 16 }, workplaceType: 'comercio',
};

test('citizen routines are deterministic and expose the current activity', () => {
  const first = deriveCitizenRoutine(citizen, 12);
  assert.deepEqual(first, deriveCitizenRoutine(citizen, 12));
  assert.equal(currentRoutineActivity(first, 12)?.activity, 'compras');
  assert.equal(deriveCitizenRoutine({ ...citizen, level: 2 }, 12).length, 0);
});

test('citizen view caches routines within a day and refreshes on day change', () => {
  const first = citizenViewState({ test: [citizen] }, 12).test[0].routine;
  const second = citizenViewState({ test: [citizen] }, 12).test[0].routine;
  const nextDay = citizenViewState({ test: [citizen] }, 13).test[0].routine;
  assert.strictEqual(first, second);
  assert.notStrictEqual(first, nextDay);
});
