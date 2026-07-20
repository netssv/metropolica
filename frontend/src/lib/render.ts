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
function updateHUD() {
  const el = id => document.getElementById(id);

  el('current-day').textContent = simState.day ?? 0;
  el('city-approval').textContent = `${((simState.approval ?? 0)*100).toFixed(1)}%`;
  el('active-citizens-count').textContent =
    `${simState.activeCitizens ?? 0} / ${simState.totalCitizens ?? 0}`;
  updateTreasuryDisplay();

  const st = simState.result?.status ?? 'running';
  const sb = el('game-status');
  sb.className = 'status-badge ' + st;
  sb.textContent = st === 'won' ? 'Victoria' : st === 'lost' ? 'Derrota' : 'Activa';

  // Sliders
  const tax   = simState.taxRate   ?? 0.15;
  const audit = simState.auditLevel ?? 0.10;
  el('tax-slider').value   = tax;
  el('audit-slider').value = audit;
  el('tax-slider-val').textContent   = `${Math.round(tax*100)}%`;
  el('audit-slider-val').textContent = `${Math.round(audit*100)}%`;

  // Quick stats in toggle button
  const dists = (simState.districts ?? []).length;
  const cits  = simState.totalCitizens ?? 0;
  const orgs  = (simState.organizations ?? []).length;
  const corr  = ((simState.corruptionRisk ?? 0)*100).toFixed(0);
  el('qs-districts').textContent = `${dists} distritos`;
  el('qs-citizens').textContent  = `${cits} ciudadanos`;
  el('qs-orgs').textContent      = `${orgs} orgs`;
  el('qs-corruption').textContent = `Corr: ${corr}%`;

  renderDistricts();
  renderOrganizations();
  renderCorruption();
  renderFootprintLog();
  renderOpinionBreakdown();
  renderTreasuryDetail();
  renderCitizensList();

  if (currentSelectedCitizenId) updateModalData(currentSelectedCitizenId);
}

// ── DISTRICT CARDS ──


function renderDistricts() {
  const grid = document.getElementById('districts-grid');
  grid.innerHTML = '';
  (simState.districts ?? []).forEach(d => {
    const card = document.createElement('div');
    card.className = `district-card ${d.id} ${d.social.atRisk ? 'at-risk' : ''}`;
    const orgs = (simState.organizations ?? []).filter(o => o.territory.includes(d.id));
    const orgPills = orgs.map(o =>
      `<div class="org-pill">⚠️ ${orgLabel(o.type)} (Inf. ${(o.influence*100).toFixed(0)}%)</div>`
    ).join('');
    card.innerHTML = `
      <div class="district-name">${d.id.replace(/_/g,' ')}
        <span class="district-badge ${d.social.atRisk ? 'at-risk-label' : 'safe-label'}">${d.social.atRisk ? 'En Crisis' : 'Estable'}</span>
      </div>
      ${bar('Agua', d.services.water.coverage, 'water')}
      ${bar('Luz',  d.services.electricity.coverage, 'electricity')}
      ${bar('Edu.', d.services.education?.coverage ?? 0, 'education')}
      ${bar('Salud',d.services.healthcare?.coverage ?? 0, 'healthcare')}
      ${bar('Aprobación', d.approval, 'approval')}
      <div class="district-meta">
        <span class="district-pop">👥 ${d.population.toLocaleString()}</span>
        ${orgPills}
      </div>
    `;
    grid.appendChild(card);
  });
}

function bar(label, value, cls) {
  return `
    <div class="progress-bar-group">
      <div class="progress-labels"><span>${label}</span><span>${Math.round(value*100)}%</span></div>
      <div class="progress-container"><div class="progress-value ${cls}" style="width:${value*100}%"></div></div>
    </div>
  `;
}

// ── ORGANIZATIONS ──


function orgLabel(type) {
  return type==='gang'?'Pandilla':type==='cartel'?'Cartel':'Red Contratistas';
}
function orgIcon(type) {
  return type==='gang'?'🔴':type==='cartel'?'💀':'🤝';
}

function renderOrganizations() {
  const orgs = simState.organizations ?? [];
  const cnt  = document.getElementById('orgs-count');
  if (cnt) cnt.textContent = `${orgs.length} activa${orgs.length !== 1 ? 's' : ''}`;
  const container = document.getElementById('orgs-list');
  if (!container) return;
  if (orgs.length === 0) { container.innerHTML = '<div class="empty-state">Sin organizaciones activas.</div>'; return; }
  container.innerHTML = '';
  orgs.forEach(org => {
    const inCrisis = (simState.districts ?? []).some(d => org.territory.includes(d.id) && d.social.atRisk);
    const card = document.createElement('div');
    card.className = `org-card ${inCrisis ? 'crisis' : ''}`;
    card.innerHTML = `
      <div class="org-icon">${orgIcon(org.type)}</div>
      <div class="org-info">
        <div class="org-name">${orgLabel(org.type)}</div>
        <span class="org-type-badge">${org.type.replace(/_/g,' ')}</span>
        <div class="org-territory">📍 ${org.territory.join(', ').replace(/_/g,' ')}</div>
      </div>
      <div class="org-metrics">
        ${inCrisis ? '<span class="org-crisis-tag">EN CRISIS</span>' : ''}
        <div class="org-metric-row"><span class="org-metric-label">Ingresos</span><span class="org-metric-val" style="color:#f87171">$${Math.round(org.income).toLocaleString()}</span></div>
        <div class="org-metric-row"><span class="org-metric-label">Influencia</span><span class="org-metric-val" style="color:#fb923c">${(org.influence*100).toFixed(1)}%</span></div>
        <div class="org-metric-row"><span class="org-metric-label">Reclutamiento</span><span class="org-metric-val">${(org.recruitment*100).toFixed(1)}%</span></div>
        <div class="org-metric-row"><span class="org-metric-label">Violencia</span><span class="org-metric-val">${(org.violence*100).toFixed(0)}%</span></div>
      </div>
    `;
    container.appendChild(card);
  });
}

// ── CORRUPTION ──


function renderCorruption() {
  const risk = simState.corruptionRisk ?? 0;
  const pct  = (risk * 100).toFixed(1);
  const vEl  = document.getElementById('corruption-val');
  const bEl  = document.getElementById('corruption-bar');
  if (vEl) vEl.textContent = `${pct}%`;
  if (bEl) bEl.style.width = `${Math.min(100, risk*100)}%`;
}

// ── FOOTPRINT LOG ──


const EMOTION_ICON = { anger:'😡', fear:'😨', relief:'😮‍💨', indifference:'😐' };
function severityClass(v) { return v>=0.6?'high':v>=0.3?'medium':'low'; }

function renderFootprintLog() {
  const log = simState.footprintLog ?? [];
  const cnt = document.getElementById('footprint-count');
  if (cnt) cnt.textContent = `${log.length} evento${log.length!==1?'s':''}`;
  const container = document.getElementById('footprint-log');
  if (!container) return;
  if (log.length === 0) { container.innerHTML = '<div class="empty-state">Ningún evento registrado.</div>'; return; }
  container.innerHTML = '';
  log.forEach(fp => {
    const item = document.createElement('div');
    item.className = 'footprint-item';
    item.innerHTML = `
      <div class="fp-emotion">${EMOTION_ICON[fp.emotion] ?? '📌'}</div>
      <div class="fp-body">
        <div class="fp-topic">${fp.topic.replace(/_/g,' ')}</div>
        <div class="fp-district">📍 ${fp.affectedDistrict.replace(/_/g,' ')}</div>
        <div class="fp-culprit">Culpable: ${fp.perceivedCulprit}</div>
      </div>
      <div class="fp-severity ${severityClass(fp.severity)}">Sev. ${(fp.severity*100).toFixed(0)}%</div>
    `;
    container.appendChild(item);
  });
}
