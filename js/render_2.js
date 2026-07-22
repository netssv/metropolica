// ── RESIDENTIAL & COMMERCIAL BUILDINGS + SERVICES RENDERING ──

function drawTileRender2(ctx, tile, wx, wy, ts, t) {
  const isNight = typeof getAmbientLighting === 'function' ? getAmbientLighting(t).isNight : false;
  const winGlow = isNight ? '#fef08a' : '#fde047';

  switch (tile.type) {
    case T.BLDG_R: {
      const lv = tile.level || 1;
      if (lv === 1) {
        ctx.fillStyle = '#2d6a2d'; ctx.fillRect(wx, wy, ts, ts);
        ctx.fillStyle = '#d97706'; ctx.fillRect(wx + ts*0.15, wy + ts*0.4, ts*0.7, ts*0.52);
        ctx.fillStyle = '#b45309';
        ctx.beginPath(); ctx.moveTo(wx + ts*0.1, wy + ts*0.4); ctx.lineTo(wx + ts*0.5, wy + ts*0.18); ctx.lineTo(wx + ts*0.9, wy + ts*0.4); ctx.fill();
        ctx.fillStyle = '#78350f'; ctx.fillRect(wx + ts*0.42, wy + ts*0.64, ts*0.16, ts*0.28);
        ctx.fillStyle = winGlow; ctx.fillRect(wx + ts*0.22, wy + ts*0.5, ts*0.14, ts*0.16);
      } else if (lv === 2) {
        ctx.fillStyle = '#2d6a2d'; ctx.fillRect(wx, wy, ts, ts);
        ctx.fillStyle = '#c9a96a'; ctx.fillRect(wx + ts*0.4, wy + ts*0.75, ts*0.2, ts*0.25);
        ctx.fillStyle = '#f1f5f9'; ctx.fillRect(wx + ts*0.12, wy + ts*0.25, ts*0.76, ts*0.68);
        ctx.fillStyle = '#334155'; ctx.fillRect(wx + ts*0.1, wy + ts*0.25, ts*0.8, ts*0.08);
        ctx.fillStyle = winGlow;
        [[0.2,0.35],[0.6,0.35],[0.2,0.6]].forEach(([x,y]) => ctx.fillRect(wx + ts*x, wy + ts*y, ts*0.18, ts*0.16));
        ctx.fillStyle = '#475569'; ctx.fillRect(wx + ts*0.58, wy + ts*0.6, ts*0.18, ts*0.33);
      } else if (lv === 3) {
        ctx.fillStyle = '#1e293b'; ctx.fillRect(wx, wy, ts, ts);
        const bh = ts * 0.85;
        ctx.fillStyle = '#9a3412'; ctx.fillRect(wx + ts*0.1, wy + ts - bh, ts*0.8, bh);
        ctx.fillStyle = '#7c2d12'; ctx.fillRect(wx + ts*0.08, wy + ts - bh, ts*0.84, ts*0.06);
        ctx.fillStyle = winGlow;
        for (let wr = 0; wr < 3; wr++)
          for (let wc = 0; wc < 3; wc++)
            ctx.fillRect(wx + ts*(0.16 + wc*0.25), wy + ts - bh + ts*0.12 + wr*ts*0.22, ts*0.14, ts*0.12);
        ctx.fillStyle = isNight ? '#38bdf8' : '#0284c7'; ctx.fillRect(wx + ts*0.38, wy + ts - ts*0.2, ts*0.24, ts*0.2);
      } else {
        ctx.fillStyle = '#0f172a'; ctx.fillRect(wx, wy, ts, ts);
        const bh = ts * 0.94;
        ctx.fillStyle = '#1e293b'; ctx.fillRect(wx + ts*0.08, wy + ts - bh, ts*0.84, bh);
        ctx.fillStyle = isNight ? '#7dd3fc' : '#38bdf8';
        ctx.fillRect(wx + ts*0.15, wy + ts - bh + ts*0.08, ts*0.28, bh - ts*0.12);
        ctx.fillRect(wx + ts*0.57, wy + ts - bh + ts*0.08, ts*0.28, bh - ts*0.12);
        ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(wx + ts*0.18, wy + ts - bh + ts*0.1, ts*0.08, bh - ts*0.16);
        ctx.fillStyle = '#16a34a'; ctx.fillRect(wx + ts*0.2, wy + ts - bh, ts*0.6, ts*0.05);
        const beacon = Math.sin(t * 5) > 0 ? '#ef4444' : '#7f1d1d';
        ctx.fillStyle = beacon; ctx.fillRect(wx + ts*0.48, wy + ts - bh - ts*0.08, ts*0.04, ts*0.08);
      }
      return true;
    }

    case T.BLDG_C: {
      const lv = tile.level || 1;
      if (lv === 1) {
        ctx.fillStyle = '#334155'; ctx.fillRect(wx, wy, ts, ts);
        ctx.fillStyle = '#1d4ed8'; ctx.fillRect(wx + ts*0.1, wy + ts*0.45, ts*0.8, ts*0.5);
        ctx.fillStyle = isNight ? '#bae6fd' : '#93c5fd'; ctx.fillRect(wx + ts*0.18, wy + ts*0.52, ts*0.38, ts*0.28);
        ctx.fillStyle = '#1e3a8a'; ctx.fillRect(wx + ts*0.62, wy + ts*0.52, ts*0.2, ts*0.43);
        ctx.fillStyle = isNight ? '#fef08a' : '#fde047'; ctx.fillRect(wx + ts*0.1, wy + ts*0.45, ts*0.8, ts*0.06);
      } else if (lv === 2) {
        ctx.fillStyle = '#1e293b'; ctx.fillRect(wx, wy, ts, ts);
        const bh = ts * 0.75;
        ctx.fillStyle = '#1e4d8c'; ctx.fillRect(wx + ts*0.08, wy + ts - bh, ts*0.84, bh);
        ctx.fillStyle = isNight ? '#e0f2fe' : '#bfdbfe';
        ctx.fillRect(wx + ts*0.15, wy + ts - bh + ts*0.1, ts*0.7, ts*0.22);
        ctx.fillRect(wx + ts*0.15, wy + ts - bh + ts*0.42, ts*0.7, ts*0.25);
        ctx.fillStyle = '#fbbf24'; ctx.fillRect(wx + ts*0.1, wy + ts - bh - ts*0.06, ts*0.8, ts*0.06);
      } else if (lv === 3) {
        ctx.fillStyle = '#0f172a'; ctx.fillRect(wx, wy, ts, ts);
        const bh = ts * 0.88;
        ctx.fillStyle = '#0369a1'; ctx.fillRect(wx + ts*0.06, wy + ts - bh, ts*0.88, bh);
        ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(wx + ts*0.08, wy + ts - bh + 2, ts*0.25, bh - 2);
        ctx.fillStyle = isNight ? '#7dd3fc' : '#38bdf8';
        for (let f = 0; f < 3; f++)
          ctx.fillRect(wx + ts*0.12, wy + ts - bh + ts*0.12 + f*ts*0.24, ts*0.76, ts*0.12);
        ctx.fillStyle = '#38bdf8'; ctx.fillRect(wx + ts*0.46, wy + ts - bh - ts*0.1, ts*0.08, ts*0.1);
      } else {
        ctx.fillStyle = '#090d16'; ctx.fillRect(wx, wy, ts, ts);
        const bh = ts * 0.96;
        ctx.fillStyle = '#0f172a'; ctx.fillRect(wx + ts*0.06, wy + ts - bh, ts*0.88, bh);
        ctx.fillStyle = isNight ? '#bae6fd' : '#38bdf8'; ctx.fillRect(wx + ts*0.1, wy + ts - bh + ts*0.06, ts*0.8, bh - ts*0.1);
        ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(wx + ts*0.15, wy + ts - bh + ts*0.08, ts*0.2, bh - ts*0.14);
        const strob = Math.sin(t * 6) > 0 ? '#38bdf8' : '#0284c7';
        ctx.fillStyle = strob; ctx.fillRect(wx + ts*0.47, wy + ts - bh - ts*0.12, ts*0.06, ts*0.12);
      }
      return true;
    }

    case T.POWER: {
      ctx.fillStyle = '#1c1c24'; ctx.fillRect(wx, wy, ts, ts);
      ctx.fillStyle = '#78350f'; ctx.fillRect(wx + ts*0.1, wy + ts*0.4, ts*0.8, ts*0.55);
      ctx.fillStyle = isNight ? '#fef08a' : '#fbbf24'; ctx.fillRect(wx + ts*0.14, wy + ts*0.44, ts*0.72, ts*0.05);
      ctx.fillStyle = '#422006'; ctx.fillRect(wx + ts*0.35, wy + ts*0.1, ts*0.08, ts*0.32);
      ctx.fillStyle = '#fbbf24';
      [0.1, 0.35, 0.6].forEach(px => {
        ctx.fillRect(wx + ts*px, wy + ts*0.1, ts*0.08, ts*0.04);
        ctx.fillRect(wx + ts*px, wy + ts*0.2, ts*0.08, ts*0.04);
        ctx.fillRect(wx + ts*px, wy + ts*0.3, ts*0.08, ts*0.04);
      });
      const pulse = 0.5 + 0.5 * Math.sin(t * 4);
      ctx.fillStyle = `rgba(251,191,36,${0.5 + pulse * 0.5})`;
      ctx.beginPath(); ctx.arc(wx + ts*0.5, wy + ts*0.25, ts*0.1, 0, Math.PI*2); ctx.fill();
      return true;
    }

    case T.POLICE: {
      ctx.fillStyle = '#1e293b'; ctx.fillRect(wx, wy, ts, ts);
      ctx.fillStyle = '#1e4d8c'; ctx.fillRect(wx + ts*0.06, wy + ts*0.22, ts*0.88, ts*0.72);
      ctx.fillStyle = '#f8fafc'; ctx.fillRect(wx + ts*0.12, wy + ts*0.32, ts*0.76, ts*0.55);
      ctx.fillStyle = isNight ? '#7dd3fc' : '#93c5fd';
      ctx.fillRect(wx + ts*0.18, wy + ts*0.4, ts*0.22, ts*0.2);
      ctx.fillRect(wx + ts*0.6, wy + ts*0.4, ts*0.22, ts*0.2);
      const siren = Math.sin(t * 10) > 0;
      ctx.fillStyle = siren ? '#ef4444' : '#3b82f6';
      ctx.fillRect(wx + ts*0.37, wy + ts*0.15, ts*0.12, ts*0.1);
      if (ts >= 16) {
        ctx.fillStyle = isNight ? '#38bdf8' : '#1e293b';
        ctx.font = `bold ${Math.max(5, ts*0.18)}px monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('POL', wx + ts*0.5, wy + ts*0.6);
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      }
      return true;
    }

    case T.FIRE: {
      ctx.fillStyle = '#1a0a00'; ctx.fillRect(wx, wy, ts, ts);
      ctx.fillStyle = '#7f1d1d'; ctx.fillRect(wx + ts*0.05, wy + ts*0.18, ts*0.9, ts*0.78);
      ctx.fillStyle = '#991b1b'; ctx.fillRect(wx + ts*0.55, wy + ts*0.5, ts*0.32, ts*0.44);
      [0.58, 0.66, 0.74].forEach(y => ctx.fillRect(wx + ts*0.55, wy + ts*y, ts*0.32, ts*0.02));
      ctx.fillStyle = isNight ? '#fef08a' : '#fbbf24';
      ctx.fillRect(wx + ts*0.12, wy + ts*0.28, ts*0.18, ts*0.14);
      ctx.fillRect(wx + ts*0.35, wy + ts*0.28, ts*0.14, ts*0.14);
      const fl = 0.5 + 0.5 * Math.sin(t * 8 + wx * 0.1);
      ctx.fillStyle = `rgba(251,146,60,${0.6 + fl * 0.4})`;
      ctx.beginPath(); ctx.arc(wx + ts*0.5, wy + ts*0.14, ts*(0.06 + fl*0.05), 0, Math.PI*2); ctx.fill();
      return true;
    }

    case T.HOSPITAL: {
      ctx.fillStyle = '#2d3748'; ctx.fillRect(wx, wy, ts, ts);
      ctx.fillStyle = '#f8fafc'; ctx.fillRect(wx + ts*0.08, wy + ts*0.2, ts*0.84, ts*0.74);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(wx + ts*0.44, wy + ts*0.4, ts*0.12, ts*0.34);
      ctx.fillRect(wx + ts*0.33, wy + ts*0.51, ts*0.34, ts*0.12);
      ctx.fillStyle = isNight ? '#7dd3fc' : '#93c5fd';
      ctx.fillRect(wx + ts*0.18, wy + ts*0.35, ts*0.1, ts*0.1);
      ctx.fillRect(wx + ts*0.72, wy + ts*0.35, ts*0.1, ts*0.1);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(wx + ts*0.5, wy + ts*0.28, ts*0.12, 0, Math.PI*2); ctx.stroke();
      return true;
    }

    case T.SCHOOL: {
      ctx.fillStyle = '#1e3a1e'; ctx.fillRect(wx, wy, ts, ts);
      ctx.fillStyle = '#d97706'; ctx.fillRect(wx + ts*0.08, wy + ts*0.25, ts*0.84, ts*0.68);
      ctx.fillStyle = '#b45309';
      ctx.beginPath(); ctx.moveTo(wx + ts*0.08, wy + ts*0.25); ctx.lineTo(wx + ts*0.5, wy + ts*0.12); ctx.lineTo(wx + ts*0.92, wy + ts*0.25); ctx.fill();
      ctx.fillStyle = '#78350f'; ctx.fillRect(wx + ts*0.42, wy + ts*0.65, ts*0.16, ts*0.28);
      ctx.fillStyle = winGlow;
      [[0.16,0.36],[0.68,0.36],[0.16,0.62],[0.68,0.62]].forEach(([px,py]) => ctx.fillRect(wx + ts*px, wy + ts*py, ts*0.16, ts*0.18));
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(wx + ts*0.5, wy + ts*0.22, ts*0.06, 0, Math.PI*2); ctx.fill();
      return true;
    }
  }
  return false;
}
