import { SimulationClock, type SimulationTick } from "../../core/clock/index.ts";
import { CommandDispatcher } from "../../core/commands/index.ts";
import type { CiudadDivididaContent } from "../../content/scenarios/ciudad_dividida.ts";
import type { CityState } from "../models.ts";
import type { HouseholdCohort } from "../households/index.ts";
import { EconomyLoop } from "../economy/loop.ts";
import { UtilitiesLoop } from "../utilities/index.ts";
import { SocialRiskLoop } from "../social-risk/index.ts";
import { OrganizationsLoop } from "../organizations/index.ts";
import { OpinionLoop } from "../opinion/index.ts";
import { ZoningLoop } from "../districts/zoning.ts";
import { readFileSync } from "node:fs";
import { assignCitizens, assignDrivingCitizens, syncCitizenActivation, chooseActivity, type Citizen, type CitizenPoolProfile } from "../citizens/index.ts";
import { assignCommuteLocations } from "../citizens/destinations.ts";
import type { HouseholdTickOutput } from "../households/index.ts";
import { generateInitialMap } from "./map.ts";

export type ScenarioResult = { status: "running" | "won" | "lost"; reason?: string; tick: number };
export type CitySize = "tiny" | "small" | "big" | "very-big" | "enormous";
export const CITY_SIZES: Record<CitySize, { cols: number; rows: number; label: string }> = {
  tiny: { cols: 24, rows: 18, label: "Tiny" },
  small: { cols: 48, rows: 36, label: "Small" },
  big: { cols: 96, rows: 72, label: "Big" },
  "very-big": { cols: 128, rows: 96, label: "Very big" },
  enormous: { cols: 160, rows: 120, label: "Enormous" },
};
export class ScenarioRunner {
  readonly citySize: CitySize;
  city: CityState;
  cohorts: Record<string, HouseholdCohort[]>;
  readonly clock: SimulationClock;
  readonly dispatcher: CommandDispatcher;
  readonly opinion: OpinionLoop;
  private readonly economy: EconomyLoop;
  get economySnapshot() { return this.economy.snapshot; }
  citizens: Record<string, Citizen[]>;
  readonly inspectedCitizens = new Set<string>();
  result: ScenarioResult = { status: "running", tick: 0 };
  private readonly content: CiudadDivididaContent;
  private readonly streaks = { treasury: 0, approval: 0 };
  private readonly consumptionLedger = new Set<string>();
  constructor(content: CiudadDivididaContent, millisecondsPerDay = 3_600_000, seed = 1, citySize: CitySize = "big") {
    this.citySize = citySize;
    this.content = content; this.city = { ...content.startingCity, districts: content.districts.map(item => structuredClone(item.district)), organizations: [] };
    for (const district of this.city.districts) for (const service of ["gasolina", "supermercado", "hospitales", "bomberos", "ocio", "telefonía"] as const) {
      district.services[service] ??= { capacity: 0, demand: 0, coverage: 0, maintenance: 1 };
    }
    const dimensions = CITY_SIZES[citySize];
    const initialTiles = generateInitialMap(seed, dimensions.cols, dimensions.rows);
    this.city.districts.forEach(d => { d.tiles = initialTiles[d.id] || []; });
    this.cohorts = Object.fromEntries(content.districts.map(item => [item.district.id, structuredClone(item.households)]));
    const pool = JSON.parse(readFileSync(new URL("../../../content/citizens/sample_pool.json", import.meta.url), "utf8")) as CitizenPoolProfile[];
    this.citizens = assignDrivingCitizens(assignCitizens(pool, this.city.districts.map(district => district.id), this.cohorts, 20));
    this.citizens = assignCommuteLocations(this.citizens, this.city.districts);
    this.clock = new SimulationClock({ millisecondsPerSimulatedDay: millisecondsPerDay }); this.dispatcher = new CommandDispatcher();
    this.dispatcher.register("CITIZEN_CONSUMPTION", command => this.applyConsumption(command as any));
    const utilities = new UtilitiesLoop(this.city, this.cohorts, this.clock, this.dispatcher);
    const zoning = new ZoningLoop(this.city, this.dispatcher);
    this.economy = new EconomyLoop(this.city, this.cohorts, this.clock, this.dispatcher, id => utilities.coverage(id), id => zoning.getProximityModifier(id));
    new SocialRiskLoop(this.city, this.cohorts, this.clock, this.dispatcher);
    new OrganizationsLoop(this.city, this.cohorts, this.clock, this.dispatcher);
    this.opinion = new OpinionLoop(this.city, this.cohorts, this.clock, this.dispatcher);
    this.clock.onWeeklyTick(() => {
      this.citizens = syncCitizenActivation(
        this.citizens,
        this.city,
        this.opinion.activeFootprints,
        this.inspectedCitizens
      );
      this.citizens = assignCommuteLocations(this.citizens, this.city.districts);
    });
    this.clock.onDailyTick(() => this.tickCitizens());
    this.clock.onWeeklyTick(tick => this.evaluate(tick));
  }
  private applyConsumption(command: { cohortId: string; districtId: string; activity: "shop" | "refuel"; day: number }): void {
    if (!['shop', 'refuel'].includes(command.activity) || command.day !== this.clock.currentDay) throw new Error('Invalid citizen consumption command');
    const district = this.city.districts.find(item => item.id === command.districtId);
    const cohorts = this.cohorts[command.districtId] ?? [];
    const index = Number(command.cohortId.split('-').pop()); const cohort = Number.isInteger(index) ? cohorts[index] : undefined;
    if (!district || !cohort) throw new Error('Unknown consumption district or cohort');
    const key = `${command.cohortId}:${command.day}:${command.activity}`; if (this.consumptionLedger.has(key)) throw new Error('Consumption already charged for cohort/day/activity');
    const cost = command.activity === 'shop' ? 25 : 15; const charged = Math.min(cost, Math.max(0, cohort.disposableIncome ?? cohort.income));
    cohort.disposableIncome = Math.max(0, (cohort.disposableIncome ?? cohort.income) - charged);
    if (command.activity === 'shop') district.economy.commercialRevenue += charged; else district.economy.industrialRevenue += charged;
    this.consumptionLedger.add(key);
  }
  private tickCitizens(): void {
    for (const [districtId, citizens] of Object.entries(this.citizens)) {
      const districtCohorts = this.cohorts[districtId] ?? [];
      for (const citizen of citizens) {
        if (citizen.level === 3) {
          const cohortIndex = parseInt(citizen.householdId.split("-").pop() || "0", 10);
          const cohort = districtCohorts[cohortIndex];
          const needsSatisfied = cohort ? cohort.needs.satisfaction : 0.5;

          const options = [
            { activity: "trabajo", affinity: citizen.skills[0] * 0.4 + citizen.skills[1] * 0.3, accessibility: 0.8, cost: 0, travelTime: 0.1 },
            { activity: "recreación", affinity: citizen.traits[1] * 0.5 + citizen.traits[4] * 0.5, accessibility: 0.7, cost: 0.1, travelTime: 0.15 },
            { activity: "estudio", affinity: citizen.aspirations[1] * 0.6, accessibility: 0.5, cost: 0.2, travelTime: 0.25 },
            { activity: "descanso", affinity: 0.3, accessibility: 1.0, cost: 0, travelTime: 0 }
          ];

          const outputs: Record<string, HouseholdTickOutput> = {};
          if (cohort) {
            outputs[citizen.householdId] = {
              cohort,
              grossIncome: cohort.income,
              taxPaid: 0,
              disposableIncome: cohort.income,
              debtChange: 0,
              stress: cohort.stress,
              needsSatisfied
            };
          }

          const decision = chooseActivity(citizen, outputs, options, this.clock.currentDay);
          
          if (cohort) {
            if (decision.activity === "trabajo") {
              // Citizen working reduces unemployment rate and increases savings slightly for their cohort
              cohort.unemployment = Math.max(0.01, cohort.unemployment - 0.002);
              cohort.savings = Math.min(10000, cohort.savings + 5);
            } else if (decision.activity === "estudio") {
              // Citizen studying increases cohort education level
              cohort.education = Math.min(1.0, cohort.education + 0.001);
            } else if (decision.activity === "recreación") {
              // Citizen recreating reduces stress
              cohort.stress = Math.max(0.02, cohort.stress - 0.005);
            } else if (decision.activity === "descanso") {
              // Citizen resting reduces stress slightly
              cohort.stress = Math.max(0.02, cohort.stress - 0.002);
            }
          }

          if (citizen.activeCause === "organization") {
            citizen.currentProblem = `presión de reclutamiento (decisión: ${decision.activity})`;
          } else if (citizen.activeCause === "footprint") {
            citizen.currentProblem = `preocupado por crisis local (decisión: ${decision.activity})`;
          } else if (citizen.activeCause === "inspection") {
            citizen.currentProblem = `bajo inspección (decisión: ${decision.activity})`;
          } else {
            citizen.currentProblem = `actividad: ${decision.activity}`;
          }
        }
      }
    }
  }
  syncCitizenActivationNow(): void {
    this.citizens = syncCitizenActivation(this.citizens, this.city, this.opinion.activeFootprints, this.inspectedCitizens);
    this.citizens = assignCommuteLocations(this.citizens, this.city.districts);
  }
  advance(days: number): void {
    if (this.result.status !== "running") return;
    this.clock.advance(days * this.clock.millisecondsPerSimulatedDay / this.clock.currentSpeed);
  }

  serialize(): string {
    return JSON.stringify({
      city: this.city,
      cohorts: this.cohorts,
      citizens: this.citizens,
      result: this.result,
      day: this.clock.currentDay,
      opinionFootprints: this.opinion.footprints,
      opinionBreakdown: this.opinion.breakdownHistory
    });
  }

  deserialize(data: string): void {
    const state = JSON.parse(data);
    this.city = state.city;
    this.cohorts = state.cohorts;
    this.citizens = state.citizens;
    this.result = state.result;
    (this.clock as any).day = state.day;
    this.opinion.footprints = state.opinionFootprints;
    this.opinion.breakdownHistory = state.opinionBreakdown;
  }
  private evaluate(tick: SimulationTick): void {
    this.result.tick = tick.day; if (this.city.treasury < this.content.loss.treasury.threshold) this.streaks.treasury++; else this.streaks.treasury = 0;
    if (this.city.approval < this.content.loss.approval.threshold) this.streaks.approval++; else this.streaks.approval = 0;
    if (this.streaks.treasury >= this.content.loss.treasury.consecutiveTicks) return this.stop("tesorería negativa durante varios ticks");
    if (this.streaks.approval >= this.content.loss.approval.consecutiveTicks) return this.stop("aprobación demasiado baja durante varios ticks");
    if (tick.day >= this.content.targetYears * 365 - 7 && this.city.treasury >= 0 && this.city.approval >= this.content.winApproval) this.stop("supervivencia cumplida");
  }
  private stop(reason: string): void { this.result = { status: reason === "supervivencia cumplida" ? "won" : "lost", reason, tick: this.result.tick }; this.clock.pause(); }
}
