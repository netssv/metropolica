// ── VEHICLES ENGINE (Canvas 2D) ──

let vehicles = [];
const VEHICLE_TYPES = [
  'compact', 'pickup_old',             // Clase Baja
  'sedan', 'suv', 'minivan',           // Clase Media
  'sports', 'limo', 'electric',        // Clase Alta / Lujo
  'taxi', 'police', 'ambulance', 'truck', 'bus' // Servicios
];

function spawnVehicles() {
  vehicles = [];
  const roads = [];
  for (let r = 0; r < MAP_ROWS; r++) {
    for (let c = 0; c < MAP_COLS; c++) {
      const t = tileMap[r]?.[c];
      if (t && (t.type === T.ROAD || t.type === T.BRIDGE || t.type === T.TRANSIT)) roads.push([c, r]);
    }
  }
  if (roads.length === 0) return;

  const count = Math.min(130, Math.floor(roads.length * 0.3));
  for (let i = 0; i < count; i++) {
    const [tc, tr] = roads[Math.floor(Math.random() * roads.length)];
    const type = VEHICLE_TYPES[Math.floor(Math.random() * VEHICLE_TYPES.length)];
    vehicles.push({
      x: tc + 0.5,
      y: tr + 0.5,
      dir: Math.floor(Math.random() * 4),
      speed: (type === 'sports' || type === 'police') ? 2.3 : (type === 'truck' || type === 'pickup_old') ? 1.1 : 1.6,
      type: type,
      timer: Math.random() * 2,
    });
  }
}

function updateVehicles(dt) {
  vehicles.forEach(v => {
    v.timer += dt;
    const col = Math.floor(v.x);
    const row = Math.floor(v.y);
    const [dx, dy] = DIRS4[v.dir];
    const nextC = Math.floor(v.x + dx * 0.4);
    const nextR = Math.floor(v.y + dy * 0.4);

    const isDriveable = (c, r) => {
      const tt = tileMap[r]?.[c]?.type;
      return tt === T.ROAD || tt === T.BRIDGE || tt === T.TRANSIT;
    };

    if (!isDriveable(nextC, nextR) || Math.random() < 0.02) {
      const valid = [];
      DIRS4.forEach(([cdx, cdy], d) => {
        if (isDriveable(col + cdx, row + cdy)) valid.push(d);
      });
      if (valid.length > 0) v.dir = valid[Math.floor(Math.random() * valid.length)];
      else v.dir = (v.dir + 2) % 4;
    }

    const [moveX, moveY] = DIRS4[v.dir];
    v.x = clamp(v.x + moveX * v.speed * dt, 0, MAP_COLS - 1);
    v.y = clamp(v.y + moveY * v.speed * dt, 0, MAP_ROWS - 1);
  });
}

function drawVehicleBody(ctx, type, vw, vh, t) {
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(-vw/2 + 1, -vh/2 + 2, vw, vh);

  if (type === 'bus') {
    ctx.fillStyle = '#0284c7'; ctx.fillRect(-vw/2, -vh/2, vw, vh);
    ctx.fillStyle = '#f8fafc'; ctx.fillRect(-vw*0.45, -vh*0.3, vw*0.8, vh*0.6);
    ctx.fillStyle = '#38bdf8'; ctx.fillRect(vw*0.25, -vh*0.4, vw*0.2, vh*0.8);
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(-vw*0.4 + i*vw*0.24, -vh*0.46, vw*0.16, vh*0.18);
      ctx.fillRect(-vw*0.4 + i*vw*0.24, vh*0.28, vw*0.16, vh*0.18);
    }
  } else if (type === 'truck') {
    ctx.fillStyle = '#e2e8f0'; ctx.fillRect(-vw/2, -vh*0.48, vw*0.65, vh*0.96);
    ctx.fillStyle = '#94a3b8'; ctx.fillRect(-vw/2 + vw*0.18, -vh*0.45, 1, vh*0.9); ctx.fillRect(-vw/2 + vw*0.38, -vh*0.45, 1, vh*0.9);
    ctx.fillStyle = '#dc2626'; ctx.fillRect(vw*0.15, -vh*0.45, vw*0.33, vh*0.9);
    ctx.fillStyle = '#38bdf8'; ctx.fillRect(vw*0.28, -vh*0.35, vw*0.16, vh*0.7);
  } else if (type === 'limo') {
    ctx.fillStyle = '#0f172a'; ctx.fillRect(-vw/2, -vh/2, vw, vh);
    ctx.fillStyle = '#1e293b'; ctx.fillRect(-vw*0.35, -vh*0.35, vw*0.65, vh*0.7);
    ctx.fillStyle = '#f8fafc'; ctx.fillRect(-vw*0.05, -vh*0.4, vw*0.08, vh*0.8);
  } else if (type === 'sports') {
    ctx.fillStyle = '#ef4444'; ctx.fillRect(-vw/2, -vh/2, vw, vh);
    ctx.fillStyle = '#000'; ctx.fillRect(-vw/2, -vh*0.45, vw*0.1, vh*0.9);
    ctx.fillStyle = '#38bdf8'; ctx.fillRect(vw*0.05, -vh*0.35, vw*0.3, vh*0.7);
  } else if (type === 'electric') {
    ctx.fillStyle = '#f8fafc'; ctx.fillRect(-vw/2, -vh/2, vw, vh);
    ctx.fillStyle = '#38bdf8'; ctx.fillRect(-vw/2, -vh*0.08, vw, vh*0.16);
    ctx.fillStyle = '#0284c7'; ctx.fillRect(vw*0.08, -vh*0.35, vw*0.24, vh*0.7);
  } else if (type === 'pickup_old') {
    ctx.fillStyle = '#b45309'; ctx.fillRect(-vw/2, -vh/2, vw, vh);
    ctx.fillStyle = '#78350f'; ctx.fillRect(-vw/2 + 2, -vh/2 + 2, vw*0.5, vh - 4);
    ctx.fillStyle = '#fde047'; ctx.fillRect(-vw*0.3, -vh*0.2, vw*0.2, vh*0.4);
    ctx.fillStyle = '#38bdf8'; ctx.fillRect(vw*0.12, -vh*0.35, vw*0.22, vh*0.7);
  } else if (type === 'compact') {
    ctx.fillStyle = '#10b981'; ctx.fillRect(-vw/2, -vh/2, vw, vh);
    ctx.fillStyle = '#38bdf8'; ctx.fillRect(vw*0.05, -vh*0.35, vw*0.26, vh*0.7);
  } else if (type === 'suv') {
    ctx.fillStyle = '#334155'; ctx.fillRect(-vw/2, -vh/2, vw, vh);
    ctx.fillStyle = '#64748b'; ctx.fillRect(-vw*0.35, -vh*0.45, vw*0.7, vh*0.1); ctx.fillRect(-vw*0.35, vh*0.35, vw*0.7, vh*0.1);
    ctx.fillStyle = '#38bdf8'; ctx.fillRect(vw*0.08, -vh*0.35, vw*0.24, vh*0.7);
  } else if (type === 'minivan') {
    ctx.fillStyle = '#475569'; ctx.fillRect(-vw/2, -vh/2, vw, vh);
    ctx.fillStyle = '#38bdf8'; ctx.fillRect(-vw*0.2, -vh*0.35, vw*0.55, vh*0.7);
  } else {
    if (type === 'taxi') ctx.fillStyle = '#facc15';
    else if (type === 'police') ctx.fillStyle = '#1e4d8c';
    else if (type === 'ambulance') ctx.fillStyle = '#f8fafc';
    else ctx.fillStyle = '#94a3b8';

    ctx.fillRect(-vw/2, -vh/2, vw, vh);
    ctx.fillStyle = '#38bdf8'; ctx.fillRect(vw*0.08, -vh*0.35, vw*0.24, vh*0.7);

    if (type === 'police') {
      const siren = Math.sin(t * 12) > 0;
      ctx.fillStyle = siren ? '#ef4444' : '#3b82f6';
      ctx.fillRect(-vw*0.12, -vh*0.3, vw*0.16, vh*0.6);
    } else if (type === 'ambulance') {
      ctx.fillStyle = '#ef4444'; ctx.fillRect(-vw*0.1, -vh*0.15, vw*0.2, vh*0.3);
    } else if (type === 'taxi') {
      ctx.fillStyle = '#000'; ctx.fillRect(-vw*0.1, -vh*0.4, vw*0.15, vh*0.8);
    }
  }

  if (type !== 'bus' && type !== 'truck') {
    ctx.fillStyle = '#fef08a'; ctx.fillRect(vw*0.46, -vh*0.4, vw*0.06, vh*0.25); ctx.fillRect(vw*0.46, vh*0.15, vw*0.06, vh*0.25);
    ctx.fillStyle = '#ef4444'; ctx.fillRect(-vw*0.49, -vh*0.35, vw*0.04, vh*0.2); ctx.fillRect(-vw*0.49, vh*0.15, vw*0.04, vh*0.2);
  }
}

function drawSingleVehicle(ctx, type, ts, t) {
  const vx = ts * 0.5, vy = ts * 0.5;
  const isLong = (type === 'bus' || type === 'truck' || type === 'limo');
  const vw = isLong ? ts * 0.72 : (type === 'compact' ? ts * 0.38 : ts * 0.48);
  const vh = ts * 0.3;

  ctx.save();
  ctx.translate(vx, vy);
  drawVehicleBody(ctx, type, vw, vh, t);
  ctx.restore();
}

function drawVehicles(ctx, ts, startC, endC, startR, endR, t) {
  if (cam.zoom < 0.35) return;
  ctx.save();
  vehicles.forEach(v => {
    if (v.x < startC || v.x > endC+1 || v.y < startR || v.y > endR+1) return;

    const laneOffsets = [{ x: ts*0.2, y: 0 }, { x: 0, y: ts*0.2 }, { x: -ts*0.2, y: 0 }, { x: 0, y: -ts*0.2 }];
    const off = laneOffsets[v.dir];
    const vx = v.x * ts + off.x, vy = v.y * ts + off.y;
    const isLong = (v.type === 'bus' || v.type === 'truck' || v.type === 'limo');
    const vw = isLong ? ts * 0.72 : (v.type === 'compact' ? ts * 0.38 : ts * 0.46);
    const vh = ts * 0.28;

    ctx.save();
    ctx.translate(vx, vy);
    const angles = [-Math.PI/2, 0, Math.PI/2, Math.PI];
    ctx.rotate(angles[v.dir]);

    const amb = typeof getAmbientLighting === 'function' ? getAmbientLighting(t) : null;
    if (amb && (amb.isNight || amb.alpha > 0.2)) {
      ctx.fillStyle = 'rgba(254, 240, 138, 0.25)';
      ctx.beginPath();
      ctx.moveTo(vw*0.45, -vh*0.3);
      ctx.lineTo(vw*0.45 + ts*0.85, -vh*0.85);
      ctx.lineTo(vw*0.45 + ts*0.85, vh*0.85);
      ctx.lineTo(vw*0.45, vh*0.3);
      ctx.fill();
    }

    drawVehicleBody(ctx, v.type, vw, vh, t);
    ctx.restore();
  });
  ctx.restore();
}
