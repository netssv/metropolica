import { isRedSignal, type RoadGraph, type RoadNode } from '../trafficSystem.ts';
import { exitIsBlocked, intersectionId, pedestrianBlocksIntersection } from './intersectionControl.ts';
import type { PedestrianCrossingPresence, VehicleState, VehicleWaitReason } from './roadTrafficTypes.ts';

export type TrafficTrip = { id: string; route: RoadNode[]; progress: number; state?: VehicleState };
export type TrafficDecision = { speed: number; reason: 'moving' | 'following' | 'signal' | 'yield'; queueDepth: number };
export type TrafficDecisionContext = { pedestrians?: PedestrianCrossingPresence[]; reservations?: Map<string, string> };
// Progress is advanced in bounded but discrete frames; keep a buffer larger than one frame
// so a binary stop decision cannot step into the vehicle ahead.
export const MINIMUM_QUEUE_GAP = 0.22;
/** Fraction of the incoming segment where vehicles stop for a red signal.
 *  Positioned on the incoming road tile so the front bumper stops prudently BEFORE the crosswalk (0.16). */
export const SIGNAL_STOP_LINE = 0.16;

const same = (a?: RoadNode, b?: RoadNode) => Boolean(a && b && a.col === b.col && a.row === b.row);
const segmentIndex = (trip: TrafficTrip) => Math.max(0, Math.min(trip.route.length - 2, Math.floor(trip.progress * Math.max(0, trip.route.length - 1))));
const distanceOnSegment = (trip: TrafficTrip, index: number) => trip.progress - index / Math.max(1, trip.route.length - 1);
const isJunction = (graph: RoadGraph, node?: RoadNode) => Boolean(node && (graph.get(`${node.col},${node.row}`)?.length ?? 0) >= 3);
const localProgress = (trip: TrafficTrip, index: number) => trip.progress * Math.max(1, trip.route.length - 1) - index;

/** Logical distance to the closest vehicle ahead, including adjacent edges. */
export function followingGap(trip: TrafficTrip, other: TrafficTrip): number | undefined {
  if (trip.route.length < 2 || other.route.length < 2) return undefined;
  const i = segmentIndex(trip), oi = segmentIndex(other);
  const from = trip.route[i], to = trip.route[i + 1];
  const oFrom = other.route[oi], oTo = other.route[oi + 1];
  if (!from || !to || !oFrom || !oTo) return undefined;

  const tripTotalSegs = trip.route.length - 1;

  if (same(from, oFrom) && same(to, oTo)) {
    if (other.progress > trip.progress) {
      return (other.progress - trip.progress) * tripTotalSegs;
    }
    return undefined;
  }

  const nextTo = trip.route[i + 2];
  if (nextTo && same(to, oFrom) && same(nextTo, oTo)) {
    const tripRemainingOnSeg = 1 - localProgress(trip, i);
    const otherOnSeg = localProgress(other, oi);
    return tripRemainingOnSeg + otherOnSeg;
  }

  // If other vehicle is stopped/arrived at junction or destination node
  if (same(to, oFrom)) {
    const tripRemainingOnSeg = 1 - localProgress(trip, i);
    const otherOnSeg = localProgress(other, oi);
    return tripRemainingOnSeg + otherOnSeg;
  }

  return undefined;
}

/** Stop on the incoming edge, leaving the junction tile clear. */
export function stopBeforeJunction(local: number): boolean { return local >= SIGNAL_STOP_LINE; }

/** Deterministic car-following and intersection priority for one frame. */
export function trafficDecision(trips: TrafficTrip[], trip: TrafficTrip, graph: RoadGraph, time: number, context: TrafficDecisionContext = {}): TrafficDecision {
  if (trip.route.length < 2 || trip.progress >= 1) return { speed: 0, reason: 'moving', queueDepth: 0 };
  const index = segmentIndex(trip), from = trip.route[index], to = trip.route[index + 1];
  const axis = from.row === to.row ? 'horizontal' : 'vertical';
  const segmentProgress = localProgress(trip, index);

  // Once a vehicle passes the stop line into an intersection or is exiting a junction,
  // it is committed and MUST clear the intersection without stopping for red signals.
  const inJunctionBox = isJunction(graph, from) || (isJunction(graph, to) && segmentProgress > SIGNAL_STOP_LINE);

  // Count vehicles queued ahead on the same lane (for visual indicator depth & realistic traffic queueing).
  const queueAhead = trips.filter(other => other.id !== trip.id && other.route.length > 1 && (followingGap(trip, other) ?? Infinity) < MINIMUM_QUEUE_GAP);
  if (queueAhead.length > 0) return { speed: 0, reason: 'following', queueDepth: queueAhead.length };

  if (!inJunctionBox) {
    if (isJunction(graph, to) && isRedSignal(graph, to, time, axis) && segmentProgress >= SIGNAL_STOP_LINE - 0.02) {
      return { speed: 0, reason: 'signal', queueDepth: 0 };
    }

    if (isJunction(graph, to) && segmentProgress >= SIGNAL_STOP_LINE - 0.02) {
      const id = intersectionId(to);
      if (pedestrianBlocksIntersection(context.pedestrians, id)) return { speed: 0, reason: 'yield', queueDepth: 0 };
      const exit = trip.route[index + 2];
      if (exit && exitIsBlocked(trips, trip.id, exit)) return { speed: 0, reason: 'yield', queueDepth: 0 };
      const holder = context.reservations?.get(id);
      if (holder && holder !== trip.id) return { speed: 0, reason: 'yield', queueDepth: 0 };
      context.reservations?.set(id, trip.id);
    }

    const crossingTrip = trips.find(other => {
      if (other.id === trip.id || other.route.length < 2) return false;
      const otherIndex = segmentIndex(other), otherFrom = other.route[otherIndex], otherTo = other.route[otherIndex + 1];
      const otherLocal = localProgress(other, otherIndex);
      const otherAxis = otherFrom && otherTo && otherFrom.row === otherTo.row ? 'horizontal' : 'vertical';
      return isJunction(graph, to) && otherAxis !== axis && ((same(to, otherFrom) && otherLocal < 0.35) || (same(to, otherTo) && otherLocal > 0.72));
    });

    if (crossingTrip) {
      const otherIndex = segmentIndex(crossingTrip);
      const otherLocal = localProgress(crossingTrip, otherIndex);
      const otherAlreadyInside = same(to, crossingTrip.route[otherIndex]) && otherLocal >= 0.05 && otherLocal < 0.35;
      if (otherAlreadyInside || crossingTrip.id < trip.id) return { speed: 0, reason: 'yield', queueDepth: 0 };
    }
  }

  return { speed: 1, reason: 'moving', queueDepth: 0 };
}

export function trafficStateForDecision(decision: TrafficDecision, trip: TrafficTrip, graph: RoadGraph): { state: VehicleState; waitReason: VehicleWaitReason } {
  if (trip.progress >= 1) return { state: 'arrived', waitReason: undefined };
  if (decision.reason === 'signal') return { state: 'waiting_for_signal', waitReason: 'signal' };
  if (decision.reason === 'following' || decision.reason === 'yield') return { state: 'waiting_for_space', waitReason: 'space' };
  const index = segmentIndex(trip), to = trip.route[index + 1];
  const junction = isJunction(graph, to);
  if (junction && localProgress(trip, index) >= SIGNAL_STOP_LINE) return { state: 'crossing_intersection', waitReason: undefined };
  if (junction) return { state: 'approaching_intersection', waitReason: undefined };
  return { state: 'driving', waitReason: undefined };
}


export function enforceVisualGap(
  position: { x: number; y: number },
  others: Array<{ x: number; y: number }>,
  minimum: number,
  heading?: number,
): { x: number; y: number } {
  let { x, y } = position;
  for (const other of others) {
    const dx = x - other.x;
    const dy = y - other.y;
    const dist = Math.hypot(dx, dy);
    if (dist < minimum && dist > 0.0001) {
      const push = minimum - dist;
      if (heading !== undefined) {
        // Push along the lane heading axis to preserve lane direction alignment
        const dirX = Math.cos(heading);
        const dirY = Math.sin(heading);
        const dot = dx * dirX + dy * dirY;
        const sign = dot >= 0 ? 1 : -1;
        x += dirX * push * sign;
        y += dirY * push * sign;
      } else {
        x += (dx / dist) * push;
        y += (dy / dist) * push;
      }
    }
  }
  return { x, y };
}
