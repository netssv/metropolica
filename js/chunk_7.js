function renderBars(containerId, array, type, labels) {
  const grid = document.getElementById(containerId);
  if (!grid) return;
  grid.innerHTML = '';
  array.forEach((val, idx) => {
    const pct = Math.round(val*100);
    const div = document.createElement('div');
    div.className = 'radar-stat-bar';
    div.innerHTML = `
      <div class="radar-label"><span>${labels[idx]??idx}</span><span>${pct}%</span></div>
      <div class="radar-bar-container"><div class="radar-bar-fill ${type}" style="width:${pct}%"></div></div>
    `;
    grid.appendChild(div);
  });
}

// ── PRESS MODAL ──


function openPressModal()  { document.getElementById('press-modal').classList.add('active'); }
function closePressModal() { document.getElementById('press-modal').classList.remove('active'); }

// ── TOAST ──


function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = message;
  container.appendChild(t);
  requestAnimationFrame(() => t.classList.add('visible'));
  setTimeout(() => { t.classList.remove('visible'); setTimeout(() => t.remove(), 300); }, 2200);
}


// ── API ──


async function fetchState() {
  try {
    const res = await fetch('/api/state');
    simState = await res.json();
    
    // Reconstruct tileMap from backend districts
    if (simState.districts && tileMap.length > 0) {
      simState.districts.forEach(d => {
        if (d.tiles) {
          d.tiles.forEach(t => {
            if (tileMap[t.row] && tileMap[t.row][t.col]) {
              tileMap[t.row][t.col].type = t.type;
              tileMap[t.row][t.col].level = t.level;
              tileMap[t.row][t.col].age = t.age;
              tileMap[t.row][t.col].owner = d.id;
            }
          });
        }
      });
    }
  } catch(e) { console.warn('fetchState:', e); }
}

async function fetchCitizens() {
  try {
    const res  = await fetch('/api/citizens');
    const data = await res.json();
    citizensMap = {};
    data.forEach(c => {
      if (!citizensMap[c.districtId]) citizensMap[c.districtId] = [];
      citizensMap[c.districtId].push(c);
    });
  } catch(e) { console.warn('fetchCitizens:', e); }
}

async function refreshAll() {
  await Promise.all([fetchState(), fetchCitizens()]);
}

async function toggleInspect(citizenId) {
  await fetch('/api/inspect', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ citizenId }),
  });
  await refreshAll();
  updateHUD();
}

async function postCommand(cmd) {
  await fetch('/api/command', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(cmd),
  });
  await refreshAll();
  updateHUD();
}

async function advanceSim(days) {
  showToast(`⏭ Avanzando ${days} día${days>1?'s':''}...`, 'info');
  await fetch('/api/advance', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ days }),
  });
  await refreshAll();
  updateHUD();
}


// ── Game loop ──

let gameCanvas, gameCtx;
let gameTime    = 0;
let lastFrameTs = 0;

// Drag state
let isDragging  = false;
let dragStart   = { x: 0, y: 0 };
let dragCamStart= { x: 0, y: 0 };
let dragMoved   = false;

let hoveredTile = null;

// ── INIT ──


function id(sel) { return document.getElementById(sel); }

function bindEvents() {
  // Advance buttons
  id('btn-adv1').onclick  = () => advanceSim(1);
  id('btn-adv7').onclick  = () => advanceSim(7);
  id('btn-adv30').onclick = () => advanceSim(30);
  id('btn-reset').onclick = () => showMainMenu();

  // Sliders
  id('tax-slider').oninput = e => {
    id('tax-slider-val').textContent = `${Math.round(e.target.value*100)}%`;
    postCommand({ type:'CHANGE_TAX_RATE', value: parseFloat(e.target.value) });
  };
  id('audit-slider').oninput = e => {
    id('audit-slider-val').textContent = `${Math.round(e.target.value*100)}%`;
    postCommand({ type:'SET_AUDIT_LEVEL', value: parseFloat(e.target.value) });
  };

  // Invest / press
  id('btn-invest-water').onclick  = () =>
    postCommand({ type:'INVEST_UTILITY', district: id('invest-district').value, utility:'water', amount:300000 });
  id('btn-invest-social').onclick = () =>
    postCommand({ type:'INVEST_SOCIAL_PROGRAM', district: id('invest-district').value, amount:100000 });
  id('btn-press').onclick = () => {
    postCommand({ type:'HOLD_PRESS_CONFERENCE', topic: id('press-topic').value, message: id('press-message').value });
    closePressModal();
    showToast('📢 Conferencia publicada', 'success');
  };

  // Citizen modal
  id('btn-close-modal').onclick    = closeModal;
  id('inspect-action-btn').onclick = () => toggleInspect(currentSelectedCitizenId);

  // Tool buttons
  document.querySelectorAll('.tool-btn[data-tool]').forEach(btn =>
    btn.addEventListener('click', () => selectTool(btn.dataset.tool))
  );
}

async function init() {
  gameCanvas = document.getElementById('city-canvas');
  gameCtx    = gameCanvas.getContext('2d');

  // Load components first
  const dashRes = await fetch('components/dashboard.html');
  document.getElementById('dashboard-container').innerHTML = await dashRes.text();
  const toolRes = await fetch('components/toolbar.html');
  document.getElementById('toolbar-container').innerHTML = await toolRes.text();
  
  await initMainMenu();

  // Resize canvas to window
  function resize() {
    gameCanvas.width  = window.innerWidth;
    gameCanvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Build the world map template (types overwritten by backend)
  tileMap = Array.from({ length: MAP_ROWS }, (_, r) =>
    Array.from({ length: MAP_COLS }, (_, c) => ({
      type: 'grass', owner: 'centro', level: 0, age: 0
    }))
  );

  // Center camera on Centro (middle of map)
  const centroX = MAP_COLS * 0.5 * TILE_SIZE;
  const centroY = MAP_ROWS * 0.5 * TILE_SIZE;
  cam.x = centroX - window.innerWidth  / 2 / cam.zoom;
  cam.y = centroY - window.innerHeight / 2 / cam.zoom;
  clampCam();

  // Wire events
  bindEvents();
  initInputHandlers();

  // Load game data
  await refreshAll();
  updateHUD();

  // Spawn pedestrians
  spawnPedestrians();

  // Start game loop
  lastFrameTs = performance.now();
  requestAnimationFrame(renderFrame);

  // Poll API every 8s
  setInterval(async () => {
    await refreshAll();
    updateHUD();
  }, 8000);

  // Slow zone growth ticker
  setInterval(evolveCityNaturally, 15000);

  showToast('🏙️ Metropolica iniciada — ¡Construye tu ciudad!', 'success');
}

// Naturally grow zones into buildings over time
