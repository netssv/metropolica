/** Window on the SW (lit) wall face. */
export function drawWindow(
  ctx: CanvasRenderingContext2D,
  cx: number, base: number, hw: number, hh: number, height: number,
  zoom: number, night: boolean, time: number, seed: number
) {
  const u = 0.35;
  const v = 0.45;
  const wFrac = 0.32;
  const hFrac = 0.35;

  const origX = cx - hw + u * hw;
  const origY = base - hh + u * hh - v * height;

  const widthVecX = wFrac * hw;
  const widthVecY = wFrac * hh;
  const heightVal = hFrac * height;

  ctx.fillStyle = night ? '#ffe9a3' : '#94cdd8';
  ctx.beginPath();
  ctx.moveTo(origX, origY);
  ctx.lineTo(origX + widthVecX, origY + widthVecY);
  ctx.lineTo(origX + widthVecX, origY + widthVecY - heightVal);
  ctx.lineTo(origX, origY - heightVal);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#4a757d';
  ctx.lineWidth = Math.max(0.6, 0.8 * zoom);
  ctx.stroke();

  if (!night) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.beginPath();
    ctx.moveTo(origX + widthVecX * 0.15, origY + widthVecY * 0.15 - heightVal * 0.2);
    ctx.lineTo(origX + widthVecX * 0.45, origY + widthVecY * 0.45 - heightVal * 0.2);
    ctx.lineTo(origX + widthVecX * 0.45, origY + widthVecY * 0.45 - heightVal * 0.8);
    ctx.lineTo(origX + widthVecX * 0.15, origY + widthVecY * 0.15 - heightVal * 0.8);
    ctx.closePath();
    ctx.fill();
  }

  ctx.strokeStyle = 'rgba(40, 70, 80, 0.5)';
  ctx.lineWidth = Math.max(0.5, 0.6 * zoom);
  ctx.beginPath();
  ctx.moveTo(origX + widthVecX * 0.5, origY + widthVecY * 0.5);
  ctx.lineTo(origX + widthVecX * 0.5, origY + widthVecY * 0.5 - heightVal);
  ctx.moveTo(origX, origY - heightVal * 0.5);
  ctx.lineTo(origX + widthVecX, origY + widthVecY - heightVal * 0.5);
  ctx.stroke();
}

/** Door on the SE (shaded/front) wall face. */
export function drawDoor(
  ctx: CanvasRenderingContext2D,
  cx: number, base: number, hw: number, hh: number, height: number,
  zoom: number
) {
  const u = 0.3;
  const wFrac = 0.25;
  const hFrac = 0.65;

  const origX = cx + u * hw;
  const origY = base - u * hh;

  const widthVecX = wFrac * hw;
  const widthVecY = -wFrac * hh;
  const heightVal = hFrac * height;

  ctx.fillStyle = '#261a12';
  ctx.beginPath();
  ctx.moveTo(origX - 0.5 * zoom, origY + 0.5 * zoom);
  ctx.lineTo(origX + widthVecX + 0.5 * zoom, origY + widthVecY - 0.5 * zoom);
  ctx.lineTo(origX + widthVecX + 0.5 * zoom, origY + widthVecY - heightVal - 0.5 * zoom);
  ctx.lineTo(origX - 0.5 * zoom, origY - heightVal - 0.5 * zoom);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#4a3324';
  ctx.beginPath();
  ctx.moveTo(origX, origY);
  ctx.lineTo(origX + widthVecX, origY + widthVecY);
  ctx.lineTo(origX + widthVecX, origY + widthVecY - heightVal);
  ctx.lineTo(origX, origY - heightVal);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#261a12';
  ctx.lineWidth = Math.max(0.5, 0.7 * zoom);
  ctx.stroke();

  ctx.fillStyle = '#3a271b';
  const insetMarginW = widthVecX * 0.18;
  const insetMarginH = heightVal * 0.12;
  ctx.beginPath();
  ctx.moveTo(origX + insetMarginW, origY + (widthVecY * 0.18) - insetMarginH);
  ctx.lineTo(origX + widthVecX - insetMarginW, origY + (widthVecY * 0.82) - insetMarginH);
  ctx.lineTo(origX + widthVecX - insetMarginW, origY + (widthVecY * 0.82) - heightVal + insetMarginH);
  ctx.lineTo(origX + insetMarginW, origY + (widthVecY * 0.18) - heightVal + insetMarginH);
  ctx.closePath();
  ctx.fill();

  const knobX = origX + widthVecX * 0.78;
  const knobY = origY + widthVecY * 0.78 - heightVal * 0.48;

  ctx.fillStyle = '#d4af37';
  ctx.beginPath();
  ctx.arc(knobX, knobY, Math.max(1, 1.2 * zoom), 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fff4bc';
  ctx.beginPath();
  ctx.arc(knobX - 0.3 * zoom, knobY - 0.3 * zoom, Math.max(0.4, 0.5 * zoom), 0, Math.PI * 2);
  ctx.fill();
}
