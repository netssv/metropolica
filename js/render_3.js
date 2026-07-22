// ── CIVIC TILES & SPECIAL STRUCTURES RENDERING ──

function drawTileRender3(ctx, tile, wx, wy, ts, t) {
  const isNight = typeof getAmbientLighting === 'function' ? getAmbientLighting(t).isNight : false;

  if (tile.type && tile.type.startsWith('veh_') && typeof drawSingleVehicle === 'function') {
    drawSingleVehicle(ctx, tile.type.replace('veh_', ''), ts, t);
    return true;
  }

  if (tile.type && tile.type.startsWith('ped_') && typeof drawPedBody === 'function') {
    ctx.fillStyle = '#1e293b'; ctx.fillRect(wx, wy, ts, ts);
    const r = Math.max(2.5, ts * 0.09);
    const pedType = tile.type.replace('ped_', '');
    const accents = ['#ef4444','#3b82f6','#22c55e','#f97316','#a855f7'];
    const fakePed = {
      pedType: pedType, skinIdx: 1, accentColor: accents[Math.floor(pedType.length % accents.length)],
      stepTimer: t % 1, stepDuration: 0.5,
    };
    drawPedBody(ctx, wx + ts * 0.5, wy + ts * 0.62, r, fakePed, t);
    return true;
  }

  switch (tile.type) {
    case T.BLDG_I: {
      const lv = tile.level || 1;
      ctx.fillStyle = '#1a1a22'; ctx.fillRect(wx, wy, ts, ts);
      if (lv === 1) {
        ctx.fillStyle = '#475569'; ctx.fillRect(wx + ts*0.1, wy + ts*0.4, ts*0.8, ts*0.55);
        ctx.fillStyle = '#64748b'; ctx.fillRect(wx + ts*0.35, wy + ts*0.55, ts*0.3, ts*0.4);
        ctx.fillStyle = isNight ? '#fbbf24' : '#f59e0b'; ctx.fillRect(wx + ts*0.1, wy + ts*0.4, ts*0.8, ts*0.05);
      } else if (lv === 2) {
        ctx.fillStyle = '#2a2a38'; ctx.fillRect(wx + ts*0.06, wy + ts*0.35, ts*0.88, ts*0.6);
        ctx.fillStyle = '#3a3a4a'; ctx.fillRect(wx + ts*0.2, wy + ts*0.1, ts*0.12, ts*0.28);
        if (Math.sin(t*3 + wx*0.1) > 0) {
          ctx.fillStyle = 'rgba(180,180,180,0.3)';
          ctx.beginPath(); ctx.arc(wx + ts*0.26, wy + ts*0.06, ts*0.09, 0, Math.PI*2); ctx.fill();
        }
        ctx.fillStyle = isNight ? '#fbbf24' : '#f59e0b'; ctx.fillRect(wx + ts*0.06, wy + ts*0.35, ts*0.88, ts*0.05);
      } else if (lv === 3) {
        ctx.fillStyle = '#2a2a38'; ctx.fillRect(wx + ts*0.04, wy + ts*0.35, ts*0.6, ts*0.6);
        ctx.fillStyle = '#64748b'; ctx.beginPath(); ctx.arc(wx + ts*0.78, wy + ts*0.65, ts*0.18, 0, Math.PI*2); ctx.fill();
        [0.15, 0.42].forEach(cx => {
          ctx.fillStyle = '#3a3a4a'; ctx.fillRect(wx + ts*cx, wy + ts*0.1, ts*0.12, ts*0.28);
          if (Math.sin(t*3 + cx*10) > 0) {
            ctx.fillStyle = 'rgba(180,180,180,0.3)';
            ctx.beginPath(); ctx.arc(wx + ts*(cx+0.06), wy + ts*0.06, ts*0.08, 0, Math.PI*2); ctx.fill();
          }
        });
        ctx.fillStyle = isNight ? '#fbbf24' : '#f59e0b'; ctx.fillRect(wx + ts*0.04, wy + ts*0.35, ts*0.6, ts*0.05);
      } else {
        ctx.fillStyle = '#2a2a38'; ctx.fillRect(wx + ts*0.04, wy + ts*0.35, ts*0.92, ts*0.6);
        [0.12, 0.35, 0.58, 0.8].forEach(cx => {
          ctx.fillStyle = '#3a3a4a'; ctx.fillRect(wx + ts*cx, wy + ts*0.1, ts*0.1, ts*0.28);
          if (Math.sin(t*3 + cx*10) > 0) {
            ctx.fillStyle = 'rgba(200,200,200,0.35)';
            ctx.beginPath(); ctx.arc(wx + ts*(cx+0.05), wy + ts*0.06, ts*0.07, 0, Math.PI*2); ctx.fill();
          }
        });
        ctx.fillStyle = '#ef4444'; ctx.fillRect(wx + ts*0.48, wy + ts*0.35, ts*0.04, ts*0.05);
      }
      return true;
    }

    case T.CITY_HALL: {
      ctx.fillStyle = '#1e293b'; ctx.fillRect(wx, wy, ts, ts);
      ctx.fillStyle = '#94a3b8'; ctx.fillRect(wx + ts*0.08, wy + ts*0.75, ts*0.84, ts*0.2);
      ctx.fillStyle = '#e2e8f0'; ctx.fillRect(wx + ts*0.12, wy + ts*0.35, ts*0.76, ts*0.42);
      ctx.fillStyle = isNight ? '#fef08a' : '#ffffff';
      [0.18, 0.38, 0.58, 0.76].forEach(cx => ctx.fillRect(wx + ts*cx, wy + ts*0.4, ts*0.06, ts*0.35));
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath(); ctx.moveTo(wx + ts*0.1, wy + ts*0.35); ctx.lineTo(wx + ts*0.5, wy + ts*0.2); ctx.lineTo(wx + ts*0.9, wy + ts*0.35); ctx.fill();
      ctx.fillStyle = isNight ? '#fde047' : '#fbbf24';
      ctx.beginPath(); ctx.arc(wx + ts*0.5, wy + ts*0.18, ts*0.12, Math.PI, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#64748b'; ctx.fillRect(wx + ts*0.5, wy + ts*0.02, ts*0.03, ts*0.15);
      const flagWave = Math.sin(t * 5) * ts * 0.02;
      ctx.fillStyle = '#ef4444'; ctx.fillRect(wx + ts*0.53, wy + ts*0.03, ts*0.14 + flagWave, ts*0.07);
      if (ts >= 16) {
        ctx.fillStyle = isNight ? '#fde047' : '#1e293b'; ctx.font = `bold ${Math.max(5, ts*0.16)}px monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('GOV', wx + ts*0.5, wy + ts*0.58);
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      }
      return true;
    }

    case T.MARKET: {
      ctx.fillStyle = '#78350f'; ctx.fillRect(wx, wy, ts, ts);
      ctx.fillStyle = '#b45309'; ctx.fillRect(wx + ts*0.06, wy + ts*0.25, ts*0.88, ts*0.68);
      const stripes = 6; const sw = ts * 0.88 / stripes;
      for (let s = 0; s < stripes; s++) {
        ctx.fillStyle = (s % 2 === 0) ? '#ef4444' : '#f8fafc';
        ctx.fillRect(wx + ts*0.06 + s*sw, wy + ts*0.25, sw, ts*0.18);
      }
      ctx.fillStyle = isNight ? '#fef08a' : '#f59e0b'; ctx.fillRect(wx + ts*0.12, wy + ts*0.68, ts*0.2, ts*0.2);
      ctx.fillStyle = '#10b981'; ctx.fillRect(wx + ts*0.4, wy + ts*0.68, ts*0.2, ts*0.2);
      ctx.fillStyle = '#3b82f6'; ctx.fillRect(wx + ts*0.68, wy + ts*0.68, ts*0.2, ts*0.2);
      return true;
    }

    case T.TRANSIT: {
      ctx.fillStyle = '#334155'; ctx.fillRect(wx, wy, ts, ts);
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 1.5; ctx.strokeRect(wx + ts*0.05, wy + ts*0.05, ts*0.9, ts*0.9);
      ctx.fillStyle = isNight ? 'rgba(125,211,252,0.6)' : 'rgba(56,189,248,0.3)';
      ctx.fillRect(wx + ts*0.15, wy + ts*0.3, ts*0.7, ts*0.45);
      ctx.fillStyle = '#64748b'; ctx.fillRect(wx + ts*0.15, wy + ts*0.26, ts*0.7, ts*0.06);
      ctx.fillStyle = '#d97706'; ctx.fillRect(wx + ts*0.25, wy + ts*0.55, ts*0.5, ts*0.1);
      ctx.fillStyle = '#0284c7'; ctx.fillRect(wx + ts*0.8, wy + ts*0.15, ts*0.06, ts*0.5);
      const busGlow = isNight ? '#38bdf8' : (Math.sin(t * 4) > 0 ? '#38bdf8' : '#0284c7');
      ctx.fillStyle = busGlow; ctx.beginPath(); ctx.arc(wx + ts*0.83, wy + ts*0.15, ts*0.09, 0, Math.PI*2); ctx.fill();
      return true;
    }

    case T.STADIUM: {
      ctx.fillStyle = '#475569'; ctx.fillRect(wx, wy, ts, ts);
      ctx.fillStyle = '#94a3b8'; ctx.fillRect(wx + ts*0.06, wy + ts*0.06, ts*0.88, ts*0.88);
      ctx.fillStyle = '#15803d'; ctx.fillRect(wx + ts*0.2, wy + ts*0.2, ts*0.6, ts*0.6);
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1;
      ctx.strokeRect(wx + ts*0.24, wy + ts*0.24, ts*0.52, ts*0.52);
      ctx.beginPath(); ctx.arc(wx + ts*0.5, wy + ts*0.5, ts*0.1, 0, Math.PI*2); ctx.stroke();

      // Floodlight cones at night
      const glowAlpha = isNight ? 0.75 : (0.5 + 0.3 * Math.sin(t * 3));
      ctx.fillStyle = `rgba(254,240,138,${glowAlpha})`;
      [[0.08,0.08],[0.92,0.08],[0.08,0.92],[0.92,0.92]].forEach(([lx, ly]) => {
        ctx.beginPath(); ctx.arc(wx + ts*lx, wy + ts*ly, ts*(isNight ? 0.12 : 0.06), 0, Math.PI*2); ctx.fill();
      });
      return true;
    }

    case T.CEMETERY: {
      ctx.fillStyle = '#14532d'; ctx.fillRect(wx, wy, ts, ts);
      ctx.strokeStyle = '#334155'; ctx.lineWidth = 1; ctx.strokeRect(wx + ts*0.04, wy + ts*0.04, ts*0.92, ts*0.92);
      ctx.fillStyle = '#78350f'; ctx.fillRect(wx + ts*0.46, wy + ts*0.04, ts*0.08, ts*0.92);
      ctx.fillStyle = isNight ? '#e2e8f0' : '#cbd5e1';
      [[0.15,0.2],[0.3,0.2],[0.65,0.2],[0.8,0.2],[0.15,0.5],[0.3,0.5],[0.65,0.5],[0.8,0.5],[0.15,0.78],[0.3,0.78],[0.65,0.78],[0.8,0.78]].forEach(([cx, cy]) => {
        ctx.fillRect(wx + ts*cx, wy + ts*cy, ts*0.08, ts*0.12);
      });
      ctx.fillStyle = '#064e3b';
      ctx.beginPath(); ctx.arc(wx + ts*0.12, wy + ts*0.12, ts*0.07, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(wx + ts*0.88, wy + ts*0.88, ts*0.07, 0, Math.PI*2); ctx.fill();
      return true;
    }
  }
  return false;
}
