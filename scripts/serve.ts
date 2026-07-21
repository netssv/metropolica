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

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
let game = new ScenarioRunner(ciudadDividida);
let savedGame: string | null = null;
const context: ServerContext = { get game() { return game; }, get savedGame() { return savedGame; }, rootDir, setGame: value => { game = value; }, setSavedGame: value => { savedGame = value; } };

async function handleRequest(req: any, res: any) {
  setCors(res);
  if (isOptions(req, res)) return;
  if (await handleState(req, res, context)) return;
  if (await handleCommands(req, res, context)) return;
  if (await handlePersistence(req, res, context)) return;
  await handleStaticFiles(req, res, context);
}

const server = createServer(handleRequest);
const PORT = 3000;
setInterval(() => game.advance(game.clock.currentSpeed / 1440), 2500);
server.listen(PORT, () => console.log(`Metropolica Server running at http://localhost:${PORT}`));
