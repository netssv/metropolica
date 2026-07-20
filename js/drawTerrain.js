function drawGrass(ctx, wx, wy, ts) {
  ctx.fillStyle = '#2d6a2d';
  ctx.fillRect(wx, wy, ts, ts);
  ctx.fillStyle = '#255225';
  ctx.fillRect(wx + ts*0.15, wy + ts*0.2, ts*0.12, ts*0.1);
  ctx.fillRect(wx + ts*0.6,  wy + ts*0.55, ts*0.1,  ts*0.1);
}

function drawWater(ctx, wx, wy, ts, t) {
  const w = 0.5 + 0.5 * Math.sin(t * 1.8 + wx * 0.04 + wy * 0.03);
  ctx.fillStyle = `hsl(210,70%,${22 + w*5}%)`;
  ctx.fillRect(wx, wy, ts, ts);
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.fillRect(wx + ts*0.05, wy + ts*(0.3 + 0.1*Math.sin(t*2+wx*0.05)), ts*0.7, ts*0.07);
}

function drawRoad(ctx, wx, wy, ts, col, row) {
  const rN = isRoad(col, row-1), rS = isRoad(col, row+1);
  const rW = isRoad(col-1, row), rE = isRoad(col+1, row);
  const horiz = rW || rE;
  const vert  = rN || rS;

  ctx.fillStyle = '#3a3a48';
  ctx.fillRect(wx, wy, ts, ts);

  ctx.fillStyle = '#56566a';
  if (!rN) ctx.fillRect(wx, wy,        ts, 2);
  if (!rS) ctx.fillRect(wx, wy+ts-2,   ts, 2);
  if (!rW) ctx.fillRect(wx, wy,        2,  ts);
  if (!rE) ctx.fillRect(wx+ts-2, wy,   2,  ts);

  ctx.fillStyle = '#f1c232';
  const dw = ts*0.08, dh = ts*0.1, gap = ts*0.35;

  if (horiz && vert) {
    ctx.fillRect(wx + ts*0.05,  wy + ts*0.46, ts*0.35, dw);
    ctx.fillRect(wx + ts*0.60,  wy + ts*0.46, ts*0.35, dw);
    ctx.fillRect(wx + ts*0.46,  wy + ts*0.05, dw, ts*0.35);
    ctx.fillRect(wx + ts*0.46,  wy + ts*0.60, dw, ts*0.35);
  } else if (horiz) {
    ctx.fillRect(wx + ts*0.05,  wy + ts*0.46, ts*0.28, dw);
    ctx.fillRect(wx + ts*0.40,  wy + ts*0.46, ts*0.20, dw);
    ctx.fillRect(wx + ts*0.67,  wy + ts*0.46, ts*0.28, dw);
  } else {
    ctx.fillRect(wx + ts*0.46, wy + ts*0.05,  dw, ts*0.28);
    ctx.fillRect(wx + ts*0.46, wy + ts*0.40,  dw, ts*0.20);
    ctx.fillRect(wx + ts*0.46, wy + ts*0.67,  dw, ts*0.28);
  }
}

function drawBridge(ctx, wx, wy, ts, col, row) {
  const bridgeH = isRoad(col-1, row) || isRoad(col+1, row);
  ctx.fillStyle = '#1e4d8c';
  ctx.fillRect(wx, wy, ts, ts);
  if (bridgeH) {
    ctx.fillStyle = '#5a4a38';
    ctx.fillRect(wx + ts*0.0,  wy + ts*0.2, ts, ts*0.6);
    ctx.fillStyle = '#6b5740';
    ctx.fillRect(wx + ts*0.0,  wy + ts*0.28, ts, ts*0.44);
    ctx.fillStyle = '#888';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(wx + ts*(0.14 + i*0.22), wy + ts*0.22, ts*0.05, ts*0.1);
      ctx.fillRect(wx + ts*(0.14 + i*0.22), wy + ts*0.68, ts*0.05, ts*0.1);
    }
  } else {
    ctx.fillStyle = '#5a4a38';
    ctx.fillRect(wx + ts*0.2, wy + ts*0.0, ts*0.6, ts);
    ctx.fillStyle = '#6b5740';
    ctx.fillRect(wx + ts*0.28, wy + ts*0.0, ts*0.44, ts);
    ctx.fillStyle = '#888';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(wx + ts*0.22, wy + ts*(0.14 + i*0.22), ts*0.1, ts*0.05);
      ctx.fillRect(wx + ts*0.68, wy + ts*(0.14 + i*0.22), ts*0.1, ts*0.05);
    }
  }
}

function drawTree(ctx, wx, wy, ts) {
  ctx.fillStyle = '#1a4d1a';
  ctx.fillRect(wx, wy, ts, ts);
  ctx.fillStyle = '#5c3a1e';
  ctx.fillRect(wx + ts*0.42, wy + ts*0.58, ts*0.16, ts*0.38);
  ctx.fillStyle = '#0d3a0d';
  ctx.beginPath(); ctx.arc(wx+ts/2, wy+ts*0.42, ts*0.38, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#145214';
  ctx.beginPath(); ctx.arc(wx+ts*0.38, wy+ts*0.32, ts*0.22, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(wx+ts*0.62, wy+ts*0.35, ts*0.18, 0, Math.PI*2); ctx.fill();
}

function drawPark(ctx, wx, wy, ts) {
  ctx.fillStyle = '#1e7a3e';
  ctx.fillRect(wx, wy, ts, ts);
  ctx.fillStyle = '#c9a96a';
  ctx.fillRect(wx + ts*0.42, wy, ts*0.16, ts);
  ctx.fillRect(wx, wy + ts*0.42, ts, ts*0.16);
  ctx.fillStyle = '#0a4a0a';
  ctx.beginPath(); ctx.arc(wx+ts*0.22, wy+ts*0.22, ts*0.14, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(wx+ts*0.78, wy+ts*0.78, ts*0.14, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#8b6914';
  ctx.fillRect(wx + ts*0.6, wy + ts*0.25, ts*0.25, ts*0.07);
}

function drawSand(ctx, wx, wy, ts) {
  ctx.fillStyle = '#c4a86a';
  ctx.fillRect(wx, wy, ts, ts);
  ctx.fillStyle = '#d4b87a';
  ctx.fillRect(wx+ts*0.1, wy+ts*0.2, ts*0.15, ts*0.1);
  ctx.fillRect(wx+ts*0.55, wy+ts*0.6, ts*0.12, ts*0.08);
}
