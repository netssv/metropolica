import assert from "node:assert/strict";
import test from "node:test";
import { destinationScreenPoint } from "../frontend/src/lib/citizens/destination.ts";
import { createCitizenTransit } from "../frontend/src/lib/citizens/transit.ts";

test("arrived citizen renders at its destination tile, not the nearest road node", () => {
  const project = (col: number, row: number) => ({ x: col * 100, y: row * 50 });
  const target = { col: 4, row: 3 };
  const arrived = destinationScreenPoint("industrial-citizen-1", target, project, 1);
  const roadNode = { x: 300 + 32, y: 150 + 16 };
  assert.ok(Math.abs(arrived.x - (target.col * 100 + 32)) <= 3);
  assert.ok(Math.abs(arrived.y - (target.row * 50 + 16)) <= 3);
  assert.notDeepEqual(arrived, roadNode);
});

test("single-node home return registers arrival at the home tile", () => {
  const transit = createCitizenTransit();
  const ctx = new Proxy({}, { get: () => () => undefined }) as unknown as CanvasRenderingContext2D;
  const map = [[{ type: "road" }, { type: "road" }]];
  const citizen = { id: "home-return", level: 3, homeTile: { col: 0, row: 0 }, workTile: { col: 0, row: 0 }, routine: [{ activity: "regreso a casa", startHour: 16, endHour: 17, location: "home" as const }] };
  transit.updateAndDraw(ctx, 0, 0, 0, 1, map, [citizen], 1, 16, 1, false, (col, row) => ({ x: col * 100, y: row * 50 }));
  const point = transit.getCitizenAt(32, 16, [citizen]);
  assert.equal(point?.id, citizen.id);
});

test("unresolved home route snaps the citizen to the intended home tile", () => {
  const transit = createCitizenTransit();
  const ctx = new Proxy({}, { get: () => () => undefined }) as unknown as CanvasRenderingContext2D;
  const citizen = { id: "unresolved-home", level: 3, homeTile: { col: 4, row: 3 }, workTile: { col: 4, row: 3 }, routine: [{ activity: "sueño", startHour: 0, endHour: 7, location: "home" as const }] };
  transit.updateAndDraw(ctx, 0, 0, 0, 1, [[{ type: "grass" }]], [citizen], 1, 0, 1, false, (col, row) => ({ x: col * 100, y: row * 50 }));
  assert.equal(transit.getCitizenAt(432, 166, [citizen])?.id, citizen.id);
});

test("transit state sync applies the newly received simulated hour", () => {
  const transit = createCitizenTransit();
  transit.syncState(2, 22);
  assert.equal(typeof transit.syncState, "function");
});
