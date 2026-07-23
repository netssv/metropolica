import type { CommandDispatcher, PlaceZoneCommand, DemolishTileCommand } from "../../core/commands/index.ts";
import type { CityState } from "../models.ts";
import type { TileState } from "../models.ts";
import { DEVELOPMENT_ECONOMY, constructionCost } from "../../../shared/economyBalance.ts";

/**
 * Sprint 11 — Zone placement effects on simulation state (first pass, flagged for review).
 *
 * zone-r  → +housing capacity proxy: raises district population slightly (+8 per tile).
 *           Reuses district.population as the housing demand signal already read by EconomyLoop.
 * zone-c  → +employment proxy: nudges district.economy.employment up (+0.5 pp, capped at 0.98).
 *           Rationale: commercial activity creates jobs; same field read by crime formula.
 * zone-i  → +income proxy: nudges district.economy.averageIncome up (+50 per tile).
 *           Rationale: industrial zones raise average district wage; read by household tick.
 * road    → no direct simulation field; infrastructure benefit tracked only on the tile map.
 * park    → nudges district.social.trust up (+0.01, capped at 1.0).
 *           Rationale: green space is a proxy for social cohesion.
 * power   → adds +500 electricity capacity to district utility.
 *           Reuses the same UtilityState.capacity field used by UtilitiesLoop.
 * demolish→ reverses a fraction of zone-r population proxy (−4 per tile demolished).
 */

const DEMOLISH_COST = DEVELOPMENT_ECONOMY.construction.demolish;
const ZONE_TYPES = new Set(["zone-r", "zone-c", "zone-i"]);
export const PROXIMITY_RADIUS = 3;
export const PROXIMITY_EFFECTS: Record<number, number> = { 1: 0.02, 2: 0.01, 3: 0.005 };

export function calculateProximityModifier(tiles: TileState[]): number {
  const homes = tiles.filter(tile => tile.type === "zone-r");
  if (!homes.length) return 0;
  const commercial = tiles.filter(tile => tile.type === "zone-c" || tile.type === "bldg-c");
  const industrial = tiles.filter(tile => tile.type === "zone-i" || tile.type === "bldg-i");
  const nearest = (home: TileState, candidates: TileState[]) => candidates.reduce((best, tile) => Math.min(best,
    Math.abs(home.col - tile.col) + Math.abs(home.row - tile.row)), Infinity);
  const total = homes.reduce((sum, home) => {
    const effect = (distance: number) => distance <= PROXIMITY_RADIUS ? PROXIMITY_EFFECTS[distance] ?? 0 : 0;
    return sum + effect(nearest(home, commercial)) - effect(nearest(home, industrial));
  }, 0);
  return total / homes.length;
}

export class ZoningLoop {
  private readonly city: CityState;
  private readonly proximityCache = new Map<string, number>();

  constructor(city: CityState, dispatcher: CommandDispatcher) {
    this.city = city;
    dispatcher.register("PLACE_ZONE",   cmd => this.placeZone(cmd as PlaceZoneCommand));
    dispatcher.register("DEMOLISH_TILE", cmd => this.demolishTile(cmd as DemolishTileCommand));
  }

  getProximityModifier(districtId: string): number {
    if (!this.proximityCache.has(districtId)) this.recomputeProximity(districtId);
    return this.proximityCache.get(districtId) ?? 0;
  }

  private recomputeProximity(districtId: string): void {
    const district = this.city.districts.find(item => item.id === districtId);
    if (district) this.proximityCache.set(districtId, calculateProximityModifier(district.tiles));
  }

  private placeZone(cmd: PlaceZoneCommand): void {
    const expectedCost = constructionCost(cmd.zoneType, cmd.specialty);
    // Authoritative treasury validation — use server-known cost, ignore client-provided value.
    if (this.city.treasury < expectedCost) return;

    const district = this.city.districts.find(d => d.id === cmd.district);
    if (!district) return;
    const existingTile = district.tiles.find(t => t.col === cmd.col && t.row === cmd.row);
    // Zoning may only replace an empty buildable plot. Buildings, roads,
    // water, terrain, parks and infrastructure are not valid house plots.
    if (ZONE_TYPES.has(cmd.zoneType) && (!existingTile || existingTile.type !== "grass")) return;
    this.city.treasury -= expectedCost;

    switch (cmd.zoneType) {
      case "zone-r":
        // +housing capacity: raise population demand signal by 8 households
        district.population = Math.round(district.population + 8);
        break;
      case "zone-c":
        // +employment: nudge employment rate up, max 0.98
        district.economy.employment = Math.min(0.98, district.economy.employment + 0.005);
        break;
      case "zone-i":
        // +income: nudge average income up
        district.economy.averageIncome = district.economy.averageIncome + 50;
        break;
      case "power":
        // +electricity capacity: reuse UtilityState.capacity (same field UtilitiesLoop reads)
        district.services.electricity.capacity += 500;
        break;
      case "park":
        // +social trust: proxy for cohesion / green space
        district.social.trust = Math.min(1.0, district.social.trust + 0.01);
        break;
      // road: no direct simulation field impact this sprint
    }

    let tile = existingTile;
    if (tile) {
      tile.type = cmd.zoneType;
      tile.level = 0;
      tile.specialty = cmd.specialty;
    } else {
    district.tiles.push({ col: cmd.col, row: cmd.row, type: cmd.zoneType, level: 0, age: 0, specialty: cmd.specialty });
    }
    this.recomputeProximity(district.id);
  }

  private demolishTile(cmd: DemolishTileCommand): void {
    if (this.city.treasury < DEMOLISH_COST) return;
    this.city.treasury -= DEMOLISH_COST;

    const district = this.city.districts.find(d => d.id === cmd.district);
    if (!district) return;
    // Partial reversal of zone-r population proxy
    district.population = Math.max(0, Math.round(district.population - 4));
    
    let tile = district.tiles.find(t => t.col === cmd.col && t.row === cmd.row);
    if (tile) {
      tile.type = "grass";
      tile.level = 0;
    }
    this.recomputeProximity(district.id);
  }
}
