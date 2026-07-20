import type { District } from "../models.ts";
import type { HouseholdCohort } from "../households/index.ts";

export type UtilityType = "water" | "electricity";
export type UtilityCoverage = { water: number; electricity: number };

export function calculateDemand(cohorts: HouseholdCohort[], utility: UtilityType): number {
  const field = utility === "water" ? "waterDemand" : "electricityDemand";
  return cohorts.reduce((total, cohort) => total + cohort.size * cohort.needs[field], 0);
}

export function calculateCoverage(capacity: number, demand: number): number {
  return demand <= 0 ? 1 : Math.min(1, Math.max(0, capacity / demand));
}

export function updateUtility(district: District, utility: UtilityType, demand: number): District {
  const current = district.services[utility];
  return { ...district, services: { ...district.services, [utility]: { ...current, demand, coverage: calculateCoverage(current.capacity, demand) } } };
}
