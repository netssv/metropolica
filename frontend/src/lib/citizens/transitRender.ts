/**
 * transitRender.ts
 * Per-vehicle rendering logic: position computation, visual gap, and drawVehicle call.
 */
import { gridToIso, ISO_TILE_H, ISO_TILE_W } from '../isoMath.ts';
import type { Projection } from '../projection.ts';
import { signalState } from '../trafficSystem.ts';
import { destinationScreenPoint } from './destination.ts';
import { drawVehicle, vehicleForIncome } from '../vehicleSprites.ts';
import { laneOffset } from './roadTraffic.ts';
import { enforceVisualGap } from './trafficBehavior.ts';
import { recordTrafficDiagnostic } from './trafficDiagnostics.ts';
import type { Point, VehicleState } from './roadTrafficTypes.ts';
import type { Trip } from './transitTrip.ts';
import { arrivalScale, arrivalLaneKey } from './transitArrival.ts';
import { drawWaitIndicator, waitIndicatorState } from './transitWaitIndicator.ts';

type Citizen = { id: string; householdId?: string; level: number };

export type RenderedVehicle = { cx: number; cy: number; laneKey: string; state: VehicleState | undefined };

export function computeVehiclePosition(
  trip: Trip,
  ox: number,
  oy: number,
  zoom: number,
  project?: Projection,
): { roadPoint: { x: number; y: number } | undefined; destination: { x: number; y: number } | undefined; from: Point | undefined; to: Point | undefined; local: number } {
  const routePosition = trip.progress * Math.max(0, trip.route.length - 1);
  const segment = Math.min(Math.max(0, trip.route.length - 2), Math.floor(routePosition));
  const local = routePosition - segment;
  const from = trip.route[segment];
  const to = trip.route[segment + 1];

  const roadPoint = from && to
    ? project
      ? project(from.col + (to.col - from.col) * local, from.row + (to.row - from.row) * local)
      : (() => { const iso = gridToIso(from.col + (to.col - from.col) * local, from.row + (to.row - from.row) * local); return { x: iso.x * zoom + ox, y: iso.y * zoom + oy }; })()
    : undefined;

  const destination = trip.progress >= 1 && project
    ? destinationScreenPoint(trip.citizenId, trip.target, project, zoom)
    : undefined;

  return { roadPoint, destination, from, to, local };
}

export function renderVehicle(
  ctx: CanvasRenderingContext2D,
  trip: Trip,
  rendered: RenderedVehicle[],
  positions: Map<string, { cx: number; cy: number }>,
  ox: number, oy: number, zoom: number,
  dt: number, before: number, time: number, simulationSpeed: number,
  decisionSpeed: number,
  queueDepth: number,
  citizens: Citizen[],
  householdIncomes: Record<string, number>,
  render: boolean,
  project?: Projection,
): void {
  const { roadPoint, destination, from, to, local } = computeVehiclePosition(trip, ox, oy, zoom, project);
  const lane = laneOffset(from, to, zoom, project);

  const cx = (destination?.x ?? (roadPoint ? roadPoint.x + ISO_TILE_W * zoom / 2 : 0)) + lane.x;
  const cy = (destination?.y ?? (roadPoint ? roadPoint.y + ISO_TILE_H * zoom / 2 : 0)) + lane.y;

  // Arrived vehicles get a unique laneKey per citizen so they don't push others away.
  const laneKey = from && to
    ? `${from.col},${from.row}>${to.col},${to.row}`
    : arrivalLaneKey(trip.citizenId, trip.target);

  const nextProjected = from && to && project ? project(to.col, to.row) : undefined;
  const currentProjected = from && project ? project(from.col, from.row) : undefined;
  const heading = currentProjected && nextProjected
    ? Math.atan2(nextProjected.y - currentProjected.y, nextProjected.x - currentProjected.x)
    : undefined;

  // Driving vehicles: enforce gap only against same-lane neighbours along lane axis.
  // Arrived vehicles: skip gap so they sit exactly at the destination point.
  const sameLaneOthers = rendered.filter(r => r.laneKey === laneKey).map(r => ({ x: r.cx, y: r.cy }));
  const minGapSame = trip.progress >= 1 ? 0 : Math.max(14, 20 * zoom);

  const pos = enforceVisualGap({ x: cx, y: cy }, sameLaneOthers, minGapSame, heading);

  rendered.push({ cx: pos.x, cy: pos.y, laneKey, state: trip.state });
  positions.set(trip.citizenId, { cx: pos.x, cy: pos.y });

  recordTrafficDiagnostic({
    vehicleId: trip.citizenId,
    segmentId: laneKey,
    direction: from && to ? `${to.col - from.col},${to.row - from.row}` : 'arrival',
    routeProgress: trip.progress,
    localProgress: local,
    laneOffset: lane,
    computedScreenPosition: { x: cx, y: cy },
    renderedScreenPosition: pos,
    speed: dt ? (trip.progress - before) / dt : 0,
    targetSpeed: decisionSpeed,
    maxSpeed: 1,
    distanceAhead: null,
    signal: from && to ? signalState(from.row === to.row ? 'horizontal' : 'vertical', time) : 'none',
    state: trip.state,
    deltaSeconds: dt,
    simulationSpeed,
  });

  if (!render || (!roadPoint && !destination)) return;

  const citizen = citizens.find(c => c.id === trip.citizenId);
  const vehicleHeading = heading ?? 0;

  const scale = arrivalScale(trip.progress >= 1, trip.arrival);

  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.scale(scale, scale);

  // Draw wait indicator BEFORE vehicle (it sits above, unaffected by vehicle rotation).
  const indState = waitIndicatorState(trip.state);
  if (indState !== 'none') {
    drawWaitIndicator(ctx, indState, time, zoom, queueDepth);
  }

  drawVehicle(ctx, vehicleForIncome(householdIncomes[citizen?.householdId ?? ''] ?? 0, trip.citizenId), zoom, vehicleHeading);
  ctx.restore();
}
