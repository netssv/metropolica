import type { District } from "../models.ts";
import type { HouseholdCohort } from "../households/index.ts";
import { selectBusinessMarkers } from "../../../shared/businessAccents.ts";

export type UtilityType = "water" | "electricity" | "gasolina" | "supermercado" | "hospitales" | "bomberos" | "ocio" | "telefonía";
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

const DEMAND_PER_PERSON: Record<Exclude<UtilityType, "water" | "electricity">, number> = { gasolina: .12, supermercado: .20, hospitales: .05, bomberos: .03, ocio: .15, telefonía: .80 };
export function serviceDemand(district: District, utility: Exclude<UtilityType, "water" | "electricity">): number { return district.population * DEMAND_PER_PERSON[utility]; }
export function developedBusinessSupply(district: District, utility: Exclude<UtilityType, "water" | "electricity">): number {
  const developed = district.tiles.filter(tile => tile.type === "bldg-c" || tile.type === "bldg-i");
  if (utility === "gasolina") return selectBusinessMarkers(developed, "gasoline").length * 100;
  if (utility === "supermercado") return selectBusinessMarkers(developed, "supermarket").length * 100;
  if (utility === "hospitales") return developed.filter(tile => tile.specialty === "hospital").length * 100;
  // Shared-placeholder fallback remains for firefighters, leisure and telephony.
  return (utility === "bomberos" || utility === "ocio" || utility === "telefonía") ? developed.filter(tile => tile.type === "bldg-c").length * 100 : 0;
}
