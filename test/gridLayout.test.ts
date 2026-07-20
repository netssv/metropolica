/**
 * gridLayout.test.ts — Unit tests for the 2D tile-grid map layout math.
 *
 * Runs under node --test.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { computeGridLayout } from "../src/rendering/gridLayout.ts";

describe("computeGridLayout", () => {
  test("computes correct canvas size for default 32x24 map", () => {
    const layout = computeGridLayout(32, 24, 16);
    assert.equal(layout.cols, 32);
    assert.equal(layout.rows, 24);
    assert.equal(layout.cellSize, 16);
    assert.equal(layout.canvasWidth, 512);
    assert.equal(layout.canvasHeight, 384);
  });

  test("computes custom sizes accurately", () => {
    const layout = computeGridLayout(10, 10, 8);
    assert.equal(layout.canvasWidth, 80);
    assert.equal(layout.canvasHeight, 80);
  });
});
