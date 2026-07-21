'use client';
import { useGameContext } from '../hooks/GameContext';
import { TOOL_COSTS } from '../lib/constants';

export default function Sidebar() {
  const { currentTool, setCurrentTool, selectedSpecialty, setSelectedSpecialty } = useGameContext();
  const selectTool = (tool: string) => { setCurrentTool(tool); setSelectedSpecialty(undefined); };
  const selectCommercialSpecialty = (specialty: 'hospital' | 'mall-government') => {
    setCurrentTool('zone-c'); setSelectedSpecialty(specialty);
  };

  return (
    <div id="hud-toolbar">
      <div className="tool-section">
        <div className="tool-sec-label">VISTA</div>
        <button className={`tool-btn ${currentTool === 'cursor' ? 'active' : ''}`} onClick={() => selectTool('cursor')}>
          <span className="tool-ico">🖱️</span><span className="tool-name">Inspector</span>
        </button>
      </div>

      <div className="tool-section">
        <div className="tool-sec-label">ZONAS</div>
        <button className={`tool-btn ${currentTool === 'zone-r' ? 'active' : ''}`} onClick={() => selectTool('zone-r')}>
          <span className="tool-ico">🏠</span><span className="tool-name">Residencial</span><span className="tool-cost">$100</span>
        </button>
        <button className={`tool-btn ${currentTool === 'zone-c' && !selectedSpecialty ? 'active' : ''}`} onClick={() => selectTool('zone-c')}>
          <span className="tool-ico">🏪</span><span className="tool-name">Comercial</span><span className="tool-cost">$150</span>
        </button>
        <button className={`tool-btn tool-sub-btn ${selectedSpecialty === 'hospital' ? 'active' : ''}`} onClick={() => selectCommercialSpecialty('hospital')}>
          <span className="tool-ico">🏥</span><span className="tool-name">Hospital</span><span className="tool-cost">$150</span>
        </button>
        <button className={`tool-btn tool-sub-btn ${selectedSpecialty === 'mall-government' ? 'active' : ''}`} onClick={() => selectCommercialSpecialty('mall-government')}>
          <span className="tool-ico">🏛️</span><span className="tool-name">Mall/Gobierno</span><span className="tool-cost">$150</span>
        </button>
        <button className={`tool-btn ${currentTool === 'zone-i' ? 'active' : ''}`} onClick={() => selectTool('zone-i')}>
          <span className="tool-ico">🏭</span><span className="tool-name">Industrial</span><span className="tool-cost">$200</span>
        </button>
      </div>

      <div className="tool-section">
        <div className="tool-sec-label">INFRAESTRUCTURA</div>
        <button className={`tool-btn ${currentTool === 'road' ? 'active' : ''}`} onClick={() => selectTool('road')}>
          <span className="tool-ico">🛣️</span><span className="tool-name">Calle</span><span className="tool-cost">$50</span>
        </button>
        <button className={`tool-btn ${currentTool === 'park' ? 'active' : ''}`} onClick={() => selectTool('park')}>
          <span className="tool-ico">🌳</span><span className="tool-name">Parque</span><span className="tool-cost">$75</span>
        </button>
        <button className={`tool-btn ${currentTool === 'power' ? 'active' : ''}`} onClick={() => selectTool('power')}>
          <span className="tool-ico">⚡</span><span className="tool-name">Central</span><span className="tool-cost">$500</span>
        </button>
      </div>

      <div className="tool-section">
        <div className="tool-sec-label">DEMO</div>
        <button className={`tool-btn tool-danger ${currentTool === 'demolish' ? 'active' : ''}`} onClick={() => selectTool('demolish')}>
          <span className="tool-ico">💥</span><span className="tool-name">Demoler</span><span className="tool-cost">$25</span>
        </button>
      </div>
      
      <div className="toolbar-hint">Rueda: zoom · Drag: mover</div>
    </div>
  );
}
