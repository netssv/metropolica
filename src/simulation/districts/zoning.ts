import type { CommandDispatcher, PlaceZoneCommand, DemolishTileCommand } from "../../core/commands/index.ts";
import type { CityState } from "../models.ts";

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

const TILE_COSTS: Record<string, number> = {
  "zone-r": 100, "zone-c": 150, "zone-i": 200,
  road: 50, park: 75, power: 500,
};
const DEMOLISH_COST = 25;

export class ZoningLoop {
  private readonly city: CityState;

  constructor(city: CityState, dispatcher: CommandDispatcher) {
    this.city = city;
    dispatcher.register("PLACE_ZONE",   cmd => this.placeZone(cmd as PlaceZoneCommand));
    dispatcher.register("DEMOLISH_TILE", cmd => this.demolishTile(cmd as DemolishTileCommand));
  }

  private placeZone(cmd: PlaceZoneCommand): void {
    const expectedCost = TILE_COSTS[cmd.zoneType] ?? 0;
    // Authoritative treasury validation — use server-known cost, ignore client-provided value.
    if (this.city.treasury < expectedCost) return;
    this.city.treasury -= expectedCost;

    const district = this.city.districts.find(d => d.id === cmd.district);
    if (!district) return;

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

    let tile = district.tiles.find(t => t.col === cmd.col && t.row === cmd.row);
    if (tile) {
      tile.type = cmd.zoneType;
      tile.level = 0;
    } else {
      district.tiles.push({ col: cmd.col, row: cmd.row, type: cmd.zoneType, level: 0, age: 0 });
    }
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
  }
}
