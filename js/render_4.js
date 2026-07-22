// ── RENDER LOOP & AMBIENT ENGINE ──

function renderFrame(timestamp) {
  const dt = Math.min((timestamp - lastFrameTs) / 1000, 0.12);
  lastFrameTs = timestamp;
  gameTime += dt;

  updatePedestrians(dt);
  if (typeof updateVehicles === 'function') updateVehicles(dt);

  const cw = gameCanvas.width;
  const ch = gameCanvas.height;
  const ts = TILE_SIZE;

  gameCtx.setTransform(1, 0, 0, 1, 0, 0);
  gameCtx.fillStyle = '#070d18';
  gameCtx.fillRect(0, 0, cw, ch);

  gameCtx.setTransform(cam.zoom, 0, 0, cam.zoom, -cam.x * cam.zoom, -cam.y * cam.zoom);

  const visW  = cw  / cam.zoom;
  const visH  = ch  / cam.zoom;
  const startC = Math.max(0, Math.floor(cam.x / ts) - 1);
  const endC   = Math.min(MAP_COLS - 1, Math.ceil((cam.x + visW) / ts) + 1);
  const startR = Math.max(0, Math.floor(cam.y / ts) - 1);
  const endR   = Math.min(MAP_ROWS - 1, Math.ceil((cam.y + visH) / ts) + 1);

  for (let r = startR; r <= endR; r++) {
    for (let c = startC; c <= endC; c++) {
      const tile = tileMap[r]?.[c];
      if (tile) drawTile(gameCtx, tile, c * ts, r * ts, ts, gameTime);
    }
  }

  if (typeof drawPedestrians === 'function') drawPedestrians(gameCtx, ts, startC, endC, startR, endR);
  if (typeof drawVehicles === 'function') drawVehicles(gameCtx, ts, startC, endC, startR, endR, gameTime);

  if (cam.zoom >= 0.55) {
    gameCtx.strokeStyle = 'rgba(255,255,255,0.04)';
    gameCtx.lineWidth   = 0.5;
    for (let c = startC; c <= endC + 1; c++) {
      gameCtx.beginPath(); gameCtx.moveTo(c*ts, startR*ts); gameCtx.lineTo(c*ts, (endR+1)*ts); gameCtx.stroke();
    }
    for (let r = startR; r <= endR + 1; r++) {
      gameCtx.beginPath(); gameCtx.moveTo(startC*ts, r*ts); gameCtx.lineTo((endC+1)*ts, r*ts); gameCtx.stroke();
    }
  }

  drawDistrictOverlay(gameCtx, ts, startR, endR);

  // Ambient Day/Night Lighting Filter
  if (typeof getAmbientLighting === 'function') {
    const amb = getAmbientLighting(gameTime);
    if (amb.alpha > 0) {
      gameCtx.save();
      gameCtx.setTransform(1, 0, 0, 1, 0, 0);
      gameCtx.fillStyle = amb.tintColor;
      gameCtx.fillRect(0, 0, cw, ch);
      gameCtx.restore();
    }
  }

  // Weather overlay (rain/fog)
  if (typeof drawWeatherOverlay === 'function') {
    drawWeatherOverlay(gameCtx, cw, ch, gameTime);
  }

  if (hoveredTile && currentTool !== 'cursor') {
    const { col, row } = hoveredTile;
    gameCtx.fillStyle   = 'rgba(255,255,255,0.12)';
    gameCtx.fillRect(col*ts, row*ts, ts, ts);
    gameCtx.strokeStyle = toolColor();
    gameCtx.lineWidth   = 2;
    gameCtx.strokeRect(col*ts + 1, row*ts + 1, ts - 2, ts - 2);
  }

  requestAnimationFrame(renderFrame);
}
