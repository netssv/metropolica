import assert from 'node:assert/strict';
import test from 'node:test';
import { buildRoadGraph } from '../frontend/src/lib/trafficSystem.ts';
import { followingGap, MINIMUM_QUEUE_GAP, stopBeforeJunction, trafficDecision } from '../frontend/src/lib/citizens/trafficBehavior.ts';
import { signalVisualState } from '../frontend/src/lib/trafficSystem.ts';

const map = [
  [{ type: 'grass' }, { type: 'road' }, { type: 'grass' }],
  [{ type: 'road' }, { type: 'road' }, { type: 'road' }],
  [{ type: 'grass' }, { type: 'road' }, { type: 'grass' }]
];
const graph = buildRoadGraph(map);
const horizontal = (id: string, progress: number) => ({ id, route: [{ col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }], progress });
const vertical = (id: string, progress: number) => ({ id, route: [{ col: 1, row: 0 }, { col: 1, row: 1 }, { col: 1, row: 2 }], progress });

test('traffic follows the vehicle ahead only on the same directed segment', () => {
  const follower = horizontal('follower', 0.4), leader = horizontal('leader', 0.45);
  assert.equal(trafficDecision([follower, leader], follower, graph, 0).reason, 'following');
  const opposite = { id: 'opposite', route: [...leader.route].reverse(), progress: 0.45 };
  assert.equal(trafficDecision([follower, opposite], follower, graph, 0).reason, 'moving');
});

test('queued vehicles retain a logical gap through the front vehicle', () => {
  const a = horizontal('a', 0.40), b = horizontal('b', 0.44), c = horizontal('c', 0.48);
  assert.ok((followingGap(a, b) ?? 0) >= 0.05);
  assert.equal(trafficDecision([a, b, c], a, graph, 5000).reason, 'following');
  assert.equal(trafficDecision([a, b, c], b, graph, 5000).reason, 'following');
  assert.equal(MINIMUM_QUEUE_GAP, 0.4);
});

test('traffic stops at a red signal before entering a junction', () => {
  const car = horizontal('car', 0.4);
  assert.equal(trafficDecision([car], car, graph, 5000).reason, 'signal');
});

test('perpendicular vehicles use deterministic priority instead of mutual yield deadlock', () => {
  const priority = horizontal('alpha', 0.4), waiting = vertical('zulu', 0.4);
  assert.notEqual(trafficDecision([priority, waiting], priority, graph, 0).reason, 'yield');
  assert.ok(['yield', 'signal'].includes(trafficDecision([priority, waiting], waiting, graph, 0).reason));
});

test('stop point remains on the incoming edge', () => {
  assert.equal(stopBeforeJunction(0.54), false);
  assert.equal(stopBeforeJunction(0.55), true);
});

test('signal visual state follows the movement phase', () => {
  assert.equal(signalVisualState('horizontal', 0).state, 'green');
  assert.equal(signalVisualState('vertical', 0).state, 'red');
  assert.equal(signalVisualState('horizontal', 4050).state, 'yellow');
});
