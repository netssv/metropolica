export const MAP_COLS   = 96;
export const MAP_ROWS   = 72;
export const TILE_SIZE  = 24;
export const MAP_W      = MAP_COLS * TILE_SIZE;
export const MAP_H      = MAP_ROWS  * TILE_SIZE;

export const T = {
  GRASS:  'grass',
  WATER:  'water',
  ROAD:   'road',
  BRIDGE: 'bridge',
  TREE:   'tree',
  PARK:   'park',
  SAND:   'sand',
  ZONE_R: 'zone-r',
  ZONE_C: 'zone-c',
  ZONE_I: 'zone-i',
  BLDG_R: 'bldg-r',
  BLDG_C: 'bldg-c',
  BLDG_I: 'bldg-i',
  POWER:  'power',
};

export const DEVELOPMENT_ECONOMY = {
  construction: {
    'zone-r': 50,
    'zone-c': 80,
    'zone-i': 120,
    road: 20,
    park: 100,
    power: 1500,
    demolish: 10,
  }
};

export const TOOL_COSTS: Record<string, number> = { ...DEVELOPMENT_ECONOMY.construction };

export const DISTRICT_ZONES = [
  { id: 'periferia',       startCol: 0,                        endCol: Math.floor(MAP_COLS*0.35)-1, label: 'Periferia' },
  { id: 'centro',          startCol: Math.floor(MAP_COLS*0.35),endCol: Math.floor(MAP_COLS*0.65)-1, label: 'Centro' },
  { id: 'zona_industrial', startCol: Math.floor(MAP_COLS*0.65),endCol: MAP_COLS - 1,                label: 'Zona Industrial' },
];

export function toolColor(currentTool: string) {
  const MAP: Record<string, string> = {
    'zone-r': '#5cbb7a', 'zone-c': '#2aab8c', 'zone-i': '#d4822a',
    road: '#c8c0b0', park: '#4caa66', power: '#d4aa30', demolish: '#e0513a',
  };
  return MAP[currentTool] || '#fff';
}
