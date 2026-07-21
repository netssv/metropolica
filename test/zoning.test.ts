import assert from "node:assert/strict";
import test from "node:test";
import { CommandDispatcher } from "../src/core/commands/index.ts";
import { aggregateDistrictEconomy } from "../src/simulation/economy/index.ts";
import { simulateHouseholdTick } from "../src/simulation/households/index.ts";
import { calculateProximityModifier, ZoningLoop } from "../src/simulation/districts/zoning.ts";
import type { CityState, District } from "../src/simulation/models.ts";

const district = (tiles: District["tiles"]): District => ({
  id: "test", population: 100, approval: .8,
  services: { water: { capacity: 1, demand: 0, coverage: 1, maintenance: 1 }, electricity: { capacity: 1, demand: 0, coverage: 1, maintenance: 1 }, waste: 1, safety: 1, internet: 1, gasolina: { capacity: 0, demand: 0, coverage: 0, maintenance: 1 }, supermercado: { capacity: 0, demand: 0, coverage: 0, maintenance: 1 }, hospitales: { capacity: 0, demand: 0, coverage: 0, maintenance: 1 }, bomberos: { capacity: 0, demand: 0, coverage: 0, maintenance: 1 }, ocio: { capacity: 0, demand: 0, coverage: 0, maintenance: 1 }, telefonía: { capacity: 0, demand: 0, coverage: 0, maintenance: 1 } },
  economy: { employment: .7, averageIncome: 1000, costOfLiving: 500, commercialRevenue: 0, industrialRevenue: 0 },
  social: { inequality: .2, trust: .5, institutionalTrust: .5, unrest: 0, crimeRisk: 0, atRisk: false }, tiles
});

const city = (tiles: District["tiles"]): CityState => ({ treasury: 10000, debt: 0, approval: .8, taxRate: .1, auditLevel: 0, corruptionRisk: 0, districts: [district(tiles)], organizations: [] });
const output = { cohort: { size: 100, income: 1000, savings: 0, debt: 0, education: 0, unemployment: 0, needs: { monthlyCost: 0, satisfaction: 1, waterDemand: 0, electricityDemand: 0 }, politicalLean: 0, trust: 0, stress: 0 }, grossIncome: 0, taxPaid: 0, disposableIncome: 1000, debtChange: 0, stress: 0, needsSatisfied: 1 } as any;
const tile = (col: number, row: number, type: string) => ({ col, row, type, level: 0, age: 0 });

test("proximity income is positive near commerce, negative near industry, and decays", () => {
  const commercial = calculateProximityModifier([tile(0, 0, "zone-r"), tile(1, 0, "zone-c")]);
  const industrial = calculateProximityModifier([tile(0, 0, "zone-r"), tile(1, 0, "zone-i")]);
  const far = calculateProximityModifier([tile(0, 0, "zone-r"), tile(3, 0, "zone-c")]);
  assert.ok(commercial > 0);
  assert.ok(industrial < 0);
  assert.ok(commercial > far);
  const baseline = aggregateDistrictEconomy(district([tile(0, 0, "zone-r")]), [output]).economy.averageIncome;
  assert.ok(aggregateDistrictEconomy(district([]), [output], commercial).economy.averageIncome > baseline);
  assert.ok(aggregateDistrictEconomy(district([]), [output], industrial).economy.averageIncome < baseline);
  assert.ok(aggregateDistrictEconomy(district([]), [{ ...output, disposableIncome: -100 }], industrial).economy.averageIncome < 0);
});

test("informal floor replaces negative formal income but leaves healthy cohorts unchanged", () => {
  const base = { size: 1200, income: 1300, savings: 400, debt: 1200, education: .5, unemployment: .70,
    needs: { monthlyCost: 500, satisfaction: .75, waterDemand: 4, electricityDemand: 3 }, politicalLean: 0, trust: .5, stress: .25 };
  const periferia = simulateHouseholdTick(base, .18);
  assert.equal(periferia.disposableIncome, 125);
  assert.ok(periferia.disposableIncome > 0);
  const healthy = simulateHouseholdTick({ ...base, unemployment: .08 }, .18);
  assert.ok(Math.abs(healthy.disposableIncome - (1300 * .92 * .82 - 500)) < 1e-9);
});

test("informal floor remains sane at extreme unemployment", () => {
  const cohort = { size: 100, income: 1300, savings: 0, debt: 0, education: 0, unemployment: 1,
    needs: { monthlyCost: 500, satisfaction: .5, waterDemand: 0, electricityDemand: 0 }, politicalLean: 0, trust: 0, stress: 0 };
  assert.equal(simulateHouseholdTick(cohort, .18).disposableIncome, 125);
});

test("zoning cache is deterministic and preserves base zone effects", () => {
  const tiles = [tile(0, 0, "zone-r"), tile(1, 0, "zone-c"), tile(4, 0, "zone-i"), tile(5, 5, "grass"), tile(6, 6, "grass"), tile(7, 7, "grass")];
  const firstCity = city(tiles.map(item => ({ ...item })));
  const secondCity = city(tiles.map(item => ({ ...item })));
  const firstDispatcher = new CommandDispatcher(), secondDispatcher = new CommandDispatcher();
  const first = new ZoningLoop(firstCity, firstDispatcher), second = new ZoningLoop(secondCity, secondDispatcher);
  const command = { type: "PLACE_ZONE", zoneType: "zone-r", district: "test", cost: 100, col: 5, row: 5 } as const;
  const beforePopulation = firstCity.districts[0].population;
  firstDispatcher.dispatch(command); secondDispatcher.dispatch(command);
  assert.equal(firstCity.districts[0].population, beforePopulation + 8);
  assert.equal(first.getProximityModifier("test"), second.getProximityModifier("test"));
  const employment = firstCity.districts[0].economy.employment;
  firstDispatcher.dispatch({ type: "PLACE_ZONE", zoneType: "zone-c", district: "test", cost: 150, col: 6, row: 6 });
  assert.ok(firstCity.districts[0].economy.employment > employment);
  const income = firstCity.districts[0].economy.averageIncome;
  firstDispatcher.dispatch({ type: "PLACE_ZONE", zoneType: "zone-i", district: "test", cost: 200, col: 7, row: 7 });
  assert.equal(firstCity.districts[0].economy.averageIncome, income + 50);
});

test("zones cannot overwrite buildings or occupy non-buildable terrain", () => {
  const blocked = city([tile(0, 0, "bldg-r"), tile(1, 0, "water"), tile(2, 0, "sand")]);
  const dispatcher = new CommandDispatcher();
  new ZoningLoop(blocked, dispatcher);
  const treasury = blocked.treasury;
  for (const [col, type] of [[0, "zone-r"], [1, "zone-c"], [2, "zone-i"]] as const) {
    dispatcher.dispatch({ type: "PLACE_ZONE", zoneType: type, district: "test", cost: 100, col, row: 0 });
  }
  assert.equal(blocked.treasury, treasury);
  assert.deepEqual(blocked.districts[0].tiles.map(item => item.type), ["bldg-r", "water", "sand"]);
});
