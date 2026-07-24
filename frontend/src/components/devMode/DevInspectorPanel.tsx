'use client';
import React, { useState, useEffect } from 'react';
import { SelectedObjectInfo } from '../../lib/devModeManager';
import { duplexHorizTune, DuplexHorizTuneParams } from '../../lib/buildings/duplexHorizTuneState';
import { duplexVertTune, DuplexVertTuneParams } from '../../lib/buildings/duplexVertTuneState';
import { genericTune, GenericBuildingTuneParams } from '../../lib/buildings/genericTuneState';
import DevTuneHorizDuplex from './DevTuneHorizDuplex';
import DevTuneVertDuplex from './DevTuneVertDuplex';
import DevTuneGeneric from './DevTuneGeneric';
import DevInspectorHeader from './DevInspectorHeader';
import {
  getGenericTuneKey,
  formatHorizTuneCode,
  formatVertTuneCode,
  formatGenericTuneCode,
} from './devInspectorUtils';

interface Props {
  selectedObject: SelectedObjectInfo | null;
  mapCamera?: any;
  onClose: () => void;
}

export default function DevInspectorPanel({ selectedObject, mapCamera, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'state' | 'tune' | 'history' | 'raw'>('state');
  const [tuneParams, setTuneParams] = useState<DuplexHorizTuneParams>(duplexHorizTune.getParams());
  const [vertTuneParams, setVertTuneParams] = useState<DuplexVertTuneParams>(duplexVertTune.getParams());
  const [genericTuneParams, setGenericTuneParams] = useState<Record<string, GenericBuildingTuneParams>>({});
  const [duplexMode, setDuplexMode] = useState<'horiz' | 'vert' | 'generic'>('horiz');
  const [copied, setCopied] = useState(false);
  const [liveCamRot, setLiveCamRot] = useState(0);

  const rawCamRot = mapCamera?.ref?.current?.rotation ?? mapCamera?.values?.()?.rotation ?? mapCamera?.rotation ?? tuneParams.rotation ?? 0;
  const currentCameraRot = liveCamRot ?? (((Math.round(rawCamRot) % 4) + 4) % 4);

  useEffect(() => {
    const interval = setInterval(() => {
      const rotVal = mapCamera?.ref?.current?.rotation ?? mapCamera?.values?.()?.rotation ?? 0;
      setLiveCamRot(((Math.round(rotVal) % 4) + 4) % 4);
    }, 200);

    const unsubH = duplexHorizTune.subscribe((newParams) => setTuneParams(newParams));
    const unsubV = duplexVertTune.subscribe((newParams) => setVertTuneParams(newParams));
    const unsubG = genericTune.subscribe((newParams) => setGenericTuneParams(newParams));
    return () => { clearInterval(interval); unsubH(); unsubV(); unsubG(); };
  }, [mapCamera]);

  useEffect(() => {
    if (!selectedObject) return;
    const nameStr = (selectedObject.name || '').toLowerCase();
    const typeStr = (selectedObject.type || '').toLowerCase();
    const role = selectedObject.state?.houseRole as string | undefined;
    const duplexOrientation = selectedObject.state?.duplexOrientation as string | undefined;

    if (nameStr.includes('duplex') || typeStr.includes('duplex') || role?.startsWith('duplex-') || duplexOrientation) {
      const isVert = nameStr.includes('vertical') || typeStr.includes('vertical') || selectedObject.state?.orientation === 'vertical' || role?.startsWith('duplex-v') || duplexOrientation === 'vertical';
      setDuplexMode(isVert ? 'vert' : 'horiz');
    } else {
      setDuplexMode('generic');
    }
  }, [selectedObject]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyView = () => {
    if (!selectedObject) return;
    const rotNames = ['SW (Frontal)', 'SE (Derecha)', 'NE (Trasera)', 'NW (Izquierda)'];
    const summary = `rot: ${currentCameraRot} (${rotNames[currentCameraRot % 4]}), objeto: "${selectedObject.name}" (${selectedObject.type}), grid: (${selectedObject.gridPos.col}, ${selectedObject.gridPos.row})`;
    copyToClipboard(summary);
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
      <DevInspectorHeader
        selectedObject={selectedObject}
        currentCameraRot={currentCameraRot}
        copied={copied}
        onCopyView={handleCopyView}
        onClose={onClose}
      />

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
                onCopy={() => copyToClipboard(formatHorizTuneCode(tuneParams))}
              />
            )}

            {duplexMode === 'vert' && (
              <DevTuneVertDuplex
                tuneParams={vertTuneParams}
                copied={copied}
                onCopy={() => copyToClipboard(formatVertTuneCode(vertTuneParams))}
              />
            )}

            {duplexMode === 'generic' && (
              <DevTuneGeneric
                selectedObjectName={selectedObject?.name}
                selectedObjectType={selectedObject?.type}
                activeKey={getGenericTuneKey(selectedObject)}
                genericTuneParams={genericTuneParams}
                copied={copied}
                onCopy={(activeKey) => copyToClipboard(formatGenericTuneCode(activeKey))}
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

