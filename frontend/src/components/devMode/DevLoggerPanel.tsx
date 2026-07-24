'use client';
import React, { useState, useMemo } from 'react';
import { DevLogEntry, DevLogLevel } from '../../lib/devModeManager';

interface Props {
  logs: DevLogEntry[];
  onClear: () => void;
}

export default function DevLoggerPanel({ logs, onClear }: Props) {
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (filterLevel !== 'all' && log.level !== filterLevel) return false;
      if (search.trim() !== '') {
        const query = search.toLowerCase();
        return (
          log.message.toLowerCase().includes(query) ||
          log.category.toLowerCase().includes(query) ||
          log.timestamp.includes(query)
        );
      }
      return true;
    });
  }, [logs, filterLevel, search]);

  const getLevelBadgeClass = (level: DevLogLevel) => {
    switch (level) {
      case 'info': return 'badge-info';
      case 'warn': return 'badge-warn';
      case 'error': return 'badge-error';
      case 'action': return 'badge-action';
      case 'anim': return 'badge-anim';
      default: return '';
    }
  };

  return (
    <div className="dev-logger-container">
      <div className="dev-logger-toolbar">
        <div className="dev-logger-filters">
          <button className={`filter-btn ${filterLevel === 'all' ? 'active' : ''}`} onClick={() => setFilterLevel('all')}>Todos ({logs.length})</button>
          <button className={`filter-btn info ${filterLevel === 'info' ? 'active' : ''}`} onClick={() => setFilterLevel('info')}>Info</button>
          <button className={`filter-btn action ${filterLevel === 'action' ? 'active' : ''}`} onClick={() => setFilterLevel('action')}>Acción</button>
          <button className={`filter-btn anim ${filterLevel === 'anim' ? 'active' : ''}`} onClick={() => setFilterLevel('anim')}>Anim</button>
          <button className={`filter-btn warn ${filterLevel === 'warn' ? 'active' : ''}`} onClick={() => setFilterLevel('warn')}>Warn</button>
          <button className={`filter-btn error ${filterLevel === 'error' ? 'active' : ''}`} onClick={() => setFilterLevel('error')}>Error</button>
        </div>

        <div className="dev-logger-actions">
          <input
            type="text"
            className="dev-log-search"
            placeholder="Filtrar eventos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="dev-btn-sm" onClick={onClear} title="Limpiar logs">🧹 Limpiar</button>
        </div>
      </div>

      <div className="dev-log-list">
        {filteredLogs.length === 0 ? (
          <div className="dev-empty-msg">No hay registros de eventos para mostrar.</div>
        ) : (
          filteredLogs.map(log => (
            <div key={log.id} className={`dev-log-row ${log.level}`}>
              <span className="dev-log-time">{log.timestamp}</span>
              <span className={`dev-log-badge ${getLevelBadgeClass(log.level)}`}>[{log.category}]</span>
              <span className="dev-log-msg">{log.message}</span>
              {log.details && (
                <span className="dev-log-details" title={JSON.stringify(log.details)}>
                  {typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details)}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
