export interface UtilityState { capacity: number; demand: number; coverage: number; maintenance: number; }
export interface DistrictServices { water: UtilityState; electricity: UtilityState; waste: number; safety: number; internet: number; gasolina: UtilityState; supermercado: UtilityState; hospitales: UtilityState; bomberos: UtilityState; ocio: UtilityState; telefonía: UtilityState; }
export interface DistrictEconomy { employment: number; averageIncome: number; costOfLiving: number; commercialRevenue: number; industrialRevenue: number; }
export interface DistrictSocial { inequality: number; trust: number; institutionalTrust: number; unrest: number; crimeRisk: number; atRisk: boolean; }
export type TileSpecialty = "hospital" | "mall-government" | "bank" | "fish-market" | "pier" | "customs" | "water-treatment";
export interface TileState { col: number; row: number; type: string; level: number; age: number; specialty?: TileSpecialty; }
export interface District { id: string; population: number; approval: number; services: DistrictServices; economy: DistrictEconomy; social: DistrictSocial; tiles: TileState[]; }
export type OrganizationType = "gang" | "cartel" | "contractor_network";
export interface Organization { id: string; type: OrganizationType; territory: string[]; income: number; influence: number; violence: number; recruitment: number; institutionalPenetration: number; publicSupport: number; lowRiskTicks: number; }
export interface CityState { treasury: number; debt: number; approval: number; taxRate: number; auditLevel: number; corruptionRisk: number; districts: District[]; organizations: Organization[]; }
