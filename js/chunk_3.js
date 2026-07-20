// ── RENDER LOOP ──


function renderFrame(timestamp) {
  const dt = Math.min((timestamp - lastFrameTs) / 1000, 0.12);
  lastFrameTs = timestamp;
  gameTime += dt;

  updatePedestrians(dt);

  const cw = gameCanvas.width;
  const ch = gameCanvas.height;
  const ts = TILE_SIZE;

  // Clear
  gameCtx.setTransform(1, 0, 0, 1, 0, 0);
  gameCtx.fillStyle = '#070d18';
  gameCtx.fillRect(0, 0, cw, ch);

  // Apply camera transform (world-space drawing)
  gameCtx.setTransform(cam.zoom, 0, 0, cam.zoom, -cam.x * cam.zoom, -cam.y * cam.zoom);

  // Visible tile range (with 1-tile padding)
  const visW  = cw  / cam.zoom;
  const visH  = ch  / cam.zoom;
  const startC = Math.max(0, Math.floor(cam.x / ts) - 1);
  const endC   = Math.min(MAP_COLS - 1, Math.ceil((cam.x + visW) / ts) + 1);
  const startR = Math.max(0, Math.floor(cam.y / ts) - 1);
  const endR   = Math.min(MAP_ROWS - 1, Math.ceil((cam.y + visH) / ts) + 1);
// ── Draw tiles ──

  for (let r = startR; r <= endR; r++) {
    for (let c = startC; c <= endC; c++) {
      const tile = tileMap[r]?.[c];
      if (tile) drawTile(gameCtx, tile, c * ts, r * ts, ts, gameTime, c, r);
    }
  }

  // ── Grid lines (only when zoomed in) ──

  if (cam.zoom >= 0.55) {
    gameCtx.strokeStyle = 'rgba(255,255,255,0.04)';
    gameCtx.lineWidth   = 0.5;
    for (let c = startC; c <= endC + 1; c++) {
      gameCtx.beginPath();
      gameCtx.moveTo(c*ts, startR*ts);
      gameCtx.lineTo(c*ts, (endR+1)*ts);
      gameCtx.stroke();
    }
    for (let r = startR; r <= endR + 1; r++) {
      gameCtx.beginPath();
      gameCtx.moveTo(startC*ts, r*ts);
      gameCtx.lineTo((endC+1)*ts, r*ts);
      gameCtx.stroke();
    }
  }

  // ── District boundary lines & labels ──

  drawDistrictOverlay(gameCtx, ts, startR, endR);

  // ── Tool hover highlight ──

  if (hoveredTile && currentTool !== 'cursor') {
    const { col, row } = hoveredTile;
    gameCtx.fillStyle   = 'rgba(255,255,255,0.12)';
    gameCtx.fillRect(col*ts, row*ts, ts, ts);
    gameCtx.strokeStyle = toolColor();
    gameCtx.lineWidth   = 2;
    gameCtx.strokeRect(col*ts + 1, row*ts + 1, ts - 2, ts - 2);
  }

  // ── At-risk district pulse ──

  (simState.districts ?? []).forEach(d => {
    if (!d.social?.atRisk) return;
    const zone = DISTRICT_ZONES.find(z => z.id === d.id);
    if (!zone) return;
    const alpha = 0.06 + 0.04 * Math.sin(gameTime * 3);
    gameCtx.fillStyle = `rgba(239,68,68,${alpha})`;
    gameCtx.fillRect(zone.startCol*ts, 0, (zone.endCol-zone.startCol+1)*ts, MAP_H);
    // crisis banner
    const bx = (zone.startCol + (zone.endCol-zone.startCol)/2) * ts;
    const by = ts * 1.5;
    gameCtx.fillStyle = 'rgba(239,68,68,0.9)';
    gameCtx.fillRect(bx - 52, by - 12, 104, 18);
    gameCtx.fillStyle = '#fff';
    gameCtx.font = 'bold 9px system-ui';
    gameCtx.textAlign = 'center'; gameCtx.textBaseline = 'middle';
    gameCtx.fillText('⚠ CRISIS LOCAL', bx, by - 3);
    gameCtx.textAlign = 'left'; gameCtx.textBaseline = 'alphabetic';
  });

  requestAnimationFrame(renderFrame);
}

  
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
