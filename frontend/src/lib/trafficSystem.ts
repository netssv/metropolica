type Tile = { type?: string } | null;
export type RoadNode = { col: number; row: number };
export type RoadGraph = Map<string, RoadNode[]>;
export type SignalState = 'red' | 'yellow' | 'green';

const ROAD_TYPES = new Set(['road', 'bridge']);
const DIRECTIONS = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;
function key(col: number, row: number) { return `${col},${row}`; }

export function roadSignature(map: Tile[][]) {
  return map.map(row => row.map(tile => ROAD_TYPES.has(tile?.type ?? '') ? (tile?.type ?? '') : '').join(',')).join(';');
}

export function buildRoadGraph(map: Tile[][]): RoadGraph {
  const nodes: RoadNode[] = [], graph: RoadGraph = new Map();
  for (let row = 0; row < map.length; row++) for (let col = 0; col < (map[row]?.length ?? 0); col++) {
    if (ROAD_TYPES.has(map[row]?.[col]?.type ?? '')) nodes.push({ col, row });
  }
  for (const node of nodes) {
    const neighbors = DIRECTIONS.map(([dc, dr]) => ({ col: node.col + dc, row: node.row + dr }))
      .filter(candidate => ROAD_TYPES.has(map[candidate.row]?.[candidate.col]?.type ?? ''));
    if (neighbors.length) graph.set(key(node.col, node.row), neighbors);
  }
  return graph;
}

export function findRoadRoute(graph: RoadGraph, start: RoadNode, goal: RoadNode): RoadNode[] {
  const startKey = key(start.col, start.row), goalKey = key(goal.col, goal.row);
  if (!graph.has(startKey) || !graph.has(goalKey)) return [];
  const queue = [startKey], previous = new Map<string, string | null>([[startKey, null]]);
  while (queue.length) {
    const current = queue.shift()!;
    if (current === goalKey) break;
    for (const next of graph.get(current) ?? []) {
      const nextKey = key(next.col, next.row);
      if (!previous.has(nextKey)) { previous.set(nextKey, current); queue.push(nextKey); }
    }
  }
  if (!previous.has(goalKey)) return [];
  const route: RoadNode[] = [];
  let current: string | null = goalKey;
  while (current) { const [col, row] = current.split(',').map(Number); route.unshift({ col, row }); current = previous.get(current) ?? null; }
  return route;
}

export function signalState(axis: 'horizontal' | 'vertical', time: number): SignalState {
  const phase = (time % 9000) / 9000;
  if (phase < 0.45) return axis === 'horizontal' ? 'green' : 'red';
  if (phase < 0.5) return axis === 'horizontal' ? 'yellow' : 'red';
  if (phase < 0.95) return axis === 'vertical' ? 'green' : 'red';
  return axis === 'vertical' ? 'yellow' : 'red';
}

/** Visual state uses the exact same phase as movement decisions. */
export function signalVisualState(axis: 'horizontal' | 'vertical', time: number): { state: SignalState; color: string } {
  const state = signalState(axis, time);
  return { state, color: state === 'green' ? '#38d26f' : state === 'yellow' ? '#ffd447' : '#f04d55' };
}

export function isRedSignal(graph: RoadGraph, node: RoadNode, time: number, axis: 'horizontal' | 'vertical') {
  const neighbors = graph.get(key(node.col, node.row)) ?? [];
  return neighbors.length >= 3 && signalState(axis, time) !== 'green';
}

/** Minimum progress gap for two cars sharing the same road node. */
export function hasVehicleAhead(trips: Array<{ id: string; route: RoadNode[]; progress: number }>, trip: { id: string; route: RoadNode[]; progress: number }, routeIndex: number, minimumGap = 0.18) {
  const node = trip.route[routeIndex];
  return trips.some(other => other.id !== trip.id && other.route[routeIndex]?.col === node?.col && other.route[routeIndex]?.row === node?.row && other.progress > trip.progress && other.progress - trip.progress < minimumGap);
}
