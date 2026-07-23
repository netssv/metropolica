import { buildRoadGraph } from '../trafficSystem.ts';
import { Citizen, MapTile } from './types.ts';
import { clamp01, k } from './utils.ts';
import { trips } from '../pedestrianSprites.ts';
import type { PedestrianCrossingPresence } from '../citizens/roadTrafficTypes.ts';

export function getPedestrianCrossingPresence(
  map: MapTile[][],
  time: number,
  citizens: Citizen[] = []
): PedestrianCrossingPresence[] {
  const graph = buildRoadGraph(map);
  const roster = citizens.filter((c) => c.homeTile && c.workTile).slice(0, 60);
  const result: PedestrianCrossingPresence[] = [];
  for (const citizen of roster) {
    const trip = trips.get(citizen.id);
    if (!trip || trip.route.length < 2) continue;
    const walkSeconds = Math.max(18, Math.min(90, (trip.route.length - 1) * 3.2));
    const cycle = walkSeconds * 2 + 4;
    const elapsed = ((time / 1000 + ((trip.phase % cycle) + cycle) % cycle) % cycle);
    const outbound = elapsed < walkSeconds;
    const returning = elapsed >= walkSeconds + 2;
    if (!outbound && !returning) continue;
    const progress = outbound
      ? clamp01(elapsed / walkSeconds)
      : clamp01((elapsed - walkSeconds - 2) / walkSeconds);
    const path = outbound ? trip.route : [...trip.route].reverse();
    const index = Math.min(
      path.length - 1,
      Math.floor(progress * (path.length - 1))
    );
    const node = path[index];
    if ((graph.get(k(node))?.length ?? 0) < 3) continue;
    result.push({
      intersectionId: k(node),
      progress: (progress * (path.length - 1)) % 1,
      direction: 'crossing'
    });
  }
  return result;
}
