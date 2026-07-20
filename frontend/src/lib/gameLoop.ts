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

async function placeTile(col, row) {
  const cost = TOOL_COSTS[currentTool] ?? 0;
  const tile = tileMap[row]?.[col];
  if (!tile) return;

  // Optimistic UI check before hitting server (real validation is server-side)
  if ((simState.treasury ?? 0) < cost) {
    showToast('⚠️ Fondos insuficientes', 'warning');
    return;
  }

  const prev = tile.type;

  switch (currentTool) {
    case 'zone-r':  tile.type = T.ZONE_R; tile.level = 0; break;
    case 'zone-c':  tile.type = T.ZONE_C; tile.level = 0; break;
    case 'zone-i':  tile.type = T.ZONE_I; tile.level = 0; break;
    case 'road':    tile.type = (tile.type === T.WATER) ? T.BRIDGE : T.ROAD; break;
    case 'park':    tile.type = T.PARK;  break;
    case 'power':   tile.type = T.POWER; break;
    case 'demolish':tile.type = T.GRASS; tile.level = 0; break;
    default: return;
  }

  if (tile.type === prev) return;

  if (currentTool === 'demolish') {
    await postCommand({ type: 'DEMOLISH_TILE', district: tile.owner ?? 'centro', cost, col, row });
  } else {
    await postCommand({ type: 'PLACE_ZONE', zoneType: currentTool, district: tile.owner ?? 'centro', cost, col, row });
  }

  showToast(`✓ ${currentTool.replace('-',' ')} — $${cost}`, 'success');

  if (currentTool.startsWith('zone')) {
    const gc = col, gr = row;
    setTimeout(() => growZone(gc, gr), 4000 + Math.random() * 6000);
  }
  if (currentTool === 'road' || currentTool === 'demolish') {
    clearTimeout(pedRespawnTimer);
    pedRespawnTimer = setTimeout(spawnPedestrians, 500);
  }
}


let pedRespawnTimer = null;

function growZone(col, row) {
  const tile = tileMap[row]?.[col];
  if (!tile) return;
  if (tile.type === T.ZONE_R) { tile.type = T.BLDG_R; tile.level = 1; }
  else if (tile.type === T.ZONE_C) { tile.type = T.BLDG_C; tile.level = 1; }
  else if (tile.type === T.ZONE_I) { tile.type = T.BLDG_I; tile.level = 1; }
  else return;

  // Level up over time
  if (tile.level < 4) {
    setTimeout(() => {
      if (tileMap[row]?.[col] === tile && tile.level < 4) {
        tile.level++;
      }
    }, 6000 + Math.random() * 8000);
  }
}


// ── TILE INSPECTOR ──


const TILE_NAMES = {
  [T.GRASS]:'Pasto',[T.WATER]:'Agua',[T.ROAD]:'Calle',[T.BRIDGE]:'Puente',
  [T.TREE]:'Árbol',[T.PARK]:'Parque',[T.SAND]:'Arena',
  [T.ZONE_R]:'Zona Residencial',[T.ZONE_C]:'Zona Comercial',[T.ZONE_I]:'Zona Industrial',
  [T.BLDG_R]:'Edificio Residencial',[T.BLDG_C]:'Edificio Comercial',
  [T.BLDG_I]:'Instalación Industrial',[T.POWER]:'Central Eléctrica',
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
  const treasury = simState.treasury ?? 0;
  if (el) el.textContent = `$${Math.round(treasury).toLocaleString()}`;
}
