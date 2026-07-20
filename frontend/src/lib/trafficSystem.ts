import { gridToIso, ISO_TILE_H, ISO_TILE_W } from './isoMath';

type Tile = { type?: string } | null;
type Node = { col: number; row: number };
type Car = { col: number; row: number; next: Node; previous?: Node; progress: number; speed: number };
export type RoadGraph = Map<string, Node[]>;

const MAX_CARS = 8;
const ROAD_TYPES = new Set(['road', 'bridge']);
const DIRECTIONS = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;

function key(col: number, row: number) { return `${col},${row}`; }
function roadSignature(map: Tile[][]) {
  return map.map(row => row.map(tile => ROAD_TYPES.has(tile?.type ?? '') ? tile.type : '').join(',')).join(';');
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
  console.log('%c[TRAFFIC SYSTEM INIT]', 'background: blue; color: white; font-size: 20px');
  let graph = new Map<string, Node[]>();
  let graphSignature = '';
  let cars: Car[] = [];
  let lastTime = 0;
  let frameCount = 0;
  let lastSnapshotFrame = 0;
  const positions = new Map<string, { cx: number; cy: number; from: string; to: string }>();

  const rebuild = (map: Tile[][]) => {
    const previousCars = cars;
    graph = buildRoadGraph(map);
    const nodes = [...graph.keys()].map(item => { const [col, row] = item.split(',').map(Number); return { col, row }; });
    graphSignature = roadSignature(map);
    const usable = nodes.filter(n => graph.has(key(n.col, n.row)));
    // The initial camera is centered on the map. Prefer connected road nodes
    // near that center so the first car pool is visible immediately instead
    // of deterministically spawning all cars at map-edge roads.
    const centerCol = (map[0]?.length ?? 0) / 2;
    const centerRow = map.length / 2;
    const visibleFirst = [...usable].sort((a, b) =>
      Math.abs(a.col - centerCol) + Math.abs(a.row - centerRow) -
      (Math.abs(b.col - centerCol) + Math.abs(b.row - centerRow))
    );
    const starts: Node[] = [];
    for (const candidate of visibleFirst) {
      if (starts.every(start => Math.abs(start.col - candidate.col) + Math.abs(start.row - candidate.row) >= 8)) {
        starts.push(candidate);
      }
      if (starts.length === Math.min(MAX_CARS, usable.length)) break;
    }
    while (starts.length < Math.min(MAX_CARS, usable.length)) {
      starts.push(visibleFirst[starts.length % visibleFirst.length]);
    }
    const freshCars = Array.from({ length: Math.min(MAX_CARS, usable.length) }, (_, index) => {
      const start = starts[index];
      const options = graph.get(key(start.col, start.row))!;
      return { col: start.col, row: start.row, next: options[index % options.length], progress: 0, speed: 1.3 + (index % 3) * 0.22 };
    });
    // Editing a tile rebuilds the road graph, but must not restart animation.
    // Keep cars on still-valid segments, including their current progress and
    // speed. Only cars whose segment was removed are respawned.
    cars = freshCars.map((replacement, index) => {
      const current = previousCars[index];
      if (current && graph.has(key(current.col, current.row)) && graph.has(key(current.next.col, current.next.row)) &&
          (graph.get(key(current.col, current.row)) ?? []).some(node => key(node.col, node.row) === key(current.next))) {
        return { ...current };
      }
      return replacement;
    });
    console.log('[traffic] graph rebuild', { roadTiles: nodes.length, usableNodes: usable.length, carPool: cars });
  };

  const drawCar = (ctx: CanvasRenderingContext2D, car: Car, ox: number, oy: number, zoom: number) => {
    const x = car.col + (car.next.col - car.col) * car.progress;
    const y = car.row + (car.next.row - car.row) * car.progress;
    const iso = gridToIso(x, y);
    const cx = (iso.x + ISO_TILE_W / 2) * zoom + ox;
    const cy = (iso.y + ISO_TILE_H / 2) * zoom + oy;
    positions.set(`${car.col},${car.row}`, {
      cx, cy, from: `${car.col},${car.row}`, to: `${car.next.col},${car.next.row}`
    });
    const w = Math.max(9, 18 * zoom);
    const h = Math.max(5, 10 * zoom);
    console.log('[traffic] final canvas position', {
      cx, cy, w, h, zoom,
      canvas: { width: ctx.canvas.width, height: ctx.canvas.height },
      visible: cx >= -w && cx <= ctx.canvas.width + w && cy >= -h && cy <= ctx.canvas.height + h,
    });
    ctx.save();
    ctx.translate(cx, cy - 3 * zoom);
    const angle = Math.atan2(car.next.row - car.row, car.next.col - car.col);
    ctx.rotate(angle * 0.5);
    ctx.shadowColor = 'rgba(255, 230, 140, 0.8)';
    ctx.shadowBlur = Math.max(2, 5 * zoom);
    // Readable top-down car: elongated body, cabin/windshield, wheels and
    // headlights. The old symmetric diamond was technically moving but read
    // as a stationary red dot at normal map zoom.
    ctx.fillStyle = '#15191c';
    ctx.fillRect(-w * 0.92, -h * 0.82, w * 1.84, h * 1.64);
    ctx.fillStyle = '#d84b3e';
    ctx.fillRect(-w * 0.82, -h * 0.65, w * 1.64, h * 1.3);
    ctx.fillStyle = '#8ed0d8';
    ctx.fillRect(-w * 0.38, -h * 0.48, w * 0.76, h * 0.96);
    ctx.fillStyle = '#252a2e';
    ctx.fillRect(-w * 0.98, -h * 0.68, w * 0.16, h * 0.42);
    ctx.fillRect(w * 0.82, -h * 0.68, w * 0.16, h * 0.42);
    ctx.fillRect(-w * 0.98, h * 0.26, w * 0.16, h * 0.42);
    ctx.fillRect(w * 0.82, h * 0.26, w * 0.16, h * 0.42);
    ctx.fillStyle = '#fff1b8';
    ctx.fillRect(-w * 0.72, -h * 0.78, w * 0.22, h * 0.16);
    ctx.fillRect(w * 0.5, -h * 0.78, w * 0.22, h * 0.16);
    ctx.restore();
  };

  return {
    updateAndDraw(ctx: CanvasRenderingContext2D, time: number, ox: number, oy: number, zoom: number, simulationSpeed = 1) {
      frameCount += 1;
      const map = tileMapRef.current;
      const signature = roadSignature(map);
      if (signature !== graphSignature) rebuild(map);
      console.log('[traffic] frame', { carCount: cars.length, cars, graphNodes: graph.size, camera: { ox, oy, zoom } });
      if (!cars.length) return;
      const dt = lastTime ? Math.min(0.05, (time - lastTime) / 1000) * simulationSpeed : 0;
      lastTime = time;
      for (const car of cars) {
        car.progress += car.speed * dt;
        while (car.progress >= 1) {
          car.progress -= 1;
          car.previous = { col: car.col, row: car.row };
          car.col = car.next.col; car.row = car.next.row;
          const options = (graph.get(key(car.col, car.row)) ?? []).filter(n => !car.previous || key(n.col, n.row) !== key(car.previous.col, car.previous.row));
          const fallback = graph.get(key(car.col, car.row)) ?? [];
          const choices = options.length ? options : fallback;
          if (!choices.length) {
            car.progress = 0;
            const replacement = [...graph.keys()][Math.floor(Math.random() * graph.size)];
            if (!replacement) continue;
            const [col, row] = replacement.split(',').map(Number);
            car.col = col; car.row = row;
            car.next = graph.get(replacement)![0];
          } else car.next = choices[Math.floor(Math.random() * choices.length)];
        }
        console.log('[traffic] draw car', { col: car.col, row: car.row, next: car.next, progress: car.progress, speed: car.speed });
        drawCar(ctx, car, ox, oy, zoom);
      }
      if (frameCount - lastSnapshotFrame >= 60) {
        lastSnapshotFrame = frameCount;
        console.log('[traffic] snapshot', {
          frameCount,
          time,
          cars: cars.map(car => {
            const iso = gridToIso(car.col + (car.next.col - car.col) * car.progress, car.row + (car.next.row - car.row) * car.progress);
            const cx = (iso.x + ISO_TILE_W / 2) * zoom + ox;
            const cy = (iso.y + ISO_TILE_H / 2) * zoom + oy;
            return { col: car.col, row: car.row, progress: car.progress, cx, cy,
              visible: cx >= 0 && cx <= ctx.canvas.width && cy >= 0 && cy <= ctx.canvas.height };
          }),
        });
      }
    },
    getCarAt(x: number, y: number) {
      for (const [location, position] of positions) {
        if (Math.hypot(position.cx - x, position.cy - y) < 24) return { location, kind: 'traffic-car', from: position.from, to: position.to };
      }
      return undefined;
    },
  };
}
