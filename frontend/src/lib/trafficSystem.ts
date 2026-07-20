import { gridToIso, ISO_TILE_H, ISO_TILE_W } from './isoMath';

type Tile = { type?: string } | null;
type Node = { col: number; row: number };
type VehicleKind = 'car' | 'taxi' | 'bus' | 'firefighter' | 'police' | 'ambulance' | 'vip';
type Car = { id: number; col: number; row: number; next: Node; previous?: Node; progress: number; speed: number; route: Node[]; routeIndex: number; kind: VehicleKind };
export type RoadGraph = Map<string, Node[]>;

const MAX_CARS = 8;
const ROAD_TYPES = new Set(['road', 'bridge']);
const DIRECTIONS = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;
const VEHICLE_KINDS: VehicleKind[] = ['car', 'taxi', 'bus', 'firefighter', 'police', 'ambulance', 'vip'];

function key(col: number, row: number) { return `${col},${row}`; }
function roadSignature(map: Tile[][]) {
  return map.map(row => row.map(tile => ROAD_TYPES.has(tile?.type ?? '') ? (tile?.type ?? '') : '').join(',')).join(';');
}

export function buildRoadGraph(map: Tile[][]): RoadGraph {
  const nodes: Node[] = [];
  const graph: RoadGraph = new Map();
  for (let row = 0; row < map.length; row++) for (let col = 0; col < (map[row]?.length ?? 0); col++) {
    if (ROAD_TYPES.has(map[row]?.[col]?.type ?? '')) nodes.push({ col, row });
  }
  for (const node of nodes) {
    const neighbors = DIRECTIONS.map(([dc, dr]) => ({ col: node.col + dc, row: node.row + dr }))
      .filter(candidate => ROAD_TYPES.has(map[candidate.row]?.[candidate.col]?.type ?? ''));
    if (neighbors.length) graph.set(key(node.col, node.row), neighbors);
  }
  return graph;
}

export function findRoadRoute(graph: RoadGraph, start: Node, goal: Node): Node[] {
  const startKey = key(start.col, start.row), goalKey = key(goal.col, goal.row);
  if (!graph.has(startKey) || !graph.has(goalKey)) return [];
  const queue = [startKey]; const previous = new Map<string, string | null>([[startKey, null]]);
  while (queue.length) {
    const current = queue.shift()!;
    if (current === goalKey) break;
    for (const next of graph.get(current) ?? []) {
      const nextKey = key(next.col, next.row);
      if (!previous.has(nextKey)) { previous.set(nextKey, current); queue.push(nextKey); }
    }
  }
  if (!previous.has(goalKey)) return [];
  const route: Node[] = []; let current: string | null = goalKey;
  while (current) { const [col, row] = current.split(',').map(Number); route.unshift({ col, row }); current = previous.get(current) ?? null; }
  return route;
}

export function createTrafficSystem(tileMapRef: { current: Tile[][] }) {
  let graph = new Map<string, Node[]>();
  let graphSignature = '';
    let cars: Car[] = [];
  let destinations: Node[] = [];
  let lastTime = 0;
  let frameCount = 0;
  let lastSnapshotFrame = 0;
  const positions = new Map<string, { cx: number; cy: number; from: string; to: string; col: number; row: number; kind: VehicleKind }>();

  const routeToBuilding = (start: Node) => {
    const candidates = destinations
      .filter(destination => key(destination.col, destination.row) !== key(start.col, start.row))
      .sort(() => Math.random() - 0.5);
    for (const destination of candidates) {
      const route = findRoadRoute(graph, start, destination);
      if (route.length > 1) return route;
    }
    return [start, ...(graph.get(key(start.col, start.row)) ?? [])].slice(0, 2);
  };

  type SignalState = 'red' | 'yellow' | 'green';
  const signalState = (axis: 'horizontal' | 'vertical', time: number): SignalState => {
    const phase = (time % 9000) / 9000;
    if (phase < 0.45) return axis === 'horizontal' ? 'green' : 'red';
    if (phase < 0.5) return axis === 'horizontal' ? 'yellow' : 'red';
    if (phase < 0.95) return axis === 'vertical' ? 'green' : 'red';
    return axis === 'vertical' ? 'yellow' : 'red';
  };

  const isRedSignal = (node: Node, time: number, axis: 'horizontal' | 'vertical') => {
    const neighbors = graph.get(key(node.col, node.row)) ?? [];
    if (neighbors.length < 3) return false;
    return signalState(axis, time) !== 'green';
  };

  const rebuild = (map: Tile[][]) => {
    const previousCars = cars;
    graph = buildRoadGraph(map);
    const nodes = [...graph.keys()].map(item => { const [col, row] = item.split(',').map(Number); return { col, row }; });
    graphSignature = roadSignature(map);
    const usable = nodes.filter(n => graph.has(key(n.col, n.row)));
    destinations = [];
    for (let row = 0; row < map.length; row++) for (let col = 0; col < (map[row]?.length ?? 0); col++) {
      if (!map[row]?.[col]?.type?.startsWith('bldg-')) continue;
      const road = DIRECTIONS.map(([dc, dr]) => ({ col: col + dc, row: row + dr }))
        .find(candidate => graph.has(key(candidate.col, candidate.row)));
      if (road) destinations.push(road);
    }
    if (!destinations.length) destinations = usable;
    // Spread cars across the network so ambient traffic does not appear from
    // one central spawn point. Shuffle first, then keep generous separation.
    const shuffled = [...usable].sort(() => Math.random() - 0.5);
    const starts: Node[] = [];
    for (const candidate of shuffled) {
      if (starts.every(start => Math.abs(start.col - candidate.col) + Math.abs(start.row - candidate.row) >= 12)) {
        starts.push(candidate);
      }
      if (starts.length === Math.min(MAX_CARS, usable.length)) break;
    }
    // Very small maps may not have enough separated nodes; use evenly spread
    // fallbacks rather than placing every car at the first road tile.
    while (starts.length < Math.min(MAX_CARS, usable.length)) {
      starts.push(usable[Math.floor(starts.length * usable.length / Math.min(MAX_CARS, usable.length))]);
    }
    const freshCars = Array.from({ length: Math.min(MAX_CARS, usable.length) }, (_, index) => {
      const start = starts[index];
      const options = graph.get(key(start.col, start.row))!;
      const route = routeToBuilding(start);
      return { id: index, col: start.col, row: start.row, next: route[1] ?? options[index % options.length], progress: 0, speed: 1.3 + (index % 3) * 0.22, route, routeIndex: 1, kind: VEHICLE_KINDS[index % VEHICLE_KINDS.length] };
    });
    // Editing a tile rebuilds the road graph, but must not restart animation.
    // Keep cars on still-valid segments, including their current progress and
    // speed. Only cars whose segment was removed are respawned.
    cars = freshCars.map((replacement, index) => {
      const current = previousCars[index];
      if (current && graph.has(key(current.col, current.row)) && graph.has(key(current.next.col, current.next.row)) &&
          (graph.get(key(current.col, current.row)) ?? []).some(node => key(node.col, node.row) === key(current.next.col, current.next.row))) {
        return { ...current };
      }
      return replacement;
    });
  };

  const drawCar = (ctx: CanvasRenderingContext2D, car: Car, ox: number, oy: number, zoom: number, render = true) => {
    const x = car.col + (car.next.col - car.col) * car.progress;
    const y = car.row + (car.next.row - car.row) * car.progress;
    const iso = gridToIso(x, y);
    const cx = (iso.x + ISO_TILE_W / 2) * zoom + ox;
    const cy = (iso.y + ISO_TILE_H / 2) * zoom + oy;
    positions.set(String(car.id), {
      cx, cy, from: `${car.col},${car.row}`, to: `${car.next.col},${car.next.row}`, col: x, row: y, kind: car.kind,
    });
    if (!render) return;
    const palettes: Record<VehicleKind, { body: string; accent: string; roof: string }> = {
      car: { body: '#d84b3e', accent: '#8ed0d8', roof: '#15191c' },
      taxi: { body: '#f5c542', accent: '#202b31', roof: '#3b3218' },
      bus: { body: '#2d9b83', accent: '#b9eee3', roof: '#153a39' },
      firefighter: { body: '#d9362e', accent: '#f5c542', roof: '#20252a' },
      police: { body: '#315b9b', accent: '#c9e7ff', roof: '#172238' },
      ambulance: { body: '#f1f1e8', accent: '#d93636', roof: '#27343b' },
      vip: { body: '#6d4bc4', accent: '#e6d8ff', roof: '#191326' },
    };
    const palette = palettes[car.kind ?? 'car'];
    const scale = car.kind === 'bus' ? 1.2 : 1;
    const w = Math.max(4, 8 * zoom) * scale;
    const h = Math.max(2, 3.5 * zoom);
    ctx.save();
    ctx.translate(cx, cy - 3 * zoom);
    const nextIso = gridToIso(car.next.col, car.next.row);
    const currentIso = gridToIso(car.col, car.row);
    ctx.rotate(Math.atan2(nextIso.y - currentIso.y, nextIso.x - currentIso.x));
    // Isometric pixel vehicle: a compact rhomboid follows the road axis and
    // sits inside the tile diamond instead of looking like a flat 2D car.
    ctx.fillStyle = palette.roof;
    ctx.beginPath(); ctx.moveTo(-w, 0); ctx.lineTo(-w * .55, -h); ctx.lineTo(w * .62, -h); ctx.lineTo(w, 0); ctx.lineTo(w * .55, h); ctx.lineTo(-w * .68, h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = palette.body;
    ctx.beginPath(); ctx.moveTo(-w * .72, 0); ctx.lineTo(-w * .3, -h * .58); ctx.lineTo(w * .48, -h * .58); ctx.lineTo(w * .72, 0); ctx.lineTo(w * .35, h * .58); ctx.lineTo(-w * .5, h * .58); ctx.closePath(); ctx.fill();
    ctx.fillStyle = palette.accent;
    ctx.beginPath(); ctx.moveTo(-w * .12, -h * .42); ctx.lineTo(w * .3, -h * .42); ctx.lineTo(w * .48, 0); ctx.lineTo(w * .2, h * .42); ctx.lineTo(-w * .12, h * .42); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#252a2e';
    ctx.fillRect(-w * .72, -Math.max(1, zoom), Math.max(1, 2 * zoom), Math.max(1, 2 * zoom));
    ctx.fillRect(w * .58, -Math.max(1, zoom), Math.max(1, 2 * zoom), Math.max(1, 2 * zoom));
    ctx.fillRect(-w * .72, Math.max(0, h - 1.5 * zoom), Math.max(1, 2 * zoom), Math.max(1, 2 * zoom));
    ctx.fillRect(w * .58, Math.max(0, h - 1.5 * zoom), Math.max(1, 2 * zoom), Math.max(1, 2 * zoom));
    if (car.kind === 'firefighter' || car.kind === 'police' || car.kind === 'ambulance') {
      ctx.fillStyle = '#e7f7ff';
      ctx.fillRect(-Math.max(1, zoom), -Math.max(1, zoom), Math.max(2, 3 * zoom), Math.max(1, 2 * zoom));
    }
    ctx.fillStyle = '#fff1b8';
    ctx.fillRect(w * .62, -Math.max(1, zoom), Math.max(1, 2 * zoom), Math.max(1, zoom));
    ctx.restore();
  };

  const drawSemaphores = (ctx: CanvasRenderingContext2D, time: number, ox: number, oy: number, zoom: number) => {
    if (zoom < 0.6) return;
    for (const [intersection, neighbors] of graph) {
      if (neighbors.length < 3) continue;
      const [col, row] = intersection.split(',').map(Number);
      const iso = gridToIso(col, row);
      const cx = (iso.x + ISO_TILE_W / 2) * zoom + ox;
      const cy = (iso.y + ISO_TILE_H / 2) * zoom + oy;
      const radius = Math.max(2, 3.5 * zoom);
      const drawHead = (x: number, y: number, axis: 'horizontal' | 'vertical') => {
        const state = signalState(axis, time);
        ctx.fillStyle = '#20252a';
        ctx.fillRect(x - 4 * zoom, y - 18 * zoom, 8 * zoom, 10 * zoom);
        for (const [index, light] of (['red', 'yellow', 'green'] as SignalState[]).entries()) {
          ctx.fillStyle = state === light ? ({ red: '#ef4444', yellow: '#facc15', green: '#22c55e' }[light]) : ({ red: '#4b1717', yellow: '#4a3d12', green: '#123d23' }[light]);
          ctx.beginPath(); ctx.arc(x, y - (15 - index * 3) * zoom, radius, 0, Math.PI * 2); ctx.fill();
        }
      };
      ctx.save();
      ctx.strokeStyle = 'rgba(20, 20, 20, .9)';
      ctx.lineWidth = Math.max(1, zoom * 1.5);
      ctx.beginPath(); ctx.moveTo(cx, cy - 2 * zoom); ctx.lineTo(cx, cy - 13 * zoom); ctx.stroke();
      // Keep the two directional heads visibly separate: vertical traffic is
      // controlled by the left head, horizontal traffic by the right head.
      drawHead(cx - 12 * zoom, cy - 2 * zoom, 'vertical');
      drawHead(cx + 12 * zoom, cy + 10 * zoom, 'horizontal');
      ctx.restore();
    }
  };

  return {
    updateAndDraw(ctx: CanvasRenderingContext2D, time: number, ox: number, oy: number, zoom: number, simulationSpeed = 1, render = true) {
      frameCount += 1;
      const map = tileMapRef.current;
      const signature = roadSignature(map);
      if (signature !== graphSignature) rebuild(map);
      if (!cars.length) return;
      const dt = lastTime ? Math.min(0.05, (time - lastTime) / 1000) * simulationSpeed : 0;
      lastTime = time;
      if (render) drawSemaphores(ctx, time, ox, oy, zoom);
      for (const car of cars) {
        const nextNode = car.next;
        const axis = car.col === car.next.col ? 'vertical' : 'horizontal';
        if (car.progress >= 0.82 && isRedSignal(nextNode, time, axis)) {
          drawCar(ctx, car, ox, oy, zoom, render);
          continue;
        }
        car.progress += car.speed * dt;
        while (car.progress >= 1) {
          car.progress -= 1;
          car.previous = { col: car.col, row: car.row };
          car.col = car.next.col; car.row = car.next.row;
          if (car.routeIndex < car.route.length - 1) {
            car.routeIndex += 1;
            car.next = car.route[car.routeIndex];
            continue;
          }
          const nextRoute = routeToBuilding({ col: car.col, row: car.row });
          if (nextRoute.length < 2) {
            car.progress = 0;
            const replacement = [...graph.keys()][Math.floor(Math.random() * graph.size)];
            if (!replacement) continue;
            const [col, row] = replacement.split(',').map(Number);
            car.col = col; car.row = row;
            car.route = routeToBuilding({ col, row });
            car.routeIndex = 1;
            car.next = car.route[1] ?? graph.get(replacement)![0];
          } else {
            car.route = nextRoute;
            car.routeIndex = 1;
            car.next = car.route[1];
          }
        }
        drawCar(ctx, car, ox, oy, zoom, render);
      }
    },
    getCarAt(x: number, y: number) {
      for (const [id, position] of positions) {
        if (Math.hypot(position.cx - x, position.cy - y) < 24) return { id, kind: 'traffic-car', vehicleType: position.kind, from: position.from, to: position.to, location: `${Math.round(position.col)},${Math.round(position.row)}` };
      }
      return undefined;
    },
    getPosition(id: string) { return positions.get(id); },
  };
}
