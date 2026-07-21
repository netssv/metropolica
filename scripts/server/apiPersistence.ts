import { ciudadDividida } from '../../src/content/scenarios/ciudad_dividida.ts';
import { CITY_SIZES, type CitySize, ScenarioRunner } from '../../src/simulation/scenario/index.ts';
import { json, readBody } from './http.ts';
import type { Handler } from './types.ts';

export const handlePersistence: Handler = async (req, res, context) => {
  const path = req.url?.split('?')[0];
  if (path === '/api/reset' && req.method === 'POST') {
    try {
      const parsed = JSON.parse(await readBody(req) || '{}');
      const seed = parsed.seed || 1;
      const citySize = (parsed.citySize in CITY_SIZES ? parsed.citySize : 'big') as CitySize;
      context.setGame(new ScenarioRunner(ciudadDividida, 10, seed, citySize));
      json(res, 200, parsed.citySize ? { success: true, citySize } : { success: true });
    } catch (err: any) { json(res, 400, { error: err.message }); }
    return true;
  }
  if (path === '/api/save' && req.method === 'POST') {
    try { context.setSavedGame(context.game.serialize()); json(res, 200, { success: true }); }
    catch (err: any) { json(res, 500, { error: err.message }); }
    return true;
  }
  if (path === '/api/save/exists' && req.method === 'GET') { json(res, 200, { exists: context.savedGame !== null }); return true; }
  if (path === '/api/load' && req.method === 'POST') {
    if (!context.savedGame) { json(res, 400, { error: 'No save found' }); return true; }
    try { const game = new ScenarioRunner(ciudadDividida); game.deserialize(context.savedGame); context.setGame(game); json(res, 200, { success: true }); }
    catch (err: any) { json(res, 500, { error: err.message }); }
    return true;
  }
  return false;
};
