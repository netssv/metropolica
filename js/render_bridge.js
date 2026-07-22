// ── BRIDGE TILE RENDERER ──
// Wide-deck bridge matching road width, with animated water and support pillars.

function drawBridgeTile(ctx, wx, wy, ts) {
  const bc = Math.round(wx / ts), br = Math.round(wy / ts);
  const isBR = (col, row) => {
    const tp = typeof tileMap !== 'undefined' ? tileMap[row]?.[col]?.type : null;
    return tp === T.ROAD || tp === T.BRIDGE || tp === T.TRANSIT;
  };
  const bN = isBR(bc, br-1), bS = isBR(bc, br+1);
  const bW = isBR(bc-1, br), bE = isBR(bc+1, br);
  const horiz = (bW || bE) || !(bN || bS);
  const wt = typeof gameTime !== 'undefined' ? gameTime : 0;

  // ── Water background ──
  ctx.fillStyle = `hsl(${212 + 3*Math.sin(wt*0.5+wx*0.04)},55%,28%)`;
  ctx.fillRect(wx, wy, ts, ts);

  // Animated water ripples (direction-aware)
  ctx.strokeStyle = 'rgba(147,210,255,0.2)'; ctx.lineWidth = 1.5;
  for (let ri = 0; ri < 6; ri++) {
    const yo = (ri/6*ts + wt*14) % ts;
    const xo = (ri/6*ts - wt*9) % ts;
    const wig = Math.sin(ri * 1.3) * 4;
    if (horiz) {
      ctx.beginPath(); ctx.moveTo(wx + ts*0.04, wy + yo); ctx.lineTo(wx + ts*0.5 + wig, wy + yo); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(wx + xo, wy + ts*0.04); ctx.lineTo(wx + xo, wy + ts*0.5 + wig); ctx.stroke();
    }
  }

  if (horiz) {
    // ── Horizontal Bridge: full tile width, water visible at top 13% / bottom 13% ──

    // Concrete outer guardrail beams
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(wx, wy + ts*0.05, ts, ts*0.08);  // top beam
    ctx.fillRect(wx, wy + ts*0.87, ts, ts*0.08);  // bottom beam

    // Shadow edge under beams (structural depth)
    ctx.fillStyle = '#334155';
    ctx.fillRect(wx, wy + ts*0.13, ts, ts*0.025);
    ctx.fillRect(wx, wy + ts*0.845, ts, ts*0.025);

    // Road deck — matches ROAD tile color exactly
    ctx.fillStyle = '#3a3a48';
    ctx.fillRect(wx, wy + ts*0.155, ts, ts*0.69);

    // Acera / curb strips (dark band at deck edges)
    ctx.fillStyle = '#4a4a5a';
    ctx.fillRect(wx, wy + ts*0.155, ts, ts*0.045);
    ctx.fillRect(wx, wy + ts*0.8, ts, ts*0.045);

    // Yellow center dashes — same style as road
    ctx.fillStyle = '#f1c232';
    ctx.fillRect(wx + ts*0.04, wy + ts*0.455, ts*0.34, ts*0.09);
    ctx.fillRect(wx + ts*0.62, wy + ts*0.455, ts*0.34, ts*0.09);

    // Support pillar caps in water zone
    ctx.fillStyle = '#64748b';
    [0.12, 0.46, 0.78].forEach(px => {
      ctx.fillRect(wx + ts*px, wy,           ts*0.1, ts*0.05);  // top water
      ctx.fillRect(wx + ts*px, wy + ts*0.95, ts*0.1, ts*0.05);  // bottom water
    });

  } else {
    // ── Vertical Bridge: full tile height, water visible at left 13% / right 13% ──

    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(wx + ts*0.05, wy, ts*0.08, ts);
    ctx.fillRect(wx + ts*0.87, wy, ts*0.08, ts);

    ctx.fillStyle = '#334155';
    ctx.fillRect(wx + ts*0.13, wy, ts*0.025, ts);
    ctx.fillRect(wx + ts*0.845, wy, ts*0.025, ts);

    ctx.fillStyle = '#3a3a48';
    ctx.fillRect(wx + ts*0.155, wy, ts*0.69, ts);

    ctx.fillStyle = '#4a4a5a';
    ctx.fillRect(wx + ts*0.155, wy, ts*0.045, ts);
    ctx.fillRect(wx + ts*0.8,   wy, ts*0.045, ts);

    ctx.fillStyle = '#f1c232';
    ctx.fillRect(wx + ts*0.455, wy + ts*0.04, ts*0.09, ts*0.34);
    ctx.fillRect(wx + ts*0.455, wy + ts*0.62, ts*0.09, ts*0.34);

    ctx.fillStyle = '#64748b';
    [0.12, 0.46, 0.78].forEach(py => {
      ctx.fillRect(wx,           wy + ts*py, ts*0.05, ts*0.1);
      ctx.fillRect(wx + ts*0.95, wy + ts*py, ts*0.05, ts*0.1);
    });
  }
}
