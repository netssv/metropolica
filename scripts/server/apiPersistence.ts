import { ciudadDividida } from '../../src/content/scenarios/ciudad_dividida.ts';
import { CITY_SIZES, type CitySize, ScenarioRunner } from '../../src/simulation/scenario/index.ts';
import { json, readBody } from './http.ts';
import type { Handler } from './types.ts';
import { GameLog } from './gameLog.ts';

export const handlePersistence: Handler = async (req, res, context) => {
  const path = req.url?.split('?')[0];
  if (path === '/api/reset' && req.method === 'POST') {
    try {
      const parsed = JSON.parse(await readBody(req) || '{}');
      const seed = parsed.seed || 1;
      const citySize = (parsed.citySize in CITY_SIZES ? parsed.citySize : 'small') as CitySize;
      context.setGame(new ScenarioRunner(ciudadDividida, 10, seed, citySize));
      context.setGameLog(new GameLog(context.gameLogDirectory, context.game, 'reset'));
      context.gameLog.event('game_reset', { seed, citySize }, context.game);
      json(res, 200, parsed.citySize ? { success: true, citySize } : { success: true });
    } catch (err: any) { json(res, 400, { error: err.message }); }
    return true;
  }
  if (path === '/api/save' && req.method === 'POST') {
    try { context.setSavedGame(context.game.serialize()); context.gameLog.event('game_saved', {}, context.game); json(res, 200, { success: true }); }
    catch (err: any) { json(res, 500, { error: err.message }); }
    return true;
  }
  if (path === '/api/save/exists' && req.method === 'GET') { json(res, 200, { exists: context.savedGame !== null }); return true; }
  if (path === '/api/load' && req.method === 'POST') {
    if (!context.savedGame) { json(res, 400, { error: 'No save found' }); return true; }
    try { const game = new ScenarioRunner(ciudadDividida); game.deserialize(context.savedGame); context.setGame(game); context.gameLog.event('game_loaded', {}, context.game); json(res, 200, { success: true }); }
    catch (err: any) { json(res, 500, { error: err.message }); }
    return true;
  }
  return false;
};
