
  if (tile.type !== prev) {
    localTreasury -= cost;
    updateTreasuryDisplay();
    showToast(`✓ ${currentTool.replace('-',' ')} — $${cost}`, 'success');

    // Zone growth schedule
    if (currentTool.startsWith('zone')) {
      const gc = col, gr = row;
      setTimeout(() => growZone(gc, gr), 4000 + Math.random() * 6000);
    }
    // Respawn pedestrians if road changed
    if (currentTool === 'road' || currentTool === 'demolish') {
      clearTimeout(pedRespawnTimer);
      pedRespawnTimer = setTimeout(spawnPedestrians, 500);
    }
  }
}

let pedRespawnTimer = null;

function growZone(col, row) {
  const tile = tileMap[row]?.[col];
  if (!tile) return;
  if (tile.type === T.ZONE_R) { tile.type = T.BLDG_R; tile.level = 1; }
  else if (tile.type === T.ZONE_C) { tile.type = T.BLDG_C; tile.level = 1; }
  else if (tile.type === T.ZONE_I) { tile.type = T.BLDG_I; tile.level = 1; }
  else return;

  // Level up over time
  if (tile.level < 4) {
    setTimeout(() => {
      if (tileMap[row]?.[col] === tile && tile.level < 4) tile.level++;
    }, 6000 + Math.random() * 8000);
  }
}


