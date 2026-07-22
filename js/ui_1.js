// ── TILE INSPECTOR ──

const TILE_NAMES = {
  [T.GRASS]:'Pasto',[T.WATER]:'Agua',[T.ROAD]:'Calle',[T.BRIDGE]:'Puente',
  [T.TREE]:'Árbol',[T.PARK]:'Parque',[T.SAND]:'Arena',
  [T.ZONE_R]:'Zona Residencial',[T.ZONE_C]:'Zona Comercial',[T.ZONE_I]:'Zona Industrial',
  [T.BLDG_R]:'Edificio Residencial',[T.BLDG_C]:'Edificio Comercial',
  [T.BLDG_I]:'Instalación Industrial',[T.POWER]:'Central Eléctrica',
  [T.POLICE]:'Comisaría',[T.FIRE]:'Bomberos',
  [T.HOSPITAL]:'Hospital',[T.SCHOOL]:'Escuela',
  [T.CITY_HALL]:'Ayuntamiento',[T.MARKET]:'Mercado Central',
  [T.TRANSIT]:'Estación de Tránsito',[T.STADIUM]:'Estadio Deportivo',
  [T.CEMETERY]:'Cementerio',
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