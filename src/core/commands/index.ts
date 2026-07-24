export interface PlayerCommand { readonly type: string; }
export type ChangeTaxRateCommand = { readonly type: "CHANGE_TAX_RATE"; readonly value: number; };
export type CitizenConsumptionCommand = { readonly type: "CITIZEN_CONSUMPTION"; readonly cohortId: string; readonly districtId: string; readonly activity: "shop" | "refuel"; readonly day: number; };
export type SocialRiskCommand = { readonly type: "SET_AUDIT_LEVEL"; readonly value: number; } | { readonly type: "INVEST_SOCIAL_PROGRAM"; readonly district: string; readonly amount: number; };
export type PressConferenceCommand = { readonly type: "HOLD_PRESS_CONFERENCE"; readonly topic: string; readonly message: "acknowledge" | "deny" | "reassure"; };

/**
 * PLACE_ZONE — player places a tile on the map.
 * zoneType matches the frontend T.* tile type strings.
 * district is the owning simulation district id.
 * cost is the treasury deduction amount validated on the server.
 */
export type PlaceZoneCommand = {
  readonly type: "PLACE_ZONE";
  readonly zoneType: "zone-r" | "zone-c" | "zone-i" | "road" | "park" | "power";
  readonly district: string;
  readonly cost: number;
  readonly col: number;
  readonly row: number;
  readonly specialty?: "hospital" | "mall-government" | "bank";
};

/**
 * DEMOLISH_TILE — player removes a tile, paying the demolish cost.
 */
export type DemolishTileCommand = {
  readonly type: "DEMOLISH_TILE";
  readonly district: string;
  readonly cost: number;
  readonly col: number;
  readonly row: number;
};

export type CommandHandler<C extends PlayerCommand> = (command: C) => void;

export class CommandDispatcher {
  private readonly handlers = new Map<string, CommandHandler<PlayerCommand>>();
  register<C extends PlayerCommand>(type: C["type"], handler: CommandHandler<C>): void {
    if (this.handlers.has(type)) throw new Error(`Command handler already registered: ${type}`);
    this.handlers.set(type, handler as CommandHandler<PlayerCommand>);
  }
  dispatch(command: PlayerCommand): void {
    const handler = this.handlers.get(command.type);
    if (!handler) throw new Error(`Unknown player command: ${command.type}`);
    handler(command);
  }
}

export type SmokeTestCommand = { readonly type: "NO_OP" };
