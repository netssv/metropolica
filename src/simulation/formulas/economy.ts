/** Shared economic formulas. Keep these independent of district and household storage. */
export function monthlyToWeekly(value: number): number { return value / 4.345; }
export function weightedAverage(values: Array<{ value: number; weight: number }>): number {
  const weight = values.reduce((sum, item) => sum + item.weight, 0);
  return weight === 0 ? 0 : values.reduce((sum, item) => sum + item.value * item.weight, 0) / weight;
}
export function clampRate(value: number): number { return Math.min(1, Math.max(0, value)); }
export function clamp(value: number): number { return Math.min(1, Math.max(0, value)); }
