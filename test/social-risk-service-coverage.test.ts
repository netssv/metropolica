import assert from "node:assert/strict";
import test from "node:test";
import { CommandDispatcher } from "../src/core/commands/index.ts";
import { SimulationClock } from "../src/core/clock/index.ts";
import {
  calculateCrimeRisk,
  serviceCoverageCrimePenalty,
  SocialRiskLoop
} from "../src/simulation/social-risk/index.ts";
import type { District } from "../src/simulation/models.ts";

const utility = (coverage: number) => ({ capacity: 1, demand: 1, coverage, maintenance: 1 });
function district(coverage = 1): District {
  return {
    id: "d", population: 100, approval: 0.8,
    services: {
      water: utility(1), electricity: utility(1), waste: 1, safety: coverage, internet: 1,
      gasolina: utility(1), supermercado: utility(1), hospitales: utility(coverage),
      bomberos: utility(coverage), ocio: 1, telefonía: 1
    },
    economy: { employment: 1, averageIncome: 1000, costOfLiving: 500, commercialRevenue: 0, industrialRevenue: 0 },
    social: { inequality: 0, trust: 1, institutionalTrust: 1, unrest: 0, crimeRisk: 0, atRisk: false }, tiles: []
  };
}

test("coverage exactly at 0.8 has no penalty, while below it does", () => {
  assert.equal(serviceCoverageCrimePenalty(district(0.8)), 0);
  assert.ok(serviceCoverageCrimePenalty(district(0.79)) > 0);
});

test("crime coverage penalty is deterministic across repeated reads", () => {
  const d = district(0.4);
  assert.equal(serviceCoverageCrimePenalty(d), serviceCoverageCrimePenalty(d));
  assert.equal(serviceCoverageCrimePenalty(d), 0.075);
});

test("high public-safety coverage and convenience shortages do not add crime pressure", () => {
  const d = district(1);
  d.services.internet = 0;
  d.services.ocio = 0;
  assert.equal(serviceCoverageCrimePenalty(d), 0);
  assert.equal(calculateCrimeRisk(d, []), 0);
});

test("the effect is district-level and leaves approval/opinion unchanged", () => {
  const d = district(0);
  const city = { treasury: 0, debt: 0, approval: 0.8, taxRate: 0, auditLevel: 0,
    corruptionRisk: 0, districts: [d], organizations: [] };
  const approval = d.approval;
  const cityApproval = city.approval;
  const clock = new SimulationClock({ millisecondsPerSimulatedDay: 1 });
  new SocialRiskLoop(city, { d: [] }, clock, new CommandDispatcher());
  assert.equal(d.approval, approval);
  assert.equal(city.approval, cityApproval);
  assert.equal(d.social.crimeRisk, 0.15);
});

test("coverage penalty is refreshed on the existing weekly social-risk cadence", () => {
  const d = district(0);
  const clock = new SimulationClock({ millisecondsPerSimulatedDay: 1 });
  new SocialRiskLoop({ treasury: 0, debt: 0, approval: 0.8, taxRate: 0, auditLevel: 0,
    corruptionRisk: 0, districts: [d], organizations: [] }, { d: [] }, clock, new CommandDispatcher());
  d.services.safety = 1;
  clock.advance(7);
  assert.equal(d.social.crimeRisk, 0);
});
