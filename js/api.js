// ── API ──


async function fetchState() {
  try {
    const res = await fetch('/api/state');
    const prev = simState.treasury;
    simState = await res.json();
    if (prev === undefined) {
      localTreasury = simState.treasury ?? localTreasury;
    } else if (simState.treasury !== undefined && simState.treasury !== prev) {
      localTreasury += (simState.treasury - prev);
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


