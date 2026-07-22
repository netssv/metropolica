import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ScenarioRunner } from '../src/simulation/scenario/index.ts';
import { ciudadDividida } from '../src/content/scenarios/ciudad_dividida.ts';
import { setCors, isOptions } from './server/http.ts';
import { handleState } from './server/apiState.ts';
import { handleCommands } from './server/apiCommands.ts';
import { handlePersistence } from './server/apiPersistence.ts';
import { handleStaticFiles } from './server/staticFiles.ts';
import type { ServerContext } from './server/types.ts';
import { GameLog } from './server/gameLog.ts';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
let game = new ScenarioRunner(ciudadDividida);
let savedGame: string | null = null;
const gameLogDirectory = join(rootDir, '.metropolica', 'logs', 'games');
let gameLog = new GameLog(gameLogDirectory, game, 'server_start');
const context: ServerContext = { get game() { return game; }, get savedGame() { return savedGame; }, rootDir, gameLogDirectory, get gameLog() { return gameLog; }, setGame: value => { game = value; }, setSavedGame: value => { savedGame = value; }, setGameLog: value => { gameLog = value; } };

async function handleRequest(req: any, res: any) {
  setCors(res);
  if (isOptions(req, res)) return;
  if (await handleState(req, res, context)) return;
  if (await handleCommands(req, res, context)) return;
  if (await handlePersistence(req, res, context)) return;
  await handleStaticFiles(req, res, context);
}

const server = createServer(handleRequest);
const PORT = Number(process.env.METROPOLICA_BACKEND_PORT ?? 3000);
setInterval(() => { game.advance(game.clock.currentSpeed / 1440); gameLog.snapshot(game); }, 2500);
server.listen(PORT, () => console.log(`Metropolica Server running at http://localhost:${PORT}`));
