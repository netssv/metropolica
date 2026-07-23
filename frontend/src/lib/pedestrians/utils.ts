import type { Point, MapTile } from './types.ts';
import type { RoadGraph } from '../trafficSystem.ts';

export function hash(value: string) {
  return [...value].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 17);
}

export const pedestrianPalette = [
  '#ff6b6b',
  '#ffd166',
  '#4dd4ac',
  '#62b6ff',
  '#c084fc',
  '#ff9f68',
  '#f472b6'
];

export function pedestrianColor(id: string) {
  return pedestrianPalette[hash(id) % pedestrianPalette.length];
}

export function clamp01(value: number) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

export const k = (p: Point) => `${p.col},${p.row}`;

export function adjacentRoad(graph: RoadGraph, map: MapTile[][], p: Point) {
  const candidates = [
    [p.col - 1, p.row],
    [p.col + 1, p.row],
    [p.col, p.row - 1],
    [p.col, p.row + 1]
  ]
    .filter(([col, row]) => ['road', 'bridge'].includes(map[row]?.[col]?.type ?? ''))
    .map(([col, row]) => ({ col, row }));
  return candidates.find((candidate) => graph.has(k(candidate)));
}
