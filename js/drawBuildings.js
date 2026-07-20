function drawZoneEmpty(ctx, type, wx, wy, ts) {
  if (type === T.ZONE_R) {
    ctx.fillStyle = '#2d6a2d'; ctx.fillRect(wx, wy, ts, ts);
    ctx.strokeStyle = '#86efac'; ctx.lineWidth = 1.5; ctx.strokeRect(wx+1.5, wy+1.5, ts-3, ts-3);
    if (ts >= 16) { ctx.fillStyle = '#86efac'; ctx.font = `bold ${Math.max(8, ts*0.38)}px monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('R', wx+ts/2, wy+ts/2); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; }
  } else if (type === T.ZONE_C) {
    ctx.fillStyle = '#1a3a6a'; ctx.fillRect(wx, wy, ts, ts);
    ctx.strokeStyle = '#93c5fd'; ctx.lineWidth = 1.5; ctx.strokeRect(wx+1.5, wy+1.5, ts-3, ts-3);
    if (ts >= 16) { ctx.fillStyle = '#93c5fd'; ctx.font = `bold ${Math.max(8, ts*0.38)}px monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('C', wx+ts/2, wy+ts/2); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; }
  } else if (type === T.ZONE_I) {
    ctx.fillStyle = '#5a3a0a'; ctx.fillRect(wx, wy, ts, ts);
    ctx.strokeStyle = '#fcd34d'; ctx.lineWidth = 1.5; ctx.strokeRect(wx+1.5, wy+1.5, ts-3, ts-3);
    if (ts >= 16) { ctx.fillStyle = '#fcd34d'; ctx.font = `bold ${Math.max(8, ts*0.38)}px monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('I', wx+ts/2, wy+ts/2); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; }
  }
}

function drawBuildingR(ctx, lv, wx, wy, ts) {
  const bh = clamp(ts*(0.28 + lv*0.14), ts*0.28, ts*0.9);
  ctx.fillStyle = '#2d6a2d'; ctx.fillRect(wx, wy, ts, ts);
  ctx.fillStyle = `hsl(${25+lv*5},55%,${32+lv*3}%)`; ctx.fillRect(wx+ts*0.1, wy+ts-bh, ts*0.8, bh);
  ctx.fillStyle = `hsl(${25+lv*5},40%,${25+lv*2}%)`; ctx.fillRect(wx+ts*0.1, wy+ts-bh, ts*0.8, ts*0.08);
  if (ts >= 14) {
    ctx.fillStyle = '#ffd580cc';
    const cols = 2, wrows = Math.min(lv+1, 4);
    const ww = ts*0.16, wh = ts*0.12;
    for (let wr = 0; wr < wrows; wr++)
      for (let wc = 0; wc < cols; wc++) {
        const ex = wx + ts*(0.18 + wc*0.42);
        const ey = wy + ts - bh + ts*0.12 + wr*(bh-ts*0.12)/(wrows+0.5);
        ctx.fillRect(ex, ey, ww, wh);
      }
  }
}

function drawBuildingC(ctx, lv, wx, wy, ts) {
  const bh = clamp(ts*(0.35 + lv*0.13), ts*0.35, ts*0.96);
  ctx.fillStyle = '#1a3a6a'; ctx.fillRect(wx, wy, ts, ts);
  ctx.fillStyle = `hsl(215,60%,${18+lv*3}%)`; ctx.fillRect(wx+ts*0.08, wy+ts-bh, ts*0.84, bh);
  ctx.fillStyle = 'rgba(147,197,253,0.25)'; ctx.fillRect(wx+ts*0.1, wy+ts-bh+2, ts*0.28, bh-2);
  if (ts >= 14) {
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    const floorH = bh/(lv*2+1);
    for (let f = 0; f < lv*2; f++) ctx.fillRect(wx+ts*0.1, wy+ts-bh+2+f*floorH, ts*0.8, 1);
  }
  ctx.fillStyle = '#aaa'; ctx.fillRect(wx+ts*0.47, wy+ts-bh-ts*0.12, ts*0.06, ts*0.12);
}

function drawBuildingI(ctx, lv, wx, wy, ts, t) {
  ctx.fillStyle = '#1a1a22'; ctx.fillRect(wx, wy, ts, ts);
  ctx.fillStyle = '#2a2a38'; ctx.fillRect(wx+ts*0.04, wy+ts*0.35, ts*0.92, ts*0.6);
  const chPos = [0.15, 0.45, 0.72];
  chPos.slice(0, lv).forEach(cx => {
    ctx.fillStyle = '#3a3a4a'; ctx.fillRect(wx+ts*cx, wy+ts*0.1, ts*0.12, ts*0.28);
    if (Math.sin(t*3 + cx*10) > 0) {
      ctx.fillStyle = 'rgba(180,180,180,0.25)'; ctx.beginPath();
      ctx.arc(wx+ts*(cx+0.06), wy+ts*0.08, ts*0.09, 0, Math.PI*2); ctx.fill();
      ctx.arc(wx+ts*(cx+0.09), wy+ts*0.02, ts*0.07, 0, Math.PI*2); ctx.fill();
    }
  });
  ctx.fillStyle = '#f59e0b'; ctx.fillRect(wx+ts*0.04, wy+ts*0.35, ts*0.92, ts*0.05);
}

function drawPower(ctx, wx, wy, ts) {
  ctx.fillStyle = '#1a1a2a'; ctx.fillRect(wx, wy, ts, ts);
  ctx.fillStyle = '#888'; ctx.fillRect(wx+ts*0.46, wy, ts*0.08, ts);
  ctx.fillRect(wx+ts*0.2, wy+ts*0.2, ts*0.6, ts*0.06);
  ctx.fillRect(wx+ts*0.28, wy+ts*0.5, ts*0.44, ts*0.06);
  ctx.fillStyle = '#ffd700';
  [[0.2,0.2],[0.8,0.2],[0.28,0.5],[0.72,0.5]].forEach(([cx,cy]) => {
    ctx.beginPath(); ctx.arc(wx+ts*cx, wy+ts*cy, ts*0.05, 0, Math.PI*2); ctx.fill();
  });
}
