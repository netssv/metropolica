import { gridToIso, ISO_TILE_H, ISO_TILE_W } from './isoMath';

export type Projection = (col: number, row: number) => { x: number; y: number };
export type ProjectionOptions = {
  zoom: number;
  offsetX: number;
  offsetY: number;
  cols: number;
  rows: number;
  width: number;
  height: number;
};

export function topDownProgress(zoom: number): number {
  return Math.max(0, Math.min(1, (0.9 - zoom) / 0.6));
}

export function createProjection(options: ProjectionOptions): Projection {
  const progress = topDownProgress(options.zoom);
  const cell = Math.min((options.width - 48) / options.cols, (options.height - 48) / options.rows);
  const topDownX = (options.width - options.cols * cell) / 2;
  const topDownY = (options.height - options.rows * cell) / 2;
  return (col, row) => {
    const iso = gridToIso(col, row);
    const isoX = iso.x * options.zoom + options.offsetX;
    const isoY = iso.y * options.zoom + options.offsetY;
    return {
      x: isoX + (col * cell + topDownX - isoX) * progress,
      y: isoY + (row * cell + topDownY - isoY) * progress,
    };
  };
}

export function screenToGrid(x: number, y: number, options: ProjectionOptions): { col: number; row: number } {
  const project = createProjection(options);
  let best = { col: -1, row: -1, distance: Infinity };
  for (let row = 0; row < options.rows; row++) {
    for (let col = 0; col < options.cols; col++) {
      const point = project(col, row);
      const distance = Math.hypot(x - point.x - ISO_TILE_W * options.zoom / 2, y - point.y - ISO_TILE_H * options.zoom / 2);
      if (distance < best.distance) best = { col, row, distance };
    }
  }
  return { col: best.col, row: best.row };
}
