import { clamp, clampRate } from "../formulas/economy.ts";

export interface HouseholdNeeds {
  monthlyCost: number;
  satisfaction: number;
  waterDemand: number;
  electricityDemand: number;
}

export interface HouseholdCohort {
  size: number;
  income: number;
  savings: number;
  debt: number;
  education: number;
  unemployment: number;
  needs: HouseholdNeeds;
  politicalLean: number;
  trust: number;
  stress: number;
  disposableIncome?: number;
}

export interface HouseholdTickOutput {
  cohort: HouseholdCohort;
  grossIncome: number;
  taxPaid: number;
  disposableIncome: number;
  debtChange: number;
  stress: number;
  needsSatisfied: number;
}

export const INFORMAL_INCOME_FLOOR_RATE = 0.25;

/** Pure daily cohort calculation. Monetary inputs are monthly and prorated to one day. */
export function simulateHouseholdTick(cohort: HouseholdCohort, taxRate: number, coverage = { water: 1, electricity: 1 }): HouseholdTickOutput {
  const safeTaxRate = clampRate(taxRate);
  const grossIncome = cohort.income * (1 - cohort.unemployment);
  const taxPaid = grossIncome * safeTaxRate;
  const formalDisposableIncome = grossIncome - taxPaid - cohort.needs.monthlyCost;
  const informalIncome = cohort.needs.monthlyCost * INFORMAL_INCOME_FLOOR_RATE;
  const disposableIncome = Math.max(formalDisposableIncome, informalIncome);
  const dailyDisposableIncome = disposableIncome / 30;
  const debtChange = Math.max(0, -dailyDisposableIncome) - Math.min(cohort.debt, Math.max(0, dailyDisposableIncome) * 0.25);
  const nextDebt = Math.max(0, cohort.debt + debtChange);
  const debtBurden = nextDebt / Math.max(1, grossIncome);
  const needsSatisfied = clamp(cohort.needs.satisfaction * Math.min(coverage.water, coverage.electricity));
  const stress = clamp(0.30 * (1 - needsSatisfied) + 0.20 * debtBurden + 0.15 * cohort.unemployment + 0.35 * safeTaxRate);
  const dailySavingsChange = dailyDisposableIncome;
  const next: HouseholdCohort = {
    ...cohort,
    savings: Math.max(0, cohort.savings + dailySavingsChange),
    debt: nextDebt,
    stress, disposableIncome
  };
  return { cohort: next, grossIncome, taxPaid, disposableIncome, debtChange, stress, needsSatisfied };
}
