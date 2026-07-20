/**
 * gridLayout.ts — Layout math for the 2D tile-grid city map.
 *
 * Modified for Sprint 9 Micropolis-style tile grid layout.
 * Architecture rule #1: no imports from simulation/ or core/.
 */

export interface GridCell {
  col: number;
  row: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GridLayout {
  cols: number;
  rows: number;
  cellSize: number;
  canvasWidth: number;
  canvasHeight: number;
}

export function computeGridLayout(
  cols = 32,
  rows = 24,
  cellSize = 16
): GridLayout {
  return {
    cols,
    rows,
    cellSize,
    canvasWidth: cols * cellSize,
    canvasHeight: rows * cellSize
  };
}
