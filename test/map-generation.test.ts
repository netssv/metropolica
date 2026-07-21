import assert from "node:assert/strict";
import test from "node:test";
import { generateInitialMap, MIN_RESIDENTIAL_TILES_PER_DISTRICT } from "../src/simulation/scenario/map.ts";

const count = (tiles: { type: string }[], type: string) => tiles.filter(tile => tile.type === type).length;

test("procedural maps are deterministic and guarantee residential minimums", () => {
  for (const seed of [1, 7, 42, 99]) {
    const first = generateInitialMap(seed);
    const second = generateInitialMap(seed);
    assert.deepEqual(first, second);
    for (const tiles of Object.values(first)) {
      assert.ok(count(tiles, "bldg-r") >= MIN_RESIDENTIAL_TILES_PER_DISTRICT);
    }
    assert.ok(count(first.zona_industrial, "bldg-i") > count(first.zona_industrial, "bldg-r"));
  }
});

test("small maps degrade safely when fewer eligible residential plots exist", () => {
  const districts = generateInitialMap(3, 12, 12);
  for (const tiles of Object.values(districts)) {
    assert.ok(count(tiles, "bldg-r") <= MIN_RESIDENTIAL_TILES_PER_DISTRICT);
  }
});
