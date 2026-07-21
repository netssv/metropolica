// ── Draw tiles ──

  for (let r = startR; r <= endR; r++) {
    for (let c = startC; c <= endC; c++) {
      const tile = tileMap[r]?.[c];
      if (tile) drawTile(gameCtx, tile, c * ts, r * ts, ts, gameTime);
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

  

// ── TILE INSPECTOR ──


const TILE_NAMES = {
  [T.GRASS]:'Pasto',[T.WATER]:'Agua',[T.ROAD]:'Calle',[T.BRIDGE]:'Puente',
  [T.TREE]:'Árbol',[T.PARK]:'Parque',[T.SAND]:'Arena',
  [T.ZONE_R]:'Zona Residencial',[T.ZONE_C]:'Zona Comercial',[T.ZONE_I]:'Zona Industrial',
  [T.BLDG_R]:'Edificio Residencial',[T.BLDG_C]:'Edificio Comercial',
  [T.BLDG_I]:'Instalación Industrial',[T.POWER]:'Central Eléctrica',
  [T.POLICE]:'Comisaría',[T.FIRE]:'Bomberos',
  [T.HOSPITAL]:'Hospital',[T.SCHOOL]:'Escuela',
};

function inspectTile(col, row) {
  const tile = tileMap[row][col];
  const insp = document.getElementById('hud-tile-inspector');
  document.getElementById('inspector-title').textContent = TILE_NAMES[tile.type] || tile.type;

  const d = (simState.districts ?? []).find(d => d.id === tile.owner);
  document.getElementById('inspector-body').innerHTML = `
    <div class="inspector-row"><span>Posición</span><span>${col}, ${row}</span></div>
    <div class="inspector-row"><span>Tipo</span><span>${tile.type}</span></div>
    <div class="inspector-row"><span>Distrito</span><span>${(tile.owner || '—').replace(/_/g,' ')}</span></div>
    ${tile.level > 0 ? `<div class="inspector-row"><span>Nivel</span><span>${tile.level}</span></div>` : ''}
    ${d ? `
      <hr class="inspector-divider">
      <div class="inspector-row"><span>Población</span><span>${d.population.toLocaleString()}</span></div>
      <div class="inspector-row"><span>Aprobación</span><span>${Math.round(d.approval*100)}%</span></div>
      <div class="inspector-row"><span>Crimen</span><span>${Math.round(d.social.crimeRisk*100)}%</span></div>
    ` : ''}
  `;
  document.getElementById('inspector-actions').innerHTML = `
    <button class="insp-action-btn" onclick="selectTool('road');closeInspector()">+ Calle</button>
    <button class="insp-action-btn" onclick="selectTool('park');closeInspector()">+ Parque</button>
    <button class="insp-action-btn insp-danger" onclick="placeTile(${col},${row});closeInspector()">Demoler</button>
  `;
  insp.hidden = false;
}

function closeInspector() {
  const el = document.getElementById('hud-tile-inspector');
  if (el) el.hidden = true;
}


// ── DASHBOARD PANEL ──


function toggleDashboard() {
  dashboardOpen = !dashboardOpen;
  const el = document.getElementById('hud-bottom');
  const ar = document.getElementById('toggle-arrow');
  el.classList.toggle('collapsed', !dashboardOpen);
  if (ar) ar.textContent = dashboardOpen ? '▼' : '▲';
}

function switchDashTab(tab) {
  activeDashTab = tab;
  document.querySelectorAll('.dash-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.dash-tab').forEach(b => b.classList.remove('active'));
  document.getElementById(`dtab-content-${tab}`)?.classList.add('active');
  document.getElementById(`dtab-${tab}`)?.classList.add('active');
}

function setFilterTab(f) {
  currentFilter = f;
  document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
  document.getElementById(`filter-${f}`)?.classList.add('active');
  renderCitizensList();
}


// ── HUD UPDATE ──


function updateTreasuryDisplay() {
  const el = document.getElementById('city-treasury');
  if (el) el.textContent = `$${localTreasury.toLocaleString()}`;
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