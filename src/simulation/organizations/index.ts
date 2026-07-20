import type { SimulationClock } from "../../core/clock/index.ts";
import type { CommandDispatcher } from "../../core/commands/index.ts";
import type { HouseholdCohort } from "../households/index.ts";
import type { CityState, District, Organization, OrganizationType } from "../models.ts";
import { clamp, weightedAverage } from "../formulas/economy.ts";

export type DistrictCohortMap = Record<string, HouseholdCohort[]>;

function recruitment(district: District, cohorts: HouseholdCohort[]): number {
  const unemployment = weightedAverage(cohorts.map(cohort => ({ value: cohort.unemployment, weight: cohort.size })));
  // TODO: split youth unemployment and school dropout when those cohorts exist.
  return clamp(unemployment + 0.2 - district.social.institutionalTrust);
}

export function createOrganization(type: OrganizationType, districtId: string, seed: number): Organization {
  return { id: `${type}-${districtId}`, type, territory: [districtId], income: seed * 10000, influence: 0.1, violence: type === "gang" ? 0.4 : 0.1, recruitment: seed, institutionalPenetration: type === "contractor_network" ? 0.5 : 0.1, publicSupport: 0.1, lowRiskTicks: 0 };
}

function updateOrganization(org: Organization, risk: number, recruitmentScore: number): Organization {
  const pressure = Math.max(0, risk - 0.55);
  const growth = pressure * 0.18 + recruitmentScore * 0.04;
  const decline = Math.max(0, 0.45 - risk) * 0.15;
  return { ...org, income: Math.max(0, org.income * (1 + growth - decline)), influence: clamp(org.influence + growth - decline), recruitment: recruitmentScore, lowRiskTicks: risk < 0.35 ? org.lowRiskTicks + 1 : 0 };
}

export class OrganizationsLoop {
  private readonly city: CityState;
  private readonly cohorts: DistrictCohortMap;
  constructor(city: CityState, cohorts: DistrictCohortMap, clock: SimulationClock, _dispatcher: CommandDispatcher) {
    this.city = city; this.cohorts = cohorts;
    clock.onWeeklyTick(() => this.tick());
  }
  private tick(): void { this.spawnGangIfNeeded(); this.spawnContractorNetworkIfNeeded(); for (const org of [...this.city.organizations]) this.updateOrDissolve(org); this.applyEconomicEffects(); }
  private spawnGangIfNeeded(): void {
    for (const district of this.city.districts) {
      if (!district.social.atRisk || this.city.organizations.some(org => org.type === "gang" && org.territory.includes(district.id))) continue;
      this.city.organizations.push(createOrganization("gang", district.id, recruitment(district, this.cohorts[district.id] ?? [])));
    }
  }
  private spawnContractorNetworkIfNeeded(): void {
    if (this.city.corruptionRisk > 0.30 && !this.city.organizations.some(org => org.type === "contractor_network")) this.city.organizations.push(createOrganization("contractor_network", "citywide", this.city.corruptionRisk));
  }
  private updateOrDissolve(org: Organization): void {
    const district = this.city.districts.find(item => org.territory.includes(item.id));
    const risk = org.type === "contractor_network" ? this.city.corruptionRisk : district?.social.crimeRisk ?? 0;
    const score = district ? recruitment(district, this.cohorts[district.id] ?? []) : this.city.corruptionRisk;
    const updated = updateOrganization(org, risk, score);
    if (updated.lowRiskTicks >= 3 || updated.influence < 0.02) this.city.organizations = this.city.organizations.filter(item => item.id !== org.id); else Object.assign(org, updated);
  }
  private applyEconomicEffects(): void {
    for (const org of this.city.organizations) for (const districtId of org.territory) {
      const district = this.city.districts.find(item => item.id === districtId); if (!district) continue;
      const suppression = 1 - 0.12 * org.influence; district.economy.employment *= suppression; district.economy.averageIncome *= suppression;
    }
  }
}
