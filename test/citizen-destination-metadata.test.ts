import assert from "node:assert/strict";
import test from "node:test";
import { activateCitizen } from "../src/simulation/citizens/index.ts";
import { assignCommuteLocations, workplaceFor } from "../src/simulation/citizens/index.ts";
import { ScenarioRunner } from "../src/simulation/scenario/index.ts";
import { ciudadDividida } from "../src/content/scenarios/ciudad_dividida.ts";
import { createCitizenTransit } from "../frontend/src/lib/citizens/transit.ts";

test("destination metadata classifies each occupation family", () => {
  assert.equal(workplaceFor({ occupation: "Médico de hospital" }).label, "salud / hospital");
  assert.equal(workplaceFor({ occupation: "Funcionario municipal" }).label, "gobierno");
  assert.equal(workplaceFor({ occupation: "Operario industrial" }).label, "industria");
  assert.equal(workplaceFor({ occupation: "Vendedor minorista" }).label, "comercio / mall");
  assert.equal(workplaceFor({ occupation: "Contador" }).label, "servicios");
});

test("workplace type and destination tile remain stable across reassignment", () => {
  const tiles = [0, 1, 2].flatMap(col => [
    { col, row: 0, type: "bldg-r", level: 0, age: 0 },
    { col, row: 1, type: "bldg-c", level: 0, age: 0 },
    { col, row: 2, type: "bldg-i", level: 0, age: 0 }
  ]);
  const citizen = { id: "c-1", occupation: "Operario industrial", level: 3, householdId: "h-1" } as any;
  const first = assignCommuteLocations({ d: [citizen] }, [{ id: "d", tiles } as any]).d[0];
  const second = assignCommuteLocations({ d: [first] }, [{ id: "d", tiles } as any]).d[0];
  assert.equal(first.workplaceType, "industria");
  assert.deepEqual(second.workTile, first.workTile);
  assert.equal(second.workplaceType, first.workplaceType);
});

test("profile and destination fields survive simulation ticks", () => {
  const game = new ScenarioRunner(ciudadDividida);
  const before = game.citizens.centro[0];
  const snapshot = { occupation: before.occupation, age: before.age, skills: [...before.skills], workTile: before.workTile && { ...before.workTile }, workplaceType: before.workplaceType };
  game.advance(7);
  const after = game.citizens.centro.find(citizen => citizen.id === before.id)!;
  assert.deepEqual({ occupation: after.occupation, age: after.age, skills: after.skills, workTile: after.workTile, workplaceType: after.workplaceType }, snapshot);
});

test("activating a citizen preserves an in-progress transit trip", () => {
  const transit = createCitizenTransit();
  const citizen: any = { id: "c-1", householdId: "h-1", level: 3, activeCause: "driving", homeTile: { col: 0, row: 0 }, workTile: { col: 3, row: 0 }, routine: [{ activity: "traslado al trabajo", startHour: 8, endHour: 9, location: "work" }] };
  const map = [[0, 1, 2, 3].map(col => ({ type: "road", col, row: 0 }))];
  const project = (col: number, row: number) => ({ x: col * 100, y: row * 50 });
  const ctx = new Proxy({}, { get: () => () => undefined }) as unknown as CanvasRenderingContext2D;
  transit.updateAndDraw(ctx, 0, 0, 0, 1, map, [citizen], 1, 8, 1, false, project);
  transit.updateAndDraw(ctx, 1000, 0, 0, 1, map, [citizen], 1, 8, 1, false, project);
  const beforeActivation = transit.getCitizenTripProgress(citizen.id) ?? 0;
  const activated = activateCitizen(citizen, "inspection", "inspección");
  transit.updateAndDraw(ctx, 9000, 0, 0, 1, map, [activated], 1, 8, 1, false, project);
  assert.ok((transit.getCitizenTripProgress(citizen.id) ?? 0) > beforeActivation);
  assert.equal(activated.workTile.col, citizen.workTile.col);
});
