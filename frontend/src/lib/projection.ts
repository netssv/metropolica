import { gridToIso, ISO_TILE_H, ISO_TILE_W } from './isoMath.ts';

export type Projection = (col: number, row: number) => { x: number; y: number };
export type ProjectionOptions = {
  zoom: number;
  offsetX: number;
  offsetY: number;
  cols: number;
  rows: number;
  width: number;
  height: number;
  rotation?: number;
};

export function normalizedRotation(rotation = 0): number {
  return ((rotation % 4) + 4) % 4;
}

/** Converts a persistent map coordinate into its coordinate in the rotated view. */
export function gridToView(col: number, row: number, cols: number, rows: number, rotation = 0): { col: number; row: number } {
  switch (normalizedRotation(rotation)) {
    case 1: return { col: rows - 1 - row, row: col };
    case 2: return { col: cols - 1 - col, row: rows - 1 - row };
    case 3: return { col: row, row: cols - 1 - col };
    default: return { col, row };
  }
}

export function viewDimensions(cols: number, rows: number, rotation = 0): { cols: number; rows: number } {
  return normalizedRotation(rotation) % 2 ? { cols: rows, rows: cols } : { cols, rows };
}

export function topDownProgress(zoom: number): number {
  return Math.max(0, Math.min(1, (0.9 - zoom) / 0.6));
}

export function createProjection(options: ProjectionOptions): Projection {
  const progress = topDownProgress(options.zoom);
  const dimensions = viewDimensions(options.cols, options.rows, options.rotation);
  const cell = Math.min((options.width - 48) / dimensions.cols, (options.height - 48) / dimensions.rows);
  const topDownX = (options.width - dimensions.cols * cell) / 2;
  const topDownY = (options.height - dimensions.rows * cell) / 2;
  return (col, row) => {
    const view = gridToView(col, row, options.cols, options.rows, options.rotation);
    const iso = gridToIso(view.col, view.row);
    const isoX = iso.x * options.zoom + options.offsetX;
    const isoY = iso.y * options.zoom + options.offsetY;
    return {
      x: isoX + (view.col * cell + topDownX - isoX) * progress,
      y: isoY + (view.row * cell + topDownY - isoY) * progress,
    };
  };
}

export function screenToGrid(x: number, y: number, options: ProjectionOptions): { col: number; row: number } {
  const project = createProjection(options);
  let best = { col: -1, row: -1, distance: Infinity };
  const hw = (ISO_TILE_W / 2) * options.zoom;
  const hh = (ISO_TILE_H / 2) * options.zoom;

  for (let row = 0; row < options.rows; row++) {
    for (let col = 0; col < options.cols; col++) {
      const p = project(col, row);
      // The drawn diamond has top vertex at (p.x + hw, p.y) and center at (p.x + hw, p.y + hh)
      const centerX = p.x + hw;
      const centerY = p.y + hh;
      const distance = Math.hypot(x - centerX, y - centerY);
      if (distance < best.distance) best = { col, row, distance };
    }
  }
  return { col: best.col, row: best.row };
}
