import { buildRoadGraph, findRoadRoute, type RoadGraph } from './trafficSystem.ts';
import { crosswalkCenter, sidewalkPoint, type Side } from './sidewalkSystem.ts';

type Point = { col: number; row: number };
type MapTile = { type?: string } | null;
type Citizen = { id: string; level?: number; homeTile?: Point; workTile?: Point };
type PedTrip = { route: Point[]; progress: number; target: Point; destination: Point; phase: number };
type ScreenPoint = { x: number; y: number };
const trips = new Map<string, PedTrip>();
const positions = new Map<string, { cx: number; cy: number }>();
let signature = '';
const k = (p: Point) => `${p.col},${p.row}`;

function hash(value: string) { return [...value].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 17); }
const pedestrianPalette = ['#ff6b6b', '#ffd166', '#4dd4ac', '#62b6ff', '#c084fc', '#ff9f68', '#f472b6'];
function pedestrianColor(id: string) { return pedestrianPalette[hash(id) % pedestrianPalette.length]; }
function clamp01(value: number) { return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)); }
function adjacentRoad(graph: RoadGraph, map: MapTile[][], p: Point) {
  const candidates = [[p.col - 1, p.row], [p.col + 1, p.row], [p.col, p.row - 1], [p.col, p.row + 1]]
    .filter(([col, row]) => ['road', 'bridge'].includes(map[row]?.[col]?.type ?? ''))
    .map(([col, row]) => ({ col, row }));
  return candidates.find(candidate => graph.has(k(candidate)));
}

function visualSidewalkPath(path: Point[], side: Side, project: (col: number, row: number) => ScreenPoint, zoom: number): ScreenPoint[] {
  const points: ScreenPoint[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i], to = path[i + 1];
    const start = sidewalkPoint(project, from, to, side, zoom);
    const end = sidewalkPoint(project, to, from, side === 'left' ? 'right' : 'left', zoom);
    if (i === 0) points.push(start);
    points.push(end);
    const next = path[i + 2];
    const turns = next && ((to.col - from.col) * (next.row - to.row) !== (to.row - from.row) * (next.col - to.col));
    // A turn is a real crossing: do not join the two laterally-offset road
    // points with a diagonal shortcut through the street corner. Straight
    // segments keep one continuous physical sidewalk.
    if (i < path.length - 2 && turns) {
      points.push(crosswalkCenter(project, to, zoom));
      points.push(sidewalkPoint(project, to, next, side, zoom));
    }
  }
  return points.filter((point, index) => index === 0 || Math.hypot(point.x - points[index - 1].x, point.y - points[index - 1].y) > 0.01);
}

function interpolatePath(points: ScreenPoint[], progress: number): { point: ScreenPoint; direction: ScreenPoint } {
  if (points.length < 2) return { point: points[0] ?? { x: 0, y: 0 }, direction: { x: 0, y: 0 } };
  const lengths = points.slice(1).map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y));
  const total = lengths.reduce((sum, length) => sum + length, 0);
  let distance = clamp01(progress) * total;
  for (let i = 0; i < lengths.length; i++) {
    if (distance <= lengths[i] || i === lengths.length - 1) {
      const t = lengths[i] ? distance / lengths[i] : 0;
      const from = points[i], to = points[i + 1];
      return { point: { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t }, direction: { x: to.x - from.x, y: to.y - from.y } };
    }
    distance -= lengths[i];
  }
  return { point: points[points.length - 1], direction: { x: 0, y: 0 } };
}

/** Database-backed pedestrians with stable, varied building-to-building trips. */
export function drawDecorativePedestrians(ctx: CanvasRenderingContext2D, map: MapTile[][], project: (col: number, row: number) => { x: number; y: number }, zoom: number, time: number, citizens: Citizen[] = []) {
  if (zoom < .45) return;
  const graph = buildRoadGraph(map);
  const destinations: Point[] = [];
  for (let row = 0; row < map.length; row++) for (let col = 0; col < (map[row]?.length ?? 0); col++) {
    const type = map[row]?.[col]?.type ?? '';
    const adjacentToRoad = [[col - 1, row], [col + 1, row], [col, row - 1], [col, row + 1]]
      .some(([c, r]) => ['road', 'bridge'].includes(map[r]?.[c]?.type ?? ''));
    if (adjacentToRoad && (type.startsWith('bldg-') || type === 'power' || type === 'park')) destinations.push({ col, row });
  }
  // Pedestrians are a separate visual layer from vehicle commuters, but use
  // the same citizen records so every city has visible people.
  const roster = citizens.filter(c => c.homeTile && c.workTile).slice(0, 80);
  const nextSignature = roster.map(c => `${c.id}:${k(c.homeTile!)}:${k(c.workTile!)}`).join('|');
  if (nextSignature !== signature) {
    signature = nextSignature; trips.clear();
    for (const citizen of roster) {
      // Pedestrians may only enter a trip when both destinations connect to
      // the road network. This prevents fallback paths across buildings or
      // terrain; all rendered positions below come from sidewalkPoint().
      const from = adjacentRoad(graph, map, citizen.homeTile!);
      const preferred = destinations.length
        ? destinations[hash(`${citizen.id}:destination`) % destinations.length]
        : undefined;
      // A building is a valid visual endpoint only when its own tile touches
      // the road graph. Never invent a long building-to-road segment.
      const destination = preferred ?? citizen.workTile;
      if (!from || !destination || !destinations.some(p => p.col === destination.col && p.row === destination.row)) continue;
      const to = adjacentRoad(graph, map, destination);
      if (!to) continue;
      let route = findRoadRoute(graph, from, to);
      if (route.length < 2) continue;
      // Every route edge must be a real orthogonal road edge. This protects
      // the visual layer from malformed/fallback graph data.
      const validRoute = route.every((node, index) => index === 0 || Math.abs(node.col - route[index - 1].col) + Math.abs(node.row - route[index - 1].row) === 1);
      if (!validRoute) continue;
      if (route.length > 1) trips.set(citizen.id, { route, progress: (hash(citizen.id) % 100) / 100, target: to, destination, phase: hash(citizen.id) });
    }
  }
  positions.clear();
  for (const citizen of roster) {
    const trip = trips.get(citizen.id); if (!trip || trip.route.length < 2) continue;
    // Pedestrians move at a relaxed walking pace; the full home/work round
    // trip takes two minutes so they do not race across the sidewalks.
    // Travel time scales with route length, while the two building pauses are
    // explicit states. This prevents negative/out-of-range progress from
    // launching a pedestrian away from the first or last sidewalk point.
    const walkSeconds = Math.max(18, Math.min(90, (trip.route.length - 1) * 3.2));
    const buildingSeconds = 2;
    const cycle = walkSeconds * 2 + buildingSeconds * 2;
    const elapsed = (time / 1000 + (trip.phase % cycle + cycle) % cycle) % cycle;
    const outbound = elapsed < walkSeconds;
    const atDestination = elapsed >= walkSeconds && elapsed < walkSeconds + buildingSeconds;
    const returning = elapsed >= walkSeconds + buildingSeconds && elapsed < walkSeconds * 2 + buildingSeconds;
    const atHome = !outbound && !atDestination && !returning;
    const routeProgress = outbound
      ? clamp01(elapsed / walkSeconds)
      : returning
        ? clamp01((elapsed - walkSeconds - buildingSeconds) / walkSeconds)
        : atDestination || atHome ? 1 : 0;
    const path = outbound ? trip.route : [...trip.route].reverse();
    const side: Side = hash(citizen.id) % 2 ? 'left' : 'right';
    const visualPath = visualSidewalkPath(path, side, project, zoom);
    // Buildings are not walkable terrain. Keep the sprite hidden until it
    // reaches the first sidewalk point, and hide it again before the final
    // building point; the visible route is therefore sidewalk/crosswalk only.
    if (atDestination || atHome) continue;
    const buildingBlend = .14;
    if (routeProgress <= buildingBlend || routeProgress >= 1 - buildingBlend) continue;
    const pathProgress = clamp01((routeProgress - buildingBlend) / (1 - buildingBlend * 2));
    const pathVisual = interpolatePath(visualPath, pathProgress);
    const cx = pathVisual.point.x, cy = pathVisual.point.y;
    positions.set(citizen.id, { cx, cy });
    const color = pedestrianColor(citizen.id);
    if (zoom < 2) {
      // High-contrast, stable color-coded dots remain readable at city scale.
      const radius = Math.max(1.8, zoom * 1.15);
      ctx.fillStyle = 'rgba(8,18,28,.8)'; ctx.beginPath(); ctx.arc(cx, cy, radius + Math.max(1, zoom * .45), 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.fill();
      continue;
    }
    const s = zoom * .58;
    // All animation vectors are calculated in screen space. Grid-space
    // angles are not valid on an isometric canvas and make the person look
    // rotated/skewed when walking north-east or south-west.
    const directionX = pathVisual.direction.x, directionY = pathVisual.direction.y;
    const directionLength = Math.hypot(directionX, directionY) || 1;
    const direction = { x: directionX / directionLength, y: directionY / directionLength };
    const walking = Math.sin(time / 170 + trip.phase) * 2.4 * s;
    const stepX = direction.x * walking, stepY = direction.y * walking;
    ctx.save(); ctx.translate(cx, cy - 4 * s);
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(0, 5 * s, 3 * s, 1.2 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#f0a35b'; ctx.lineWidth = Math.max(1, s); ctx.beginPath(); ctx.moveTo(0, s); ctx.lineTo(-2 * s + stepX, 7 * s + stepY); ctx.moveTo(0, s); ctx.lineTo(2 * s - stepX, 7 * s - stepY); ctx.stroke();
    ctx.fillStyle = color; ctx.fillRect(-2 * s, -4 * s, 4 * s, 6 * s); ctx.fillStyle = '#e0a477'; ctx.beginPath(); ctx.arc(0, -6 * s, 2 * s, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
}

export function getPedestrianAt(x: number, y: number, citizens: Citizen[]) {
  let closest: Citizen | undefined; let distance = 18;
  for (const citizen of citizens) { const p = positions.get(citizen.id); if (!p) continue; const d = Math.hypot(p.cx - x, p.cy - y); if (d < distance) { distance = d; closest = citizen; } }
  return closest;
}
