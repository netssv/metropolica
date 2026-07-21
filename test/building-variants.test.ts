import assert from "node:assert/strict";
import test from "node:test";
import { buildingVariant } from "../frontend/src/lib/buildingSprites.ts";

test("buildingVariant is deterministic and covers all indices", () => {
  assert.equal(buildingVariant(0), 0);
  assert.equal(buildingVariant(1), 1);
  assert.equal(buildingVariant(2), 2);
  assert.equal(buildingVariant(3), 0);
  assert.equal(buildingVariant(31), buildingVariant(31));
  assert.equal(buildingVariant(5 * 31 + 7 * 17), buildingVariant(5 * 31 + 7 * 17));
  const seen = new Set(Array.from({ length: 30 }, (_, i) => buildingVariant(i)));
  assert.deepEqual([...seen].sort(), [0, 1, 2]);
  assert.equal(buildingVariant(10, 2), 0);
  assert.equal(buildingVariant(11, 2), 1);
});
