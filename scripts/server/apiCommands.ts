import { citizenViewState } from '../../src/simulation/citizens/view.ts';
import { json, readBody } from './http.ts';
import type { Handler } from './types.ts';

export const handleCommands: Handler = async (req, res, context) => {
  const path = req.url?.split('?')[0];
  if (req.method !== 'POST' || !['/api/advance', '/api/advance-hours', '/api/speed', '/api/command', '/api/inspect'].includes(path ?? '')) return false;
  try {
    const body = JSON.parse(await readBody(req) || '{}');
    if (path === '/api/advance') { context.game.advance(body.days || 1); context.gameLog.event('advance', { days: body.days || 1 }, context.game); json(res, 200, { success: true, day: context.game.clock.currentDay }); return true; }
    if (path === '/api/advance-hours') { const hours = Math.max(0, Number(body.hours) || 0); context.game.advance(hours / 24); context.gameLog.event('advance_hours', { hours }, context.game); json(res, 200, { success: true, day: context.game.clock.currentDay, hour: context.game.clock.currentHour }); return true; }
    if (path === '/api/speed') { context.game.clock.setSpeed(body.speed); context.gameLog.event('speed_changed', { speed: body.speed }, context.game); json(res, 200, { success: true, speed: context.game.clock.currentSpeed }); return true; }
    if (path === '/api/command') {
      if (['SET_AUDIT_LEVEL', 'CHANGE_TAX_RATE'].includes(body.type)) body.value = parseFloat(body.value);
      if (['INVEST_UTILITY', 'INVEST_SOCIAL_PROGRAM'].includes(body.type)) body.amount = parseFloat(body.amount);
      context.game.dispatcher.dispatch(body); json(res, 200, { success: true }); return true;
    }
    const citizenId = body.citizenId;
    if (context.game.inspectedCitizens.has(citizenId)) context.game.inspectedCitizens.delete(citizenId);
    else context.game.inspectedCitizens.add(citizenId);
    context.game.syncCitizenActivationNow();
    context.gameLog.event('citizen_inspected', { citizenId }, context.game);
    const citizen = Object.values(context.game.citizens).flat().find((item: any) => item.id === citizenId);
    console.log(`[inspect] ${citizenId} -> ${citizen ? `level ${citizen.level} (${citizen.activeCause ?? 'inactive'}), home=(${citizen.homeTile?.col},${citizen.homeTile?.row}), work=(${citizen.workTile?.col},${citizen.workTile?.row})` : 'not found'}`);
    const inspected = citizen?.level === 3 ? { ...citizen, routine: citizenViewState({ district: [citizen] }, context.game.clock.currentDay).district[0].routine } : citizen;
    json(res, 200, { success: true, inspected: Array.from(context.game.inspectedCitizens), citizen: inspected });
    return true;
  } catch (err: any) { json(res, 400, { error: err.message }); return true; }
};
