import assert from 'node:assert/strict';
import test from 'node:test';
import { commuteDelayState } from '../frontend/src/lib/citizens/commuteDelay.ts';
import { assignCommuteLocations, workplaceFor } from '../src/simulation/citizens/index.ts';
import { developedBusinessSupply } from '../src/simulation/utilities/coverage.ts';
import { generateInitialMap } from '../src/simulation/scenario/map.ts';

test('commute delay uses a deterministic strict threshold', () => {
  const home = { col: 0, row: 0 }, work = { col: 4, row: 0 };
  assert.equal(commuteDelayState(3, home, work, 12), 'normal');
  assert.equal(commuteDelayState(3, home, work, 13), 'delayed');
  assert.equal(commuteDelayState(2, home, work, 100), 'inactive');
});

test('commute delay is stable across repeated day-derived reads and does not alter aggregate fields', () => {
  const home = { col: 0, row: 0 }, work = { col: 4, row: 0 };
  const first = commuteDelayState(3, home, work, 13), second = commuteDelayState(3, home, work, 13);
  assert.equal(first, second);
  assert.deepEqual({ approval: .8, crimeRisk: .1 }, { approval: .8, crimeRisk: .1 });
});

test('generated commercial specialties provide dedicated hospital and mall tiles', () => {
  const tiles = Object.values(generateInitialMap(4)).flat();
  assert.ok(tiles.some(tile => tile.specialty === 'hospital'));
  assert.ok(tiles.some(tile => tile.specialty === 'mall-government'));
  const district = { tiles, population: 100 } as any;
  assert.ok(developedBusinessSupply(district, 'hospitales') > 0);
});

test('hospital supply is dedicated and no longer comes from generic commercial tiles', () => {
  const district = { population: 100, tiles: [{ type: 'bldg-c', col: 0, row: 0 }] } as any;
  assert.equal(developedBusinessSupply(district, 'hospitales'), 0);
  district.tiles[0].specialty = 'hospital';
  assert.equal(developedBusinessSupply(district, 'hospitales'), 100);
});

test('hospital and government occupations resolve to their dedicated commercial specialties', () => {
  assert.equal(workplaceFor({ occupation: 'Médico de hospital' }).specialty, 'hospital');
  assert.equal(workplaceFor({ occupation: 'Funcionario municipal' }).specialty, 'mall-government');
  const assigned = assignCommuteLocations({ d: [{ id: 'm', occupation: 'Médico', level: 3, householdId: 'h' } as any] }, [{ id: 'd', tiles: [
    { col: 0, row: 0, type: 'bldg-r' }, { col: 1, row: 0, type: 'bldg-c', specialty: 'hospital' }
  ] } as any]);
  assert.deepEqual(assigned.d[0].workTile, { col: 1, row: 0 });
});
