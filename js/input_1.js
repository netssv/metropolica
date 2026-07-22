// ── INPUT HANDLERS ──


function initInputHandlers() {
  const cv = gameCanvas;

  cv.addEventListener('mousedown', e => {
    if (e.button === 0 || e.button === 1 || e.button === 2) {
      isDragging   = true;
      dragMoved    = false;
      dragStart    = { x: e.clientX, y: e.clientY };
      dragCamStart = { x: cam.x, y: cam.y };
      cv.style.cursor = 'grabbing';
    }
  });

  cv.addEventListener('mousemove', e => {
    if (isDragging) {
      const dx = (e.clientX - dragStart.x) / cam.zoom;
      const dy = (e.clientY - dragStart.y) / cam.zoom;
      if (Math.abs(e.clientX - dragStart.x) + Math.abs(e.clientY - dragStart.y) > 3) dragMoved = true;
      cam.x = dragCamStart.x - dx;
      cam.y = dragCamStart.y - dy;
      clampCam();
    }
    const w = screenToWorld(e.clientX, e.clientY);
    const t = worldToTile(w.x, w.y);
    hoveredTile = (t.col >= 0 && t.col < MAP_COLS && t.row >= 0 && t.row < MAP_ROWS) ? t : null;
  });

  cv.addEventListener('mouseup', e => {
    if (!isDragging) return;
    isDragging = false;
    cv.style.cursor = toolCursor();

    if (!dragMoved) {
      // It was a click, not a pan
      const w = screenToWorld(e.clientX, e.clientY);
      const t = worldToTile(w.x, w.y);
      if (t.col >= 0 && t.col < MAP_COLS && t.row >= 0 && t.row < MAP_ROWS) {
        if (currentTool === 'cursor') {
          inspectTile(t.col, t.row);
        } else {
          placeTile(t.col, t.row);
        }
      }
    }
  });

  cv.addEventListener('mouseleave', () => {
    isDragging  = false;
    hoveredTile = null;
    cv.style.cursor = toolCursor();
  });

  cv.addEventListener('wheel', e => {
    e.preventDefault();
    zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.12 : 0.89);
  }, { passive: false });

  cv.addEventListener('contextmenu', e => e.preventDefault());

  // Keyboard shortcuts
  window.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    switch (e.key) {
      case '1': selectTool('cursor');   break;
      case '2': selectTool('zone-r');   break;
      case '3': selectTool('zone-c');   break;
      case '4': selectTool('zone-i');   break;
      case '5': selectTool('road');     break;
      case '6': selectTool('park');     break;
      case '7': selectTool('power');    break;
      case 'x': case 'X': selectTool('demolish'); break;
      case 'Escape': selectTool('cursor'); closeInspector(); break;
      case '+': case '=': zoomIn();  break;
      case '-': case '_': zoomOut(); break;
      case ' ': e.preventDefault(); toggleDashboard(); break;
    }
  });

  // Touch support (pan + pinch-zoom)
  let lastTouchDist = 0;
  cv.addEventListener('touchstart', e => {
    e.preventDefault();
    if (e.touches.length === 1) {
      isDragging   = true;
      dragMoved    = false;
      dragStart    = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      dragCamStart = { x: cam.x, y: cam.y };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist = Math.sqrt(dx*dx + dy*dy);
    }
  }, { passive: false });

  cv.addEventListener('touchmove', e => {
    e.preventDefault();
    if (e.touches.length === 1 && isDragging) {
      const dx = (e.touches[0].clientX - dragStart.x) / cam.zoom;
      const dy = (e.touches[0].clientY - dragStart.y) / cam.zoom;
      if (Math.abs(dx) + Math.abs(dy) > 3) dragMoved = true;
      cam.x = dragCamStart.x - dx;
      cam.y = dragCamStart.y - dy;
      clampCam();
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      if (lastTouchDist > 0) zoomAt(mx, my, dist / lastTouchDist);
      lastTouchDist = dist;
    }
  }, { passive: false });

  cv.addEventListener('touchend', e => {
    isDragging = false;
  }, { passive: false });
}

function toolCursor() {
  if (currentTool === 'cursor')  return 'grab';
  if (currentTool === 'demolish') return 'crosshair';
  return 'cell';
}


// ── TOOL SYSTEM ──


function selectTool(tool) {
  currentTool = tool;
  document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector(`[data-tool="${tool}"]`);
  if (btn) btn.classList.add('active');
  gameCanvas.style.cursor = toolCursor();
}

function placeTile(col, row) {
  const cost = TOOL_COSTS[currentTool] ?? 0;
  if (localTreasury < cost) {
    showToast('⚠️ Fondos insuficientes', 'warning');
    return;
  }
  const tile = tileMap[row][col];
  const prev = tile.type;

  switch (currentTool) {
    case 'zone-r':    tile.type = T.ZONE_R; tile.level = 0; break;
    case 'zone-c':    tile.type = T.ZONE_C; tile.level = 0; break;
    case 'zone-i':    tile.type = T.ZONE_I; tile.level = 0; break;
    case 'road':      tile.type = (tile.type === T.WATER) ? T.BRIDGE : T.ROAD; break;
    case 'park':      tile.type = T.PARK;  break;
    case 'power':     tile.type = T.POWER; break;
    case 'police':    tile.type = T.POLICE; break;
    case 'fire':      tile.type = T.FIRE; break;
    case 'hospital':  tile.type = T.HOSPITAL; break;
    case 'school':    tile.type = T.SCHOOL; break;
    case 'city_hall': tile.type = T.CITY_HALL; break;
    case 'market':    tile.type = T.MARKET; break;
    case 'transit':   tile.type = T.TRANSIT; break;
    case 'stadium':   tile.type = T.STADIUM; break;
    case 'cemetery':  tile.type = T.CEMETERY; break;
    case 'demolish':  tile.type = T.GRASS; tile.level = 0; break;
    default: return;
  }