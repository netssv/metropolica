/**
 * transitArrival.ts
 * Handles per-frame arrival animation state and the unboarding→next-trip transition.
 */
import type { RoadGraph } from '../trafficSystem.ts';
import type { Point } from './roadTrafficTypes.ts';
import type { Trip } from './transitTrip.ts';

type RoutineBlock = { activity: string; startHour: number; endHour: number; location: 'home' | 'work' | 'commercial' | 'refuel' };
type Citizen = { id: string; householdId?: string; level: number; homeTile?: Point; workTile?: Point; commercialTile?: Point; refuelTile?: Point; routine?: RoutineBlock[] };
type MakeTrip = (citizen: Citizen, target: Point, activityKey: string, from: Point) => Trip;

const key = (p: Point) => `${p.col},${p.row}`;

function nearestRoad(graph: RoadGraph, p: Point) {
  return [...graph.keys()]
    .map(v => { const [col, row] = v.split(',').map(Number); return { col, row }; })
    .sort((a, b) =>
      Math.abs(a.col - p.col) + Math.abs(a.row - p.row) -
      (Math.abs(b.col - p.col) + Math.abs(b.row - p.row))
    )[0];
}

/** Returns the current visual scale for a vehicle that has reached its destination.
 *  Starts at 1 on the first arrived frame and shrinks to 0 over arrival animation. */
export function arrivalScale(isArrived: boolean, arrival: number): number {
  if (!isArrived) return 1;
  return Math.max(0, 1 - arrival);
}

/** Advance the arrival animation counter and transition state to 'unboarding'. */
export function advanceArrival(trip: Trip, dt: number): void {
  // Always classify as unboarding once progress >= 1, regardless of previous state.
  trip.state = 'unboarding';
  trip.arrival = Math.min(1, trip.arrival + dt / 1.2);
}

/** When unboarding completes, start the queued trip if one is waiting. */
export function tryDequeueTrip(
  trip: Trip,
  pending: Map<string, { target: Point; activityKey: string; queuedAt: number }>,
  citizens: Citizen[],
  graph: RoadGraph,
  makeTrip: MakeTrip,
): void {
  if (trip.state !== 'unboarding' || trip.arrival < 1) return;
  const queued = pending.get(trip.citizenId);
  if (!queued) return;
  const citizen = citizens.find(c => c.id === trip.citizenId);
  const from = nearestRoad(graph, trip.target);
  if (!citizen || !from) return;
  pending.delete(trip.citizenId);
  const replacement = makeTrip(citizen, queued.target, queued.activityKey, from);
  trip.route = replacement.route;
  trip.target = replacement.target;
  trip.progress = replacement.progress;
  trip.arrival = 0;
  trip.activityKey = replacement.activityKey;
  trip.state = 'boarding';
  trip.queuedAt = queued.queuedAt;
}

/** Emit consumption command when citizen first reaches a shop/refuel destination. */
export function maybeEmitConsumption(
  trip: Trip,
  wasArrived: boolean,
  citizens: Citizen[],
  hour: number,
  day: number,
  sent: Set<string>,
  postCommand?: (cmd: Record<string, unknown>) => Promise<unknown>,
): void {
  if (wasArrived || trip.progress < 1) return;
  const citizen = citizens.find(c => c.id === trip.citizenId);
  const activity = citizen?.routine?.find(b => hour >= b.startHour && hour < b.endHour);
  if (!activity || (activity.activity !== 'compras' && activity.activity !== 'refuel')) return;
  const marker = `${trip.citizenId}:${activity.activity}:${day}`;
  if (sent.has(marker) || !postCommand || !citizen?.householdId) return;
  sent.add(marker);
  void postCommand({
    type: 'CITIZEN_CONSUMPTION',
    cohortId: citizen.householdId,
    districtId: (citizen as any).districtId,
    activity: activity.activity === 'compras' ? 'shop' : 'refuel',
    day,
  });
}

/** Unique laneKey for arrived vehicles so they don't interfere with road gap logic.
 *  Uses the citizen id to prevent cross-citizen visual gap pushes at destination. */
export function arrivalLaneKey(citizenId: string, target: Point): string {
  return `arrival:${key(target)}:${citizenId}`;
}
