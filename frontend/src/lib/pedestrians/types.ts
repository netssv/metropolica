export type Point = { col: number; row: number };
export type MapTile = { type?: string } | null;
export type Citizen = { id: string; level?: number; homeTile?: Point; workTile?: Point };
export type PedTrip = {
  route: Point[];
  progress: number;
  target: Point;
  destination: Point;
  phase: number;
};
export type ScreenPoint = { x: number; y: number };
