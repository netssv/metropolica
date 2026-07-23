import assert from 'node:assert/strict';
import test from 'node:test';
import { exitIsBlocked, pedestrianBlocksIntersection } from '../frontend/src/lib/citizens/intersectionControl.ts';

test('an occupied exit blocks an approaching vehicle but not opposite traffic', () => {
  const exit = { col: 2, row: 1 };
  const approaching = { id: 'ahead', route: [{ col: 1, row: 1 }, exit], progress: 0.2 };
  const opposite = { id: 'opposite', route: [exit, { col: 1, row: 1 }], progress: 0.2 };
  assert.equal(exitIsBlocked([approaching], 'candidate', exit), true);
  assert.equal(exitIsBlocked([opposite], 'candidate', exit), false);
});

test('pedestrian presence blocks only the matching intersection', () => {
  const pedestrians = [{ intersectionId: '1,1', progress: 0.4, direction: 'crossing' as const }];
  assert.equal(pedestrianBlocksIntersection(pedestrians, '1,1'), true);
  assert.equal(pedestrianBlocksIntersection(pedestrians, '2,1'), false);
});
