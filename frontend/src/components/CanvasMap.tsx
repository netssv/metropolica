'use client';
import { useRef, useState } from 'react';
import { useGameContext } from '../hooks/GameContext';
import { copyRenderDiagnostics } from '../lib/renderDiagnostics';
import { useMapCamera } from './canvasMap/useMapCamera';
import { useMapRenderer } from './canvasMap/useMapRenderer';
import { useMapInteraction } from './canvasMap/useMapInteraction';
import CitizenInspector from './CitizenInspector';

export default function CanvasMap() {
  const { tileMapRef, currentTool, setCurrentTool, fetchState, simState, mapCols, mapRows } = useGameContext();
  const canvasRef = useRef<HTMLCanvasElement>(null), miniMapRef = useRef<HTMLCanvasElement>(null), currentToolRef = useRef(currentTool), simStateRef = useRef(simState), fetchStateRef = useRef(fetchState), selectedEntityRef = useRef<any>(null), hoverRef = useRef({ col: -1, row: -1 });
  currentToolRef.current = currentTool; simStateRef.current = simState; fetchStateRef.current = fetchState;
  const camera = useMapCamera(canvasRef, mapCols, mapRows); const [selectedEntity, setSelectedEntity] = useState<any>(null); const [miniVisible, setMiniVisible] = useState(false); const [miniPosition, setMiniPosition] = useState<{ x: number | null; y: number }>({ x: null, y: 58 }); const miniDraggingRef = useRef(false), miniWindowDragRef = useRef<any>(null); selectedEntityRef.current = selectedEntity;
  const renderer = useMapRenderer({ canvasRef, miniMapRef, tileMapRef, simStateRef, mapCols, mapRows, camera, currentToolRef, selectedEntityRef, hoverRef });
  useMapInteraction({ canvasRef, camera, tileMapRef, simStateRef, currentToolRef, renderer, mapCols, mapRows, fetchStateRef, setCurrentTool, setSelectedEntity, hoverRef });
  return <><canvas ref={canvasRef} id="city-canvas" tabIndex={0} /><button className="render-diagnostics-copy" onClick={() => copyRenderDiagnostics().catch(() => undefined)}>Copiar diagnóstico</button>{!miniVisible && <button className="minimap-show" onClick={() => setMiniVisible(true)}>Mostrar minimapa</button>}{miniVisible && <div className="test-minimap" style={{ left: miniPosition.x ?? undefined, right: miniPosition.x === null ? 16 : undefined, top: miniPosition.y }}><div className="minimap-header" onPointerDown={e => { const rect = e.currentTarget.parentElement!.getBoundingClientRect(); miniWindowDragRef.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top }; e.currentTarget.setPointerCapture(e.pointerId); }} onPointerMove={e => { if (miniWindowDragRef.current) setMiniPosition({ x: Math.max(0, e.clientX - miniWindowDragRef.current.dx), y: Math.max(0, e.clientY - miniWindowDragRef.current.dy) }); }} onPointerUp={() => { miniWindowDragRef.current = null; }}><span>MINIMAP · clic/arrastre</span><button onPointerDown={e => e.stopPropagation()} onClick={() => setMiniVisible(false)}>Ocultar</button></div><canvas ref={miniMapRef} width={288} height={216} /></div>}{selectedEntity?.kind === 'citizen' && <CitizenInspector citizen={selectedEntity.value} hour={simState?.hour ?? 0} onClose={() => setSelectedEntity(null)} />}{selectedEntity?.kind === 'tile' && <div className="citizen-inspector"><button onClick={() => setSelectedEntity(null)}>×</button><strong>Elemento del mapa</strong><span>Tipo: {selectedEntity.value.type}</span><span>Coordenadas: ({selectedEntity.value.col}, {selectedEntity.value.row})</span><span>Distrito: {selectedEntity.value.owner ?? '—'}</span></div>}</>;
}
