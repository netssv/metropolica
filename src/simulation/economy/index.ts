import type { District } from "../models.ts";
import type { HouseholdCohort, HouseholdTickOutput } from "../households/index.ts";
import { monthlyToWeekly } from "../formulas/economy.ts";

export interface DistrictCohorts { districtId: string; cohorts: HouseholdCohort[]; outputs: HouseholdTickOutput[]; }
export interface EconomySnapshot { taxesCollected: number; totalIncome: number; totalPopulation: number; unemployment: number; }

export function aggregateDistrictEconomy(district: District, outputs: HouseholdTickOutput[], proximityModifier = 0): District {
  const totalPopulation = outputs.reduce((sum, output) => sum + output.cohort.size, 0);
  const totalIncome = outputs.reduce((sum, output) => sum + output.disposableIncome * output.cohort.size, 0);
  const unemployed = outputs.reduce((sum, output) => sum + output.cohort.unemployment * output.cohort.size, 0);
  const averageIncome = (totalPopulation ? totalIncome / totalPopulation : 0) * (1 + proximityModifier);
  // Defensive guard only: household income floors provide the economic behavior.
  const safeAverageIncome = Number.isFinite(averageIncome) ? averageIncome : 0;
  return { ...district, population: totalPopulation, economy: { ...district.economy,
    averageIncome: safeAverageIncome,
    employment: totalPopulation ? 1 - unemployed / totalPopulation : 0
  }};
}

export function summarizeEconomy(outputs: HouseholdTickOutput[], taxRate: number): EconomySnapshot {
  const totalPopulation = outputs.reduce((sum, output) => sum + output.cohort.size, 0);
  const totalIncome = outputs.reduce((sum, output) => sum + output.disposableIncome * output.cohort.size, 0);
  const taxesCollected = outputs.reduce((sum, output) => sum + output.taxPaid * output.cohort.size, 0);
  const unemployment = totalPopulation ? outputs.reduce((sum, output) => sum + output.cohort.unemployment * output.cohort.size, 0) / totalPopulation : 0;
  return { taxesCollected: monthlyToWeekly(taxesCollected), totalIncome: totalIncome / Math.max(1, totalPopulation), totalPopulation, unemployment };
}
