'use client';
import { GameContext } from '../hooks/GameContext';
import { useGameState } from '../hooks/useGameState';

export function GameProvider({ children }: { children: React.ReactNode }) {
  const state = useGameState();
  return <GameContext.Provider value={state}>{children}</GameContext.Provider>;
}
