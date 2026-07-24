'use client';
import React from 'react';
import { genericTune, GenericBuildingTuneParams } from '../../lib/buildings/genericTuneState';

interface Props {
  selectedObjectName?: string;
  selectedObjectType?: string;
  /** Renderer tune key resolved from the selected map object. */
  activeKey?: string;
  genericTuneParams: Record<string, GenericBuildingTuneParams>;
  copied: boolean;
  onCopy: (activeKey: string) => void;
}

export default function DevTuneGeneric({
  selectedObjectName = '',
  selectedObjectType = '',
  activeKey: selectedTuneKey,
  genericTuneParams,
  copied,
  onCopy,
}: Props) {
  const combined = `${selectedObjectName} ${selectedObjectType}`.toLowerCase();

  let inferredKey = 'default';
  if (combined.includes('parque') || combined.includes('park')) inferredKey = 'park';
  else if (combined.includes('puente') || combined.includes('bridge')) inferredKey = 'bridge';
  else if (combined.includes('calle') || combined.includes('carretera') || combined.includes('road') || combined.includes('vía')) inferredKey = 'road';
  else if (combined.includes('árbol') || combined.includes('arbol') || combined.includes('tree')) inferredKey = 'tree';
  else if (combined.includes('agua') || combined.includes('water') || combined.includes('río') || combined.includes('rio')) inferredKey = 'water';
  else if (combined.includes('montaña') || combined.includes('montana') || combined.includes('mountain')) inferredKey = 'mountain';
  else if (combined.includes('hospital')) inferredKey = 'hospital';
  else if (combined.includes('banco') || combined.includes('bank')) inferredKey = 'bank';
  else if (combined.includes('apartment') || combined.includes('apartamento') || combined.includes('nivel 3')) inferredKey = 'apartment';
  else if (combined.includes('casa') || combined.includes('residencial') || combined.includes('bldg-r')) inferredKey = 'house';
  else if (combined.includes('shop') || combined.includes('comercio') || combined.includes('gubernamental')) inferredKey = 'shop';
  else if (combined.includes('factory') || combined.includes('fábrica') || combined.includes('fabrica') || combined.includes('industrial')) inferredKey = 'factory';

  // The inspector knows the actual renderer role. Keep the text matching as a
  // fallback for objects that do not expose a render role yet.
  const activeKey = selectedTuneKey ?? inferredKey;

  const [localParams, setLocalParams] = React.useState<GenericBuildingTuneParams>(
    () => genericTune.getParams(activeKey)
  );
  const initialSnapshotRef = React.useRef<GenericBuildingTuneParams | null>(null);

  React.useEffect(() => {
    // Guardar los valores originales exactos al seleccionar/abrir el objeto
    const initial = JSON.parse(JSON.stringify(genericTune.getParams(activeKey)));
    initialSnapshotRef.current = initial;
    setLocalParams(initial);

    const unsub = genericTune.subscribe(() => {
      setLocalParams(genericTune.getParams(activeKey));
    });
    return unsub;
  }, [activeKey, selectedObjectName, selectedObjectType]);

  const handleReset = () => {
    if (initialSnapshotRef.current) {
      const restored = JSON.parse(JSON.stringify(initialSnapshotRef.current));
      setLocalParams(restored);
      Object.entries(restored).forEach(([k, v]) => {
        genericTune.setParam(activeKey, k as keyof GenericBuildingTuneParams, v);
      });
    } else {
      genericTune.reset(activeKey);
    }
  };

  const isRoad = activeKey === 'road';
  const isBridge = activeKey === 'bridge';
  const isParkOrTree = activeKey === 'park' || activeKey === 'tree';

  const sliders: [keyof GenericBuildingTuneParams, string, number, number, number, string][] = [
    ['height',   isBridge ? 'Grosor/Soporte Pilares' : isRoad ? 'No Aplica (Muros)' : isParkOrTree ? 'Copa / Follaje H' : 'Altura Muros',  0, 80, 1, 'px'],
    ['peak',     isBridge ? 'No Aplica (Tejado)' : isRoad ? 'No Aplica (Tejado)' : isParkOrTree ? 'Tronco / Pila H' : 'Altura Tejado',  0, 40, 1, 'px'],
    ['baseH',    isBridge ? 'Ancho Calzada Principal' : isRoad ? 'Grosor Bordillo' : 'Cimiento (baseH)',  10, 80, 1, isBridge ? '%' : 'px'],
    ['scaleX',   isRoad ? 'Ancho Línea Demarcadora' : 'Escala Ancho X',   0.1, 3.0, 0.05, 'x'],
    ['scaleY',   isRoad ? 'Escala Longitud' : 'Escala Prof. Y',   0.1, 3.0, 0.05, 'x'],
    ['rotation', '🔄 Rotación Tile',  0, 3, 1, ''],
  ];

  const handleSliderChange = (key: keyof GenericBuildingTuneParams, val: number) => {
    setLocalParams((prev) => ({ ...prev, [key]: val }));
    genericTune.setParam(activeKey, key, val);
  };

  return (
    <>
      <div style={{ fontSize: '11px', opacity: 0.8, color: '#f59e0b' }}>
        🎛️ <b>Controles de Edificio Seleccionado ({selectedObjectName || 'Edificio'})</b>
      </div>

      {sliders.map(([key, label, min, max, step, unit]) => {
        const val = localParams[key] ?? 0;
        const dirs = ['↙ SW', '↘ SE', '↗ NE', '↖ NW'];
        const display = key === 'rotation' ? dirs[Math.round(val as number) % 4] : val;
        return (
          <div key={key} className="dev-slider-group">
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span>{label}:</span> <b style={{ color: '#00e6b4' }}>{display}{unit}</b>
            </label>
            <input type="range" min={min} max={max} step={step} value={val as number}
              onChange={(e) => handleSliderChange(key, parseFloat(e.target.value))}
              onInput={(e) => handleSliderChange(key, parseFloat((e.target as HTMLInputElement).value))}
              style={{ width: '100%', cursor: 'pointer', accentColor: '#00e6b4' }}
            />
          </div>
        );
      })}

      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <button onClick={() => onCopy(activeKey)} style={{ flex: 1, padding: '8px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>
          {copied ? '✅ ¡Copiado!' : '📋 Copiar Datos Raw (Agent)'}
        </button>
        <button onClick={handleReset} style={{ flex: 1, padding: '8px', background: '#334155', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>
          🔄 Reset Edificio
        </button>
      </div>
    </>
  );
}
