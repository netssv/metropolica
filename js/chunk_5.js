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
