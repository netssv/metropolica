const DISTRICT_ZONES = [
  { id: 'periferia',       startCol: 0,                        endCol: Math.floor(MAP_COLS*0.35)-1, label: 'Periferia' },
  { id: 'centro',          startCol: Math.floor(MAP_COLS*0.35),endCol: Math.floor(MAP_COLS*0.65)-1, label: 'Centro' },
  { id: 'zona_industrial', startCol: Math.floor(MAP_COLS*0.65),endCol: MAP_COLS - 1,                label: 'Zona Industrial' },
];

function toolColor() {
  const MAP = {
    'zone-r': '#86efac', 'zone-c': '#93c5fd', 'zone-i': '#fcd34d',
    road: '#d1d5db', park: '#4ade80', power: '#ffd700', demolish: '#f87171',
  };
  return MAP[currentTool] || '#fff';
}


