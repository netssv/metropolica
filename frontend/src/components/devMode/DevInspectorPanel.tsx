'use client';
import React, { useState, useEffect } from 'react';
import { SelectedObjectInfo } from '../../lib/devModeManager';
import { duplexHorizTune, DuplexHorizTuneParams } from '../../lib/buildings/duplexHorizTuneState';
import { duplexVertTune, DuplexVertTuneParams } from '../../lib/buildings/duplexVertTuneState';
import { genericTune, GenericBuildingTuneParams } from '../../lib/buildings/genericTuneState';
import DevTuneHorizDuplex from './DevTuneHorizDuplex';
import DevTuneVertDuplex from './DevTuneVertDuplex';
import DevTuneGeneric from './DevTuneGeneric';

interface Props {
  selectedObject: SelectedObjectInfo | null;
  onClose: () => void;
}

export default function DevInspectorPanel({ selectedObject, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'state' | 'tune' | 'history' | 'raw'>('state');
  const [tuneParams, setTuneParams] = useState<DuplexHorizTuneParams>(duplexHorizTune.getParams());
  const [vertTuneParams, setVertTuneParams] = useState<DuplexVertTuneParams>(duplexVertTune.getParams());
  const [genericTuneParams, setGenericTuneParams] = useState<Record<string, GenericBuildingTuneParams>>({});
  const [duplexMode, setDuplexMode] = useState<'horiz' | 'vert' | 'generic'>('horiz');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubH = duplexHorizTune.subscribe((newParams) => setTuneParams(newParams));
    const unsubV = duplexVertTune.subscribe((newParams) => setVertTuneParams(newParams));
    const unsubG = genericTune.subscribe((newParams) => setGenericTuneParams(newParams));
    return () => { unsubH(); unsubV(); unsubG(); };
  }, []);

  useEffect(() => {
    if (!selectedObject) return;
    const nameStr = (selectedObject.name || '').toLowerCase();
    const typeStr = (selectedObject.type || '').toLowerCase();
    
    if (nameStr.includes('duplex') || typeStr.includes('duplex')) {
      const isVert = nameStr.includes('vertical') || typeStr.includes('vertical') || selectedObject.state?.orientation === 'vertical';
      setDuplexMode(isVert ? 'vert' : 'horiz');
    } else {
      setDuplexMode('generic');
    }
  }, [selectedObject]);

  const handleCopyCode = () => {
    const code = `// Parámetros Tuned para Dúplex Horizontal:
const height     = ${tuneParams.height} * zoom;
const peak       = ${tuneParams.peak} * zoom;
const baseH      = ${tuneParams.baseH} * zoom;
const depthX     = TW * ${tuneParams.depthMultX};
const depthY     = TH * ${tuneParams.depthMultY};
const facadeMult  = ${tuneParams.facadeMult};
const rotAngle   = ${tuneParams.rotAngle};
const offsetX    = ${tuneParams.offsetX};
const offsetY    = ${tuneParams.offsetY};
const doorScale  = ${tuneParams.doorScale};
const winScale   = ${tuneParams.winScale};
// ── Volumen y niveles:
const backAlpha   = ${tuneParams.backAlpha};
const rightAlpha  = ${tuneParams.rightAlpha};
const canopyYMult = ${tuneParams.canopyYMult};
const winYMult    = ${tuneParams.winYMult};
const sideWinYMult = ${tuneParams.sideWinYMult};
const rotation    = ${tuneParams.rotation}; // 0=SW 1=SE 2=NE 3=NW`;

    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyVertCode = () => {
    const code = `// Parámetros Tuned para Dúplex Vertical:
const height       = ${vertTuneParams.height};
const peak         = ${vertTuneParams.peak};
const baseH        = ${vertTuneParams.baseH};
const chimneyPosT  = ${vertTuneParams.chimneyPosT};
const chimneyDepth = ${vertTuneParams.chimneyDepth};
const chimneyH     = ${vertTuneParams.chimneyH};
const rotation     = ${vertTuneParams.rotation};`;

    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyGenericCode = (activeKey: string) => {
    const p = genericTune.getParams(activeKey);
    const code = `// Parámetros Tuned RAW para '${activeKey}' (Copiado para IDE Agent):
${JSON.stringify({ [activeKey]: p }, null, 2)}`;

    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!selectedObject) {
    return (
      <div className="dev-inspector-empty">
        <div className="dev-inspector-placeholder-icon">🔍</div>
        <p>Haz clic en cualquier objeto del mapa para inspeccionar sus propiedades o ajustar proporciones dinámicas.</p>
      </div>
    );
  }

  return (
    <div className="dev-inspector-content">
      <div className="dev-inspector-header">
        <div>
          <span className="dev-object-type">{selectedObject.type}</span>
          <h3 className="dev-object-name">{selectedObject.name}</h3>
        </div>
        <button className="dev-close-btn" onClick={onClose} title="Cerrar Inspector">✕</button>
      </div>

      <div className="dev-coords-bar">
        <span className="dev-coord-tag">Grid: ({selectedObject.gridPos.col}, {selectedObject.gridPos.row})</span>
        <span className="dev-coord-tag">Iso: ({selectedObject.isoPos.x.toFixed(1)}, {selectedObject.isoPos.y.toFixed(1)})</span>
      </div>

      <div className="dev-inspector-tabs">
        <button className={activeTab === 'state' ? 'active' : ''} onClick={() => setActiveTab('state')}>Estado</button>
        <button className={activeTab === 'tune' ? 'active' : ''} onClick={() => setActiveTab('tune')}>🎛️ Tune Live</button>
        <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>Historial</button>
        <button className={activeTab === 'raw' ? 'active' : ''} onClick={() => setActiveTab('raw')}>JSON</button>
      </div>

      <div className="dev-inspector-body">
        {activeTab === 'state' && (
          <div className="dev-prop-grid">
            {Object.entries(selectedObject.state).map(([key, val]) => (
              <div key={key} className="dev-prop-row">
                <span className="dev-prop-key">{key}:</span>
                <span className="dev-prop-val">
                  {typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val)}
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'tune' && (
          <div className="dev-tune-panel" style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {duplexMode === 'horiz' && (
              <DevTuneHorizDuplex
                tuneParams={tuneParams}
                copied={copied}
                onCopy={handleCopyCode}
              />
            )}

            {duplexMode === 'vert' && (
              <DevTuneVertDuplex
                tuneParams={vertTuneParams}
                copied={copied}
                onCopy={handleCopyVertCode}
              />
            )}

            {duplexMode === 'generic' && (
              <DevTuneGeneric
                selectedObjectName={selectedObject?.name}
                selectedObjectType={selectedObject?.type}
                genericTuneParams={genericTuneParams}
                copied={copied}
                onCopy={handleCopyGenericCode}
              />
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="dev-history-list">
            {selectedObject.history.length === 0 ? <div className="dev-empty-msg">Sin cambios de estado recientes registrados.</div> : selectedObject.history.map((item, idx) => (
              <div key={idx} className="dev-history-item">
                <span className="dev-hist-time">{item.timestamp}</span>
                <span className="dev-hist-prop">{item.property}</span>
                <span className="dev-hist-change"><span className="old">{String(item.oldValue)}</span> ➔ <span className="new">{String(item.newValue)}</span></span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'raw' && <pre className="dev-json-view">{JSON.stringify(selectedObject, null, 2)}</pre>}
      </div>
    </div>
  );
}
