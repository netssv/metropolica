type Point = { col: number; row: number };
type Projection = (col: number, row: number) => { x: number; y: number };
function destinationOffset(id: string): { x: number; y: number } {
  let hash = 2166136261;
  for (const char of id) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return { x: ((hash >>> 0) % 7) - 3, y: (((hash >>> 7) >>> 0) % 7) - 3 };
}
export function destinationScreenPoint(id: string, target: Point, project: Projection, zoom: number): { x: number; y: number } {
  const point = project(target.col, target.row), offset = destinationOffset(id);
  return { x: point.x + 32 * zoom + offset.x * zoom, y: point.y + 16 * zoom + offset.y * zoom };
}
