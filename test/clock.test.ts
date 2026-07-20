import assert from "node:assert/strict";
import test from "node:test";
import { SimulationClock } from "../src/core/clock/index.ts";

test("one simulated year advances correctly at x1, x5, x20 and x100", () => {
  for (const speed of [1, 5, 20, 100] as const) {
    const clock = new SimulationClock({ millisecondsPerSimulatedDay: 10 });
    let daily = 0; let weekly = 0; let monthly = 0;
    clock.onDailyTick(() => daily++); clock.onWeeklyTick(() => weekly++); clock.onMonthlyTick(() => monthly++);
    clock.setSpeed(speed);
    clock.advance((365 * 10) / speed);
    assert.equal(clock.currentDay, 365);
    assert.equal(daily, 365); assert.equal(weekly, 52); assert.equal(monthly, 12);
  }
});

test("pause buffers no time and unsubscribe stops notifications", () => {
  const clock = new SimulationClock({ millisecondsPerSimulatedDay: 10 });
  let ticks = 0; const unsubscribe = clock.onDailyTick(() => ticks++);
  clock.pause(); clock.advance(100); assert.equal(clock.currentDay, 0);
  clock.resume(); unsubscribe(); clock.advance(10); assert.equal(ticks, 0);
});
