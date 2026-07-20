'use client';
import { createContext, useContext } from 'react';
import { useGameState } from './useGameState';

type GameContextType = ReturnType<typeof useGameState>;

export const GameContext = createContext<GameContextType | null>(null);

export function useGameContext() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGameContext must be within GameProvider');
  return ctx;
}
