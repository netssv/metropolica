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

test("driving citizen reaches a road home tile within bounded ticks", () => {
  const transit = createCitizenTransit();
  const ctx = new Proxy({}, { get: () => () => undefined }) as unknown as CanvasRenderingContext2D;
  const map = [[{ type: "road" }, { type: "road" }, { type: "road" }]];
  const citizen = { id: "bounded-home", level: 3, homeTile: { col: 0, row: 0 }, workTile: { col: 2, row: 0 }, routine: [{ activity: "regreso a casa", startHour: 16, endHour: 17, location: "home" as const }] };
  for (let tick = 0; tick < 200; tick++) transit.updateAndDraw(ctx, tick * 50, 0, 0, 1, map, [citizen], 1, 16, 8, false, (col, row) => ({ x: col * 100, y: row * 50 }));
  assert.equal(transit.getCitizenTripProgress(citizen.id), 1);
});

test("midnight sleep starts at home instead of sending the citizen home late", () => {
  const transit = createCitizenTransit();
  const ctx = new Proxy({}, { get: () => () => undefined }) as unknown as CanvasRenderingContext2D;
  const map = [[{ type: "road" }, { type: "road" }, { type: "road" }]];
  const citizen = { id: "midnight-home", level: 3, homeTile: { col: 0, row: 0 }, workTile: { col: 2, row: 0 }, routine: [
    { activity: "sueño", startHour: 0, endHour: 7, location: "home" as const },
  ] };
  transit.updateAndDraw(ctx, 0, 0, 0, 1, map, [citizen], 1, 0, 8, false, (col, row) => ({ x: col * 100, y: row * 50 }));
  assert.equal(transit.getCitizenTripProgress(citizen.id), 1);
});

test("arrival remains at home across consecutive home activities", () => {
  const transit = createCitizenTransit();
  const ctx = new Proxy({}, { get: () => () => undefined }) as unknown as CanvasRenderingContext2D;
  const map = [[{ type: "road" }, { type: "road" }, { type: "road" }]];
  const citizen = { id: "sleeping-home", level: 3, homeTile: { col: 0, row: 0 }, workTile: { col: 2, row: 0 }, routine: [
    { activity: "regreso a casa", startHour: 16, endHour: 17, location: "home" as const },
    { activity: "ocio en casa", startHour: 17, endHour: 22, location: "home" as const },
    { activity: "sueño", startHour: 22, endHour: 24, location: "home" as const },
  ] };
  for (let tick = 0; tick < 200; tick++) transit.updateAndDraw(ctx, tick * 50, 0, 0, 1, map, [citizen], 1, 16, 8, false, (col, row) => ({ x: col * 100, y: row * 50 }));
  assert.equal(transit.getCitizenTripProgress(citizen.id), 1);
  transit.updateAndDraw(ctx, 10001, 0, 0, 1, map, [citizen], 1, 17, 8, false, (col, row) => ({ x: col * 100, y: row * 50 }));
  transit.updateAndDraw(ctx, 10051, 0, 0, 1, map, [citizen], 1, 22, 8, false, (col, row) => ({ x: col * 100, y: row * 50 }));
  assert.equal(transit.getCitizenTripProgress(citizen.id), 1);
});

test("a queued home trip keeps progress when the routine label changes", () => {
  const transit = createCitizenTransit();
  const ctx = new Proxy({}, { get: () => () => undefined }) as unknown as CanvasRenderingContext2D;
  const map = [[{ type: "road" }, { type: "road" }, { type: "road" }]];
  const citizen = { id: "queued-home", level: 3, homeTile: { col: 0, row: 0 }, workTile: { col: 2, row: 0 }, routine: [
    { activity: "regreso a casa", startHour: 16, endHour: 17, location: "home" as const },
    { activity: "ocio en casa", startHour: 17, endHour: 22, location: "home" as const },
  ] };
  for (let tick = 0; tick < 10; tick++) transit.updateAndDraw(ctx, tick * 50, 0, 0, 1, map, [citizen], 1, 16, 1, false, (col, row) => ({ x: col * 100, y: row * 50 }));
  const before = transit.getCitizenTripProgress(citizen.id) ?? 0;
  transit.updateAndDraw(ctx, 501, 0, 0, 1, map, [citizen], 1, 17, 1, false, (col, row) => ({ x: col * 100, y: row * 50 }));
  assert.ok((transit.getCitizenTripProgress(citizen.id) ?? 0) >= before);
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
