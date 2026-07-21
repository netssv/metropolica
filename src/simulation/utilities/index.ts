import type { SimulationClock } from "../../core/clock/index.ts";
import type { CommandDispatcher } from "../../core/commands/index.ts";
import type { CityState } from "../models.ts";
import type { HouseholdCohort } from "../households/index.ts";
import { calculateDemand, updateUtility, serviceDemand, developedBusinessSupply, type UtilityCoverage, type UtilityType } from "./coverage.ts";

export type DistrictCohortMap = Record<string, HouseholdCohort[]>;
export type InvestUtilityCommand = { type: "INVEST_UTILITY"; district: string; utility: UtilityType; amount: number };

export class UtilitiesLoop {
  private readonly city: CityState;
  private readonly cohorts: DistrictCohortMap;
  constructor(city: CityState, cohorts: DistrictCohortMap, clock: SimulationClock, dispatcher: CommandDispatcher) {
    this.city = city; this.cohorts = cohorts;
    dispatcher.register("INVEST_UTILITY", command => this.invest(command as InvestUtilityCommand));
    clock.onDailyTick(() => this.decay());
    clock.onWeeklyTick(() => this.recalculate());
    this.recalculate();
  }
  setCapacity(district: string, utility: UtilityType, capacity: number): void {
    const target = this.city.districts.find(item => item.id === district); if (!target) throw new Error(`Unknown district: ${district}`);
    target.services[utility].capacity = Math.max(0, capacity);
  }
  coverage(district: string): UtilityCoverage {
    const target = this.city.districts.find(item => item.id === district); if (!target) throw new Error(`Unknown district: ${district}`);
    return { water: target.services.water.coverage, electricity: target.services.electricity.coverage };
  }
  private invest(command: InvestUtilityCommand): void {
    if (command.amount < 0 || command.amount > this.city.treasury) return;
    const target = this.city.districts.find(item => item.id === command.district); if (!target) return;
    this.city.treasury -= command.amount; target.services[command.utility].capacity += command.amount;
  }
  private decay(): void {
    for (const district of this.city.districts) for (const utility of ["water", "electricity"] as UtilityType[]) {
      const state = district.services[utility]; state.capacity = Math.max(0, state.capacity - (1 - state.maintenance) * 0.01 * state.capacity);
    }
  }
  private recalculate(): void {
    for (const district of this.city.districts) {
      const cohorts = this.cohorts[district.id] ?? [];
      for (const utility of ["water", "electricity"] as UtilityType[]) Object.assign(district, updateUtility(district, utility, calculateDemand(cohorts, utility)));
      for (const utility of ["gasolina", "supermercado", "hospitales", "bomberos", "ocio", "telefonía"] as const) Object.assign(district, updateUtility(district, utility, serviceDemand(district, utility)));
      for (const utility of ["gasolina", "supermercado", "hospitales", "bomberos", "ocio", "telefonía"] as const) district.services[utility].capacity = developedBusinessSupply(district, utility);
    }
  }
}
