/**
 * transitTrip.ts
 * Trip construction, route computation, and citizen roster management.
 */
import { buildRoadGraph, findRoadRoute, roadSignature, type RoadGraph } from '../trafficSystem.ts';
import type { VehicleState, VehicleWaitReason, Point } from './roadTrafficTypes.ts';
import type { TrafficTrip } from './trafficBehavior.ts';

type RoutineBlock = { activity: string; startHour: number; endHour: number; location: 'home' | 'work' | 'commercial' | 'refuel' };
type Tile = { type?: string } | null;
type Citizen = { id: string; householdId?: string; level: number; homeTile?: Point; workTile?: Point; commercialTile?: Point; refuelTile?: Point; routine?: RoutineBlock[] };
export type Trip = TrafficTrip & { id: string; citizenId: string; target: Point; arrival: number; activityKey: string; state: VehicleState; waitReason?: VehicleWaitReason; queuedAt: number; departureTime: number };

export const key = (p: Point) => `${p.col},${p.row}`;

export function nearestRoad(graph: RoadGraph, p: Point) {
  return [...graph.keys()]
    .map(v => { const [col, row] = v.split(',').map(Number); return { col, row }; })
    .sort((a, b) =>
      Math.abs(a.col - p.col) + Math.abs(a.row - p.row) -
      (Math.abs(b.col - p.col) + Math.abs(b.row - p.row))
    )[0];
}

export const currentActivity = (citizen: Citizen, hour: number) =>
  citizen.routine?.find(b => hour >= b.startHour && hour < b.endHour);

export function resolveTarget(citizen: Citizen, activity: RoutineBlock | undefined): Point {
  if (activity?.location === 'home') return citizen.homeTile!;
  if (activity?.location === 'commercial') return citizen.commercialTile ?? citizen.workTile!;
  if (activity?.location === 'refuel') return citizen.refuelTile ?? citizen.workTile!;
  return citizen.workTile!;
}

export function makeTrip(
  graph: RoadGraph,
  citizen: Citizen,
  target: Point,
  activityKey: string,
  from: Point,
  sequence: () => number,
  old?: Trip,
): Trip {
  let route = findRoadRoute(graph, from, nearestRoad(graph, target)!);
  if (!route.length && key(from) !== key(target)) route = [from, nearestRoad(graph, target)!];
  const routeLen = route.length;
  const isSameTarget = old && key(old.target) === key(target);
  return {
    id: citizen.id,
    citizenId: citizen.id,
    route,
    target,
    progress: isSameTarget ? old.progress : (routeLen === 1 ? 1 : 0),
    arrival: isSameTarget ? old.arrival : 0,
    activityKey,
    state: isSameTarget ? old.state : (routeLen === 1 ? 'arrived' : 'queued'),
    waitReason: isSameTarget ? old.waitReason : undefined,
    queuedAt: isSameTarget ? old.queuedAt : sequence(),
    departureTime: isSameTarget ? old.departureTime : 0,
  };
}

export function rebuildTrips(
  map: Tile[][],
  citizens: Citizen[],
  day: number,
  hour: number,
  preserve: boolean,
  oldTrips: Map<string, Trip>,
  pending: Map<string, { target: Point; activityKey: string; queuedAt: number }>,
  graphRef: { value: RoadGraph; signature: string },
  sequence: () => number,
): Map<string, Trip> {
  graphRef.value = buildRoadGraph(map);
  graphRef.signature = roadSignature(map);
  const next = new Map<string, Trip>();

  for (const citizen of citizens.filter(c => c.level === 3 && c.homeTile && c.workTile)) {
    const activity = currentActivity(citizen, hour);
    const activityKey = `${day}:${activity?.startHour ?? -1}:${activity?.endHour ?? -1}:${activity?.activity ?? 'commute'}`;
    const old = preserve ? oldTrips.get(citizen.id) : undefined;
    const target = resolveTarget(citizen, activity);
    const sameDestination = Boolean(old && key(old.target) === key(target));

    if (old && old.progress < 1 && !sameDestination) {
      pending.set(citizen.id, { target, activityKey, queuedAt: sequence() });
      next.set(citizen.id, old);
      continue;
    }

    const from = old?.route.length
      ? nearestRoad(graphRef.value, old.route[Math.min(old.route.length - 1, Math.floor(old.progress * (old.route.length - 1)))])
      : nearestRoad(graphRef.value, activity?.location === 'home' && hour < 7
        ? citizen.homeTile!
        : target === citizen.homeTile ? citizen.workTile! : citizen.homeTile!);
    const to = nearestRoad(graphRef.value, target);

    if (!from || !to) {
      next.set(citizen.id, { id: citizen.id, citizenId: citizen.id, route: [], target, progress: 1, arrival: old?.arrival ?? 0, activityKey, state: 'arrived', queuedAt: old?.queuedAt ?? sequence(), departureTime: 0 });
      continue;
    }
    next.set(citizen.id, makeTrip(graphRef.value, citizen, target, activityKey, from, sequence, sameDestination ? old : undefined));
  }
  return next;
}
