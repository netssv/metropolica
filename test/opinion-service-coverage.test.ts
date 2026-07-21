import assert from "node:assert/strict";
import test from "node:test";
import { CommandDispatcher } from "../src/core/commands/index.ts";
import { SimulationClock } from "../src/core/clock/index.ts";
import { OpinionLoop, serviceCoveragePenalty } from "../src/simulation/opinion/index.ts";
import type { District } from "../src/simulation/models.ts";

const utility = (coverage: number) => ({ capacity: 1, demand: 1, coverage, maintenance: 1 });
function district(coverage = 1): District {
  return {
    id: "d", population: 100, approval: 0.8,
    services: {
      water: utility(coverage), electricity: utility(coverage), waste: coverage,
      safety: coverage, internet: coverage, gasolina: utility(coverage),
      supermercado: utility(coverage), hospitales: utility(coverage),
      bomberos: utility(coverage), ocio: coverage, telefonía: coverage
    } as District["services"],
    economy: { employment: 1, averageIncome: 1000, costOfLiving: 500, commercialRevenue: 0, industrialRevenue: 0 },
    social: { inequality: 0, trust: 1, institutionalTrust: 1, unrest: 0, crimeRisk: 0, atRisk: false }, tiles: []
  };
}

test("coverage at or above threshold produces no penalty", () => {
  assert.equal(serviceCoveragePenalty(district(0.8)), 0);
  assert.equal(serviceCoveragePenalty(district(1)), 0);
});

test("an equal critical deficit weighs four times a convenience deficit", () => {
  const critical = district(1); critical.services.water.coverage = 0.4;
  const convenience = district(1); convenience.services.internet = 0.4;
  assert.ok(Math.abs(serviceCoveragePenalty(critical) / serviceCoveragePenalty(convenience) - 4) < 1e-10);
});

test("all services at zero cap the penalty at 0.30", () => {
  assert.equal(serviceCoveragePenalty(district(0)), 0.30);
});

test("unchanged coverage does not compound approval penalty across ticks", () => {
  const d = district(0); const city = { treasury: 0, debt: 0, approval: 0.8, taxRate: 0, auditLevel: 0, corruptionRisk: 0, districts: [d], organizations: [] };
  const clock = new SimulationClock({ millisecondsPerSimulatedDay: 1 });
  new OpinionLoop(city, { d: [] }, clock, new CommandDispatcher());
  clock.advance(7); const first = d.approval;
  clock.advance(7); assert.equal(d.approval, first);
});
