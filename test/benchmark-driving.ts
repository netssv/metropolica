import { performance } from "node:perf_hooks";
import { ScenarioRunner } from "../src/simulation/scenario/index.ts";
import { ciudadDividida } from "../src/content/scenarios/ciudad_dividida.ts";
import { buildRoadGraph, findRoadRoute } from "../frontend/src/lib/trafficSystem.ts";

const game = new ScenarioRunner(ciudadDividida, 3_600_000, 1, "big");
const district = game.city.districts.find(item => item.id === "zona_industrial")!;
const map = Array.from({ length: 72 }, () => Array.from({ length: 96 }, () => ({ type: "grass" })));
for (const tile of district.tiles) map[tile.row][tile.col] = { type: tile.type };
const graph = buildRoadGraph(map);
const roadNodes = [...graph.values()].flat();
const nearestRoad = (point: { col: number; row: number }) => roadNodes.reduce((best, node) =>
  Math.abs(node.col - point.col) + Math.abs(node.row - point.row) < Math.abs(best.col - point.col) + Math.abs(best.row - point.row) ? node : best, roadNodes[0]);
const seedCitizens = Object.values(game.citizens).flat().filter(citizen => citizen.level === 3);
const citizens = (count: number) => Array.from({ length: count }, (_, index) => {
  const seed = seedCitizens[index % seedCitizens.length];
  return { home: nearestRoad(seed.homeTile!), work: nearestRoad(seed.workTile!), id: `bench-${index}` };
});
const routeBench = (count: number) => {
  const values: number[] = [], batch = citizens(count);
  for (const citizen of batch) {
    const start = performance.now(); findRoadRoute(graph, citizen.work, citizen.home); values.push(performance.now() - start);
  }
  return { total: values.reduce((sum, value) => sum + value, 0), min: Math.min(...values), max: Math.max(...values), avg: values.reduce((sum, value) => sum + value, 0) / values.length };
};
const markerBench = (count: number) => {
  const batch = citizens(count), frames = 600, start = performance.now();
  let checksum = 0;
  for (let frame = 0; frame < frames; frame++) for (const citizen of batch) {
    const progress = (frame % 480) / 480;
    checksum += citizen.work.col * (1 - progress) + citizen.home.col * progress;
    checksum += citizen.work.row * (1 - progress) + citizen.home.row * progress;
  }
  return { avgFrameMs: (performance.now() - start) / frames, checksum };
};

console.log("[render-benchmark] synthetic driving harness; district=zona_industrial; roads=528");
console.log("N | BFS total ms | BFS min/avg/max ms | marker frame ms | tileDrawMs/FPS");
for (const count of [8, 20, 30, 50]) {
  const routes = routeBench(count), markers = markerBench(count);
  console.log(`${count} | ${routes.total.toFixed(3)} | ${routes.min.toFixed(3)}/${routes.avg.toFixed(3)}/${routes.max.toFixed(3)} | ${markers.avgFrameMs.toFixed(4)} | not measured (Node harness)`);
}
