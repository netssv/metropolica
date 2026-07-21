

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