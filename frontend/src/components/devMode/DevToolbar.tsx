'use client';
import React, { useState } from 'react';
import { useGameContext } from '../../hooks/GameContext';
import { devManager } from '../../lib/devModeManager';

interface Props {
  mapCamera?: any;
  isPaused?: boolean;
  onTogglePause?: () => void;
}

export default function DevToolbar({ mapCamera }: Props) {
  const { fetchState, mapCols, mapRows } = useGameContext();
  const [spawnType, setSpawnType] = useState('bldg-r');
  const [targetCol, setTargetCol] = useState(0);
  const [targetRow, setTargetRow] = useState(0);

  const handleSpawn = async () => {
    try {
      devManager.addLog('action', 'Spawn', `Intentando crear ${spawnType} en (${targetCol}, ${targetRow})`);
      await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'PLACE_ZONE',
          zoneType: spawnType,
          district: 'centro',
          col: targetCol,
          row: targetRow
        })
      });
      devManager.addLog('info', 'Spawn', `Spawneo exitoso de ${spawnType} en (${targetCol}, ${targetRow})`);
      await fetchState();
    } catch (err: any) {
      devManager.addLog('error', 'Spawn', `Error al spawnear objeto: ${err.message}`);
    }
  };

  const handleDemolish = async () => {
    try {
      devManager.addLog('action', 'Eliminar', `Eliminando objeto en (${targetCol}, ${targetRow})`);
      await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'DEMOLISH_TILE',
          col: targetCol,
          row: targetRow
        })
      });
      devManager.addLog('info', 'Eliminar', `Objeto eliminado en (${targetCol}, ${targetRow})`);
      await fetchState();
    } catch (err: any) {
      devManager.addLog('error', 'Eliminar', `Error al eliminar objeto: ${err.message}`);
    }
  };

  const handleResetCamera = () => {
    if (mapCamera) {
      mapCamera.centerWorld();
      devManager.addLog('action', 'Cámara', 'Cámara centrada al origen del mapa');
    }
  };

  return (
    <div className="dev-tools-wrapper">
      <div className="dev-tool-group">
        <span className="dev-group-title">🛠️ Herramientas de Test</span>
        <div className="dev-controls">
          <label>Col:</label>
          <input
            type="number"
            min={0}
            max={mapCols - 1}
            value={targetCol}
            onChange={(e) => setTargetCol(Math.max(0, Math.min(mapCols - 1, parseInt(e.target.value) || 0)))}
            className="dev-input-num"
          />

          <label>Row:</label>
          <input
            type="number"
            min={0}
            max={mapRows - 1}
            value={targetRow}
            onChange={(e) => setTargetRow(Math.max(0, Math.min(mapRows - 1, parseInt(e.target.value) || 0)))}
            className="dev-input-num"
          />

          <select value={spawnType} onChange={(e) => setSpawnType(e.target.value)} className="dev-select">
            <option value="bldg-r">Casa Residencial</option>
            <option value="bldg-c">Edificio Comercial</option>
            <option value="bldg-i">Fábrica Industrial</option>
            <option value="road">Calle</option>
            <option value="park">Parque</option>
            <option value="tree">Árboles</option>
          </select>

          <button className="dev-action-btn spawn" onClick={handleSpawn}>Spawn</button>
          <button className="dev-action-btn demolish" onClick={handleDemolish}>Eliminar</button>
        </div>
      </div>

      <div className="dev-tool-group">
        <span className="dev-group-title">📷 Cámara & Utilidades</span>
        <div className="dev-controls">
          <button className="dev-btn-sm" onClick={handleResetCamera}>Re-centrar Mapa</button>
        </div>
      </div>
    </div>
  );
}
