import assert from "node:assert/strict";
import test from "node:test";
import { ScenarioRunner } from "../src/simulation/scenario/index.ts";
import { ciudadDividida } from "../src/content/scenarios/ciudad_dividida.ts";

function game() { return new ScenarioRunner(ciudadDividida, 3_600_000, 4); }

test("consumption charges once per cohort/day/activity and rejects frontend duplicates", () => {
  const runner = game(); const cohort = runner.cohorts.centro[0]; cohort.disposableIncome = 100;
  const command = { type: "CITIZEN_CONSUMPTION", cohortId: "centro-cohort-0", districtId: "centro", activity: "shop", day: 0 } as const;
  runner.dispatcher.dispatch(command); assert.equal(cohort.disposableIncome, 75); assert.equal(runner.city.districts[0].economy.commercialRevenue, 25);
  assert.throws(() => runner.dispatcher.dispatch(command));
});

test("consumption floors disposable income at zero", () => {
  const runner = game(); runner.cohorts.centro[0].disposableIncome = 10;
  runner.dispatcher.dispatch({ type: "CITIZEN_CONSUMPTION", cohortId: "centro-cohort-0", districtId: "centro", activity: "refuel", day: 0 });
  assert.equal(runner.cohorts.centro[0].disposableIncome, 0); assert.equal(runner.city.districts[0].economy.industrialRevenue, 10);
});

test("refuel credits the industrial aggregate without changing treasury", () => {
  const runner = game(); const before = runner.city.treasury; runner.cohorts.centro[0].disposableIncome = 100;
  runner.dispatcher.dispatch({ type: "CITIZEN_CONSUMPTION", cohortId: "centro-cohort-0", districtId: "centro", activity: "refuel", day: 0 });
  assert.equal(runner.city.districts[0].economy.industrialRevenue, 15); assert.equal(runner.city.treasury, before);
});
