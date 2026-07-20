// ── OPINION BREAKDOWN ──


function fmtDelta(v) { const p = (v*100).toFixed(2); return v>=0?`+${p}%`:`${p}%`; }

function renderOpinionBreakdown() {
  const history = simState.opinionBreakdown ?? [];
  const container = document.getElementById('opinion-breakdown');
  const tickLabel = document.getElementById('opinion-tick-label');
  if (!container) return;
  if (history.length === 0) {
    container.innerHTML = '<div class="empty-state">Sin datos de opinión todavía.</div>';
    if (tickLabel) tickLabel.textContent = '—';
    return;
  }
  const latest = history[0];
  if (tickLabel) tickLabel.textContent = `Día ${latest.day}`;
  const maxAbs = Math.max(
    Math.abs(latest.socialMedia), Math.abs(latest.newspapers),
    Math.abs(latest.wordOfMouth), Math.abs(latest.pressConference), 0.01
  );
  const channels = [
    { key: 'socialMedia',     label: 'Redes Soc.', cls: 'social' },
    { key: 'newspapers',      label: 'Prensa',     cls: 'news' },
    { key: 'wordOfMouth',     label: 'Boca a Boca',cls: 'wom' },
    { key: 'pressConference', label: 'Conf. Prensa',cls:'press' },
  ];
  container.innerHTML = '';
  const block = document.createElement('div');
  block.className = 'opinion-tick';
  block.innerHTML = `<div class="opinion-tick-header"><span>Último tick — Día ${latest.day}</span></div>`;
  const barsDiv = document.createElement('div');
  barsDiv.className = 'ch-bar-group';
  channels.forEach(ch => {
    const val = latest[ch.key] ?? 0;
    const w   = Math.min(100, (Math.abs(val)/maxAbs)*100);
    barsDiv.innerHTML += `
      <div class="ch-bar-row">
        <span class="ch-label">${ch.label}</span>
        <div class="ch-bar-bg"><div class="ch-bar-fill ${val<0?'negative':ch.cls}" style="width:${w}%"></div></div>
        <span class="ch-val ${val>=0?'pos':'neg'}">${fmtDelta(val)}</span>
      </div>`;
  });
  block.appendChild(barsDiv);
  const tot = latest.total ?? 0;
  const tDiv = document.createElement('div');
  tDiv.className = 'opinion-total-row';
  tDiv.innerHTML = `<span>Total Δ aprobación</span><span class="${tot>=0?'ch-val pos':'ch-val neg'}">${fmtDelta(tot)}</span>`;
  block.appendChild(tDiv);
  container.appendChild(block);
  history.slice(1, 5).forEach(tick => {
    const row = document.createElement('div');
    row.className = 'opinion-tick';
    const t = tick.total ?? 0;
    row.innerHTML = `<div class="opinion-tick-header"><span>Día ${tick.day}</span><span class="${t>=0?'ch-val pos':'ch-val neg'}">${fmtDelta(t)}</span></div>`;
    container.appendChild(row);
  });
}

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
