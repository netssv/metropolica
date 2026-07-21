// ── Tile map ──

// tileMap[row][col] = { type, owner, level, age }
let tileMap = [];


// ── MAP GENERATION ──


function ownerForCol(c) {
  if (c < Math.floor(MAP_COLS * 0.35)) return 'periferia';
  if (c < Math.floor(MAP_COLS * 0.65)) return 'centro';
  return 'zona_industrial';
}

function isRoadOrBridge(t) {
  return t && (t.type === T.ROAD || t.type === T.BRIDGE);
}

function initTileMap() {
  // 1. Fill with grass
  tileMap = Array.from({ length: MAP_ROWS }, (_, r) =>
    Array.from({ length: MAP_COLS }, (_, c) => ({
      type: T.GRASS, owner: ownerForCol(c), level: 0, age: 0,
    }))
  );

  // 2. Meandering rivers (two streams that merge)
  let r1 = Math.floor(MAP_COLS * 0.40);
  let r2 = Math.floor(MAP_COLS * 0.42);
  for (let row = 0; row < MAP_ROWS; row++) {
    r1 += Math.round(Math.sin(row * 0.3) * 0.7 + (seededRand(row*7+1) - 0.5) * 0.6);
    r1 = clamp(r1, Math.floor(MAP_COLS*0.36), Math.floor(MAP_COLS*0.44));
    r2 = r1 + 2;
    for (let w = r1; w <= r2 + 1; w++) {
      if (w >= 0 && w < MAP_COLS) tileMap[row][w].type = T.WATER;
    }
    // sand banks
    if (r1 - 1 >= 0 && tileMap[row][r1-1].type === T.GRASS && seededRand(row*11) > 0.4)
      tileMap[row][r1-1].type = T.SAND;
    if (r2 + 2 < MAP_COLS && tileMap[row][r2+2].type === T.GRASS && seededRand(row*13) > 0.4)
      tileMap[row][r2+2].type = T.SAND;
  }

  // 3. Road grid
  const hRoads = []; const vRoads = [];
  for (let r = 6; r < MAP_ROWS; r += 9)  { hRoads.push(r); }
  for (let c = 7; c < MAP_COLS; c += 11) { vRoads.push(c); }

  hRoads.forEach(row => {
    for (let c = 0; c < MAP_COLS; c++) {
      const t = tileMap[row][c];
      t.type = (t.type === T.WATER) ? T.BRIDGE : T.ROAD;
    }
  });
  vRoads.forEach(col => {
    for (let r = 0; r < MAP_ROWS; r++) {
      const t = tileMap[r][col];
      if (t.type !== T.ROAD) t.type = (t.type === T.WATER) ? T.BRIDGE : T.ROAD;
    }
  });

  // 4. Forest clusters (left area — Periferia)
  for (let i = 0; i < 80; i++) {
    const cc = Math.floor(seededRand(i*17+1) * Math.floor(MAP_COLS * 0.32));
    const rr = Math.floor(seededRand(i*17+2) * MAP_ROWS);
    if (tileMap[rr]?.[cc]?.type === T.GRASS) {
      tileMap[rr][cc].type = T.TREE;
      [[0,1],[1,0],[-1,0],[0,-1],[1,1],[-1,-1]].forEach(([dc,dr]) => {
        const nc=cc+dc, nr=rr+dr;
        if (nr>=0 && nr<MAP_ROWS && nc>=0 && nc<MAP_COLS && tileMap[nr][nc].type===T.GRASS && seededRand(i*17+dc*3+dr*7) > 0.45)
          tileMap[nr][nc].type = T.TREE;
      });
    }
  }

  // 5. Zones around roads
  for (let row = 0; row < MAP_ROWS; row++) {
    for (let col = 0; col < MAP_COLS; col++) {
      const t = tileMap[row][col];
      if (t.type !== T.GRASS) continue;
      if (!nearRoad(col, row, 2)) continue;
      const s = seededRand(col*1009 + row*503);
      const owner = t.owner;
      if (s < 0.40) {
        if (owner === 'periferia') t.type = T.ZONE_R;
        else if (owner === 'centro') t.type = s < 0.20 ? T.ZONE_R : T.ZONE_C;
        else t.type = s < 0.15 ? T.ZONE_R : T.ZONE_I;
      }
    }
  }

  // 6. Evolve zones → buildings (initial state — city already exists)
  for (let row = 0; row < MAP_ROWS; row++) {
    for (let col = 0; col < MAP_COLS; col++) {
      const t = tileMap[row][col];
      const s = seededRand(col*997 + row*499 + 7);
      if (t.type === T.ZONE_R && s > 0.35) {
        t.type = T.BLDG_R; t.level = 1 + Math.floor(seededRand(col+row*2)*3);
      } else if (t.type === T.ZONE_C && s > 0.25) {
        t.type = T.BLDG_C; t.level = 1 + Math.floor(seededRand(col*2+row)*4);
      } else if (t.type === T.ZONE_I && s > 0.45) {
        t.type = T.BLDG_I; t.level = 1 + Math.floor(seededRand(col+row*3)*2);
      }
    }
  }

  // 7. Power lines
  const pwCol = Math.floor(MAP_COLS * 0.66);
  for (let row = 0; row < MAP_ROWS; row++) {
    if (tileMap[row][pwCol]?.type === T.GRASS) tileMap[row][pwCol].type = T.POWER;
  }
}

function nearRoad(col, row, radius) {
  for (let dc = -radius; dc <= radius; dc++) {
    for (let dr = -radius; dr <= radius; dr++) {
      const t = tileMap[row+dr]?.[col+dc];
      if (t && (t.type === T.ROAD || t.type === T.BRIDGE)) return true;
    }
  }
  return false;
}

// Deterministic seeded rand (0..1)
function seededRand(seed) {
  let x = Math.sin(seed + 1) * 43758.5453123;
  return x - Math.floor(x);
}
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }


