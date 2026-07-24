'use client';
import React from 'react';
import { SelectedObjectInfo } from '../../lib/devModeManager';

interface Props {
  selectedObject: SelectedObjectInfo;
  currentCameraRot: number;
  copied: boolean;
  onCopyView: () => void;
  onClose: () => void;
}

export default function DevInspectorHeader({
  selectedObject,
  currentCameraRot,
  copied,
  onCopyView,
  onClose,
}: Props) {
  const rotLabels = ['SW', 'SE', 'NE', 'NW'];

  return (
    <>
      <div className="dev-inspector-header">
        <div>
          <span className="dev-object-type">{selectedObject.type}</span>
          <h3 className="dev-object-name">{selectedObject.name}</h3>
        </div>
        <button className="dev-close-btn" onClick={onClose} title="Cerrar Inspector">✕</button>
      </div>

      <div className="dev-coords-bar" style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span className="dev-coord-tag">Grid: ({selectedObject.gridPos.col}, {selectedObject.gridPos.row})</span>
        <span className="dev-coord-tag">Iso: ({selectedObject.isoPos.x.toFixed(1)}, {selectedObject.isoPos.y.toFixed(1)})</span>
        <span className="dev-coord-tag" style={{ color: '#00e6b4', fontWeight: 'bold' }}>
          Rot: {currentCameraRot}° (Cam: {rotLabels[currentCameraRot % 4]})
        </span>
        <button
          onClick={onCopyView}
          style={{
            background: copied ? '#10b981' : 'rgba(0, 230, 180, 0.15)',
            border: '1px solid #00e6b4',
            color: copied ? '#ffffff' : '#00e6b4',
            borderRadius: '4px',
            fontSize: '10px',
            padding: '2px 8px',
            cursor: 'pointer',
            marginLeft: 'auto',
          }}
          title="Copiar resumen rápido de rotación y posición para el Agente"
        >
          {copied ? '✓ Copiado' : '📋 Copiar Vista'}
        </button>
      </div>
    </>
  );
}
