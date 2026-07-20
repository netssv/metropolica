import { SeededRandom } from "../../core/random/index.ts";
import type { CityState } from "../models.ts";
import type { HouseholdCohort, HouseholdTickOutput } from "../households/index.ts";
import type { EventFootprint } from "../opinion/index.ts";

export type CitizenPoolProfile = {
  id: string;
  age: number;
  occupation: string;
  education: string;
  householdType: string;
  municipality: string;
  region: string;
  language: string;
  skills: number[];
  aspirations: number[];
  traits: number[];
  interests: string[];
};

export type Citizen = {
  id: string;
  districtId?: string;
  householdId: string;
  age: number;
  occupation: string;
  skills: number[];
  aspirations: number[];
  traits: number[];
  relationships: string[];
  education?: string;
  householdType?: string;
  municipality?: string;
  region?: string;
  language?: string;
  interests?: string[];
  workplaceType?: string;
  currentProblem?: string;
  level: 2 | 3;
  activeCause?: ActivationCause;
  homeTile?: { col: number; row: number };
  workTile?: { col: number; row: number };
  workShift?: { startHour: number; endHour: number };
};

export type ActivationCause = "policy" | "organization" | "footprint" | "inspection";
export type CitizenDecision = { activity: string; score: number };

export function assignCitizens(
  pool: CitizenPoolProfile[],
  districtIds: string[],
  cohorts: Record<string, HouseholdCohort[]>,
  perDistrict = 20
): Record<string, Citizen[]> {
  const assigned: Record<string, Citizen[]> = {};
  let cursor = 0;
  for (const districtId of districtIds) {
    assigned[districtId] = [];
    const districtCohorts = cohorts[districtId] ?? [];
    for (let i = 0; i < perDistrict; i++) {
      const profile = pool[cursor++ % pool.length];
      const householdId = `${districtId}-cohort-${i % Math.max(1, districtCohorts.length)}`;
      assigned[districtId].push({
        id: `${districtId}-citizen-${i + 1}`,
        districtId,
        householdId,
        age: profile.age,
        occupation: profile.occupation,
        skills: [...profile.skills],
        aspirations: [...profile.aspirations],
        traits: [...profile.traits],
        relationships: [],
        education: profile.education,
        householdType: profile.householdType,
        municipality: profile.municipality,
        region: profile.region,
        language: profile.language,
        interests: [...profile.interests],
        level: 2
      });
    }
  }
  return assigned;
}

export function scoreActivity(
  needsSatisfied: number,
  affinity: number,
  accessibility: number,
  affordability: number,
  cost: number,
  travelTime: number,
  variation: number
): number {
  return needsSatisfied + affinity + accessibility + affordability - cost - travelTime + variation;
}

export function chooseActivity(
  citizen: Citizen,
  outputs: Record<string, HouseholdTickOutput>,
  options: Array<{ activity: string; affinity: number; accessibility: number; cost: number; travelTime: number }>,
  seed: number
): CitizenDecision {
  const household = outputs[citizen.householdId];
  const needsSatisfied = household?.needsSatisfied ?? 0.5;
  const random = new SeededRandom(seed + citizen.id.length);
  
  // Variation is parameterized by citizen's risk tolerance trait (traits[0])
  const riskTolerance = citizen.traits[0] ?? 0.5;
  const variation = random.centered(riskTolerance * 0.15);

  return options
    .map(option => {
      // Price sensitivity (traits[2]) scales the cost penalty
      const priceSensitivity = citizen.traits[2] ?? 0.5;
      const effectiveCost = option.cost * (1 + priceSensitivity * 0.5);
      
      // Affordability: 1 - Math.min(1, effectiveCost)
      const affordability = Math.max(0, 1 - effectiveCost);

      // Sociability (traits[1]) or recreation preference (traits[4]) can adjust affinity for social/recreation activities
      let modifiedAffinity = option.affinity;
      if (option.activity === "recreación") {
        const sociability = citizen.traits[1] ?? 0.5;
        const recPreference = citizen.traits[4] ?? 0.5;
        modifiedAffinity += (sociability * 0.1 + recPreference * 0.1);
      }

      const score = scoreActivity(
        needsSatisfied,
        modifiedAffinity,
        option.accessibility,
        affordability,
        option.cost,
        option.travelTime,
        variation
      );
      return { activity: option.activity, score };
    })
    .sort((a, b) => b.score - a.score)[0] ?? { activity: "descanso", score: 0 };
}

export function activateCitizen(citizen: Citizen, cause: ActivationCause, problem?: string): Citizen {
  return { ...citizen, level: 3, activeCause: cause, currentProblem: problem };
}

export function deactivateCitizen(citizen: Citizen): Citizen {
  return { ...citizen, level: 2, activeCause: undefined, currentProblem: undefined };
}

function workplaceFor(citizen: Pick<Citizen, "occupation" | "interests">): { zone: string; label: string } {
  const text = `${citizen.occupation} ${(citizen.interests ?? []).join(" ")}`.toLowerCase();
  if (/gobierno|gubern|alcald|oficial|funcionario|estado|públic|public/.test(text)) return { zone: "bldg-c", label: "gobierno" };
  if (/granja|agricul|ganad|pesca|campo|farm/.test(text)) return { zone: "bldg-i", label: "granja" };
  if (/mall|centro comercial|tienda|compras|retail|ventas|viajes|turismo|restaurante/.test(text)) return { zone: "bldg-c", label: "comercio / mall" };
  if (/carne|fabric|manufact|industrial|constru|minería|energía/.test(text)) return { zone: "bldg-i", label: "industria" };
  return { zone: "bldg-c", label: "comercio" };
}

/** Assign real map locations only to the existing individually active subset. */
export function assignCommuteLocations(
  assigned: Record<string, Citizen[]>,
  districts: CityState["districts"]
): Record<string, Citizen[]> {
  return Object.fromEntries(Object.entries(assigned).map(([districtId, citizens]) => {
    const tiles = districts.find(d => d.id === districtId)?.tiles ?? [];
    const homes = tiles.filter(t => t.type === "bldg-r" || t.type === "zone-r");
    const commercialWorks = tiles.filter(t => t.type === "bldg-c" || t.type === "zone-c");
    const industrialWorks = tiles.filter(t => t.type === "bldg-i" || t.type === "zone-i");
    const fallbackHomes = tiles.filter(t => t.type === "grass");
    const fallbackWorks = tiles.filter(t => t.type === "bldg-c" || t.type === "bldg-i" || t.type === "grass");
    let homeIndex = 0;
    let workIndex = 0;
    return [districtId, citizens.map(citizen => {
      if (citizen.level !== 3) return citizen;
      const workplace = workplaceFor(citizen);
      if (citizen.homeTile && citizen.workTile && citizen.workShift && citizen.workplaceType === workplace.label) return citizen;
      if (citizen.homeTile && citizen.workTile) return { ...citizen, workShift: { startHour: 8, endHour: 16 }, workplaceType: workplace.label };
      const home = homes[homeIndex++ % Math.max(1, homes.length)] ?? fallbackHomes[homeIndex++ % Math.max(1, fallbackHomes.length)];
      const preferredWorks = workplace.zone === "bldg-i" ? industrialWorks : commercialWorks;
      const alternateWorks = workplace.zone === "bldg-i" ? commercialWorks : industrialWorks;
      const work = preferredWorks[workIndex++ % Math.max(1, preferredWorks.length)] ?? alternateWorks[workIndex++ % Math.max(1, alternateWorks.length)] ?? fallbackWorks[workIndex++ % Math.max(1, fallbackWorks.length)];
      return home && work ? {
        ...citizen,
        homeTile: { col: home.col, row: home.row },
        workTile: { col: work.col, row: work.row },
        workShift: { startHour: 8, endHour: 16 },
        workplaceType: workplace.label
      } : citizen;
    })];
  }));
}

export function syncCitizenActivation(
  assigned: Record<string, Citizen[]>,
  city: CityState,
  activeFootprints: EventFootprint[] = [],
  inspectedIds: Set<string> = new Set()
): Record<string, Citizen[]> {
  const activeOrgDistricts = new Set(city.organizations.flatMap(org => org.territory));
  const activeFootprintDistricts = new Set(activeFootprints.map(fp => fp.affectedDistrict));

  return Object.fromEntries(
    Object.entries(assigned).map(([districtId, citizens]) => [
      districtId,
      citizens.map((citizen, index) => {
        // 1. Explicitly inspected by the test harness
        if (inspectedIds.has(citizen.id)) {
          return activateCitizen(citizen, "inspection", citizen.currentProblem ?? "bajo inspección");
        }

        // 2. Organization cause: index 0 in district with active organization (recruit/target)
        if (activeOrgDistricts.has(districtId) && index === 0) {
          const org = city.organizations.find(o => o.territory.includes(districtId));
          const orgLabel = org ? (org.type === "gang" ? "pandilla" : "red de contratistas") : "organización";
          return activateCitizen(citizen, "organization", `presión/contacto de ${orgLabel} activa`);
        }

        // 3. Footprint cause: index 1 in district with active footprint (event protagonist/witness)
        if (activeFootprintDistricts.has(districtId) && index === 1) {
          const fp = activeFootprints.find(f => f.affectedDistrict === districtId);
          const topicLabel = fp ? fp.topic : "evento";
          return activateCitizen(citizen, "footprint", `afectado por ${topicLabel}`);
        }

        // Deactivation: if the citizen is currently level 3, but the cause is no longer present
        if (citizen.level === 3) {
          if (citizen.activeCause === "inspection" && !inspectedIds.has(citizen.id)) {
            return deactivateCitizen(citizen);
          }
          if (citizen.activeCause === "organization" && !activeOrgDistricts.has(districtId)) {
            return deactivateCitizen(citizen);
          }
          if (citizen.activeCause === "footprint" && !activeFootprintDistricts.has(districtId)) {
            return deactivateCitizen(citizen);
          }
        }

        return citizen;
      })
    ])
  );
}

export function activeCitizenCount(assigned: Record<string, Citizen[]>): number {
  return Object.values(assigned).reduce((total, citizens) => total + citizens.filter(citizen => citizen.level === 3).length, 0);
}
