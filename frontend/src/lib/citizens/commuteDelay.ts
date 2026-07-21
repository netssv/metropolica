export type CommuteDelayState = 'inactive' | 'normal' | 'delayed';
type Point = { col: number; row: number };

export function commuteDelayState(level: number, home: Point | undefined, work: Point | undefined, routeLength?: number): CommuteDelayState {
  if (level !== 3 || !home || !work || routeLength === undefined) return level === 3 ? 'normal' : 'inactive';
  const manhattan = Math.abs(home.col - work.col) + Math.abs(home.row - work.row);
  return routeLength > Math.max(12, manhattan * 2.5) ? 'delayed' : 'normal';
}
