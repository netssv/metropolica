export type Point = { col: number; row: number };

export type VehicleState =
  | 'idle'
  | 'queued'
  | 'driving'
  | 'approaching_intersection'
  | 'waiting_for_signal'
  | 'waiting_for_pedestrian'
  | 'waiting_for_space'
  | 'crossing_intersection'
  | 'arrived'
  | 'boarding'
  | 'unboarding';

export type VehicleWaitReason = 'signal' | 'pedestrian' | 'space' | 'yield' | undefined;

export type PedestrianCrossingPresence = {
  intersectionId: string;
  progress: number;
  direction: 'entering' | 'crossing' | 'leaving';
};
