import type { HouseholdCohort } from "../../simulation/households/index.ts";
import type { CityState, District } from "../../simulation/models.ts";
import { DEVELOPMENT_ECONOMY } from "../../../shared/economyBalance.ts";

export type ScenarioCondition = { threshold: number; consecutiveTicks: number };
export type CiudadDivididaContent = {
  id: string; targetYears: number; loss: { treasury: ScenarioCondition; approval: ScenarioCondition };
  winApproval: number; startingCity: Omit<CityState, "districts" | "organizations">;
  districts: Array<{ district: District; households: HouseholdCohort[]; notes?: string[] }>;
};

const utility = (capacity: number) => ({ capacity, demand: 0, coverage: 1, maintenance: 0.9 });
const baseDistrict = (id: string, population: number, income: number, trust: number, approval = 0.56): District => ({
  id, population, approval, services: { water: utility(1000), electricity: utility(1000), waste: 0.7, safety: 0.6, internet: 0.7, gasolina: utility(0), supermercado: utility(0), hospitales: utility(0), bomberos: utility(0), ocio: utility(0), telefonía: utility(0) },
    economy: { employment: 0.75, averageIncome: income, costOfLiving: 500, commercialRevenue: 0, industrialRevenue: 0 },
  social: { inequality: 0.3, trust, institutionalTrust: trust, unrest: 0, crimeRisk: 0, atRisk: false }, tiles: []
});
const households = (income: number, monthlyCost: number, size: number, unemployment: number): HouseholdCohort[] => [{
  size, income, savings: 400, debt: 1200, education: 0.5, unemployment,
  needs: { monthlyCost, satisfaction: 0.75, waterDemand: 4, electricityDemand: 3 },
  politicalLean: 0, trust: 0.5, stress: 0.25
}];

export const ciudadDividida: CiudadDivididaContent = {
  id: "ciudad_dividida", targetYears: 5, winApproval: 0.45,
  startingCity: { treasury: DEVELOPMENT_ECONOMY.treasury.initial, debt: DEVELOPMENT_ECONOMY.treasury.debt, approval: 0.9, taxRate: DEVELOPMENT_ECONOMY.treasury.taxRate, auditLevel: 0.65, corruptionRisk: 0 },
  loss: { treasury: { threshold: 0, consecutiveTicks: 4 }, approval: { threshold: 0.25, consecutiveTicks: 4 } },
  districts: [
    { district: baseDistrict("centro", 800, DEVELOPMENT_ECONOMY.household.centro.income, 0.65, 0.9), households: households(DEVELOPMENT_ECONOMY.household.centro.income, DEVELOPMENT_ECONOMY.household.centro.monthlyCost, 800, 0.08), notes: ["Infraestructura envejecida"] },
    { district: { ...baseDistrict("periferia", 1200, DEVELOPMENT_ECONOMY.household.periferia.income, 0.1, 0.9), services: { ...baseDistrict("x", 1, 1, 1).services, water: utility(450), electricity: utility(450) } }, households: households(DEVELOPMENT_ECONOMY.household.periferia.income, DEVELOPMENT_ECONOMY.household.periferia.monthlyCost, 1200, 0.7), notes: ["Crecimiento rápido", "Cobertura inicial baja"] },
    { district: baseDistrict("zona_industrial", 700, DEVELOPMENT_ECONOMY.household.zona_industrial.income, 0.55, 0.9), households: households(DEVELOPMENT_ECONOMY.household.zona_industrial.income, DEVELOPMENT_ECONOMY.household.zona_industrial.monthlyCost, 700, 0.1), notes: ["TODO: contaminación no modelada"] }
  ]
};
