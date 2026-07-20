function evolveCityNaturally() {
  let count = 0;
  for (let r = 0; r < MAP_ROWS && count < 8; r++) {
    for (let c = 0; c < MAP_COLS && count < 8; c++) {
      const t = tileMap[r][c];
      if (t.type === T.ZONE_R && Math.random() > 0.7) { t.type = T.BLDG_R; t.level = 1; count++; }
      else if (t.type === T.ZONE_C && Math.random() > 0.65) { t.type = T.BLDG_C; t.level = 1; count++; }
      else if (t.type === T.ZONE_I && Math.random() > 0.75) { t.type = T.BLDG_I; t.level = 1; count++; }
      else if ((t.type === T.BLDG_R || t.type === T.BLDG_C || t.type === T.BLDG_I) && t.level < 4 && Math.random() > 0.85) {
        t.level++; count++;
      }
    }
  }
  if (count > 0) saveMap();
}

// Start the game when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// ═══════════════════════════════════════════════════════════════════
//  METROPOLICA — Full-Screen City Builder Game Engine
// ═══════════════════════════════════════════════════════════════════

// ── CAMERA ──


function screenToWorld(sx, sy) {
  return { x: sx / cam.zoom + cam.x, y: sy / cam.zoom + cam.y };
}
function worldToTile(wx, wy) {
  return { col: Math.floor(wx / TILE_SIZE), row: Math.floor(wy / TILE_SIZE) };
}
function clampCam() {
  const sw = gameCanvas.width  / cam.zoom;
  const sh = gameCanvas.height / cam.zoom;
  cam.x = clamp(cam.x, 0, Math.max(0, MAP_W - sw));
  cam.y = clamp(cam.y, 0, Math.max(0, MAP_H - sh));
}

function zoomAt(sx, sy, factor) {
  const wb = screenToWorld(sx, sy);
  cam.zoom = clamp(cam.zoom * factor, cam.minZoom, cam.maxZoom);
  const wa = screenToWorld(sx, sy);
  cam.x += wb.x - wa.x;
  cam.y += wb.y - wa.y;
  clampCam();
  document.getElementById('zoom-label').textContent = `${Math.round(cam.zoom * 100)}%`;
}
function zoomIn()  { zoomAt(window.innerWidth/2, window.innerHeight/2, 1.2); }
function zoomOut() { zoomAt(window.innerWidth/2, window.innerHeight/2, 0.83); }

// ── PEDESTRIANS ──


function pedColor(owner) {
  if (owner === 'centro')          return '#a5f3fc';
  if (owner === 'zona_industrial') return '#fbbf24';
  return '#86efac'; // periferia
}

function spawnPedestrians() {
  pedestrians = [];
  const roads = [];
  for (let r = 0; r < MAP_ROWS; r++)
    for (let c = 0; c < MAP_COLS; c++) {
      const t = tileMap[r]?.[c];
      if (t && (t.type === T.ROAD || t.type === T.BRIDGE)) roads.push([c, r]);
    }
  if (roads.length === 0) return;

  const count = Math.min(300, Math.floor(roads.length * 0.35));
  for (let i = 0; i < count; i++) {
    const [tc, tr] = roads[Math.floor(Math.random() * roads.length)];
    pedestrians.push({
      x: tc + 0.3 + Math.random() * 0.4,
      y: tr + 0.3 + Math.random() * 0.4,
      dir: Math.floor(Math.random() * 4),
      speed: 0.5 + Math.random() * 0.9,
      stepTimer: Math.random() * 0.6,
      stepDuration: 0.3 + Math.random() * 0.8,
      color: pedColor(ownerForCol(tc)),
    });
  }
}

function updatePedestrians(dt) {
  pedestrians.forEach(p => {
    p.stepTimer += dt;
    if (p.stepTimer >= p.stepDuration) {
      p.stepTimer = 0;
      p.stepDuration = 0.25 + Math.random() * 0.7;

      const col = Math.round(p.x - 0.5);
      const row = Math.round(p.y - 0.5);

      const valid = [];
      DIRS4.forEach(([dx, dy], d) => {
        const nc = col+dx, nr = row+dy;
        if (nc >= 0 && nc < MAP_COLS && nr >= 0 && nr < MAP_ROWS) {
          const tt = tileMap[nr]?.[nc]?.type;
          if (tt === T.ROAD || tt === T.BRIDGE || tt === T.PARK) valid.push(d);
        }
      });

      if (valid.length > 0) {
        const stay = valid.includes(p.dir) && Math.random() > 0.38;
        if (!stay) p.dir = valid[Math.floor(Math.random() * valid.length)];
      } else {
        p.dir = (p.dir + 2) % 4;
      }
    }

    const [dx, dy] = DIRS4[p.dir];
    p.x = clamp(p.x + dx * p.speed * dt, 0, MAP_COLS - 1);
    p.y = clamp(p.y + dy * p.speed * dt, 0, MAP_ROWS - 1);
  });
}


function drawDistrictOverlay(ctx, ts, startR, endR) {
  const boundaries = [
    Math.floor(MAP_COLS * 0.35),
    Math.floor(MAP_COLS * 0.65),
  ];

  // Boundary lines
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth   = 1.5;
  ctx.setLineDash([5, 5]);
  boundaries.forEach(bc => {
    ctx.beginPath();
    ctx.moveTo(bc * ts, 0);
    ctx.lineTo(bc * ts, MAP_H);
    ctx.stroke();
  });
  ctx.setLineDash([]);

  // Zone labels (only once per zone, at top)
  DISTRICT_ZONES.forEach(z => {
    const zw  = (z.endCol - z.startCol + 1) * ts;
    const cx  = (z.startCol + (z.endCol - z.startCol + 1) / 2) * ts;
    const cy  = startR * ts + ts * 0.5;
    const txt = z.label;
    ctx.font  = `bold ${Math.max(9, Math.round(ts * 0.44))}px system-ui`;
    const tw  = ctx.measureText(txt).width + 18;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(cx - tw/2, cy - 12, tw, 20);
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(txt, cx, cy - 2);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  });
}
