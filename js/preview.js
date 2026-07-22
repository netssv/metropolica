// ── VISUAL CATALOG CONTROLLER ──

const CATALOG = [
  // Terreno
  { type: 'grass', name: 'Pasto', cat: 'terreno', anim: false },
  { type: 'water', name: 'Agua', cat: 'terreno', anim: true },
  { type: 'road', name: 'Calle (Conexión Auto)', cat: 'terreno', anim: false },
  { type: 'bridge', name: 'Puente', cat: 'terreno', anim: false },
  { type: 'tree', name: 'Árbol', cat: 'terreno', anim: false },
  { type: 'park', name: 'Parque (Fuente)', cat: 'terreno', anim: true },
  { type: 'sand', name: 'Arena', cat: 'terreno', anim: false },

  // Zonas
  { type: 'zone-r', name: 'Zona Residencial', cat: 'zonas', anim: false },
  { type: 'zone-c', name: 'Zona Comercial', cat: 'zonas', anim: false },
  { type: 'zone-i', name: 'Zona Industrial', cat: 'zonas', anim: false },

  // Edificios Residenciales por Clase Social (Niveles 1-4)
  { type: 'bldg-r', name: 'Residencial Nv 1 (Casa/Cabaña)', cat: 'edificios', level: 1, anim: false },
  { type: 'bldg-r', name: 'Residencial Nv 2 (Dúplex/Chalet)', cat: 'edificios', level: 2, anim: false },
  { type: 'bldg-r', name: 'Residencial Nv 3 (Apartamentos)', cat: 'edificios', level: 3, anim: false },
  { type: 'bldg-r', name: 'Residencial Nv 4 (Torre Condominios)', cat: 'edificios', level: 4, anim: true },

  // Edificios Comerciales por Nivel (1-4)
  { type: 'bldg-c', name: 'Comercial Nv 1 (Tienda/Minimarket)', cat: 'edificios', level: 1, anim: false },
  { type: 'bldg-c', name: 'Comercial Nv 2 (Plaza Comercial)', cat: 'edificios', level: 2, anim: false },
  { type: 'bldg-c', name: 'Comercial Nv 3 (Supermercado/Mall)', cat: 'edificios', level: 3, anim: false },
  { type: 'bldg-c', name: 'Comercial Nv 4 (Torre Corporativa)', cat: 'edificios', level: 4, anim: true },

  // Edificios Industriales por Nivel (1-4)
  { type: 'bldg-i', name: 'Industrial Nv 1 (Taller Mecánico)', cat: 'edificios', level: 1, anim: false },
  { type: 'bldg-i', name: 'Industrial Nv 2 (Fábrica)', cat: 'edificios', level: 2, anim: true },
  { type: 'bldg-i', name: 'Industrial Nv 3 (Planta Refinería)', cat: 'edificios', level: 3, anim: true },
  { type: 'bldg-i', name: 'Industrial Nv 4 (Mega Complejo)', cat: 'edificios', level: 4, anim: true },

  // Servicios
  { type: 'power', name: 'Central Eléctrica', cat: 'servicios', anim: false },
  { type: 'police', name: 'Comisaría', cat: 'servicios', anim: true },
  { type: 'fire', name: 'Estación Bomberos', cat: 'servicios', anim: true },
  { type: 'hospital', name: 'Hospital', cat: 'servicios', anim: false },
  { type: 'school', name: 'Escuela', cat: 'servicios', anim: false },

  // Cívicos (Nuevos)
  { type: 'city_hall', name: 'Ayuntamiento', cat: 'civicos', isNew: true, anim: true },
  { type: 'market', name: 'Mercado Central', cat: 'civicos', isNew: true, anim: false },
  { type: 'transit', name: 'Estación Tránsito', cat: 'civicos', isNew: true, anim: true },
  { type: 'stadium', name: 'Estadio Deportivo', cat: 'civicos', isNew: true, anim: true },
  { type: 'cemetery', name: 'Cementerio', cat: 'civicos', isNew: true, anim: false },

  // Vehículos por Clase Social
  { type: 'veh_compact', name: 'Baja: Compacto Económico', cat: 'vehiculos', isNew: true, anim: false },
  { type: 'veh_pickup_old', name: 'Baja: Pickup de Trabajo', cat: 'vehiculos', isNew: true, anim: false },
  { type: 'veh_sedan', name: 'Media: Sedán Familiar', cat: 'vehiculos', isNew: true, anim: false },
  { type: 'veh_suv', name: 'Media: Camioneta SUV', cat: 'vehiculos', isNew: true, anim: false },
  { type: 'veh_minivan', name: 'Media: Minivan Familiar', cat: 'vehiculos', isNew: true, anim: false },
  { type: 'veh_sports', name: 'Alta: Deportivo de Lujo', cat: 'vehiculos', isNew: true, anim: false },
  { type: 'veh_limo', name: 'Alta: Limusina Ejecutiva', cat: 'vehiculos', isNew: true, anim: false },
  { type: 'veh_electric', name: 'Alta: EV Eléctrico Neón', cat: 'vehiculos', isNew: true, anim: false },
  { type: 'veh_taxi', name: 'Servicio: Taxi', cat: 'vehiculos', isNew: true, anim: false },
  { type: 'veh_police', name: 'Servicio: Patrulla Policía', cat: 'vehiculos', isNew: true, anim: true },
  { type: 'veh_ambulance', name: 'Servicio: Ambulancia', cat: 'vehiculos', isNew: true, anim: true },
  { type: 'veh_truck', name: 'Servicio: Camión Carga', cat: 'vehiculos', isNew: true, anim: false },
  { type: 'veh_bus', name: 'Servicio: Autobús Urbano', cat: 'vehiculos', isNew: true, anim: false },

  // Peatones por Tipo
  { type: 'ped_worker', name: 'Peatón: Obrero (Clase Baja)', cat: 'peatones', isNew: true, anim: true },
  { type: 'ped_casual', name: 'Peatón: Casual (Clase Media)', cat: 'peatones', isNew: true, anim: true },
  { type: 'ped_executive', name: 'Peatón: Ejecutivo (Clase Alta)', cat: 'peatones', isNew: true, anim: true },
  { type: 'ped_student', name: 'Peatón: Estudiante', cat: 'peatones', isNew: true, anim: true },
  { type: 'ped_elder', name: 'Peatón: Anciano', cat: 'peatones', isNew: true, anim: true },
  { type: 'ped_tourist', name: 'Peatón: Turista', cat: 'peatones', isNew: true, anim: true },
  { type: 'ped_police', name: 'Peatón: Policía', cat: 'peatones', isNew: true, anim: true },
  { type: 'ped_child', name: 'Peatón: Niño/a', cat: 'peatones', isNew: true, anim: true },
];

let activeCat = 'todos';
let searchQuery = '';
let isPaused = false;
let gameTime = 0;

function renderGrid() {
  const container = document.getElementById('grid-container');
  container.innerHTML = '';

  const filtered = CATALOG.filter(item => {
    const matchCat = (activeCat === 'todos' || item.cat === activeCat);
    const matchSearch = item.name.toLowerCase().includes(searchQuery) || item.type.toLowerCase().includes(searchQuery);
    return matchCat && matchSearch;
  });

  document.getElementById('catalog-count').textContent = `${filtered.length} / ${CATALOG.length} assets`;

  filtered.forEach(item => {
    const card = document.createElement('article');
    card.className = 'tile-card';

    const hdr = document.createElement('div');
    hdr.className = 'card-hdr';

    const title = document.createElement('span');
    title.className = 'card-title';
    title.textContent = item.name;

    const badgeWrap = document.createElement('div');
    if (item.isNew) {
      const bNew = document.createElement('span');
      bNew.className = 'badge-tag badge-new';
      bNew.textContent = 'Nuevo';
      badgeWrap.appendChild(bNew);
    }
    if (item.anim) {
      const bAnim = document.createElement('span');
      bAnim.className = 'badge-tag badge-anim';
      bAnim.textContent = 'Animado';
      badgeWrap.appendChild(bAnim);
    }

    hdr.appendChild(title);
    hdr.appendChild(badgeWrap);
    card.appendChild(hdr);

    const canvasRow = document.createElement('div');
    canvasRow.className = 'canvas-row';

    [24, 48, 96].forEach(sz => {
      const wrap = document.createElement('div');
      wrap.className = 'cv-wrap';

      const cv = document.createElement('canvas');
      cv.width = sz; cv.height = sz;
      cv.dataset.tile = item.type;
      cv.dataset.ts = sz;
      if (item.level) cv.dataset.level = item.level;

      const lbl = document.createElement('span');
      lbl.className = 'size-label';
      lbl.textContent = `${sz}px`;

      wrap.appendChild(cv);
      wrap.appendChild(lbl);
      canvasRow.appendChild(wrap);
    });

    card.appendChild(canvasRow);

    const foot = document.createElement('div');
    foot.className = 'card-foot';
    foot.innerHTML = `<span>ID: <code>${item.type}</code></span><span>Cat: ${item.cat}</span>`;
    card.appendChild(foot);

    container.appendChild(card);
  });
}

function renderLoop() {
  if (!isPaused) gameTime += 0.016;

  document.querySelectorAll('canvas[data-tile]').forEach(cv => {
    const type = cv.dataset.tile;
    const ts = parseInt(cv.dataset.ts);
    const level = parseInt(cv.dataset.level || 1);
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, ts, ts);
    drawTile(ctx, { type, level }, 0, 0, ts, gameTime);
  });

  requestAnimationFrame(renderLoop);
}

function initCatalog() {
  document.querySelectorAll('.cat-chip').forEach(chip => chip.addEventListener('click', () => {
    document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active'); activeCat = chip.dataset.cat; renderGrid();
  }));
  document.getElementById('search-input')?.addEventListener('input', e => { searchQuery = e.target.value.toLowerCase().trim(); renderGrid(); });
  const nightBtn = document.getElementById('btn-night');
  let isNightMode = false;
  nightBtn?.addEventListener('click', () => {
    isNightMode = !isNightMode; nightBtn.textContent = isNightMode ? '☀️ Modo Día' : '🌙 Modo Noche';
    nightBtn.classList.toggle('active', isNightMode);
    window.getAmbientLighting = () => ({ isNight: isNightMode, alpha: isNightMode ? 0.55 : 0, tintColor: isNightMode ? 'rgba(5, 10, 24, 0.55)' : 'rgba(0,0,0,0)' });
  });
  const pauseBtn = document.getElementById('btn-pause');
  pauseBtn?.addEventListener('click', () => {
    isPaused = !isPaused; pauseBtn.textContent = isPaused ? '▶ Reanudar' : '⏸ Pausar';
    pauseBtn.classList.toggle('active', isPaused);
  });
  renderGrid(); requestAnimationFrame(renderLoop);
}
document.addEventListener('DOMContentLoaded', initCatalog);
