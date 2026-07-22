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
  id('btn-reset').onclick = () => {
    if (confirm('¿Reiniciar simulación?'))
      fetch('/api/reset', { method:'POST' }).then(refreshAll).then(updateHUD);
  };

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

  // Resize canvas to window
  function resize() {
    gameCanvas.width  = window.innerWidth;
    gameCanvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Build the world
  initTileMap();

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

  // Spawn pedestrians & vehicles
  spawnPedestrians();
  if (typeof spawnVehicles === 'function') spawnVehicles();

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
}

// Start the game when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// ═══════════════════════════════════════════════════════════════════
//  METROPOLICA — Full-Screen City Builder Game Engine
// ═══════════════════════════════════════════════════════════════════

