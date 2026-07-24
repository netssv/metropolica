/**
 * transit.ts
 * Orchestrates citizen vehicle trips: state sync, per-frame update, and rendering.
 * Delegates to transitTrip, transitArrival, and transitRender modules.
 */
import type { Projection } from '../projection.ts';
import { roadSignature } from '../trafficSystem.ts';
import { commuteDelayState } from './commuteDelay.ts';
import { getPedestrianCrossingPresence } from '../pedestrianSprites.ts';
import { trafficDecision, trafficStateForDecision } from './trafficBehavior.ts';
import type { VehicleWaitReason, Point } from './roadTrafficTypes.ts';
import {
  key, nearestRoad, currentActivity, makeTrip, rebuildTrips,
  type Trip,
} from './transitTrip.ts';
import { advanceArrival, tryDequeueTrip, maybeEmitConsumption } from './transitArrival.ts';
import { renderVehicle, type RenderedVehicle } from './transitRender.ts';
import type { RoadGraph } from '../trafficSystem.ts';

/** Real-time milliseconds between each vehicle's departure when a new activity batch starts.
 *  Simulates natural staggered departure so vehicles don't all rush at once. */
const DEPARTURE_STAGGER_MS = 600;

type RoutineBlock = { activity: string; startHour: number; endHour: number; location: 'home' | 'work' | 'commercial' | 'refuel' };
type Tile = { type?: string } | null;
type Citizen = { id: string; householdId?: string; level: number; homeTile?: Point; workTile?: Point; commercialTile?: Point; refuelTile?: Point; routine?: RoutineBlock[] };

export function createCitizenTransit() {
  const graphRef = { value: new Map() as RoadGraph, signature: '' };
  let rosterSignature = '', activitySignature = '';
  let lastTime = 0, syncedDay: number | undefined, syncedHour: number | undefined;
  let requestSequence = 0;
  const sequence = () => requestSequence++;

  const trips = new Map<string, Trip>();
  const pending = new Map<string, { target: Point; activityKey: string; queuedAt: number }>();
  const positions = new Map<string, { cx: number; cy: number }>();
  const sent = new Set<string>();

  const buildMakeTrip = (citizen: Citizen, target: Point, activityKey: string, from: Point, old?: Trip): Trip =>
    makeTrip(graphRef.value, citizen, target, activityKey, from, sequence, old);

  /** Rebuild the trip roster then stagger departures for all newly-created trips. */
  const rebuildAndStagger = (map: Tile[][], citizens: Citizen[], day: number, hour: number, preserve: boolean, now: number) => {
    const oldTrips = new Map(trips);
    const next = rebuildTrips(map, citizens, day, hour, preserve, oldTrips, pending, graphRef, sequence);
    trips.clear();
    for (const [id, trip] of next) trips.set(id, trip);

    // Group freshly created or newly started trips by their origin tile/node
    const byOrigin = new Map<string, Trip[]>();
    for (const trip of trips.values()) {
      const old = oldTrips.get(trip.id);
      const isSameTarget = old && key(old.target) === key(trip.target);
      const isNewTrip = !old || !isSameTarget;
      if (isNewTrip && trip.route.length >= 2) {
        // Reset progress to 0 for a brand new trip so vehicle starts at origin building
        trip.progress = 0;
        trip.arrival = 0;
        trip.state = 'queued';
        const originKey = key(trip.route[0]);
        const list = byOrigin.get(originKey) ?? [];
        list.push(trip);
        byOrigin.set(originKey, list);
      }
    }

    // Stagger departure time for each vehicle queue waiting at the same origin location
    for (const [, queue] of byOrigin) {
      queue.sort((a, b) => a.queuedAt - b.queuedAt);
      queue.forEach((t, index) => {
        t.departureTime = now + index * DEPARTURE_STAGGER_MS;
      });
    }
  };

  const vehiclesByTile = new Map<string, Array<{ trip: Trip; decisionSpeed: number; queueDepth: number; dt: number; before: number }>>();
  const drawnVehicles = new Set<string>();

  return {
    syncState(day: number, hour: number) { syncedDay = day; syncedHour = hour; },

    updateAndDraw(
      ctx: CanvasRenderingContext2D, time: number, ox: number, oy: number, zoom: number,
      map: Tile[][], citizens: Citizen[], day: number, hour = 0, simulationSpeed = 1,
      render = true, project?: Projection, selectedCitizenId?: string,
      postCommand?: (command: Record<string, unknown>) => Promise<unknown>,
      householdIncomes: Record<string, number> = {},
      updateMode?: 'UPDATE_ONLY' | 'FULL',
    ) {
      day = syncedDay ?? day;
      hour = syncedHour ?? hour;
      const active = citizens.filter(c => c.level === 3);
      const roster = active.map(c => `${c.id}:${key(c.homeTile ?? { col: -1, row: -1 })}:${key(c.workTile ?? { col: -1, row: -1 })}`).join('|');
      const activities = `${day}|${active.map(c => { const a = currentActivity(c, hour); return `${c.id}:${a?.startHour ?? -1}:${a?.endHour ?? -1}:${a?.activity ?? 'commute'}`; }).join('|')}`;

      if (roadSignature(map) !== graphRef.signature || roster !== rosterSignature || activities !== activitySignature) {
        rebuildAndStagger(map, citizens, day, hour, roster === rosterSignature, time);
        rosterSignature = roster;
        activitySignature = activities;
      }

      const dt = lastTime ? Math.min(0.05, (time - lastTime) / 1000) * simulationSpeed : 0;
      lastTime = time;

      const pedestrians = getPedestrianCrossingPresence(map, time, citizens);
      const reservations = new Map<string, string>();
      const rendered: RenderedVehicle[] = [];

      vehiclesByTile.clear();
      drawnVehicles.clear();

      for (const trip of trips.values()) {
        if (trip.departureTime > time) continue;

        const wasArrived = trip.progress >= 1;
        const decision = trafficDecision([...trips.values()], trip, graphRef.value, time, { pedestrians, reservations });
        const state = trafficStateForDecision(decision, trip, graphRef.value);
        trip.state = state.state;
        trip.waitReason = state.waitReason as VehicleWaitReason;

        const before = trip.progress;

        if (!wasArrived && decision.speed > 0) {
          trip.progress = Math.min(1, trip.progress + (dt / 8) * decision.speed);
        }

        maybeEmitConsumption(trip, wasArrived, citizens, hour, day, sent, postCommand);

        if (trip.progress >= 1) {
          advanceArrival(trip, dt);
        }

        tryDequeueTrip(trip, pending, citizens, graphRef.value, buildMakeTrip);

        // Compute current tile key for isometric depth sorting
        const routePosition = trip.progress * Math.max(0, trip.route.length - 1);
        const segment = Math.min(Math.max(0, trip.route.length - 2), Math.floor(routePosition));
        const local = routePosition - segment;
        const from = trip.route[segment];
        const to = trip.route[segment + 1];
        const currentTile = trip.progress >= 1 ? trip.target : (local < 0.5 ? from : (to ?? from));
        const tileKey = currentTile ? `${currentTile.col},${currentTile.row}` : '';

        const task = { trip, decisionSpeed: decision.speed, queueDepth: decision.queueDepth, dt, before };
        const list = vehiclesByTile.get(tileKey) ?? [];
        list.push(task);
        vehiclesByTile.set(tileKey, list);

        if (updateMode !== 'UPDATE_ONLY') {
          renderVehicle(
            ctx, trip, rendered, positions,
            ox, oy, zoom, dt, before, time, simulationSpeed,
            decision.speed, decision.queueDepth, citizens, householdIncomes, render, project,
          );
          drawnVehicles.add(trip.citizenId);
        }
      }
    },

    drawVehiclesForTile(
      ctx: CanvasRenderingContext2D, col: number, row: number,
      ox: number, oy: number, zoom: number, time: number, simulationSpeed: number,
      citizens: Citizen[], householdIncomes: Record<string, number>,
      render = true, project?: Projection
    ) {
      const tileKey = `${col},${row}`;
      const tasks = vehiclesByTile.get(tileKey);
      if (!tasks?.length) return;

      for (const t of tasks) {
        if (drawnVehicles.has(t.trip.citizenId)) continue;
        renderVehicle(
          ctx, t.trip, [], positions,
          ox, oy, zoom, t.dt, t.before, time, simulationSpeed,
          t.decisionSpeed, t.queueDepth, citizens, householdIncomes, render, project
        );
        drawnVehicles.add(t.trip.citizenId);
      }
    },

    drawRemainingVehicles(
      ctx: CanvasRenderingContext2D,
      ox: number, oy: number, zoom: number, time: number, simulationSpeed: number,
      citizens: Citizen[], householdIncomes: Record<string, number>,
      render = true, project?: Projection
    ) {
      for (const tasks of vehiclesByTile.values()) {
        for (const t of tasks) {
          if (drawnVehicles.has(t.trip.citizenId)) continue;
          renderVehicle(
            ctx, t.trip, [], positions,
            ox, oy, zoom, t.dt, t.before, time, simulationSpeed,
            t.decisionSpeed, t.queueDepth, citizens, householdIncomes, render, project
          );
          drawnVehicles.add(t.trip.citizenId);
        }
      }
    },

    getCitizenAt(x: number, y: number, citizens: Citizen[]) {
      let closest: Citizen | undefined, distance = 24;
      for (const citizen of citizens) {
        const p = positions.get(citizen.id);
        if (!p) continue;
        const d = Math.hypot(p.cx - x, p.cy - y);
        if (d < distance) { distance = d; closest = citizen; }
      }
      return closest;
    },
    getCitizenTripProgress(id: string) { return trips.get(id)?.progress; },
    getCitizenVehicleState(id: string) { return trips.get(id)?.state ?? 'idle'; },
    getCommuteDelayState(citizen: Citizen) {
      return commuteDelayState(citizen.level, citizen.homeTile, citizen.workTile, trips.get(citizen.id)?.route.length);
    },
  };
}
