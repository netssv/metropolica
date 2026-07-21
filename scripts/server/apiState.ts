import { activeCitizenCount } from '../../src/simulation/citizens/index.ts';
import { citizenViewState } from '../../src/simulation/citizens/view.ts';
import { CITY_SIZES } from '../../src/simulation/scenario/index.ts';
import { json } from './http.ts';
import type { Handler } from './types.ts';

export const handleState: Handler = (req, res, { game }) => {
  if (req.method !== 'GET') return false;
  if (req.url?.split('?')[0] === '/api/state') {
    const totalCitizens = Object.values(game.citizens).reduce((sum, list) => sum + list.length, 0);
    json(res, 200, {
      day: game.clock.currentDay, hour: game.clock.currentHour, minute: game.clock.currentMinute,
      speed: game.clock.currentSpeed, treasury: game.city.treasury,
      weeklyIncome: game.economySnapshot.taxesCollected, approval: game.city.approval,
      taxRate: game.city.taxRate, auditLevel: game.city.auditLevel,
      corruptionRisk: game.city.corruptionRisk, result: game.result,
      organizations: game.city.organizations,
      footprintLog: [...game.opinion.footprints].reverse().slice(0, 30),
      opinionBreakdown: [...game.opinion.breakdownHistory].reverse().slice(0, 10),
      districts: game.city.districts.map(d => ({ id: d.id, population: d.population, approval: d.approval, services: d.services, economy: d.economy, social: d.social, cohorts: game.cohorts[d.id] ?? [] })),
      totalCitizens, activeCitizens: activeCitizenCount(game.citizens),
      citizens: citizenViewState(game.citizens, game.clock.currentDay),
      citySize: game.citySize, cityDimensions: CITY_SIZES[game.citySize],
    });
    return true;
  }
  if (req.url?.split('?')[0] === '/api/citizens') { json(res, 200, game.citizens); return true; }
  if (req.url?.split('?')[0] === '/api/tilemap') {
    const tiles: any[] = [];
    game.city.districts.forEach(d => (d.tiles ?? []).forEach((t: any) => tiles.push({ row: t.row, col: t.col, type: t.type, owner: d.id, level: t.level ?? 0, specialty: t.specialty })));
    json(res, 200, { tiles });
    return true;
  }
  return false;
};
