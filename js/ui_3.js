

// ── TREASURY DETAIL ──


function renderTreasuryDetail() {
  const treasury = simState.treasury ?? 0;
  const weekly   = simState.weeklyIncome ?? 0;
  const balEl    = document.getElementById('treasury-balance');
  const wiMain   = document.getElementById('weekly-income-main');
  const wiHdr    = document.getElementById('weekly-income-header');
  if (balEl)  balEl.textContent  = `$${Math.round(treasury).toLocaleString()}`;
  if (wiMain) { wiMain.textContent = `+$${Math.round(weekly).toLocaleString()}`; wiMain.style.color = weekly>=0?'var(--green)':'var(--red)'; }
  if (wiHdr)  wiHdr.textContent   = `+$${Math.round(weekly).toLocaleString()} / sem.`;
}


// ── CITIZENS LIST ──


function renderCitizensList() {
  const container = document.getElementById('citizens-list');
  if (!container) return;
  container.innerHTML = '';
  let total = 0;
  Object.entries(citizensMap).forEach(([districtId, list]) => {
    list.forEach(c => {
      total++;
      if (currentFilter === 'level3' && c.level !== 3) return;
      if (currentFilter === 'level2' && c.level !== 2) return;
      const card = document.createElement('div');
      card.className = `citizen-item-card ${c.level===3?'level-3':''}`;
      card.onclick = e => { if (!e.target.closest('.inspect-btn')) openCitizenModal(c.id); };
      card.innerHTML = `
        <div class="citizen-item-info">
          <span class="cit-name">${c.id} (${c.age} años)</span>
          <span class="cit-sub">${c.occupation} • ${districtId.replace(/_/g,' ')}</span>
          ${c.level===3?`<span class="cit-status">${c.activeCause??'activo'}</span>`:''}
          ${c.currentProblem?`<span class="cit-problem">${c.currentProblem}</span>`:''}
        </div>
        <div><button class="inspect-btn" data-id="${c.id}" title="Inspeccionar">🔍</button></div>
      `;
      container.appendChild(card);
    });
  });
  const fa = document.getElementById('filter-all');
  if (fa) fa.textContent = `Todos (${total})`;
  container.querySelectorAll('.inspect-btn').forEach(btn => {
    btn.onclick = e => { e.stopPropagation(); toggleInspect(btn.dataset.id); };
  });
}


// ── CITIZEN MODAL ──


function openCitizenModal(citizenId) {
  currentSelectedCitizenId = citizenId;
  updateModalData(citizenId);
  document.getElementById('profile-modal').classList.add('active');
}
function closeModal() {
  currentSelectedCitizenId = null;
  document.getElementById('profile-modal').classList.remove('active');
}
function findCitizen(id) {
  for (const list of Object.values(citizensMap)) {
    const c = list.find(c => c.id === id);
    if (c) return c;
  }
  return null;
}

function updateModalData(citizenId) {
  const c = findCitizen(citizenId);
  if (!c) return;
  const id = el => document.getElementById(el);
  id('m-citizen-id').textContent          = c.id;
  id('m-occupation-header').textContent   = c.occupation ?? '—';
  id('m-age').textContent                 = c.age;
  id('m-occupation').textContent          = c.occupation ?? '—';
  id('m-education').textContent           = c.education ?? '—';
  id('m-region').textContent              = c.id.split('-')[0].toUpperCase();
  id('m-simulation-level').textContent    = c.level===3?'Nivel 3 (Activo)':'Nivel 2 (Observacional)';
  id('m-simulation-level').style.color    = c.level===3?'var(--blue)':'var(--text-muted)';
  id('m-activation-cause').textContent    = c.activeCause?c.activeCause.toUpperCase():'Ninguna';
  id('m-current-problem').textContent     = c.currentProblem??'Estable en su rutina';
  id('m-current-problem').style.color     = c.currentProblem?'var(--yellow)':'var(--green)';

  const triggerRow = id('m-trigger-row');
  const triggerDet = id('m-trigger-detail');
  if (c.level===3 && c.activeCause) {
    triggerRow.style.display = '';
    if (c.activeCause==='organization') {
      const org = (simState.organizations??[]).find(o=>o.territory.some(t=>c.id.startsWith(t)));
      triggerDet.textContent = org?`${orgLabel(org.type)} en ${org.territory.join(', ')}`:'Org. activa en distrito';
    } else if (c.activeCause==='footprint') {
      const fp = (simState.footprintLog??[])[0];
      triggerDet.textContent = fp?`Evento: ${fp.topic.replace(/_/g,' ')} (${fp.affectedDistrict.replace(/_/g,' ')})`:'Footprint activo';
    } else { triggerDet.textContent = c.activeCause; }
  } else { triggerRow.style.display = 'none'; }

  renderBars('modal-skills-grid',      c.skills??[],      'skill',  ['Técnica','Cognitiva','Social','Resolución']);
  renderBars('modal-aspiration-grid',  c.aspirations??[], 'aspire', ['Económica','Profesional','Comunidad','Movilidad']);
  renderBars('modal-traits-grid',      c.traits??[],      'trait',  ['Riesgo','Sociabilidad','Precio','Confianza','Recreación']);

  id('inspect-action-btn').textContent = c.level===3?'🔴 Detener Inspección':'🔍 Activar Inspección';
}

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



// ── CAMERA ──


function screenToWorld(sx, sy) {
  return { x: sx / cam.zoom + cam.x, y: sy / cam.zoom + cam.y };
}