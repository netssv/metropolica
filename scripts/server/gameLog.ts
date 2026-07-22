import { mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ScenarioRunner } from '../../src/simulation/scenario/index.ts';

export const MAX_GAME_LOGS = 5;
function snapshot(game: ScenarioRunner) {
  return { time: { day: game.clock.currentDay, hour: game.clock.currentHour, minute: game.clock.currentMinute, speed: game.clock.currentSpeed }, city: { size: game.citySize, result: game.result }, citizens: Object.fromEntries(Object.entries(game.citizens).map(([district, list]) => [district, list.map(c => ({ id: c.id, householdId: c.householdId, level: c.level, homeTile: c.homeTile, workTile: c.workTile, commercialTile: c.commercialTile, refuelTile: c.refuelTile, routine: c.routine, workShift: c.workShift, workplaceType: c.workplaceType, activeCause: c.activeCause }))])), districts: game.city.districts.map(d => ({ id: d.id, population: d.population, residentialTiles: (d.tiles ?? []).filter(t => t.type === 'bldg-r' || t.type === 'zone-r').map(t => ({ col: t.col, row: t.row, type: t.type, level: t.level })) })) };
}
export class GameLog {
  readonly sessionId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${Math.random().toString(36).slice(2, 8)}`;
  readonly path: string;
  private readonly events: Array<Record<string, unknown>> = [];
  private readonly directory: string;
  constructor(directory: string, game: ScenarioRunner, reason: string) { this.directory = directory; mkdirSync(directory, { recursive: true }); this.path = join(directory, `game-${this.sessionId}.json`); this.event('game_started', { reason }, game); this.rotate(); }
  event(type: string, data: Record<string, unknown> = {}, game?: ScenarioRunner) { this.events.push({ sequence: this.events.length, timestamp: new Date().toISOString(), type, ...data, ...(game ? { snapshot: snapshot(game) } : {}) }); writeFileSync(this.path, JSON.stringify({ version: 1, sessionId: this.sessionId, events: this.events }, null, 2)); }
  snapshot(game: ScenarioRunner, reason = 'periodic') { this.event('snapshot', { reason }, game); }
  private rotate() { const files = readdirSync(this.directory).filter(f => /^game-.*\.json$/.test(f)).sort().reverse(); for (const file of files.slice(MAX_GAME_LOGS)) unlinkSync(join(this.directory, file)); }
}
export function listGameLogs(directory: string) { mkdirSync(directory, { recursive: true }); return readdirSync(directory).filter(f => /^game-.*\.json$/.test(f)).sort().reverse().slice(0, MAX_GAME_LOGS).map(file => { const data = JSON.parse(readFileSync(join(directory, file), 'utf8')); return { file, sessionId: data.sessionId, events: data.events?.length ?? 0, startedAt: data.events?.[0]?.timestamp }; }); }
