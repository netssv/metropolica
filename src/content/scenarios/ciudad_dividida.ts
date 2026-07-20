import type { HouseholdCohort } from "../../simulation/households/index.ts";
import type { CityState, District } from "../../simulation/models.ts";

export type ScenarioCondition = { threshold: number; consecutiveTicks: number };
export type CiudadDivididaContent = {
  id: string; targetYears: number; loss: { treasury: ScenarioCondition; approval: ScenarioCondition };
  winApproval: number; startingCity: Omit<CityState, "districts" | "organizations">;
  districts: Array<{ district: District; households: HouseholdCohort[]; notes?: string[] }>;
};

const utility = (capacity: number) => ({ capacity, demand: 0, coverage: 1, maintenance: 0.9 });
const baseDistrict = (id: string, population: number, income: number, trust: number, approval = 0.56): District => ({
  id, population, approval, services: { water: utility(1000), electricity: utility(1000), waste: 0.7, safety: 0.6, internet: 0.7 },
  economy: { employment: 0.75, averageIncome: income, costOfLiving: 500 },
  social: { inequality: 0.3, trust, institutionalTrust: trust, unrest: 0, crimeRisk: 0, atRisk: false }
});
const households = (income: number, size: number, unemployment: number): HouseholdCohort[] => [{
  size, income, savings: 400, debt: 1200, education: 0.5, unemployment,
  needs: { monthlyCost: 500, satisfaction: 0.75, waterDemand: 4, electricityDemand: 3 },
  politicalLean: 0, trust: 0.5, stress: 0.25
}];

export const ciudadDividida: CiudadDivididaContent = {
  id: "ciudad_dividida", targetYears: 5, winApproval: 0.45,
  startingCity: { treasury: 100000, debt: 900000, approval: 0.9, taxRate: 0.18, auditLevel: 0.65, corruptionRisk: 0 },
  loss: { treasury: { threshold: 0, consecutiveTicks: 4 }, approval: { threshold: 0.25, consecutiveTicks: 4 } },
  districts: [
    { district: baseDistrict("centro", 800, 2400, 0.65, 0.9), households: households(2400, 800, 0.08), notes: ["Infraestructura envejecida"] },
    { district: { ...baseDistrict("periferia", 1200, 1300, 0.1, 0.9), services: { ...baseDistrict("x", 1, 1, 1).services, water: utility(450), electricity: utility(450) } }, households: households(1300, 1200, 0.7), notes: ["Crecimiento rápido", "Cobertura inicial baja"] },
    { district: baseDistrict("zona_industrial", 700, 3100, 0.55, 0.9), households: households(3100, 700, 0.1), notes: ["TODO: contaminación no modelada"] }
  ]
};
