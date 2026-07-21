'use client';
import { useEffect, useRef, useState } from 'react';
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
  const [displayMinutes, setDisplayMinutes] = useState(0);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const anchorRef = useRef({ minutes: 0, time: 0, speed: 1 });
  const serverMinutes = (simState?.day ?? 0) * 1440 + (simState?.hour ?? 0) * 60 + (simState?.minute ?? 0);
  useEffect(() => {
    anchorRef.current = { minutes: serverMinutes, time: performance.now(), speed };
    setDisplayMinutes(serverMinutes);
  }, [serverMinutes, speed]);
  useEffect(() => {
    let frame = 0;
    const animate = (time: number) => {
      const anchor = anchorRef.current;
      setDisplayMinutes(anchor.minutes + ((time - anchor.time) / 1000) * 0.4 * anchor.speed);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);
  const shownMinute = Math.max(0, Math.floor(displayMinutes));
  const shownDay = Math.floor(shownMinute / 1440);
  const shownHour = Math.floor((shownMinute % 1440) / 60);
  const shownClockMinute = shownMinute % 60;
  const setSpeed = async (value: number) => {
    setPendingAction(`speed-${value}`);
    try { await fetch('/api/speed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ speed: value }) }); await fetchState(); }
    finally { setPendingAction(null); }
  };
  const advanceDays = async (days: number) => {
    setPendingAction(`advance-${days}`);
    try { await fetch('/api/advance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ days }) }); await fetchState(); }
    finally { setPendingAction(null); }
  };
  const openDashboard = (tab: 'districts' | 'opinion' | 'citizens') => {
    window.dispatchEvent(new CustomEvent('dashboard:navigate', { detail: tab }));
  };

  return (
    <header id="hud-top">
      <button id="city-brand" onClick={() => setIsMenuOpen(true)} title="Abrir menú principal" aria-label="Abrir menú principal">🏙️ <span>Metropolica</span></button>
      <div className="hud-sep"></div>
      <button className="hud-stat hud-stat-button" onClick={() => openDashboard('districts')} title="Abrir reloj y controles de tiempo">
        <span className="hud-label">HORA</span>
        <span className="hud-value">{String(shownHour).padStart(2, '0')}:{String(shownClockMinute).padStart(2, '0')}</span>
      </button>
      <button className="hud-stat hud-stat-button" onClick={() => openDashboard('districts')} title="Abrir información de la ciudad">
        <span className="hud-label">DÍA</span>
        <span className="hud-value">{shownDay}</span>
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
        {[1, 7, 30].map(days => <button key={days} className={`hud-icon-btn ${pendingAction === `advance-${days}` ? 'active pending' : ''}`} disabled={pendingAction !== null} onClick={() => advanceDays(days)}>{pendingAction === `advance-${days}` ? '…' : `+${days}d`}</button>)}
        {[1, 2, 4, 8].map(value => <button key={value} className={`hud-icon-btn ${speed === value ? 'active' : ''} ${pendingAction === `speed-${value}` ? 'pending' : ''}`} disabled={pendingAction !== null} onClick={() => setSpeed(value)}>{pendingAction === `speed-${value}` ? '…' : `${value}×`}</button>)}
        <div className="hud-sep"></div>
        <button className="hud-icon-btn" onClick={() => setIsMenuOpen(true)}>↺</button>
      </div>
    </header>
  );
}
