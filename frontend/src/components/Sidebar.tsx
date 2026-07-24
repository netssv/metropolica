'use client';
import { useState, type ReactNode } from 'react';
import { useGameContext } from '../hooks/GameContext';
import { TOOL_COSTS } from '../lib/constants';

const money = (amount: number) => `$${(amount ?? 0).toLocaleString('en-US')}`;

function MenuGroup({ title, icon, open, onToggle, children }: { title: string; icon: string; open: boolean; onToggle: () => void; children: ReactNode }) {
  return <section className={`build-group ${open ? 'open' : ''}`}>
    <button className="build-group-toggle" onClick={onToggle} aria-expanded={open}>
      <span>{icon}</span><span>{title}</span><span className="build-chevron">⌄</span>
    </button>
    {open && <div className="build-group-items">{children}</div>}
  </section>;
}

function FutureTool({ icon, name }: { icon: string; name: string }) {
  return <button className="tool-btn tool-future" disabled title="Disponible cuando se conecte la simulación">
    <span className="tool-ico">{icon}</span><span className="tool-name">{name}</span><span className="tool-soon">PRONTO</span>
  </button>;
}

export default function Sidebar() {
  const { currentTool, setCurrentTool, selectedSpecialty, setSelectedSpecialty } = useGameContext();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ zones: true, services: true, mobility: false, public: false, utilities: false });
  const toggle = (group: string) => setOpenGroups(current => ({ ...current, [group]: !current[group] }));
  const selectTool = (tool: string) => { setCurrentTool(tool); setSelectedSpecialty(undefined); };
  const selectCommercialSpecialty = (specialty: 'hospital' | 'mall-government' | 'bank') => { setCurrentTool('zone-c'); setSelectedSpecialty(specialty); };

  return <aside id="hud-toolbar" aria-label="Menú de construcción de la ciudad">
    <div className="toolbar-title"><span>CONSTRUIR</span><small>Ciudad y servicios</small></div>

    <div className="tool-section toolbar-inspector">
      <button className={`tool-btn ${currentTool === 'cursor' ? 'active' : ''}`} onClick={() => selectTool('cursor')}>
        <span className="tool-ico">🖱️</span><span className="tool-name">Inspector</span>
      </button>
    </div>

    <MenuGroup title="Zonas" icon="▦" open={openGroups.zones} onToggle={() => toggle('zones')}>
      <button className={`tool-btn ${currentTool === 'zone-r' ? 'active' : ''}`} onClick={() => selectTool('zone-r')}><span className="tool-ico">🏠</span><span className="tool-name">Residencial</span><span className="tool-cost">{money(TOOL_COSTS['zone-r'])}</span></button>
      <button className={`tool-btn ${currentTool === 'zone-c' && !selectedSpecialty ? 'active' : ''}`} onClick={() => selectTool('zone-c')}><span className="tool-ico">🏪</span><span className="tool-name">Comercial</span><span className="tool-cost">{money(TOOL_COSTS['zone-c'])}</span></button>
      <button className={`tool-btn ${currentTool === 'zone-i' ? 'active' : ''}`} onClick={() => selectTool('zone-i')}><span className="tool-ico">🏭</span><span className="tool-name">Industrial</span><span className="tool-cost">{money(TOOL_COSTS['zone-i'])}</span></button>
      <FutureTool icon="🌾" name="Agrícola" />
    </MenuGroup>

    <MenuGroup title="Servicios públicos" icon="✚" open={openGroups.services} onToggle={() => toggle('services')}>
      <button className={`tool-btn ${selectedSpecialty === 'hospital' ? 'active' : ''}`} onClick={() => selectCommercialSpecialty('hospital')}><span className="tool-ico">🏥</span><span className="tool-name">Hospital</span><span className="tool-cost">{money(TOOL_COSTS.hospital)}</span></button>
      <button className={`tool-btn ${selectedSpecialty === 'mall-government' ? 'active' : ''}`} onClick={() => selectCommercialSpecialty('mall-government')}><span className="tool-ico">🏛️</span><span className="tool-name">Centro cívico</span><span className="tool-cost">{money(TOOL_COSTS['mall-government'])}</span></button>
      <button className={`tool-btn ${selectedSpecialty === 'bank' ? 'active' : ''}`} onClick={() => selectCommercialSpecialty('bank')}><span className="tool-ico">🏦</span><span className="tool-name">Banco</span><span className="tool-cost">{money(TOOL_COSTS.bank)}</span></button>
      <FutureTool icon="🏫" name="Escuela" /><FutureTool icon="🚓" name="Policía" /><FutureTool icon="🚒" name="Bomberos" />
    </MenuGroup>

    <MenuGroup title="Movilidad" icon="↔" open={openGroups.mobility} onToggle={() => toggle('mobility')}>
      <button className={`tool-btn ${currentTool === 'road' ? 'active' : ''}`} onClick={() => selectTool('road')}><span className="tool-ico">🛣️</span><span className="tool-name">Calle</span><span className="tool-cost">{money(TOOL_COSTS.road)}</span></button>
      <FutureTool icon="🚌" name="Parada de bus" /><FutureTool icon="🚉" name="Terminal" />
    </MenuGroup>

    <MenuGroup title="Espacio público" icon="☘" open={openGroups.public} onToggle={() => toggle('public')}>
      <button className={`tool-btn ${currentTool === 'park' ? 'active' : ''}`} onClick={() => selectTool('park')}><span className="tool-ico">🌳</span><span className="tool-name">Parque</span><span className="tool-cost">{money(TOOL_COSTS.park)}</span></button>
      <FutureTool icon="⛲" name="Plaza" /><FutureTool icon="♻️" name="Reciclaje" />
    </MenuGroup>

    <MenuGroup title="Infraestructura" icon="⚡" open={openGroups.utilities} onToggle={() => toggle('utilities')}>
      <button className={`tool-btn ${currentTool === 'power' ? 'active' : ''}`} onClick={() => selectTool('power')}><span className="tool-ico">⚡</span><span className="tool-name">Central eléctrica</span><span className="tool-cost">{money(TOOL_COSTS.power)}</span></button>
      <FutureTool icon="🚰" name="Agua potable" /><FutureTool icon="🧹" name="Saneamiento" />
    </MenuGroup>

    <div className="tool-section toolbar-demolish"><button className={`tool-btn tool-danger ${currentTool === 'demolish' ? 'active' : ''}`} onClick={() => selectTool('demolish')}><span className="tool-ico">💥</span><span className="tool-name">Demoler</span><span className="tool-cost">{money(TOOL_COSTS.demolish)}</span></button></div>
    <div className="toolbar-hint">Haz clic para elegir · rueda para zoom · arrastra para mover</div>
  </aside>;
}
