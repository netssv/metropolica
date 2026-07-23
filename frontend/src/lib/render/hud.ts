declare let simState: any;
declare let DISTRICT_ZONES: any[];
declare let MAP_H: number;
declare let currentSelectedCitizenId: any;
declare function updateModalData(id: any): void;
declare function renderOpinionBreakdown(): void;
declare function renderTreasuryDetail(): void;
declare function renderCitizensList(): void;
declare function updateTreasuryDisplay(): void;

export function updateHUD() {
  const el = (id: string) => document.getElementById(id) as HTMLInputElement | HTMLSpanElement | null;

  const currentDayEl = el('current-day');
  if (currentDayEl) currentDayEl.textContent = simState.day ?? 0;

  const cityApprovalEl = el('city-approval');
  if (cityApprovalEl) {
    cityApprovalEl.textContent = `${((simState.approval ?? 0) * 100).toFixed(1)}%`;
  }

  const activeCitizensCountEl = el('active-citizens-count');
  if (activeCitizensCountEl) {
    activeCitizensCountEl.textContent = `${simState.activeCitizens ?? 0} / ${simState.totalCitizens ?? 0}`;
  }

  updateTreasuryDisplay();

  const st = simState.result?.status ?? 'running';
  const sb = el('game-status');
  if (sb) {
    sb.className = 'status-badge ' + st;
    sb.textContent = st === 'won' ? 'Victoria' : st === 'lost' ? 'Derrota' : 'Activa';
  }

  // Sliders
  const tax = simState.taxRate ?? 0.15;
  const audit = simState.auditLevel ?? 0.10;
  const taxSlider = el('tax-slider');
  if (taxSlider) (taxSlider as HTMLInputElement).value = String(tax);
  const auditSlider = el('audit-slider');
  if (auditSlider) (auditSlider as HTMLInputElement).value = String(audit);

  const taxSliderVal = el('tax-slider-val');
  if (taxSliderVal) taxSliderVal.textContent = `${Math.round(tax * 100)}%`;
  const auditSliderVal = el('audit-slider-val');
  if (auditSliderVal) auditSliderVal.textContent = `${Math.round(audit * 100)}%`;

  // Quick stats in toggle button
  const dists = (simState.districts ?? []).length;
  const cits = simState.totalCitizens ?? 0;
  const orgs = (simState.organizations ?? []).length;
  const corr = ((simState.corruptionRisk ?? 0) * 100).toFixed(0);

  const qsDistricts = el('qs-districts');
  if (qsDistricts) qsDistricts.textContent = `${dists} distritos`;
  const qsCitizens = el('qs-citizens');
  if (qsCitizens) qsCitizens.textContent = `${cits} ciudadanos`;
  const qsOrgs = el('qs-orgs');
  if (qsOrgs) qsOrgs.textContent = `${orgs} orgs`;
  const qsCorruption = el('qs-corruption');
  if (qsCorruption) qsCorruption.textContent = `Corr: ${corr}%`;

  renderDistricts();
  renderOrganizations();
  renderCorruption();
  renderFootprintLog();
  renderOpinionBreakdown();
  renderTreasuryDetail();
  renderCitizensList();

  if (currentSelectedCitizenId) updateModalData(currentSelectedCitizenId);
}

export function renderDistricts() {
  const grid = document.getElementById('districts-grid');
  if (!grid) return;
  grid.innerHTML = '';
  (simState.districts ?? []).forEach((d: any) => {
    const card = document.createElement('div');
    card.className = `district-card ${d.id} ${d.social.atRisk ? 'at-risk' : ''}`;
    const orgs = (simState.organizations ?? []).filter((o: any) => o.territory.includes(d.id));
    const orgPills = orgs
      .map(
        (o: any) =>
          `<div class="org-pill">⚠️ ${orgLabel(o.type)} (Inf. ${(o.influence * 100).toFixed(0)}%)</div>`
      )
      .join('');
    card.innerHTML = `
      <div class="district-name">${d.id.replace(/_/g, ' ')}
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

export function bar(label: string, value: number, cls: string) {
  return `
    <div class="progress-bar-group">
      <div class="progress-labels"><span>${label}</span><span>${Math.round(value * 100)}%</span></div>
      <div class="progress-container"><div class="progress-value ${cls}" style="width:${value * 100}%"></div></div>
    </div>
  `;
}

export function orgLabel(type: string) {
  return type === 'gang' ? 'Pandilla' : type === 'cartel' ? 'Cartel' : 'Red Contratistas';
}

export function orgIcon(type: string) {
  return type === 'gang' ? '🔴' : type === 'cartel' ? '💀' : '🤝';
}

export function renderOrganizations() {
  const orgs = simState.organizations ?? [];
  const cnt = document.getElementById('orgs-count');
  if (cnt) cnt.textContent = `${orgs.length} activa${orgs.length !== 1 ? 's' : ''}`;
  const container = document.getElementById('orgs-list');
  if (!container) return;
  if (orgs.length === 0) {
    container.innerHTML = '<div class="empty-state">Sin organizaciones activas.</div>';
    return;
  }
  container.innerHTML = '';
  orgs.forEach((org: any) => {
    const inCrisis = (simState.districts ?? []).some(
      (d: any) => org.territory.includes(d.id) && d.social.atRisk
    );
    const card = document.createElement('div');
    card.className = `org-card ${inCrisis ? 'crisis' : ''}`;
    card.innerHTML = `
      <div class="org-icon">${orgIcon(org.type)}</div>
      <div class="org-info">
        <div class="org-name">${orgLabel(org.type)}</div>
        <span class="org-type-badge">${org.type.replace(/_/g, ' ')}</span>
        <div class="org-territory">📍 ${org.territory.join(', ').replace(/_/g, ' ')}</div>
      </div>
      <div class="org-metrics">
        ${inCrisis ? '<span class="org-crisis-tag">EN CRISIS</span>' : ''}
        <div class="org-metric-row"><span class="org-metric-label">Ingresos</span><span class="org-metric-val" style="color:#f87171">$${Math.round(org.income).toLocaleString()}</span></div>
        <div class="org-metric-row"><span class="org-metric-label">Influencia</span><span class="org-metric-val" style="color:#fb923c">${(org.influence * 100).toFixed(1)}%</span></div>
        <div class="org-metric-row"><span class="org-metric-label">Reclutamiento</span><span class="org-metric-val">${(org.recruitment * 100).toFixed(1)}%</span></div>
        <div class="org-metric-row"><span class="org-metric-label">Violencia</span><span class="org-metric-val">${(org.violence * 100).toFixed(0)}%</span></div>
      </div>
    `;
    container.appendChild(card);
  });
}

export function renderCorruption() {
  const risk = simState.corruptionRisk ?? 0;
  const pct = (risk * 100).toFixed(1);
  const vEl = document.getElementById('corruption-val');
  const bEl = document.getElementById('corruption-bar');
  if (vEl) vEl.textContent = `${pct}%`;
  if (bEl) bEl.style.width = `${Math.min(100, risk * 100)}%`;
}

const EMOTION_ICON: Record<string, string> = {
  anger: '😡',
  fear: '😨',
  relief: '😮‍💨',
  indifference: '😐'
};

export function severityClass(v: number) {
  return v >= 0.6 ? 'high' : v >= 0.3 ? 'medium' : 'low';
}

export function renderFootprintLog() {
  const log = simState.footprintLog ?? [];
  const cnt = document.getElementById('footprint-count');
  if (cnt) cnt.textContent = `${log.length} evento${log.length !== 1 ? 's' : ''}`;
  const container = document.getElementById('footprint-log');
  if (!container) return;
  if (log.length === 0) {
    container.innerHTML = '<div class="empty-state">Ningún evento registrado.</div>';
    return;
  }
  container.innerHTML = '';
  log.forEach((fp: any) => {
    const item = document.createElement('div');
    item.className = 'footprint-item';
    item.innerHTML = `
      <div class="fp-emotion">${EMOTION_ICON[fp.emotion] ?? '📌'}</div>
      <div class="fp-body">
        <div class="fp-topic">${fp.topic.replace(/_/g, ' ')}</div>
        <div class="fp-district">📍 ${fp.affectedDistrict.replace(/_/g, ' ')}</div>
        <div class="fp-culprit">Culpable: ${fp.perceivedCulprit}</div>
      </div>
      <div class="fp-severity ${severityClass(fp.severity)}">Sev. ${(fp.severity * 100).toFixed(0)}%</div>
    `;
    container.appendChild(item);
  });
}
