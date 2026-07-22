// ── PEDESTRIANS RENDERING ──

// Tipos de peatón por clase social y rol
const PED_TYPES = [
  'worker',      // Obrero / Clase baja: casco amarillo, ropa azul
  'casual',      // Casual / Clase media: ropa variada
  'executive',   // Ejecutivo / Clase alta: traje oscuro
  'student',     // Estudiante: mochila, ropa colorida
  'elder',       // Anciano: camina lento, bastón
  'tourist',     // Turista: cámara, sombrero
  'police',      // Policía: uniforme azul oscuro
  'child',       // Niño: pequeño, ropa brillante
];

const PED_SKIN_TONES = ['#f4c49a', '#d4944a', '#a0522d', '#f9e0c8', '#8B4513', '#FFDAB9'];

function getPedSkin(p) {
  return PED_SKIN_TONES[p.skinIdx];
}

function drawPedBody(ctx, px, py, r, p, t) {
  const skin = getPedSkin(p);
  const type = p.pedType;
  const bob  = Math.sin((p.stepTimer / p.stepDuration) * Math.PI * 2) * r * 0.25;
  const bpy  = py + bob;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(px, bpy + r * 1.1, r * 0.85, r * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  if (type === 'worker') {
    ctx.fillStyle = '#1d4ed8'; ctx.beginPath(); ctx.arc(px, bpy, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(px, bpy - r * 1.25, r * 0.65, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b45309'; ctx.beginPath(); ctx.arc(px, bpy - r * 2.0, r * 0.55, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ca8a04'; ctx.fillRect(px - r * 0.7, bpy - r * 2.55, r * 1.4, r * 0.4);
  } else if (type === 'executive') {
    ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.arc(px, bpy, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(px, bpy - r * 1.25, r * 0.65, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#94a3b8'; ctx.fillRect(px - r * 0.08, bpy - r * 1.65, r * 0.16, r * 0.38);
  } else if (type === 'student') {
    const clr = p.accentColor;
    ctx.fillStyle = clr; ctx.beginPath(); ctx.arc(px, bpy, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(px, bpy - r * 1.25, r * 0.65, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6366f1'; ctx.beginPath(); ctx.arc(px + r * 0.6, bpy - r * 0.2, r * 0.55, 0, Math.PI * 2); ctx.fill();
  } else if (type === 'elder') {
    ctx.fillStyle = '#64748b'; ctx.beginPath(); ctx.arc(px, bpy, r * 0.85, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e2e8f0'; ctx.beginPath(); ctx.arc(px, bpy - r * 1.1, r * 0.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#78350f'; ctx.fillRect(px + r * 0.55, bpy - r * 0.2, r * 0.15, r * 1.4);
  } else if (type === 'tourist') {
    ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.arc(px, bpy, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(px, bpy - r * 1.25, r * 0.65, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath(); ctx.arc(px, bpy - r * 2.0, r * 0.8, Math.PI, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#a16207'; ctx.fillRect(px - r * 0.7, bpy - r * 2.0, r * 1.4, r * 0.22);
  } else if (type === 'police') {
    ctx.fillStyle = '#1e40af'; ctx.beginPath(); ctx.arc(px, bpy, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(px, bpy - r * 1.25, r * 0.65, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1d4ed8'; ctx.beginPath(); ctx.arc(px, bpy - r * 2.0, r * 0.62, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fbbf24'; ctx.fillRect(px - r * 0.18, bpy - r * 0.5, r * 0.36, r * 0.3);
  } else if (type === 'child') {
    const clr = p.accentColor;
    ctx.fillStyle = clr; ctx.beginPath(); ctx.arc(px, bpy, r * 0.7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(px, bpy - r * 0.95, r * 0.55, 0, Math.PI * 2); ctx.fill();
  } else {
    // casual
    ctx.fillStyle = p.accentColor; ctx.beginPath(); ctx.arc(px, bpy, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(px, bpy - r * 1.25, r * 0.65, 0, Math.PI * 2); ctx.fill();
  }
}

function drawPedestrians(ctx, ts, startC, endC, startR, endR) {
  if (cam.zoom < 0.5) return;
  const pedR = Math.max(1.2, 2.8 / cam.zoom);
  ctx.save();
  pedestrians.forEach(p => {
    if (p.x < startC || p.x > endC + 1 || p.y < startR || p.y > endR + 1) return;
    const px = (p.x + 0.4) * ts;
    const py = (p.y + 0.4) * ts;
    drawPedBody(ctx, px, py, pedR, p, 0);
  });
  ctx.restore();
}
