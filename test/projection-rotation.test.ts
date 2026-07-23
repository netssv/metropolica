import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createProjection,
  gridToView,
  screenToGrid,
  viewDimensions,
} from '../frontend/src/lib/projection.ts';
import { laneOffset } from '../frontend/src/lib/citizens/roadTraffic.ts';

const cols = 7;
const rows = 4;
const base = { zoom: 0.72, offsetX: 13, offsetY: -9, cols, rows, width: 960, height: 640 };

describe('rotated isometric projection', () => {
  test('gridToView is a bijection and preserves canonical coordinates', () => {
    const original = Array.from({ length: rows }, (_, row) =>
      Array.from({ length: cols }, (_, col) => ({ col, row })));
    for (let rotation = 0; rotation < 4; rotation++) {
      const dims = viewDimensions(cols, rows, rotation);
      assert.deepEqual(dims, rotation % 2 ? { cols: rows, rows: cols } : { cols, rows });
      const seen = new Set<string>();
      for (const point of original.flat()) {
        const view = gridToView(point.col, point.row, cols, rows, rotation);
        assert.ok(view.col >= 0 && view.col < dims.cols);
        assert.ok(view.row >= 0 && view.row < dims.rows);
        seen.add(`${view.col},${view.row}`);
      }
      assert.equal(seen.size, cols * rows);
      assert.deepEqual(original[0][0], { col: 0, row: 0 });
    }
  });

  test('screenToGrid round-trips tile centers for every rotation', () => {
    for (let rotation = 0; rotation < 4; rotation++) {
      const options = { ...base, rotation };
      const project = createProjection(options);
      for (const [col, row] of [[0, 0], [6, 3], [2, 1], [5, 0]] as const) {
        const p = project(col, row);
        const hit = screenToGrid(p.x + 64 * options.zoom / 2, p.y + 32 * options.zoom / 2, options);
        assert.deepEqual(hit, { col, row }, `rotation ${rotation}, tile ${col},${row}`);
      }
    }
  });

  test('lane offset follows projected road direction and remains perpendicular', () => {
    for (let rotation = 0; rotation < 4; rotation++) {
      const options = { ...base, rotation };
      const project = createProjection(options);
      const from = { col: 2, row: 1 };
      const to = { col: 3, row: 1 };
      const a = project(from.col, from.row);
      const b = project(to.col, to.row);
      const direction = { x: b.x - a.x, y: b.y - a.y };
      const offset = laneOffset(from, to, options.zoom, project);
      assert.ok(Math.abs(direction.x * offset.x + direction.y * offset.y) < 1e-8);
      assert.ok(Math.abs(Math.hypot(offset.x, offset.y) - 7 * options.zoom) < 1e-8);
    }
  });
});
