import type { SimulationClock } from "../../core/clock/index.ts";
import type { CommandDispatcher } from "../../core/commands/index.ts";
import type { HouseholdCohort } from "../households/index.ts";
import type { CityState, District } from "../models.ts";
import { clamp, clampRate, weightedAverage } from "../formulas/economy.ts";

export type DistrictCohortMap = Record<string, HouseholdCohort[]>;
export type InvestSocialProgramCommand = { type: "INVEST_SOCIAL_PROGRAM"; district: string; amount: number };
export type SetAuditLevelCommand = { type: "SET_AUDIT_LEVEL"; value: number };

export function calculateCrimeRisk(district: District, cohorts: HouseholdCohort[]): number {
  const unemployment = weightedAverage(cohorts.map(cohort => ({ value: cohort.unemployment, weight: cohort.size })));
  const averageIncome = weightedAverage(cohorts.map(cohort => ({ value: cohort.income, weight: cohort.size })));
  const variance = weightedAverage(cohorts.map(cohort => ({ value: ((cohort.income - averageIncome) / Math.max(1, averageIncome)) ** 2, weight: cohort.size })));
  const inequality = clamp(Math.sqrt(variance));
  const serviceDeficit = 1 - Math.min(district.services.water.coverage, district.services.electricity.coverage);
  // TODO: add education, cohesion and travel-time inputs when those systems exist.
  const rawRisk = unemployment ** 2 + inequality + serviceDeficit - district.social.institutionalTrust;
  return Math.min(1, Math.max(0, 1 - Math.exp(-Math.max(0, rawRisk))));
}

export function calculateCorruptionRisk(treasury: number, auditLevel: number): number {
  const contractValueProxy = clamp(treasury / 1000000);
  const discretion = 0.7;
  const institutionalPenetration = 0.6;
  const lowAudit = 1 - clampRate(auditLevel);
  return clamp(contractValueProxy * discretion * lowAudit * institutionalPenetration);
}

export class SocialRiskLoop {
  private readonly city: CityState;
  private readonly cohorts: DistrictCohortMap;
  constructor(city: CityState, cohorts: DistrictCohortMap, clock: SimulationClock, dispatcher: CommandDispatcher) {
    this.city = city; this.cohorts = cohorts;
    dispatcher.register("SET_AUDIT_LEVEL", command => this.setAudit(command as SetAuditLevelCommand));
    dispatcher.register("INVEST_SOCIAL_PROGRAM", command => this.investProgram(command as InvestSocialProgramCommand));
    clock.onWeeklyTick(() => this.recalculate());
    this.recalculate();
  }
  private recalculate(): void {
    for (const district of this.city.districts) {
      district.social.crimeRisk = calculateCrimeRisk(district, this.cohorts[district.id] ?? []);
      district.social.atRisk = district.social.crimeRisk > 0.70;
    }
    this.city.corruptionRisk = calculateCorruptionRisk(this.city.treasury, this.city.auditLevel);
  }
  private setAudit(command: SetAuditLevelCommand): void {
    const next = clampRate(command.value);
    const cost = Math.max(0, next - this.city.auditLevel) * 100000;
    if (cost <= this.city.treasury) { this.city.treasury -= cost; this.city.auditLevel = next; }
  }
  private investProgram(command: InvestSocialProgramCommand): void {
    if (command.amount < 0 || command.amount > this.city.treasury) return;
    const district = this.city.districts.find(item => item.id === command.district); if (!district) return;
    this.city.treasury -= command.amount;
    district.social.institutionalTrust = clamp(district.social.institutionalTrust + command.amount / 100000);
  }
}
