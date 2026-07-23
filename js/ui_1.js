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
  const isHome = tile.type === T.BLDG_R;
  const isWorkplace = [T.BLDG_C, T.BLDG_I].includes(tile.type);
  const citizens = Object.values(simState.citizens ?? {}).flat();
  const residents = citizens.filter(c => c.homeTile?.col === col && c.homeTile?.row === row);
  const workers = citizens.filter(c => c.workTile?.col === col && c.workTile?.row === row);
  const specialtyNames = {
    hospital: 'Salud y atención médica', 'mall-government': 'Gobierno y servicios',
    'fish-market': 'Mercado de pescado', pier: 'Puerto y pesca', customs: 'Aduana',
    'water-treatment': 'Tratamiento de agua'
  };
  const typeLabel = tile.specialty ? specialtyNames[tile.specialty] : TILE_NAMES[tile.type] || tile.type;
  const levelLabel = tile.level > 0 ? `Nivel ${tile.level}` : 'Infraestructura';
  document.getElementById('inspector-title').innerHTML = `
    <span class="inspector-kicker">${isHome ? 'VIVIENDA' : isWorkplace ? 'ACTIVIDAD ECONÓMICA' : 'INFRAESTRUCTURA'}</span>
    <strong>${typeLabel}</strong>`;

  const d = (simState.districts ?? []).find(d => d.id === tile.owner);
  document.getElementById('inspector-body').innerHTML = `
    <div class="inspector-location"><span class="inspector-pin">⌖</span><span>${(tile.owner || 'Sin distrito').replace(/_/g,' ')}</span><small>${col}, ${row}</small></div>
    <div class="inspector-highlights">
      ${isHome ? `<div class="inspector-highlight"><strong>${residents.length}</strong><span>residentes</span></div>` : ''}
      ${isWorkplace ? `<div class="inspector-highlight"><strong>${workers.length}</strong><span>trabajadores</span></div>` : ''}
      <div class="inspector-highlight"><strong>${tile.level > 0 ? tile.level : '—'}</strong><span>${tile.level > 0 ? 'nivel' : 'nivel'}</span></div>
    </div>
    <div class="inspector-section-label">Detalles del lugar</div>
    <div class="inspector-row"><span>Clasificación</span><span>${levelLabel}</span></div>
    ${tile.specialty ? `<div class="inspector-row"><span>Rubro</span><span>${typeLabel}</span></div>` : ''}
    ${isHome && residents.length ? `<div class="inspector-section-label">Personas que viven aquí</div><div class="inspector-people">${residents.slice(0, 5).map(c => `<div class="inspector-person"><span class="person-avatar">${(c.id || '?').slice(-1)}</span><span><b>${c.id}</b><small>${c.age} años · ${c.occupation || 'Sin ocupación'}</small></span></div>`).join('')}</div>` : ''}
    ${isWorkplace && workers.length ? `<div class="inspector-section-label">Actividad laboral</div><div class="inspector-people">${workers.slice(0, 5).map(c => `<div class="inspector-person"><span class="person-avatar work">⌁</span><span><b>${c.occupation || c.id}</b><small>${c.id} · ${c.workplaceType || 'trabajador'}</small></span></div>`).join('')}</div>` : ''}
    ${isHome && residents.length > 5 ? `<div class="inspector-more">+ ${residents.length - 5} residentes más</div>` : ''}
    ${isWorkplace && workers.length > 5 ? `<div class="inspector-more">+ ${workers.length - 5} trabajadores más</div>` : ''}
    ${d ? `
      <div class="inspector-section-label">Contexto del distrito</div>
      <div class="inspector-row"><span>Población</span><span>${d.population.toLocaleString()}</span></div>
      <div class="inspector-row"><span>Aprobación</span><span>${Math.round(d.approval*100)}%</span></div>
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
