'use client';
import { useEffect, useRef, useState } from 'react';
import { useGameContext } from '../hooks/GameContext';
import { copyRenderDiagnostics } from '../lib/renderDiagnostics';
import { useMapCamera } from './canvasMap/useMapCamera';
import { useMapRenderer } from './canvasMap/useMapRenderer';
import { useMapInteraction } from './canvasMap/useMapInteraction';
import CitizenInspector from './CitizenInspector';
import HouseInspector from './HouseInspector';

const TILE_TYPE_LABELS: Record<string, string> = {
  'grass': 'Terreno Vacío',
  'water': 'Cuerpo de Agua',
  'road': 'Calle de la Ciudad',
  'bridge': 'Puente de la Ciudad',
  'tree': 'Arboleda',
  'park': 'Parque Público',
  'sand': 'Arena / Costa',
  'zone-r': 'Zonificación Residencial',
  'zone-c': 'Zonificación Comercial',
  'zone-i': 'Zonificación Industrial',
  'bldg-r': 'Edificio Residencial',
  'bldg-c': 'Edificio Comercial',
  'bldg-i': 'Edificio Industrial (Fábrica)',
  'power': 'Central Eléctrica',
};

const SPECIALTY_LABELS: Record<string, string> = {
  'fish-market': 'Mercado de Mariscos',
  'pier': 'Muelle / Embarcadero',
  'customs': 'Aduana Portuaria',
  'water-treatment': 'Planta de Tratamiento de Agua',
  'hospital': 'Hospital de la Ciudad',
  'mall-government': 'Centro Gubernamental',
};

function getFriendlyTileLabel(tile: any): string {
  if (tile.specialty && SPECIALTY_LABELS[tile.specialty]) {
    return SPECIALTY_LABELS[tile.specialty];
  }
  return TILE_TYPE_LABELS[tile.type] || tile.type;
}

export default function CanvasMap() {
  const { tileMapRef, currentTool, setCurrentTool, selectedSpecialty, setSelectedSpecialty, fetchState, simState, mapCols, mapRows } = useGameContext();
  const canvasRef = useRef<HTMLCanvasElement>(null), miniMapRef = useRef<HTMLCanvasElement>(null), currentToolRef = useRef(currentTool), selectedSpecialtyRef = useRef(selectedSpecialty), simStateRef = useRef(simState), fetchStateRef = useRef(fetchState), selectedEntityRef = useRef<any>(null), hoverRef = useRef({ col: -1, row: -1 });
  currentToolRef.current = currentTool; selectedSpecialtyRef.current = selectedSpecialty; simStateRef.current = simState; fetchStateRef.current = fetchState;
  const camera = useMapCamera(canvasRef, mapCols, mapRows); const [selectedEntity, setSelectedEntity] = useState<any>(null); const [miniVisible, setMiniVisible] = useState(false); const [miniPosition, setMiniPosition] = useState<{ x: number | null; y: number }>({ x: null, y: 58 }); const miniDraggingRef = useRef(false), miniWindowDragRef = useRef<any>(null); selectedEntityRef.current = selectedEntity;
  const renderer = useMapRenderer({ canvasRef, miniMapRef, tileMapRef, simStateRef, mapCols, mapRows, camera, currentToolRef, selectedEntityRef, hoverRef });
  const selectCitizen = (citizen: any) => {
    setSelectedEntity({ kind: 'citizen', value: citizen });
    const destination = citizen.homeTile ?? citizen.workTile;
    if (destination) camera.follow(destination.col, destination.row);
  };
  useMapInteraction({ canvasRef, camera, tileMapRef, simStateRef, currentToolRef, selectedSpecialtyRef, renderer, mapCols, mapRows, fetchStateRef, setCurrentTool, setSelectedSpecialty, setSelectedEntity, hoverRef });

  const [isFading, setIsFading] = useState(false);
  const fadeTimerRef = useRef<any>(null);

  const startFadeTimer = () => {
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    fadeTimerRef.current = setTimeout(() => {
      setIsFading(true);
      fadeTimerRef.current = setTimeout(() => {
        setSelectedEntity(null);
        setIsFading(false);
      }, 500);
    }, 5000);
  };

  const resetFadeTimer = () => {
    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
    setIsFading(false);
  };

  useEffect(() => {
    if (selectedEntity) {
      setIsFading(false);
      startFadeTimer();
    } else {
      resetFadeTimer();
    }
    return () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, [selectedEntity]);

  return <><canvas ref={canvasRef} id="city-canvas" tabIndex={0} /><div className="map-rotation-controls" aria-label="Rotar vista del mapa"><button onClick={() => camera.rotateBy(-1)} title="Rotar a la izquierda (Q)">↶</button><button onClick={() => camera.rotateBy(1)} title="Rotar a la derecha (E)">↷</button></div><button className="render-diagnostics-copy" onClick={() => copyRenderDiagnostics().catch(() => undefined)}>Copiar diagnóstico</button>{!miniVisible && <button className="minimap-show" onClick={() => setMiniVisible(true)}>Mostrar minimapa</button>}{miniVisible && <div className="test-minimap" style={{ left: miniPosition.x ?? undefined, right: miniPosition.x === null ? 16 : undefined, top: miniPosition.y }}><div className="minimap-header" onPointerDown={e => { const rect = e.currentTarget.parentElement!.getBoundingClientRect(); miniWindowDragRef.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top }; e.currentTarget.setPointerCapture(e.pointerId); }} onPointerMove={e => { if (miniWindowDragRef.current) setMiniPosition({ x: Math.max(0, e.clientX - miniWindowDragRef.current.dx), y: Math.max(0, e.clientY - miniWindowDragRef.current.dy) }); }} onPointerUp={() => { miniWindowDragRef.current = null; }}><span>MINIMAP · clic/arrastre</span><button onPointerDown={e => e.stopPropagation()} onClick={() => setMiniVisible(false)}>Ocultar</button></div><canvas ref={miniMapRef} width={288} height={216} /></div>}{selectedEntity && <div className={`inspector-wrapper ${isFading ? 'fade-out' : ''}`} onMouseEnter={resetFadeTimer} onMouseLeave={startFadeTimer} onClick={resetFadeTimer} onFocus={resetFadeTimer}>{selectedEntity.kind === 'citizen' && <CitizenInspector citizen={selectedEntity.value} hour={simState?.hour ?? 0} onClose={() => setSelectedEntity(null)} />}{selectedEntity.kind === 'house' && <HouseInspector house={selectedEntity.value} onClose={() => setSelectedEntity(null)} onSelectCitizen={selectCitizen} />}{selectedEntity.kind === 'tile' && <div className="citizen-inspector house-inspector"><button className="inspector-close" onClick={() => setSelectedEntity(null)} aria-label="Cerrar">×</button><small className="inspector-eyebrow">ELEMENTO DEL MAPA</small><strong className="inspector-title">{getFriendlyTileLabel(selectedEntity.value)}</strong><div className="inspector-location">⌖ {selectedEntity.value.owner ?? 'Sin distrito'} <small>({selectedEntity.value.col}, {selectedEntity.value.row})</small></div></div>}</div>}</>;
}
