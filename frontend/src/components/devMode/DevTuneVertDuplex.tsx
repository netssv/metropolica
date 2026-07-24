'use client';
import React from 'react';
import { duplexVertTune, DuplexVertTuneParams } from '../../lib/buildings/duplexVertTuneState';

interface Props {
  tuneParams: DuplexVertTuneParams;
  copied: boolean;
  onCopy: () => void;
}

export default function DevTuneVertDuplex({ tuneParams, copied, onCopy }: Props) {
  const handleTuneChange = (key: keyof DuplexVertTuneParams, val: number) => {
    duplexVertTune.setParam(key, val);
  };

  const sliders: [keyof DuplexVertTuneParams, string, number, number, number, string][] = [
    ['height',       'Altura Muros',          10,  60,   1,    'px'],
    ['peak',         'Altura Tejado',          2,  30,   1,    'px'],
    ['baseH',        'Cimiento (baseH)',       0,  10,   1,    'px'],
    ['chimneyPosT',  '🧱 Posición Chimenea',  0.05, 0.95, 0.01, ''],
    ['chimneyDepth', '🧱 Profundidad Chim.',  0.05, 0.85, 0.01, ''],
    ['chimneyH',     '🧱 Altura Chimenea',     4,  20,   1,    'px'],
    ['rotation',     '🔄 Rotación Tile',       0,   3,   1,    ''],
  ];

  return (
    <>
      <div style={{ fontSize: '11px', opacity: 0.8, color: '#60a5fa' }}>
        🎛️ <b>Controles en Tiempo Real (Dúplex Vertical)</b>
      </div>

      {sliders.map(([key, label, min, max, step, unit]) => {
        const val = tuneParams[key];
        const dirs = ['↘ SE', '↙ SW', '↖ NW', '↗ NE'];
        const display = key === 'rotation'
          ? dirs[Math.round(val as number) % 4]
          : Number.isInteger(val) ? val : (val as number).toFixed(2);
        return (
          <div key={key} className="dev-slider-group">
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span>{label}:</span> <b style={{ color: (val as number) < 0 ? '#f87171' : '#e5e7eb' }}>{display}{unit}</b>
            </label>
            <input type="range" min={min} max={max} step={step} value={val as number}
              onChange={(e) => handleTuneChange(key, parseFloat(e.target.value))}
              onInput={(e) => handleTuneChange(key, parseFloat((e.target as HTMLInputElement).value))}
              style={{ width: '100%', cursor: 'pointer', accentColor: (val as number) < 0 ? '#f87171' : '#3b82f6' }}
            />
          </div>
        );
      })}

      <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
        <button onClick={onCopy} style={{ flex: 1, padding: '8px', background: copied ? '#059669' : '#0284c7', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}>
          {copied ? '✓ ¡Código Copiado!' : '📋 Copiar Código TS'}
        </button>

        <button onClick={() => duplexVertTune.reset()} style={{ padding: '8px 12px', background: '#334155', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>
          🔄 Reset
        </button>
      </div>
    </>
  );
}
