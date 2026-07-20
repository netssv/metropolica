import { gridToIso, ISO_TILE_H, ISO_TILE_W } from './isoMath';
import { buildRoadGraph, findRoadRoute, type RoadGraph } from './trafficSystem';

type Tile = { type?: string } | null;
type Point = { col: number; row: number };
type Citizen = { id: string; level: number; homeTile?: Point; workTile?: Point; workShift?: { startHour: number; endHour: number } };
type Trip = { id: string; route: Point[]; progress: number; day: number };

function key(point: Point) { return `${point.col},${point.row}`; }
const ROAD_TYPES = new Set(['road', 'bridge']);
function roadSignature(map: Tile[][]) {
  return map.map(row => row.map(tile => ROAD_TYPES.has(tile?.type ?? '') ? tile.type : '').join(',')).join(';');
}
function nearestRoad(graph: RoadGraph, point: Point, exclude?: Point): Point | undefined {
  return [...graph.keys()].map(value => { const [col, row] = value.split(',').map(Number); return { col, row }; })
    .filter(candidate => !exclude || key(candidate) !== key(exclude))
    .sort((a, b) => Math.abs(a.col - point.col) + Math.abs(a.row - point.row) - (Math.abs(b.col - point.col) + Math.abs(b.row - point.row)))[0];
}

export function createCitizenTransit() {
  let graphSignature = '';
  let citizenSignature = '';
  let graph: RoadGraph = new Map();
  const trips = new Map<string, Trip>();
  let lastTime = 0;
  let lastDay: number | undefined;
  let frameCount = 0;
  const positions = new Map<string, { cx: number; cy: number }>();

  const rebuild = (map: Tile[][], citizens: Citizen[], day: number, preserveTrips: boolean) => {
    const previousTrips = new Map(trips);
    graph = buildRoadGraph(map);
    graphSignature = roadSignature(map);
    const nextTrips = new Map<string, Trip>();
    const outbound = day % 2 === 1;
    for (const citizen of citizens.filter(item => item.level === 3 && item.homeTile && item.workTile)) {
      const from = nearestRoad(graph, outbound ? citizen.homeTile! : citizen.workTile!);
      const to = nearestRoad(graph, outbound ? citizen.workTile! : citizen.homeTile!, from);
      if (!from || !to) continue;
      let route = findRoadRoute(graph, from, to);
      // Keep the test commute visible if both endpoints resolve to roads but
      // the generated map has a disconnected segment.
      if (route.length < 2 && key(from) !== key(to)) route = [from, to];
      if (route.length > 1) {
        const previous = preserveTrips ? previousTrips.get(citizen.id) : undefined;
        nextTrips.set(citizen.id, { id: citizen.id, route, progress: previous?.progress ?? 0, day });
      }
    }
    trips.clear();
    for (const [id, trip] of nextTrips) trips.set(id, trip);
    console.log('[citizen transit] rebuild', { day, preserved: preserveTrips, activeCitizens: citizens.filter(item => item.level === 3).length, assigned: citizens.filter(item => item.level === 3 && item.homeTile && item.workTile).length, commuters: trips.size });
  };

  return {
    updateAndDraw(ctx: CanvasRenderingContext2D, time: number, ox: number, oy: number, zoom: number, map: Tile[][], citizens: Citizen[], day: number, simulationSpeed = 1) {
      frameCount++;
      const signature = roadSignature(map);
      const activeSignature = citizens.filter(citizen => citizen.level === 3).map(citizen =>
        `${citizen.id}:${citizen.homeTile?.col},${citizen.homeTile?.row}:${citizen.workTile?.col},${citizen.workTile?.row}`
      ).join('|');
      if (signature !== graphSignature || activeSignature !== citizenSignature || day !== lastDay) {
        // Activating/deactivating a citizen changes the roster, but must not
        // restart the commute animation of citizens already on the road.
        // A new simulated day is the only intentional reset of trip direction.
        const preserveTrips = day === lastDay;
        lastDay = day; citizenSignature = activeSignature; rebuild(map, citizens, day, preserveTrips);
      }
      const dt = lastTime ? Math.min(0.05, (time - lastTime) / 1000) * simulationSpeed : 0;
      lastTime = time;
      for (const trip of trips.values()) {
      // One visual commute leg represents the eight-hour 08:00–16:00 shift.
      trip.progress = Math.min(1, trip.progress + dt / 8);
        const segment = Math.min(trip.route.length - 2, Math.floor(trip.progress * (trip.route.length - 1)));
        const local = trip.progress * (trip.route.length - 1) - segment;
        const from = trip.route[segment], to = trip.route[segment + 1];
        const iso = gridToIso(from.col + (to.col - from.col) * local, from.row + (to.row - from.row) * local);
        const cx = (iso.x + ISO_TILE_W / 2) * zoom + ox;
        const cy = (iso.y + ISO_TILE_H / 2) * zoom + oy;
        positions.set(trip.id, { cx, cy });
        ctx.save(); ctx.translate(cx, cy - 6 * zoom);
        // Purposeful citizen vehicle: gold body and teal windshield, distinct
        // from red anonymous ambient traffic.
        const w = Math.max(7, 13 * zoom), h = Math.max(4, 7 * zoom);
        ctx.fillStyle = '#17202a'; ctx.fillRect(-w, -h, w * 2, h * 2);
        ctx.fillStyle = '#f5c542'; ctx.fillRect(-w * .86, -h * .82, w * 1.72, h * 1.64);
        ctx.fillStyle = '#25b7a7'; ctx.fillRect(-w * .36, -h * .58, w * .72, h * 1.16);
        ctx.fillStyle = '#fff1b8'; ctx.fillRect(-w * .72, -h * .9, w * .2, h * .16); ctx.fillRect(w * .52, -h * .9, w * .2, h * .16);
        ctx.restore();
      }
      if (frameCount % 60 === 0) console.log('[citizen transit] snapshot', { frameCount, day, commuters: [...trips.values()].map(trip => ({ id: trip.id, progress: trip.progress })) });
    },
    getCitizenAt(x: number, y: number, citizens: Citizen[]) {
      let closest: Citizen | undefined;
      let distance = 24;
      for (const citizen of citizens) {
        const position = positions.get(citizen.id);
        if (!position) continue;
        const current = Math.hypot(position.cx - x, position.cy - y);
        if (current < distance) { distance = current; closest = citizen; }
      }
      return closest;
    },
  };
}
