import assert from "node:assert/strict";
import test from "node:test";
import { calculateCoverage, developedBusinessSupply, serviceDemand } from "../src/simulation/utilities/coverage.ts";
import { selectBusinessMarkers } from "../shared/businessAccents.ts";
const district = (tiles: any[], population = 100) => ({ population, tiles } as any);
const tile = (col: number, row: number, type: string) => ({ col, row, type, level: 2, age: 1 });

test("new services use the same capacity/demand coverage formula", () => {
  const d = district([tile(0, 0, "bldg-c")], 100);
  const demand = serviceDemand(d, "supermercado"), supply = developedBusinessSupply(d, "supermercado");
  assert.equal(calculateCoverage(supply, demand), Math.min(1, supply / demand));
  assert.equal(supply, selectBusinessMarkers(d.tiles, "supermarket").length * 100);
});

test("zero-supply services report zero coverage, never undefined or NaN", () => {
  const d = district([], 100);
  for (const service of ["gasolina", "supermercado", "hospitales", "bomberos", "ocio", "telefonía"] as const) {
    assert.equal(calculateCoverage(developedBusinessSupply(d, service), serviceDemand(d, service)), 0);
  }
});

test("remaining fallback services use the shared commercial pool without subtracting capacity", () => {
  const d = district([tile(2, 2, "bldg-c"), tile(3, 3, "bldg-c"), tile(4, 4, "bldg-i")]);
  const expected = 200;
  assert.equal(developedBusinessSupply(d, "hospitales"), 0);
  assert.equal(developedBusinessSupply(d, "bomberos"), expected);
  assert.equal(developedBusinessSupply(d, "ocio"), expected);
  assert.equal(developedBusinessSupply(d, "telefonía"), expected);
});
