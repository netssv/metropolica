import type { SimulationClock } from "../../core/clock/index.ts";
import type { CommandDispatcher } from "../../core/commands/index.ts";
import type { CityState } from "../models.ts";
import type { HouseholdCohort, HouseholdTickOutput } from "../households/index.ts";
import { simulateHouseholdTick } from "../households/index.ts";
import { aggregateDistrictEconomy, summarizeEconomy, type EconomySnapshot } from "./index.ts";
import { clampRate } from "../formulas/economy.ts";
import type { UtilityCoverage } from "../utilities/coverage.ts";
import { censusCity } from "../tileCensus.ts";
import { DEVELOPMENT_ECONOMY } from "../../../shared/economyBalance.ts";

export type DistrictCohortMap = Record<string, HouseholdCohort[]>;

/** Connects clock, command boundary and pure household/economy calculations. */
export class EconomyLoop {
  private outputs = new Map<string, HouseholdTickOutput[]>();
  private latest: EconomySnapshot = { taxesCollected: 0, totalIncome: 0, totalPopulation: 0, unemployment: 0 };
  private readonly city: CityState;
  private readonly cohorts: DistrictCohortMap;
  private readonly utilityCoverage?: (district: string) => UtilityCoverage;
  private readonly proximityModifier?: (district: string) => number;
  constructor(city: CityState, cohorts: DistrictCohortMap, clock: SimulationClock, dispatcher: CommandDispatcher, utilityCoverage?: (district: string) => UtilityCoverage, proximityModifier?: (district: string) => number) {
    this.city = city;
    this.cohorts = cohorts;
    this.utilityCoverage = utilityCoverage;
    this.proximityModifier = proximityModifier;
    dispatcher.register("CHANGE_TAX_RATE", command => { this.city.taxRate = clampRate((command as unknown as { value: number }).value); });
    clock.onDailyTick(() => this.dailyHouseholdTick());
    clock.onWeeklyTick(() => this.weeklyEconomyTick());
  }
  get snapshot(): EconomySnapshot { return this.latest; }
  private dailyHouseholdTick(): void {
    for (const district of this.city.districts) {
      const coverage = this.utilityCoverage?.(district.id) ?? { water: 1, electricity: 1 };
      const next = (this.cohorts[district.id] ?? []).map(cohort => simulateHouseholdTick(cohort, this.city.taxRate, coverage));
      this.cohorts[district.id] = next.map(output => output.cohort);
      this.outputs.set(district.id, next);
    }
  }
  private weeklyEconomyTick(): void {
    console.log(JSON.stringify({ event: "tile-census", ...censusCity(this.city.districts, {}) }));
    const allOutputs: HouseholdTickOutput[] = [];
    for (const district of this.city.districts) {
      const outputs = this.outputs.get(district.id) ?? [];
      allOutputs.push(...outputs);
      Object.assign(district, aggregateDistrictEconomy(district, outputs, this.proximityModifier?.(district.id) ?? 0));
    }
    this.latest = summarizeEconomy(allOutputs, this.city.taxRate);
    // Household income is monthly; the weekly simulation collects one quarter
    // of the monthly tax total so public revenue stays in the same cadence as
    // construction costs and the starting treasury.
    this.city.treasury += this.latest.taxesCollected / DEVELOPMENT_ECONOMY.treasury.collectionsPerMonth;
  }
}
