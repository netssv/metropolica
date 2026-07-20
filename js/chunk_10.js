async function initMainMenu() {
  const container = document.createElement('div');
  container.id = 'main-menu-container';
  document.body.appendChild(container);
  
  const res = await fetch('components/main_menu.html');
  container.innerHTML = await res.text();
  
  id('btn-menu-random').onclick = () => resetGame(Math.floor(Math.random() * 1000000));
  id('btn-menu-zero').onclick = () => resetGame(1);
  
  id('btn-menu-save').onclick = async () => {
    try {
      const r = await fetch('/api/save', { method: 'POST' });
      if (r.ok) {
        showToast('Partida guardada exitosamente', 'success');
        checkSaveExists();
      }
    } catch(e) { console.error(e); }
  };
  
  id('btn-menu-load').onclick = async () => {
    try {
      const r = await fetch('/api/load', { method: 'POST' });
      if (r.ok) {
        await refreshAll();
        updateHUD();
        hideMainMenu();
        showToast('Partida cargada', 'success');
      }
    } catch(e) { console.error(e); }
  };
  
  id('btn-menu-continue').onclick = hideMainMenu;
  id('btn-menu-continue').disabled = false;
  
  await checkSaveExists();
}

async function checkSaveExists() {
  try {
    const res = await fetch('/api/save/exists');
    const { exists } = await res.json();
    const btnLoad = id('btn-menu-load');
    if (exists) {
      btnLoad.disabled = false;
      btnLoad.classList.add('primary');
    } else {
      btnLoad.disabled = true;
      btnLoad.classList.remove('primary');
    }
  } catch(e) { console.warn(e); }
}

function hideMainMenu() {
  const overlay = document.querySelector('.menu-overlay');
  if (overlay) overlay.classList.add('hidden');
}

function showMainMenu() {
  const overlay = document.querySelector('.menu-overlay');
  if (overlay) {
    overlay.classList.remove('hidden');
    id('btn-menu-continue').disabled = false;
    checkSaveExists();
  }
}

async function resetGame(seed) {
  if (confirm('¿Estás seguro de comenzar una nueva ciudad?')) {
    const r = await fetch('/api/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seed })
    });
    if (r.ok) {
      await refreshAll();
      updateHUD();
      hideMainMenu();
      showToast('Nueva ciudad iniciada', 'success');
    }
  }
}
