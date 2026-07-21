import type { IncomingMessage, ServerResponse } from 'node:http';
import { ScenarioRunner } from '../../src/simulation/scenario/index.ts';

export type Request = IncomingMessage;
export type Response = ServerResponse;
export type ServerContext = {
  game: ScenarioRunner;
  savedGame: string | null;
  rootDir: string;
  setGame(game: ScenarioRunner): void;
  setSavedGame(value: string | null): void;
};

export type Handler = (req: Request, res: Response, context: ServerContext) => Promise<boolean> | boolean;
