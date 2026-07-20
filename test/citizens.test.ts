import { test } from "node:test";
import assert from "node:assert";
import { ScenarioRunner } from "../src/simulation/scenario/index.ts";
import { ciudadDividida } from "../src/content/scenarios/ciudad_dividida.ts";
import { activeCitizenCount } from "../src/simulation/citizens/index.ts";

test("sprint 7a: citizen integration, decision scoring, selective activation, and lifecycle", async (t) => {
  const game = new ScenarioRunner(ciudadDividida);
  game.clock.setSpeed(100);

  // 1. Initial assignment check
  const totalCitizens = Object.values(game.citizens).reduce((sum, citizens) => sum + citizens.length, 0);
  console.log(`\n[Test] Initial citizens assigned: ${totalCitizens} (20 per district)`);
  assert.strictEqual(totalCitizens, 60);
  assert.strictEqual(game.citizens.periferia.length, 20);

  // Initially no organization is active, all citizens should be Level 2
  const initialActive = activeCitizenCount(game.citizens);
  console.log(`[Test] Initial Level 3 citizens: ${initialActive}`);
  assert.strictEqual(initialActive, 0);
  
  let periferiaCitizen = game.citizens.periferia[0];
  assert.strictEqual(periferiaCitizen.level, 2);

  // 2. Advance to crisis (day 7)
  game.advance(7);
  console.log(`[Test] Advanced to Day 7. Active organizations: ${game.city.organizations.map(org => org.id).join(", ")}`);
  
  // Re-query citizens since arrays are updated on ticks
  periferiaCitizen = game.citizens.periferia[0];
  const activeDuringCrisis = activeCitizenCount(game.citizens);
  console.log(`[Test] Level 3 citizens during crisis: ${activeDuringCrisis}`);
  
  // periferia-citizen-1 should be Level 3
  assert.strictEqual(periferiaCitizen.level, 3);
  assert.strictEqual(periferiaCitizen.activeCause, "organization");
  assert.match(periferiaCitizen.currentProblem || "", /pandilla/);

  // Print example citizens' profiles (Nemotron-derived data) and current problem
  console.log("\n==================================================");
  console.log("SANITY CHECK: NEMOTRON-DERIVED CITIZEN PROFILE");
  console.log("==================================================");
  console.log(`ID: ${periferiaCitizen.id}`);
  console.log(`Age: ${periferiaCitizen.age}`);
  console.log(`Occupation: ${periferiaCitizen.occupation}`);
  console.log(`Skills (Tech, Prof, Social, Adapt): ${periferiaCitizen.skills.map(s => s.toFixed(2)).join(", ")}`);
  console.log(`Aspirations (Ambition, Stability, Community, Emigration): ${periferiaCitizen.aspirations.map(a => a.toFixed(2)).join(", ")}`);
  console.log(`Traits (Risk, Social, PriceSens, Trust, RecPref): ${periferiaCitizen.traits.map(t => t.toFixed(2)).join(", ")}`);
  console.log(`Current Problem: ${periferiaCitizen.currentProblem}`);
  console.log("==================================================\n");

  const centroCitizen = game.citizens.centro[0];
  console.log("==================================================");
  console.log("EXAMPLE CITIZEN 2 PROFILE (CENTRO - LEVEL 2)");
  console.log("==================================================");
  console.log(`ID: ${centroCitizen.id}`);
  console.log(`Age: ${centroCitizen.age}`);
  console.log(`Occupation: ${centroCitizen.occupation}`);
  console.log(`Skills: ${centroCitizen.skills.map(s => s.toFixed(2)).join(", ")}`);
  console.log(`Traits: ${centroCitizen.traits.map(t => t.toFixed(2)).join(", ")}`);
  console.log(`Current Problem: ${centroCitizen.currentProblem ?? "none (Level 2)"}`);
  console.log("==================================================\n");

  // 3. Resolve crisis (intervene)
  game.dispatcher.dispatch({ type: "HOLD_PRESS_CONFERENCE", topic: "crime", message: "acknowledge" });
  game.dispatcher.dispatch({ type: "INVEST_UTILITY", district: "periferia", utility: "water", amount: 300000 });
  game.dispatcher.dispatch({ type: "INVEST_SOCIAL_PROGRAM", district: "periferia", amount: 100000 });

  // Advance 180 days to let organization dissolve
  game.advance(180);
  console.log(`[Test] Advanced to Day 187. Active organizations: ${game.city.organizations.map(org => org.id).join(", ")}`);
  
  // Re-query periferia citizen
  periferiaCitizen = game.citizens.periferia[0];
  
  // Organization should be dissolved, so citizen should be demoted back to Level 2
  assert.strictEqual(game.city.organizations.length, 0);
  assert.strictEqual(periferiaCitizen.level, 2);
  assert.strictEqual(periferiaCitizen.activeCause, undefined);
  assert.strictEqual(periferiaCitizen.currentProblem, undefined);
  console.log(`[Test] Confirmed periferia citizen demoted back to Level 2 after organization dissolved.`);

  // 4. Complete scenario to verify outcome is unchanged
  game.advance(ciudadDividida.targetYears * 365 - game.clock.currentDay);
  console.log(`[Test] Scenario finished on Day ${game.clock.currentDay}. Result: ${game.result.status} (${game.result.reason})`);
  assert.strictEqual(game.result.status, "won");

  // 5. Verify CPU scaling performance: only Level 3 citizens compute daily decisions
  // We can benchmark by calling tickCitizens with more citizens vs fewer
  const startTime = process.hrtime.bigint();
  for (let i = 0; i < 1000; i++) {
    (game as any).tickCitizens();
  }
  const endTime = process.hrtime.bigint();
  const timeWithNoneActive = Number(endTime - startTime) / 1e6; // in ms
  console.log(`[Performance] 1000 ticks with 0 active citizens: ${timeWithNoneActive.toFixed(2)} ms`);

  // Activate all 60 citizens (forced to Level 3)
  for (const list of Object.values(game.citizens)) {
    for (const c of list) {
      c.level = 3;
    }
  }
  const startActiveTime = process.hrtime.bigint();
  for (let i = 0; i < 1000; i++) {
    (game as any).tickCitizens();
  }
  const endActiveTime = process.hrtime.bigint();
  const timeWithAllActive = Number(endActiveTime - startActiveTime) / 1e6; // in ms
  console.log(`[Performance] 1000 ticks with 60 active citizens: ${timeWithAllActive.toFixed(2)} ms`);
  
  console.log(`[Performance] Scaling check: inactive is ${(timeWithAllActive / Math.max(0.001, timeWithNoneActive)).toFixed(1)}x faster.`);
  assert.ok(timeWithNoneActive < timeWithAllActive, "Ticks with inactive citizens should be faster than with active citizens");
});
