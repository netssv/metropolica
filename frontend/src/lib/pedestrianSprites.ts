import { buildRoadGraph, findRoadRoute } from './trafficSystem.ts';
import { Side } from './sidewalkSystem.ts';
import { Point, MapTile, Citizen, PedTrip } from './pedestrians/types.ts';
import { hash, pedestrianColor, clamp01, adjacentRoad, k } from './pedestrians/utils.ts';
import { visualSidewalkPath, interpolatePath } from './pedestrians/path.ts';
import { getPedestrianCrossingPresence } from './pedestrians/crossing.ts';

export { getPedestrianCrossingPresence };

export const trips = new Map<string, PedTrip>();
const positions = new Map<string, { cx: number; cy: number }>();
let signature = '';

export function drawDecorativePedestrians(
  ctx: CanvasRenderingContext2D,
  map: MapTile[][],
  project: (col: number, row: number) => { x: number; y: number },
  zoom: number,
  time: number,
  citizens: Citizen[] = []
) {
  if (zoom < 0.45) return;
  const graph = buildRoadGraph(map);
  const destinations: Point[] = [];
  for (let row = 0; row < map.length; row++) {
    for (let col = 0; col < (map[row]?.length ?? 0); col++) {
      const type = map[row]?.[col]?.type ?? '';
      const adjacentToRoad = [
        [col - 1, row],
        [col + 1, row],
        [col, row - 1],
        [col, row + 1]
      ].some(([c, r]) => ['road', 'bridge'].includes(map[r]?.[c]?.type ?? ''));
      if (
        adjacentToRoad &&
        (type.startsWith('bldg-') || type === 'power' || type === 'park')
      ) {
        destinations.push({ col, row });
      }
    }
  }

  const roster = citizens.filter((c) => c.homeTile && c.workTile).slice(0, 60);
  const nextSignature = roster
    .map((c) => `${c.id}:${k(c.homeTile!)}:${k(c.workTile!)}`)
    .join('|');
  if (nextSignature !== signature) {
    signature = nextSignature;
    trips.clear();
    for (const citizen of roster) {
      const from = adjacentRoad(graph, map, citizen.homeTile!);
      const preferred = destinations.length
        ? destinations[hash(`${citizen.id}:destination`) % destinations.length]
        : undefined;
      const destination = preferred ?? citizen.workTile;
      if (
        !from ||
        !destination ||
        !destinations.some((p) => p.col === destination.col && p.row === destination.row)
      ) {
        continue;
      }
      const to = adjacentRoad(graph, map, destination);
      if (!to) continue;
      const route = findRoadRoute(graph, from, to);
      if (route.length < 2) continue;
      const validRoute = route.every(
        (node, index) =>
          index === 0 ||
          Math.abs(node.col - route[index - 1].col) +
            Math.abs(node.row - route[index - 1].row) ===
            1
      );
      if (!validRoute) continue;
      if (route.length > 1) {
        trips.set(citizen.id, {
          route,
          progress: (hash(citizen.id) % 100) / 100,
          target: to,
          destination,
          phase: hash(citizen.id)
        });
      }
    }
  }

  positions.clear();
  for (const citizen of roster) {
    const trip = trips.get(citizen.id);
    if (!trip || trip.route.length < 2) continue;

    const walkSeconds = Math.max(18, Math.min(90, (trip.route.length - 1) * 3.2));
    const buildingSeconds = 2;
    const cycle = walkSeconds * 2 + buildingSeconds * 2;
    const elapsed = ((time / 1000 + ((trip.phase % cycle) + cycle) % cycle) % cycle);
    const outbound = elapsed < walkSeconds;
    const atDestination = elapsed >= walkSeconds && elapsed < walkSeconds + buildingSeconds;
    const returning =
      elapsed >= walkSeconds + buildingSeconds &&
      elapsed < walkSeconds * 2 + buildingSeconds;
    const atHome = !outbound && !atDestination && !returning;
    const routeProgress = outbound
      ? clamp01(elapsed / walkSeconds)
      : returning
      ? clamp01((elapsed - walkSeconds - buildingSeconds) / walkSeconds)
      : atDestination || atHome
      ? 1
      : 0;
    const path = outbound ? trip.route : [...trip.route].reverse();
    const side: Side = hash(citizen.id) % 2 ? 'left' : 'right';
    const visualPath = visualSidewalkPath(path, side, project, zoom, map);

    if (atDestination || atHome) continue;
    const buildingBlend = 0.14;
    if (routeProgress <= buildingBlend || routeProgress >= 1 - buildingBlend) continue;
    const pathProgress = clamp01(
      (routeProgress - buildingBlend) / (1 - buildingBlend * 2)
    );
    const pathVisual = interpolatePath(visualPath, pathProgress);
    const cx = pathVisual.point.x;
    const cy = pathVisual.point.y;
    positions.set(citizen.id, { cx, cy });
    const color = pedestrianColor(citizen.id);
    if (zoom < 2) {
      const radius = Math.max(1.8, zoom * 1.15);
      ctx.fillStyle = 'rgba(8,18,28,.8)';
      ctx.beginPath();
      ctx.arc(cx, cy, radius + Math.max(1, zoom * 0.45), 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    const s = zoom * 0.58;
    const directionX = pathVisual.direction.x;
    const directionY = pathVisual.direction.y;
    const directionLength = Math.hypot(directionX, directionY) || 1;
    const direction = {
      x: directionX / directionLength,
      y: directionY / directionLength
    };
    const walking = Math.sin(time / 170 + trip.phase) * 2.4 * s;
    const stepX = direction.x * walking;
    const stepY = direction.y * walking;
    ctx.save();
    ctx.translate(cx, cy - 4 * s);
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.beginPath();
    ctx.ellipse(0, 5 * s, 3 * s, 1.2 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f0a35b';
    ctx.lineWidth = Math.max(1, s);
    ctx.beginPath();
    ctx.moveTo(0, s);
    ctx.lineTo(-2 * s + stepX, 7 * s + stepY);
    ctx.moveTo(0, s);
    ctx.lineTo(2 * s - stepX, 7 * s - stepY);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.fillRect(-2 * s, -4 * s, 4 * s, 6 * s);
    ctx.fillStyle = '#e0a477';
    ctx.beginPath();
    ctx.arc(0, -6 * s, 2 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function getPedestrianAt(x: number, y: number, citizens: Citizen[]) {
  let closest: Citizen | undefined;
  let distance = 18;
  for (const citizen of citizens) {
    const p = positions.get(citizen.id);
    if (!p) continue;
    const d = Math.hypot(p.cx - x, p.cy - y);
    if (d < distance) {
      distance = d;
      closest = citizen;
    }
  }
  return closest;
}
