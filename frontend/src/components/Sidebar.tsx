'use client';
import { useGameContext } from '../hooks/GameContext';
import { TOOL_COSTS } from '../lib/constants';

export default function Sidebar() {
  const { currentTool, setCurrentTool } = useGameContext();

  return (
    <div id="hud-toolbar">
      <div className="tool-section">
        <div className="tool-sec-label">VISTA</div>
        <button className={`tool-btn ${currentTool === 'cursor' ? 'active' : ''}`} onClick={() => setCurrentTool('cursor')}>
          <span className="tool-ico">🖱️</span><span className="tool-name">Inspector</span>
        </button>
      </div>

      <div className="tool-section">
        <div className="tool-sec-label">ZONAS</div>
        <button className={`tool-btn ${currentTool === 'zone-r' ? 'active' : ''}`} onClick={() => setCurrentTool('zone-r')}>
          <span className="tool-ico">🏠</span><span className="tool-name">Residencial</span><span className="tool-cost">$100</span>
        </button>
        <button className={`tool-btn ${currentTool === 'zone-c' ? 'active' : ''}`} onClick={() => setCurrentTool('zone-c')}>
          <span className="tool-ico">🏪</span><span className="tool-name">Comercial</span><span className="tool-cost">$150</span>
        </button>
        <button className={`tool-btn ${currentTool === 'zone-i' ? 'active' : ''}`} onClick={() => setCurrentTool('zone-i')}>
          <span className="tool-ico">🏭</span><span className="tool-name">Industrial</span><span className="tool-cost">$200</span>
        </button>
      </div>

      <div className="tool-section">
        <div className="tool-sec-label">INFRA</div>
        <button className={`tool-btn ${currentTool === 'road' ? 'active' : ''}`} onClick={() => setCurrentTool('road')}>
          <span className="tool-ico">🛣️</span><span className="tool-name">Calle</span><span className="tool-cost">$50</span>
        </button>
        <button className={`tool-btn ${currentTool === 'park' ? 'active' : ''}`} onClick={() => setCurrentTool('park')}>
          <span className="tool-ico">🌳</span><span className="tool-name">Parque</span><span className="tool-cost">$75</span>
        </button>
        <button className={`tool-btn ${currentTool === 'power' ? 'active' : ''}`} onClick={() => setCurrentTool('power')}>
          <span className="tool-ico">⚡</span><span className="tool-name">Central</span><span className="tool-cost">$500</span>
        </button>
      </div>

      <div className="tool-section">
        <div className="tool-sec-label">DEMO</div>
        <button className={`tool-btn tool-danger ${currentTool === 'demolish' ? 'active' : ''}`} onClick={() => setCurrentTool('demolish')}>
          <span className="tool-ico">💥</span><span className="tool-name">Demoler</span><span className="tool-cost">$25</span>
        </button>
      </div>
      
      <div className="toolbar-hint">Rueda: zoom · Drag: mover</div>
    </div>
  );
}
