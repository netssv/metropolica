// ── Map constants ──

const MAP_COLS   = 96;
const MAP_ROWS   = 72;
const TILE_SIZE  = 24;        // world units per tile
const MAP_W      = MAP_COLS * TILE_SIZE;
const MAP_H      = MAP_ROWS  * TILE_SIZE;

// Tile type strings
const T = {
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

const TOOL_COSTS = {
  'zone-r': 100, 'zone-c': 150, 'zone-i': 200,
  road: 50, park: 75, power: 500, demolish: 25,
};

// ── Global state ──

let simState    = {};
let citizensMap = {};
let currentFilter = 'all';
let currentSelectedCitizenId = null;
let activeDashTab  = 'districts';
let dashboardOpen  = false;
let currentTool    = 'cursor';
// Treasury is read from simState.treasury (real simulation snapshot) — no local copy.


// ── Tile map ──

// tileMap[row][col] = { type, owner, level, age }
let tileMap = [];
