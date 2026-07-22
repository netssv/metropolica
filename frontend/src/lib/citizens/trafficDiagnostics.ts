export type TrafficDiagnosticRecord = {
  frame: number; vehicleId: string; segmentId: string; direction: string;
  routeProgress: number; localProgress: number; laneOffset: { x: number; y: number };
  computedScreenPosition: { x: number; y: number }; renderedScreenPosition: { x: number; y: number };
  speed: number; targetSpeed: number; maxSpeed: number; distanceAhead: number | null;
  signal: string; state: string; deltaSeconds: number; simulationSpeed: number;
};

type TrafficDebugState = { enabled?: boolean; every?: number; max?: number; records?: TrafficDiagnosticRecord[]; dump?: () => TrafficDiagnosticRecord[] };
const state = (): TrafficDebugState | undefined => (globalThis as any).__METROPOLICA_TRAFFIC_DEBUG__;
let frame = 0;
export function recordTrafficDiagnostic(record: Omit<TrafficDiagnosticRecord, 'frame'>) {
  const config = state(); if (!config?.enabled) return;
  frame += 1; const every = Math.max(1, config.every ?? 5); if (frame % every) return;
  config.records ??= []; config.records.push({ frame, ...record });
  const max = config.max ?? 10000; if (config.records.length > max) config.records.splice(0, config.records.length - max);
  if (config.dump === undefined) config.dump = () => [...(config.records ?? [])];
}
export function resetTrafficDiagnosticFrame() { frame = 0; }
