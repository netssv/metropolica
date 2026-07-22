import { isRedSignal, type RoadGraph, type RoadNode } from '../trafficSystem.ts';

export type TrafficTrip = { id: string; route: RoadNode[]; progress: number };
export type TrafficDecision = { speed: number; reason: 'moving' | 'following' | 'signal' | 'yield' };
// Progress is advanced in bounded but discrete frames; keep a buffer larger than one frame
// so a binary stop decision cannot step into the vehicle ahead.
export const MINIMUM_QUEUE_GAP = 0.4;

const same = (a?: RoadNode, b?: RoadNode) => Boolean(a && b && a.col === b.col && a.row === b.row);
const segmentIndex = (trip: TrafficTrip) => Math.max(0, Math.min(trip.route.length - 2, Math.floor(trip.progress * Math.max(0, trip.route.length - 1))));
const distanceOnSegment = (trip: TrafficTrip, index: number) => trip.progress - index / Math.max(1, trip.route.length - 1);
const isJunction = (graph: RoadGraph, node?: RoadNode) => Boolean(node && (graph.get(`${node.col},${node.row}`)?.length ?? 0) >= 3);
const localProgress = (trip: TrafficTrip, index: number) => trip.progress * Math.max(1, trip.route.length - 1) - index;
/** Logical distance to the closest vehicle ahead, including the next edge. */
export function followingGap(trip: TrafficTrip, other: TrafficTrip): number | undefined {
  const i = segmentIndex(trip), oi = segmentIndex(other); if (i === oi && same(trip.route[i], other.route[oi]) && same(trip.route[i + 1], other.route[oi + 1]) && other.progress > trip.progress) return localProgress(other, oi) - localProgress(trip, i);
  if (oi === i + 1 && same(trip.route[i + 1], other.route[oi]) && same(trip.route[i + 2], other.route[oi + 1])) return (1 - localProgress(trip, i)) + localProgress(other, oi);
  return undefined;
}
/** Stop on the incoming edge, leaving the junction tile clear. */
export function stopBeforeJunction(local: number): boolean { return local >= 0.55; }

/** Deterministic car-following and intersection priority for one frame. */
export function trafficDecision(trips: TrafficTrip[], trip: TrafficTrip, graph: RoadGraph, time: number): TrafficDecision {
  if (trip.route.length < 2 || trip.progress >= 1) return { speed: 0, reason: 'moving' };
  const index = segmentIndex(trip), from = trip.route[index], to = trip.route[index + 1];
  const axis = from.row === to.row ? 'horizontal' : 'vertical';
  // Once the car has crossed the stop line, its own occupancy grants it
  // priority to clear the box; signals and approach yields apply only before
  // entry. This prevents a car from deadlocking against its previous state.
  const enteredJunction = isJunction(graph, from) && localProgress(trip, index) >= 0.05;
  const sameLaneAhead = trips.some(other => other.id !== trip.id && other.route.length > 1 && (followingGap(trip, other) ?? Infinity) < MINIMUM_QUEUE_GAP);
  if (sameLaneAhead) return { speed: 0, reason: 'following' };
  const segmentProgress = localProgress(trip, index);
  // Decide one frame before the line so the bounded frame step cannot leap past 55%.
  if (!enteredJunction && isRedSignal(graph, to, time, axis) && isJunction(graph, to) && segmentProgress >= 0.45) return { speed: 0, reason: 'signal' };
  const crossingTrip = trips.find(other => {
    if (other.id === trip.id || other.route.length < 2) return false;
    const otherIndex = segmentIndex(other), otherFrom = other.route[otherIndex], otherTo = other.route[otherIndex + 1];
    const otherLocal = localProgress(other, otherIndex);
    const otherAxis = otherFrom && otherTo && otherFrom.row === otherTo.row ? 'horizontal' : 'vertical';
    return isJunction(graph, to) && otherAxis !== axis && ((same(to, otherFrom) && otherLocal < 0.35) || (same(to, otherTo) && otherLocal > 0.72));
  });
  if (!enteredJunction && crossingTrip) {
    const otherIndex = segmentIndex(crossingTrip);
    const otherLocal = localProgress(crossingTrip, otherIndex);
    const otherAlreadyInside = same(to, crossingTrip.route[otherIndex]) && otherLocal >= 0.05 && otherLocal < 0.35;
    // If both vehicles are approaching, use a stable ID priority so they cannot
    // mutually yield forever. A vehicle already inside the junction still wins.
    if (otherAlreadyInside || crossingTrip.id < trip.id) return { speed: 0, reason: 'yield' };
  }
  return { speed: 1, reason: 'moving' };
}

export function enforceVisualGap(position: { x: number; y: number }, others: Array<{ x: number; y: number }>, minimum: number) {
  void others; void minimum;
  return { ...position };
}
