import type { HouseRole } from './houseCluster.ts';

export type DrawArgs = {
  ctx: CanvasRenderingContext2D;
  px: number;
  py: number;
  zoom: number;
  seed?: number;
  night?: boolean;
  time?: number;
  parkSize?: number;   // number of connected PARK tiles in this cluster
  houseRole?: HouseRole; // cluster role for residential tiles
  /** Raw grid position — needed for multi-tile renders */
  tileCol?: number;
  tileRow?: number;
  /** project fn for multi-tile builds */
  project?: (col: number, row: number) => { x: number; y: number };
  /** Camera quarter-turn, when available, for orientation-sensitive details. */
  rotation?: number;
};

export type HousingProfile = {
  income: number;
  householdSize: number;
};

export type Tier = 0 | 1 | 2;

export type BuildingSpecialty =
  | 'hospital'
  | 'mall-government'
  | 'bank'
  | 'fish-market'
  | 'pier'
  | 'customs'
  | 'water-treatment';
