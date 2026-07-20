'use client';
import { useEffect, useState } from 'react';
import { useGameContext } from '../hooks/GameContext';

export default function MainMenu() {
  const { isMenuOpen, setIsMenuOpen, fetchState } = useGameContext();
  const [saveExists, setSaveExists] = useState(false);

  useEffect(() => {
    if (isMenuOpen) {
      fetch('/api/save/exists').then(r => r.json()).then(d => setSaveExists(d.exists)).catch(console.warn);
    }
  }, [isMenuOpen]);

  if (!isMenuOpen) return null;

  async function handleReset(seed: number) {
    if (confirm('¿Estás seguro de comenzar una nueva ciudad?')) {
      await fetch('/api/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seed }) });
      await fetchState();
      setIsMenuOpen(false);
    }
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
          <button className="menu-btn primary" onClick={() => setIsMenuOpen(false)}>Continuar</button>
          <button className={`menu-btn ${saveExists ? 'primary' : ''}`} disabled={!saveExists} onClick={handleLoad}>Cargar partida</button>
          <button className="menu-btn" onClick={handleSave}>Guardar partida</button>
          <button className="menu-btn" onClick={() => handleReset(Math.floor(Math.random() * 1000000))}>Nueva ciudad aleatoria</button>
          <button className="menu-btn danger" onClick={() => handleReset(1)}>Empezar de cero</button>
        </div>
      </div>
    </div>
  );
}
