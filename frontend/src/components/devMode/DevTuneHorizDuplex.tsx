'use client';
import React from 'react';
import { duplexHorizTune, DuplexHorizTuneParams } from '../../lib/buildings/duplexHorizTuneState';

interface Props {
  tuneParams: DuplexHorizTuneParams;
  copied: boolean;
  onCopy: () => void;
}

export default function DevTuneHorizDuplex({ tuneParams, copied, onCopy }: Props) {
  const handleTuneChange = (key: keyof DuplexHorizTuneParams, val: number) => {
    duplexHorizTune.setParam(key, val);
  };

  const sliders: [keyof DuplexHorizTuneParams, string, number, number, number, string][] = [
    ['height',       'Altura Muros',         -20,  80,   1,    'px'],
    ['peak',         'Altura Tejado',         -10,  30,   1,    'px'],
    ['baseH',        'Cimiento (baseH)',        -4,  12,   1,    'px'],
    ['depthMultX',   'Profundidad X',          -1.0,  2.0, 0.05, 'x'],
    ['depthMultY',   'Profundidad Y',          -1.0,  2.0, 0.05, 'x'],
    ['facadeMult',   'Largo Fachada',          -1.0,  2.0, 0.05, 'x'],
    ['rotAngle',     '📐 Inclinación Eje',     -0.5,  1.5, 0.02, ''],
    ['offsetX',      '↔️ Offset X',            -60,  60,   1,    'px'],
    ['offsetY',      '↕️ Offset Y',            -60,  60,   1,    'px'],
    ['doorScale',    '🚪 Escala Puertas',      -0.5,  2.5, 0.05, 'x'],
    ['winScale',     '🪟 Escala Ventanas',     -0.5,  2.5, 0.05, 'x'],
    ['backAlpha',    '🟥 Alpha Pared Trasera',  0,    1,   0.05, ''],
    ['rightAlpha',   '🟧 Alpha Pared Lateral',  0,    1,   0.05, ''],
    ['canopyYMult',  '☂️ Nivel Marquesina',     0.1,  0.8, 0.02, ''],
    ['winYMult',     '🪟 Nivel Ventanas Fach.', 0.1,  0.9, 0.02, ''],
    ['sideWinYMult', '🪟 Nivel Ventanas Lat.',  0.1,  0.9, 0.02, ''],
    ['chimneyPosT',  '🧱 Posición Chimenea',   0.05, 0.95, 0.01, ''],
    ['chimneyDepth', '🧱 Profundidad Chim.',   0.05, 0.85, 0.01, ''],
    ['chimneyH',     '🧱 Altura Chimenea',      4,   20,   1,    'px'],
    ['rotation',     '🔄 Rotación Tile',         0,    3,   1,    ''],
  ];

  return (
    <>
      <div style={{ fontSize: '11px', opacity: 0.8, color: '#4ade80' }}>
        🎛️ <b>Controles en Tiempo Real (Dúplex Horizontal)</b>
      </div>

      {sliders.map(([key, label, min, max, step, unit]) => {
        const val = tuneParams[key];
        const dirs = ['↙ SW', '↘ SE', '↗ NE', '↖ NW'];
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
              style={{ width: '100%', cursor: 'pointer', accentColor: (val as number) < 0 ? '#f87171' : '#00e6b4' }}
            />
          </div>
        );
      })}

      <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
        <button onClick={onCopy} style={{ flex: 1, padding: '8px', background: copied ? '#059669' : '#0284c7', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}>
          {copied ? '✓ ¡Código Copiado!' : '📋 Copiar Código TS'}
        </button>

        <button onClick={() => duplexHorizTune.reset()} style={{ padding: '8px 12px', background: '#334155', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>
          🔄 Reset
        </button>
      </div>
    </>
  );
}
