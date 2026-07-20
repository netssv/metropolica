import type { SimulationClock } from "../../core/clock/index.ts";
import type { CommandDispatcher } from "../../core/commands/index.ts";
import type { HouseholdCohort } from "../households/index.ts";
import type { CityState } from "../models.ts";

export type Emotion = "anger" | "fear" | "relief" | "indifference";
export type EventFootprint = { topic: string; severity: number; affectedDistrict: string; evidence: number; perceivedCulprit: "city" | "external" | "unclear"; emotion: Emotion };
type Channel = "socialMedia" | "newspapers" | "wordOfMouth";
type FootprintState = { footprint: EventFootprint; age: number };
export type OpinionBreakdown = { day: number; socialMedia: number; newspapers: number; wordOfMouth: number; pressConference: number; total: number };
type ChannelParameters = { speed: number; reach: number; evidenceWeight: number; emotionMultiplier: number };
const CHANNELS: Record<Channel, ChannelParameters> = {
  socialMedia: { speed: 0.35, reach: 1, evidenceWeight: 0.1, emotionMultiplier: 1.3 },
  newspapers: { speed: 0.12, reach: 0.8, evidenceWeight: 0.8, emotionMultiplier: 0.8 },
  wordOfMouth: { speed: 0.2, reach: 1, evidenceWeight: 0.3, emotionMultiplier: 1 }
};

export function channelDelta(footprint: EventFootprint, channel: Channel, targetDistrict: string, similarCohorts: number): number {
  const parameters = CHANNELS[channel]; if (channel === "wordOfMouth" && targetDistrict !== footprint.affectedDistrict) return 0;
  const emotion = footprint.emotion === "relief" ? 1 : footprint.emotion === "indifference" ? 0 : -1;
  const evidenceEffect = 1 - parameters.evidenceWeight * (1 - footprint.evidence);
  const localReach = channel === "wordOfMouth" ? Math.min(1, similarCohorts / 3) : parameters.reach;
  return emotion * 0.08 * footprint.severity * parameters.speed * parameters.emotionMultiplier * evidenceEffect * localReach;
}

export class OpinionLoop {
  readonly footprints: EventFootprint[] = [];
  readonly breakdownHistory: OpinionBreakdown[] = [];
  private readonly active: FootprintState[] = [];
  get activeFootprints(): EventFootprint[] { return this.active.map(a => a.footprint); }
  private previousRisk = new Map<string, boolean>();
  private previousCoverage = new Map<string, number>();
  private previousOrganizations = new Set<string>();
  private readonly city: CityState;
  private readonly cohorts: Record<string, HouseholdCohort[]>;
  private readonly clock: SimulationClock;
  constructor(city: CityState, cohorts: Record<string, HouseholdCohort[]>, clock: SimulationClock, dispatcher: CommandDispatcher) {
    this.city = city; this.cohorts = cohorts; this.clock = clock;
    for (const district of city.districts) { this.previousRisk.set(district.id, false); this.previousCoverage.set(district.id, this.coverage(district.id)); }
    for (const org of city.organizations) this.previousOrganizations.add(org.id);
    dispatcher.register("HOLD_PRESS_CONFERENCE", command => this.press(command as { type: "HOLD_PRESS_CONFERENCE"; topic: string; message: "acknowledge" | "deny" | "reassure" }));
    clock.onWeeklyTick(() => this.tick());
  }
  private tick(): void {
    this.detectFootprints();
    const breakdown = { day: this.clock.currentDay, socialMedia: 0, newspapers: 0, wordOfMouth: 0, pressConference: 0, total: 0 };
    for (const state of this.active) { for (const district of this.city.districts) this.applyChannels(state.footprint, district.id, breakdown); state.age++; }
    while (this.active[0]?.age > 4) this.active.shift();
    this.city.approval = this.city.districts.reduce((sum, district) => sum + district.approval * district.population, 0) / Math.max(1, this.city.districts.reduce((sum, district) => sum + district.population, 0));
    breakdown.total = breakdown.socialMedia + breakdown.newspapers + breakdown.wordOfMouth + breakdown.pressConference;
    this.breakdownHistory.push(breakdown);
  }
  private detectFootprints(): void {
    for (const district of this.city.districts) {
      if (district.social.atRisk && !this.previousRisk.get(district.id)) this.emit({ topic: "crime", severity: district.social.crimeRisk, affectedDistrict: district.id, evidence: 0.8, perceivedCulprit: "city", emotion: "fear" });
      if (!district.social.atRisk && this.previousRisk.get(district.id)) this.emit({ topic: "crime_resolved", severity: 1 - district.social.crimeRisk, affectedDistrict: district.id, evidence: 0.85, perceivedCulprit: "city", emotion: "relief" });
      const coverage = this.coverage(district.id); if ((this.previousCoverage.get(district.id) ?? coverage) - coverage > 0.2) this.emit({ topic: "utilities", severity: 1 - coverage, affectedDistrict: district.id, evidence: 0.9, perceivedCulprit: "city", emotion: "anger" });
      this.previousRisk.set(district.id, district.social.atRisk); this.previousCoverage.set(district.id, coverage);
    }
    const current = new Set(this.city.organizations.map(org => org.id));
    for (const org of this.city.organizations) if (!this.previousOrganizations.has(org.id)) this.emit({ topic: org.type, severity: org.influence, affectedDistrict: org.territory[0] ?? "citywide", evidence: 0.7, perceivedCulprit: "city", emotion: "fear" });
    for (const id of this.previousOrganizations) if (!current.has(id)) this.emit({ topic: "organization_dissolved", severity: 0.5, affectedDistrict: "citywide", evidence: 1, perceivedCulprit: "city", emotion: "relief" });
    this.previousOrganizations = current;
  }
  private emit(footprint: EventFootprint): void { this.footprints.push(footprint); this.active.push({ footprint, age: 0 }); }
  private applyChannels(footprint: EventFootprint, districtId: string, breakdown: OpinionBreakdown): void {
    const similar = (this.cohorts[footprint.affectedDistrict] ?? []).length;
    const socialMedia = channelDelta(footprint, "socialMedia", districtId, similar);
    const newspapers = channelDelta(footprint, "newspapers", districtId, similar);
    const wordOfMouth = channelDelta(footprint, "wordOfMouth", districtId, similar);
    breakdown.socialMedia += socialMedia; breakdown.newspapers += newspapers; breakdown.wordOfMouth += wordOfMouth;
    const delta = socialMedia + newspapers + wordOfMouth;
    const district = this.city.districts.find(item => item.id === districtId); if (district) district.approval = Math.min(1, Math.max(0, district.approval + delta));
  }
  private press(command: { topic: string; message: "acknowledge" | "deny" | "reassure" }): void {
    const state = [...this.active].reverse().find(item => item.footprint.topic === command.topic); if (!state) return;
    const footprint = state.footprint; const district = this.city.districts.find(item => item.id === footprint.affectedDistrict); if (!district) return;
    const delta = command.message === "acknowledge" ? (footprint.evidence * 0.3) : command.message === "deny" ? -footprint.evidence * 0.15 : 0.08;
    district.approval = Math.min(1, Math.max(0, district.approval + delta));
    this.breakdownHistory.push({ day: this.clock.currentDay, socialMedia: 0, newspapers: 0, wordOfMouth: 0, pressConference: delta, total: delta });
  }
  private coverage(districtId: string): number { const district = this.city.districts.find(item => item.id === districtId)!; return Math.min(district.services.water.coverage, district.services.electricity.coverage); }
}
