import { useState, useEffect, useCallback, useRef } from 'react';
import { MAP_COLS, MAP_ROWS } from '../lib/constants';

export function useGameState() {
  const [simState, setSimState] = useState<any>(null);
  const [currentTool, setCurrentTool] = useState('cursor');
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const tileMapRef = useRef<any[][]>([]);
  const [mapDimensions, setMapDimensions] = useState({ cols: MAP_COLS, rows: MAP_ROWS });

  const fetchAll = useCallback(async () => {
    try {
      const [stateRes, tilesRes] = await Promise.all([
        fetch('/api/state'),
        fetch('/api/tilemap')
      ]);
      if (!stateRes.ok || !tilesRes.ok) return;
      const [stateJson, tilesJson] = await Promise.all([stateRes.json(), tilesRes.json()]);
      setSimState(stateJson);
      if (stateJson.cityDimensions) setMapDimensions({ cols: stateJson.cityDimensions.cols, rows: stateJson.cityDimensions.rows });

      // Rebuild tileMap from flat tile list
      const cols = stateJson.cityDimensions?.cols ?? MAP_COLS;
      const rows = stateJson.cityDimensions?.rows ?? MAP_ROWS;
      const newMap: any[][] = Array.from({ length: rows }, () => Array(cols).fill(null));
      for (const t of tilesJson.tiles) {
        if (t.row >= 0 && t.row < rows && t.col >= 0 && t.col < cols) {
          newMap[t.row][t.col] = { type: t.type, owner: t.owner, level: t.level ?? 0 };
        }
      }
      tileMapRef.current = newMap;
    } catch (e) {
      console.warn('Backend disconnected', e);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const iv = setInterval(fetchAll, 2000);
    return () => clearInterval(iv);
  }, [fetchAll]);

  return {
    simState,
    currentTool,
    setCurrentTool,
    tileMapRef,
    fetchState: fetchAll,
    isMenuOpen,
    setIsMenuOpen
    ,mapCols: mapDimensions.cols,
    mapRows: mapDimensions.rows
  };
}
