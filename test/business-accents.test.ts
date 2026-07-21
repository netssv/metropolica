import assert from "node:assert/strict";
import test from "node:test";
import { hasBusinessAccent } from "../frontend/src/lib/businessAccents.ts";
import { BUSINESS_ACCENT_MIN_DISTANCE, selectBusinessMarkers } from "../shared/businessAccents.ts";

test("business accents are sparse, developed-only and deterministic", () => {
  const tiles = Array.from({ length: 160 }, (_, col) => ({ type: 'bldg-c', col, row: 3 }));
  const industrialTiles = Array.from({ length: 160 }, (_, col) => ({ type: 'bldg-i', col, row: 7 }));
  const commercialSet = selectBusinessMarkers(tiles, 'supermarket');
  const industrialSet = selectBusinessMarkers(industrialTiles, 'gasoline');
  const commercial = tiles.map(t => commercialSet.some(a => a.col === t.col && a.row === t.row));
  const industrial = industrialTiles.map(t => industrialSet.some(a => a.col === t.col && a.row === t.row));
  assert.ok(commercial.filter(Boolean).length <= 12);
  assert.ok(industrial.filter(Boolean).length <= 12);
  assert.equal(hasBusinessAccent("zone-c", 0, 0), false);
  assert.equal(hasBusinessAccent("zone-i", 16, 0), false);
  assert.deepEqual(commercial, Array.from({ length: 160 }, (_, col) => hasBusinessAccent("bldg-c", col, 3)));
  for (const set of [commercialSet, industrialSet]) for (let i = 0; i < set.length; i++) for (let j = i + 1; j < set.length; j++) assert.ok(Math.abs(set[i].col - set[j].col) + Math.abs(set[i].row - set[j].row) >= BUSINESS_ACCENT_MIN_DISTANCE);
});
