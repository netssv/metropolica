export function mapSW(
  cx: number,
  base: number,
  hw: number,
  hh: number,
  height: number,
  u: number,
  v: number
): { x: number; y: number } {
  return {
    x: cx - hw + u * hw,
    y: base - hh + u * hh - v * height,
  };
}

export function mapSE(
  cx: number,
  base: number,
  hw: number,
  hh: number,
  height: number,
  u: number,
  v: number
): { x: number; y: number } {
  return {
    x: cx + u * hw,
    y: base - u * hh - v * height,
  };
}

/** Draw an isometric polygon on the SW (left) facade face. */
export function drawIsoQuadSW(
  ctx: CanvasRenderingContext2D,
  cx: number, base: number, hw: number, hh: number, height: number,
  u1: number, v1: number, u2: number, v2: number,
  fillColor: string, strokeColor?: string, strokeWidth = 1
) {
  const p1 = mapSW(cx, base, hw, hh, height, u1, v1);
  const p2 = mapSW(cx, base, hw, hh, height, u2, v1);
  const p3 = mapSW(cx, base, hw, hh, height, u2, v2);
  const p4 = mapSW(cx, base, hw, hh, height, u1, v2);

  ctx.fillStyle = fillColor;
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.lineTo(p3.x, p3.y);
  ctx.lineTo(p4.x, p4.y);
  ctx.closePath();
  ctx.fill();

  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
  }
}

/** Draw an isometric polygon on the SE (right) facade face. */
export function drawIsoQuadSE(
  ctx: CanvasRenderingContext2D,
  cx: number, base: number, hw: number, hh: number, height: number,
  u1: number, v1: number, u2: number, v2: number,
  fillColor: string, strokeColor?: string, strokeWidth = 1
) {
  const p1 = mapSE(cx, base, hw, hh, height, u1, v1);
  const p2 = mapSE(cx, base, hw, hh, height, u2, v1);
  const p3 = mapSE(cx, base, hw, hh, height, u2, v2);
  const p4 = mapSE(cx, base, hw, hh, height, u1, v2);

  ctx.fillStyle = fillColor;
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.lineTo(p3.x, p3.y);
  ctx.lineTo(p4.x, p4.y);
  ctx.closePath();
  ctx.fill();

  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
  }
}

/** Render isometric text fitted strictly inside SW signboard bounds. */
export function drawIsoTextSW(
  ctx: CanvasRenderingContext2D,
  cx: number, base: number, hw: number, hh: number, height: number,
  u1: number, v1: number, u2: number, v2: number,
  text: string, color: string, baseFontSize: number,
  outlineColor?: string
) {
  const uCenter = (u1 + u2) / 2;
  const vCenter = (v1 + v2) / 2;
  const center = mapSW(cx, base, hw, hh, height, uCenter, vCenter);
  const angle = Math.atan2(hh, hw);

  const wallLen = Math.hypot((u2 - u1) * hw, (u2 - u1) * hh);
  const maxTextW = wallLen * 0.85;

  ctx.save();
  ctx.translate(center.x, center.y);
  ctx.rotate(angle);

  let fontSize = baseFontSize;
  ctx.font = `900 ${fontSize}px sans-serif`;
  let measuredW = ctx.measureText(text).width;
  if (measuredW > maxTextW && measuredW > 0) {
    fontSize = Math.max(3, fontSize * (maxTextW / measuredW));
    ctx.font = `900 ${fontSize}px sans-serif`;
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (outlineColor) {
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = Math.max(0.8, fontSize * 0.2);
    ctx.strokeText(text, 0, 0);
  }
  ctx.fillStyle = color;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

/** Render isometric text fitted strictly inside SE signboard bounds. */
export function drawIsoTextSE(
  ctx: CanvasRenderingContext2D,
  cx: number, base: number, hw: number, hh: number, height: number,
  u1: number, v1: number, u2: number, v2: number,
  text: string, color: string, baseFontSize: number,
  outlineColor?: string
) {
  const uCenter = (u1 + u2) / 2;
  const vCenter = (v1 + v2) / 2;
  const center = mapSE(cx, base, hw, hh, height, uCenter, vCenter);
  const angle = Math.atan2(-hh, hw);

  const wallLen = Math.hypot((u2 - u1) * hw, (u2 - u1) * hh);
  const maxTextW = wallLen * 0.85;

  ctx.save();
  ctx.translate(center.x, center.y);
  ctx.rotate(angle);

  let fontSize = baseFontSize;
  ctx.font = `900 ${fontSize}px sans-serif`;
  let measuredW = ctx.measureText(text).width;
  if (measuredW > maxTextW && measuredW > 0) {
    fontSize = Math.max(3, fontSize * (maxTextW / measuredW));
    ctx.font = `900 ${fontSize}px sans-serif`;
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (outlineColor) {
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = Math.max(0.8, fontSize * 0.2);
    ctx.strokeText(text, 0, 0);
  }
  ctx.fillStyle = color;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}
