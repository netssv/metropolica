import type { PedestrianCrossingPresence, Point } from './roadTrafficTypes.ts';

export type IntersectionReservation = {
  intersectionId: string;
  vehicleId: string;
  exitId: string;
  grantedAt: number;
};

const pointId = (point: Point) => `${point.col},${point.row}`;

export function intersectionId(point: Point): string { return pointId(point); }

export function exitIsBlocked(
  vehicles: Array<{ id: string; route: Point[]; progress: number }>,
  vehicleId: string,
  exit: Point,
): boolean {
  return vehicles.some(vehicle => {
    if (vehicle.id === vehicleId || vehicle.route.length < 2 || vehicle.progress >= 1) return false;
    const index = Math.min(vehicle.route.length - 1, Math.floor(vehicle.progress * (vehicle.route.length - 1)));
    return pointId(vehicle.route[index + 1]) === pointId(exit);
  });
}

export function pedestrianBlocksIntersection(
  pedestrians: PedestrianCrossingPresence[] | undefined,
  id: string,
): boolean {
  return Boolean(pedestrians?.some(pedestrian => pedestrian.intersectionId === id && pedestrian.progress < 0.92));
}

export function chooseReservation(
  reservations: IntersectionReservation[],
  candidate: IntersectionReservation,
  now: number,
): IntersectionReservation | undefined {
  const active = reservations.find(reservation => reservation.intersectionId === candidate.intersectionId && reservation.vehicleId !== candidate.vehicleId);
  if (!active) return candidate;
  if (active.exitId === candidate.exitId && active.vehicleId === candidate.vehicleId) return candidate;
  // Reservations are FIFO, with a deterministic ID tie-breaker after a bounded wait.
  if (now - active.grantedAt > 2500 && candidate.vehicleId < active.vehicleId) return candidate;
  return undefined;
}
