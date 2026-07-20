'use client';
import { useGameContext } from '../hooks/GameContext';

export default function HUD() {
  const { simState, setIsMenuOpen, fetchState } = useGameContext();

  const day = simState?.day ?? 0;
  const hour = simState?.hour ?? 0;
  const minute = simState?.minute ?? 0;
  const treasury = simState?.treasury ?? 50000;
  const approval = simState?.approval ?? 0;
  const activeCitizens = simState?.activeCitizens ?? 0;
  const speed = simState?.speed ?? 1;
  const setSpeed = async (value: number) => {
    await fetch('/api/speed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ speed: value }) });
    await fetchState();
  };
  const openDashboard = (tab: 'districts' | 'opinion' | 'citizens') => {
    window.dispatchEvent(new CustomEvent('dashboard:navigate', { detail: tab }));
  };

  return (
    <header id="hud-top">
      <div id="city-brand">🏙️ <span>Metropolica</span></div>
      <div className="hud-sep"></div>
      <button className="hud-stat hud-stat-button" onClick={() => openDashboard('districts')} title="Abrir reloj y controles de tiempo">
        <span className="hud-label">HORA</span>
        <span className="hud-value">{String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}</span>
      </button>
      <button className="hud-stat hud-stat-button" onClick={() => openDashboard('districts')} title="Abrir información de la ciudad">
        <span className="hud-label">DÍA</span>
        <span className="hud-value">{day}</span>
      </button>
      <button className="hud-stat hud-stat-button" onClick={() => openDashboard('districts')} title="Abrir tesoro y finanzas">
        <span className="hud-label">TESORO</span>
        <span className="hud-value accent-green">${treasury.toLocaleString()}</span>
      </button>
      <button className="hud-stat hud-stat-button" onClick={() => openDashboard('opinion')} title="Abrir aprobación y opinión ciudadana">
        <span className="hud-label">APROBACIÓN</span>
        <span className="hud-value">{(approval * 100).toFixed(0)}%</span>
      </button>
      <button className="hud-stat hud-stat-button" onClick={() => openDashboard('citizens')} title="Ver ciudadanos activos e inactivos">
        <span className="hud-label">POBLACIÓN</span>
        <span className="hud-value">{activeCitizens}</span>
      </button>
      <div className="hud-sep"></div>
      <div id="game-status" className="status-badge running">Activa</div>
      <div className="hud-sep"></div>
      <div className="hud-top-actions">
        <button className="hud-icon-btn" onClick={() => fetch('/api/advance', { method: 'POST', body: JSON.stringify({days: 1}) })}>+1d</button>
        <button className="hud-icon-btn" onClick={() => fetch('/api/advance', { method: 'POST', body: JSON.stringify({days: 7}) })}>+7d</button>
        <button className="hud-icon-btn" onClick={() => fetch('/api/advance', { method: 'POST', body: JSON.stringify({days: 30}) })}>+30d</button>
        <button className={`hud-icon-btn ${speed === 1 ? 'active' : ''}`} onClick={() => setSpeed(1)}>1×</button>
        <button className={`hud-icon-btn ${speed === 2 ? 'active' : ''}`} onClick={() => setSpeed(2)}>2×</button>
        <button className={`hud-icon-btn ${speed === 4 ? 'active' : ''}`} onClick={() => setSpeed(4)}>4×</button>
        <button className={`hud-icon-btn ${speed === 8 ? 'active' : ''}`} onClick={() => setSpeed(8)}>8×</button>
        <div className="hud-sep"></div>
        <button className="hud-icon-btn" onClick={() => setIsMenuOpen(true)}>↺</button>
      </div>
    </header>
  );
}
