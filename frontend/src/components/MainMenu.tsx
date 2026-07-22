'use client';
import { useEffect, useState } from 'react';
import { useGameContext } from '../hooks/GameContext';

export default function MainMenu() {
  const { isMenuOpen, setIsMenuOpen, fetchState } = useGameContext();
  const [saveExists, setSaveExists] = useState(false);
  const [citySize, setCitySize] = useState('small');

  useEffect(() => {
    if (isMenuOpen) {
      fetch('/api/save/exists').then(r => r.json()).then(d => setSaveExists(d.exists)).catch(console.warn);
    }
  }, [isMenuOpen]);

  if (!isMenuOpen) return null;

  async function handleReset(seed: number) {
    if (confirm('¿Estás seguro de comenzar una nueva ciudad?')) {
      await fetch('/api/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seed, citySize }) });
      await fetchState();
      setIsMenuOpen(false);
    }
  }

  function randomSeed() {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    return values[0] || Date.now();
  }

  async function handleLoad() {
    await fetch('/api/load', { method: 'POST' });
    await fetchState();
    setIsMenuOpen(false);
  }

  async function handleSave() {
    await fetch('/api/save', { method: 'POST' });
    setSaveExists(true);
  }

  return (
    <div className="menu-overlay">
      <div className="menu-modal">
        <h1 className="menu-title">Metropolica</h1>
        <p className="menu-subtitle">Simulación Urbana</p>
        <div className="menu-buttons">
          <label className="city-size-label" htmlFor="city-size">Tamaño de ciudad</label>
          <select id="city-size" className="city-size-select" value={citySize} onChange={e => setCitySize(e.target.value)}>
            <option value="tiny">Tiny</option><option value="small">Normal</option><option value="big">Big</option><option value="very-big">Very big</option><option value="enormous">Enormous</option>
          </select>
          <button className="menu-btn primary" onClick={() => setIsMenuOpen(false)}>Continuar</button>
          <button className={`menu-btn ${saveExists ? 'primary' : ''}`} disabled={!saveExists} onClick={handleLoad}>Cargar partida</button>
          <button className="menu-btn" onClick={handleSave}>Guardar partida</button>
          <button className="menu-btn" onClick={() => handleReset(randomSeed())}>Nueva ciudad aleatoria</button>
          <button className="menu-btn danger" onClick={() => handleReset(1)}>Empezar de cero</button>
        </div>
      </div>
    </div>
  );
}
