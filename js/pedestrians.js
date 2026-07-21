// ── Pedestrians ──

let pedestrians = [];
const DIRS4 = [[0,-1],[1,0],[0,1],[-1,0]]; // N E S W


// ── Pedestrians ──

  if (cam.zoom >= 0.35) {
    const pedR = Math.max(1.5, 2.5 / cam.zoom);
    gameCtx.save();
    pedestrians.forEach(p => {
      if (p.x < startC || p.x > endC+1 || p.y < startR || p.y > endR+1) return;
      const px = p.x * ts + ts*0.5;
      const py = p.y * ts + ts*0.5;
      // shadow
      gameCtx.fillStyle = 'rgba(0,0,0,0.3)';
      gameCtx.beginPath(); gameCtx.ellipse(px, py+pedR, pedR*0.9, pedR*0.35, 0, 0, Math.PI*2); gameCtx.fill();
      // body
      gameCtx.fillStyle = p.color;
      gameCtx.beginPath(); gameCtx.arc(px, py, pedR, 0, Math.PI*2); gameCtx.fill();
      // head (only when big enough)
      if (cam.zoom >= 1.0) {
        gameCtx.fillStyle = '#f4c49a';
        gameCtx.beginPath(); gameCtx.arc(px, py - pedR*1.2, pedR*0.6, 0, Math.PI*2); gameCtx.fill();
      }
    });
    gameCtx.restore();
  }

  
