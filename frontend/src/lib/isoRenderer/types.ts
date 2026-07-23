import type { TileSpecialty } from '../../../../src/simulation/models';
import type { HousingProfile } from '../buildingSprites';

export type TileMap = Array<Array<{ type?: string } | undefined>>;

export type Projection = (col: number, row: number) => { x: number; y: number };

import type { HouseRole } from '../buildings/houseCluster.ts';

export interface IsoTileData {
  type: string;
  specialty?: TileSpecialty;
  inCrisis?: boolean;
  isNight?: boolean;
  growthTier?: 0 | 1 | 2;
  businessAccentTiles?: any[];
  housing?: HousingProfile;
  parkSize?: number;  // pre-computed park cluster size from server
  houseRole?: HouseRole;
}
