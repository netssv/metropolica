// Helper math
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

// ── Map constants ──

const MAP_COLS   = 96;
const MAP_ROWS   = 72;
const TILE_SIZE  = 24;        // world units per tile
const MAP_W      = MAP_COLS * TILE_SIZE;
const MAP_H      = MAP_ROWS  * TILE_SIZE;

// Tile type strings
const T = {
  GRASS:     'grass',
  WATER:     'water',
  ROAD:      'road',
  BRIDGE:    'bridge',
  TREE:      'tree',
  PARK:      'park',
  SAND:      'sand',
  ZONE_R:    'zone-r',
  ZONE_C:    'zone-c',
  ZONE_I:    'zone-i',
  BLDG_R:    'bldg-r',
  BLDG_C:    'bldg-c',
  BLDG_I:    'bldg-i',
  POWER:     'power',
  POLICE:    'police',
  FIRE:      'fire',
  HOSPITAL:  'hospital',
  SCHOOL:    'school',
  CITY_HALL: 'city_hall',
  MARKET:    'market',
  TRANSIT:   'transit',
  STADIUM:   'stadium',
  CEMETERY:  'cemetery',
};

const TOOL_COSTS = {
  'zone-r': 100, 'zone-c': 150, 'zone-i': 200,
  road: 50, park: 75, power: 500, demolish: 25,
  police: 800, fire: 700, hospital: 1200, school: 600,
  city_hall: 1500, market: 500, transit: 400, stadium: 2000, cemetery: 300,
};


