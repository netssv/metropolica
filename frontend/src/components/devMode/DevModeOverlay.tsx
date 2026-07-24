'use client';
import React, { useState, useRef } from 'react';
import { useDevMode } from '../../hooks/useDevMode';
import DevInspectorPanel from './DevInspectorPanel';
import DevLoggerPanel from './DevLoggerPanel';
import DevToolbar from './DevToolbar';

interface Props {
  mapCamera?: any;
}

export default function DevModeOverlay({ mapCamera }: Props) {
  const { isActive, isPaused, toggleDevMode, togglePaused, selectedObject, setSelectedObject, logs, clearLogs } = useDevMode();
  const [activeTab, setActiveTab] = useState<'inspector' | 'logger' | 'tools'>('inspector');
  
  // Floating Window State: position & window size
  const [pos, setPos] = useState({ x: 20, y: 80 });
  const [isMinimized, setIsMinimized] = useState(false);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag when clicking header or title bar area
    if ((e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).tagName === 'INPUT') return;
    isDragging.current = true;
    dragOffset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };

    const handleMouseMove = (me: MouseEvent) => {
      if (!isDragging.current) return;
      setPos({
        x: Math.max(10, Math.min(window.innerWidth - 320, me.clientX - dragOffset.current.x)),
        y: Math.max(10, Math.min(window.innerHeight - 100, me.clientY - dragOffset.current.y)),
      });
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  if (!isActive) {
    return null;
  }

  const stopAll = (e: React.SyntheticEvent) => {
    if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
    e.stopPropagation();
  };

  return (
    <div 
      className="dev-floating-window"
      onMouseDown={stopAll}
      onWheel={stopAll}
      style={{
        position: 'fixed',
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        width: isMinimized ? '340px' : '440px',
        height: isMinimized ? 'auto' : '520px',
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.94)',
        backdropFilter: 'blur(12px)',
        borderRadius: '10px',
        border: '1px solid rgba(0, 230, 180, 0.4)',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: isDragging.current ? 'none' : 'width 0.2s, height 0.2s',
      }}
    >

      {/* Draggable Title Bar */}
      <div 
        className="dev-floating-header"
        onMouseDown={handleMouseDown}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: 'rgba(30, 41, 59, 0.95)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          cursor: 'grab',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px' }}>⋮⋮</span>
          <span className="dev-badge">🛠️ DEV MODE</span>
          <button
            className={`dev-pause-btn ${isPaused ? 'paused' : ''}`}
            onClick={togglePaused}
            title={isPaused ? 'Reanudar Simulación' : 'Pausar Simulación'}
            style={{ fontSize: '10px', padding: '2px 6px' }}
          >
            {isPaused ? '▶' : '⏸'}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button 
            onClick={() => setIsMinimized(!isMinimized)} 
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '12px' }}
            title={isMinimized ? 'Expandir' : 'Minimizar'}
          >
            {isMinimized ? '🗖' : '🗕'}
          </button>
          <button 
            className="dev-close-trigger" 
            onClick={toggleDevMode} 
            title="Cerrar Modo Desarrollador (F12)"
            style={{ padding: '0 4px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Navigation Bar */}
          <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', padding: '2px 8px' }}>
            <button
              className={`dev-nav-tab ${activeTab === 'inspector' ? 'active' : ''}`}
              onClick={() => setActiveTab('inspector')}
              style={{ fontSize: '11px', padding: '6px 10px' }}
            >
              🔍 Inspector
            </button>
            <button
              className={`dev-nav-tab ${activeTab === 'logger' ? 'active' : ''}`}
              onClick={() => setActiveTab('logger')}
              style={{ fontSize: '11px', padding: '6px 10px' }}
            >
              📋 Logs ({logs.length})
            </button>
            <button
              className={`dev-nav-tab ${activeTab === 'tools' ? 'active' : ''}`}
              onClick={() => setActiveTab('tools')}
              style={{ fontSize: '11px', padding: '6px 10px' }}
            >
              ⚡ Tools
            </button>
          </div>

          {/* Floating Content Body */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {activeTab === 'inspector' && (
              <DevInspectorPanel
                selectedObject={selectedObject}
                mapCamera={mapCamera}
                onClose={() => setSelectedObject(null)}
              />
            )}
            {activeTab === 'logger' && (
              <DevLoggerPanel
                logs={logs}
                onClear={clearLogs}
              />
            )}
            {activeTab === 'tools' && (
              <DevToolbar
                isPaused={isPaused}
                onTogglePause={togglePaused}
                mapCamera={mapCamera}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
