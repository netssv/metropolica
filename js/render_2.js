      }
      break;
    }

    case T.BLDG_C: {
      const lv = tile.level || 1;
      const bh = clamp(ts*(0.35 + lv*0.13), ts*0.35, ts*0.96);
      ctx.fillStyle = '#1a3a6a';
      ctx.fillRect(wx, wy, ts, ts);
      // building (glass)
      ctx.fillStyle = `hsl(215,60%,${18+lv*3}%)`;
      ctx.fillRect(wx+ts*0.08, wy+ts-bh, ts*0.84, bh);
      // glass sheen
      ctx.fillStyle = 'rgba(147,197,253,0.25)';
      ctx.fillRect(wx+ts*0.1, wy+ts-bh+2, ts*0.28, bh-2);
      // horizontal floor lines
      if (ts >= 14) {
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        const floorH = bh/(lv*2+1);
        for (let f = 0; f < lv*2; f++)
          ctx.fillRect(wx+ts*0.1, wy+ts-bh+2+f*floorH, ts*0.8, 1);
      }
      // antenna
      ctx.fillStyle = '#aaa';
      ctx.fillRect(wx+ts*0.47, wy+ts-bh-ts*0.12, ts*0.06, ts*0.12);
      break;
    }

    case T.BLDG_I: {
      const lv = tile.level || 1;
      ctx.fillStyle = '#1a1a22';
      ctx.fillRect(wx, wy, ts, ts);
      // factory body
      ctx.fillStyle = '#2a2a38';
      ctx.fillRect(wx+ts*0.04, wy+ts*0.35, ts*0.92, ts*0.6);
      // chimneys
      const chPos = [0.15, 0.45, 0.72];
      chPos.slice(0, lv).forEach(cx => {
        ctx.fillStyle = '#3a3a4a';
        ctx.fillRect(wx+ts*cx, wy+ts*0.1, ts*0.12, ts*0.28);
        // smoke puffs (animated)
        if (Math.sin(t*3 + cx*10) > 0) {
          ctx.fillStyle = 'rgba(180,180,180,0.25)';
          ctx.beginPath();
          ctx.arc(wx+ts*(cx+0.06), wy+ts*0.08, ts*0.09, 0, Math.PI*2);
          ctx.fill();
          ctx.arc(wx+ts*(cx+0.09), wy+ts*0.02, ts*0.07, 0, Math.PI*2);
          ctx.fill();
        }
      });
      // warning stripes
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(wx+ts*0.04, wy+ts*0.35, ts*0.92, ts*0.05);
      break;
    }

    case T.POWER:
      ctx.fillStyle = '#1a1a2a';
      ctx.fillRect(wx, wy, ts, ts);
      // pole
      ctx.fillStyle = '#888';
      ctx.fillRect(wx+ts*0.46, wy, ts*0.08, ts);
      // crossbars
      ctx.fillRect(wx+ts*0.2, wy+ts*0.2, ts*0.6, ts*0.06);
      ctx.fillRect(wx+ts*0.28, wy+ts*0.5, ts*0.44, ts*0.06);
      // insulators
      ctx.fillStyle = '#ffd700';
      [[0.2,0.2],[0.8,0.2],[0.28,0.5],[0.72,0.5]].forEach(([cx,cy]) => {
        ctx.beginPath(); ctx.arc(wx+ts*cx, wy+ts*cy, ts*0.05, 0, Math.PI*2); ctx.fill();
      });
      break;


    case T.POLICE: {
      // Base: calle + acera
      ctx.fillStyle = '#0f2a4a';
      ctx.fillRect(wx, wy, ts, ts);
      // Edificio principal
      ctx.fillStyle = '#1a3a6a';
      ctx.fillRect(wx + ts*0.06, wy + ts*0.22, ts*0.88, ts*0.72);
      // Fachada más clara
      ctx.fillStyle = '#1e4d8c';
      ctx.fillRect(wx + ts*0.1, wy + ts*0.26, ts*0.55, ts*0.64);
      // Bandera / asta
      ctx.fillStyle = '#888';
      ctx.fillRect(wx + ts*0.72, wy + ts*0.1, ts*0.04, ts*0.18);
      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(wx + ts*0.72, wy + ts*0.1, ts*0.16, ts*0.1);
      // Ventanas (2 filas)
      ctx.fillStyle = '#93c5fd';
      ctx.fillRect(wx + ts*0.15, wy + ts*0.32, ts*0.18, ts*0.12);
      ctx.fillRect(wx + ts*0.38, wy + ts*0.32, ts*0.18, ts*0.12);
      ctx.fillRect(wx + ts*0.15, wy + ts*0.50, ts*0.18, ts*0.12);
      ctx.fillRect(wx + ts*0.38, wy + ts*0.50, ts*0.18, ts*0.12);
      // Letrero PD
      if (ts >= 16) {
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.max(6, ts*0.24)}px monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('PD', wx + ts*0.37, wy + ts*0.74);
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      }
      // Sirena animada (azul/rojo alterno)
      const sirenOn = Math.sin(t * 6) > 0;
      ctx.fillStyle = sirenOn ? 'rgba(59,130,246,0.9)' : 'rgba(239,68,68,0.9)';
      ctx.beginPath();
      ctx.arc(wx + ts*0.5, wy + ts*0.17, ts*0.07, 0, Math.PI*2);
      ctx.fill();
      break;
    }

    case T.FIRE: {
      // Base: asfalto oscuro
      ctx.fillStyle = '#1a0a00';
      ctx.fillRect(wx, wy, ts, ts);
      // Edificio ladrillo
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(wx + ts*0.05, wy + ts*0.18, ts*0.9, ts*0.78);
      // Puerta del garage (grande)
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(wx + ts*0.55, wy + ts*0.5, ts*0.32, ts*0.44);
      ctx.fillStyle = '#7f1d1d';
      // Líneas del garage
      ctx.fillRect(wx + ts*0.55, wy + ts*0.58, ts*0.32, ts*0.02);
      ctx.fillRect(wx + ts*0.55, wy + ts*0.66, ts*0.32, ts*0.02);
      ctx.fillRect(wx + ts*0.55, wy + ts*0.74, ts*0.32, ts*0.02);
      // Ventanas
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(wx + ts*0.12, wy + ts*0.28, ts*0.18, ts*0.14);
      ctx.fillRect(wx + ts*0.35, wy + ts*0.28, ts*0.14, ts*0.14);
      // Letrero FD
      if (ts >= 16) {
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.max(6, ts*0.24)}px monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('FD', wx + ts*0.28, wy + ts*0.72);
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      }
      // Llama animada sobre techo
      const flicker = 0.5 + 0.5 * Math.sin(t * 8 + wx * 0.1);
      ctx.fillStyle = `rgba(251,146,60,${0.6 + flicker * 0.4})`;
      ctx.beginPath();
      ctx.arc(wx + ts*0.5, wy + ts*0.14, ts*(0.06 + flicker*0.05), 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = `rgba(239,68,68,${0.5 + flicker * 0.3})`;
      ctx.beginPath();
      ctx.arc(wx + ts*0.5, wy + ts*0.1, ts*0.04, 0, Math.PI*2);
      ctx.fill();
      break;
    }

    case T.HOSPITAL: {
      // Base: asfalto gris/claro
      ctx.fillStyle = '#2d3748';
      ctx.fillRect(wx, wy, ts, ts);
      // Edificio principal (blanco/gris claro)
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(wx + ts*0.08, wy + ts*0.2, ts*0.84, ts*0.74);
      // Ala secundaria
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(wx + ts*0.15, wy + ts*0.3, ts*0.7, ts*0.64);
      // Cruz roja en la fachada
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(wx + ts*0.44, wy + ts*0.4, ts*0.12, ts*0.34); // vertical
      ctx.fillRect(wx + ts*0.33, wy + ts*0.51, ts*0.34, ts*0.12); // horizontal
      // Ventanas
      ctx.fillStyle = '#93c5fd';
      ctx.fillRect(wx + ts*0.18, wy + ts*0.35, ts*0.1, ts*0.1);
      ctx.fillRect(wx + ts*0.72, wy + ts*0.35, ts*0.1, ts*0.1);
      // Helipuerto en el techo (círculo con 'H')
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(wx + ts*0.5, wy + ts*0.28, ts*0.12, 0, Math.PI*2);
      ctx.stroke();
      if (ts >= 16) {
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.max(5, ts*0.16)}px monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('H', wx + ts*0.5, wy + ts*0.28);
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      }
      break;
    }

    case T.SCHOOL: {
      // Base: pasto base
      ctx.fillStyle = '#1e3a1e';
      ctx.fillRect(wx, wy, ts, ts);
      // Edificio escolar (ladrillo amarillo/beige)
      ctx.fillStyle = '#d97706';
      ctx.fillRect(wx + ts*0.08, wy + ts*0.25, ts*0.84, ts*0.68);
      // Techo inclinado
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.moveTo(wx + ts*0.08, wy + ts*0.25);
      ctx.lineTo(wx + ts*0.5, wy + ts*0.12);
      ctx.lineTo(wx + ts*0.92, wy + ts*0.25);
      ctx.fill();
      // Puerta principal
      ctx.fillStyle = '#78350f';
      ctx.fillRect(wx + ts*0.42, wy + ts*0.65, ts*0.16, ts*0.28);
      // Ventanas escolares (grandes)
      ctx.fillStyle = '#fde047';
      ctx.fillRect(wx + ts*0.16, wy + ts*0.36, ts*0.16, ts*0.18);
      ctx.fillRect(wx + ts*0.68, wy + ts*0.36, ts*0.16, ts*0.18);
      ctx.fillRect(wx + ts*0.16, wy + ts*0.62, ts*0.16, ts*0.18);
      ctx.fillRect(wx + ts*0.68, wy + ts*0.62, ts*0.16, ts*0.18);
      // Reloj escolar en el centro del frontón
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(wx + ts*0.5, wy + ts*0.22, ts*0.06, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.fillRect(wx + ts*0.49, wy + ts*0.19, ts*0.02, ts*0.04);
      break;
    }

    default:
      ctx.fillStyle = '#222';
      ctx.fillRect(wx, wy, ts, ts);
  }
}


// ── RENDER LOOP ──


function renderFrame(timestamp) {
  const dt = Math.min((timestamp - lastFrameTs) / 1000, 0.12);
  lastFrameTs = timestamp;
  gameTime += dt;

  updatePedestrians(dt);

  const cw = gameCanvas.width;
  const ch = gameCanvas.height;
  const ts = TILE_SIZE;

  // Clear
  gameCtx.setTransform(1, 0, 0, 1, 0, 0);
  gameCtx.fillStyle = '#070d18';
  gameCtx.fillRect(0, 0, cw, ch);

  // Apply camera transform (world-space drawing)
  gameCtx.setTransform(cam.zoom, 0, 0, cam.zoom, -cam.x * cam.zoom, -cam.y * cam.zoom);

  // Visible tile range (with 1-tile padding)
  const visW  = cw  / cam.zoom;
  const visH  = ch  / cam.zoom;
  const startC = Math.max(0, Math.floor(cam.x / ts) - 1);
  const endC   = Math.min(MAP_COLS - 1, Math.ceil((cam.x + visW) / ts) + 1);
  const startR = Math.max(0, Math.floor(cam.y / ts) - 1);
  const endR   = Math.min(MAP_ROWS - 1, Math.ceil((cam.y + visH) / ts) + 1);
