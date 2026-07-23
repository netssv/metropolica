import { activeCitizenCount } from '../../src/simulation/citizens/index.ts';
import { citizenViewState } from '../../src/simulation/citizens/view.ts';
import { CITY_SIZES } from '../../src/simulation/scenario/index.ts';
import { json } from './http.ts';
import type { Handler } from './types.ts';
import { censusCity } from '../../src/simulation/tileCensus.ts';
import { listGameLogs } from './gameLog.ts';

export const handleState: Handler = (req, res, context) => {
  const { game } = context;
  if (req.method !== 'GET') return false;
  if (req.url?.split('?')[0] === '/api/state') {
    const totalCitizens = Object.values(game.citizens).reduce((sum, list) => sum + list.length, 0);
    const census = censusCity(game.city.districts, game.citizens);
    json(res, 200, {
      day: game.clock.currentDay, hour: game.clock.currentHour, minute: game.clock.currentMinute,
      speed: game.clock.currentSpeed, treasury: game.city.treasury,
      weeklyIncome: game.economySnapshot.taxesCollected, approval: game.city.approval,
      taxRate: game.city.taxRate, auditLevel: game.city.auditLevel,
      corruptionRisk: game.city.corruptionRisk, result: game.result,
      organizations: game.city.organizations,
      footprintLog: [...game.opinion.footprints].reverse().slice(0, 30),
      opinionBreakdown: [...game.opinion.breakdownHistory].reverse().slice(0, 10),
      districts: game.city.districts.map(d => ({ id: d.id, population: d.population, approval: d.approval, services: d.services, economy: d.economy, social: d.social, cohorts: game.cohorts[d.id] ?? [], census: census.districts.find(item => item.id === d.id)?.census })),
      totalCitizens, activeCitizens: activeCitizenCount(game.citizens),
      citizens: citizenViewState(game.citizens, game.clock.currentDay), census,
      citySize: game.citySize, cityDimensions: CITY_SIZES[game.citySize],
    });
    return true;
  }
  if (req.url?.split('?')[0] === '/api/game-logs') { json(res, 200, { max: 5, logs: listGameLogs(context.gameLogDirectory) }); return true; }
  if (req.url?.split('?')[0] === '/api/citizens') { json(res, 200, game.citizens); return true; }
  if (req.url?.split('?')[0] === '/api/tilemap') {
    const tiles: any[] = [];
    game.city.districts.forEach(d => (d.tiles ?? []).forEach((t: any) => tiles.push({ row: t.row, col: t.col, type: t.type, owner: d.id, level: t.level ?? 0, specialty: t.specialty })));

    // Pre-compute parkSize (BFS cluster count) for each park tile server-side.
    // This is more reliable than client-side BFS since the server has the full map.
    const tileIndex = new Map<string, string>();
    tiles.forEach(t => tileIndex.set(`${t.col}:${t.row}`, t.type));

    const parkSizeCache = new Map<string, number>();
    const computeParkSize = (startCol: number, startRow: number): number => {
      const key = `${startCol}:${startRow}`;
      if (parkSizeCache.has(key)) return parkSizeCache.get(key)!;
      const visited = new Set<string>();
      const queue: [number, number][] = [[startCol, startRow]];
      while (queue.length) {
        const [c, r] = queue.shift()!;
        const k = `${c}:${r}`;
        if (visited.has(k)) continue;
        visited.add(k);
        for (const [dc, dr] of [[-1,0],[1,0],[0,-1],[0,1]] as const) {
          const nk = `${c+dc}:${r+dr}`;
          if (!visited.has(nk) && tileIndex.get(nk) === 'park') queue.push([c+dc, r+dr]);
        }
      }
      visited.forEach(k => parkSizeCache.set(k, visited.size));
      return visited.size;
    };

    tiles.forEach(t => { if (t.type === 'park') t.parkSize = computeParkSize(t.col, t.row); });
    json(res, 200, { tiles });
    return true;
  }
  return false;
};
