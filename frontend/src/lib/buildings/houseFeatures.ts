import type { StreetOrientation } from './streetOrientation.ts';

/**
 * Draws the complete, monolithic House 1 structure as a single unified 3D volume.
 * The door, window, roof, and walls are bound together so that when the house is
 * oriented to face a street, the entire building rotates as a single combo.
 */
export function drawOrientedHouse(
  ctx: CanvasRenderingContext2D,
  cx: number, base: number, hw: number, hh: number, height: number, peak: number,
  wallLight: string, wallShade: string, roofHex: string, eave: number,
  zoom: number, night: boolean, time: number, seed: number,
  rotation = 0,
  facing: StreetOrientation = 'south'
) {
  const rot = ((Math.round(rotation) % 4) + 4) % 4;

  // Compute effective 3D facing of the front door wall relative to the camera:
  // facing 'south': front door is on South wall (appears SE face in screen at rot 0)
  // facing 'west':  front door is on West wall  (appears SW face in screen at rot 0 -> points to SW street)
  // facing 'north': front door is on North wall (appears NW face in screen at rot 0)
  // facing 'east':  front door is on East wall  (appears NE face in screen at rot 0)
  const facingOffsetMap: Record<StreetOrientation, number> = {
    south: 0,
    west: 1,
    north: 2,
    east: 3,
  };

  const effectiveRot = (rot + facingOffsetMap[facing]) % 4;

  // 1. Draw solid 3D box walls with dynamic lighting according to camera view angle
  const swColor = effectiveRot === 0 || effectiveRot === 3 ? wallLight : wallShade;
  const seColor = effectiveRot === 0 || effectiveRot === 1 ? wallShade : wallLight;

  // SW wall (screen bottom-left)
  ctx.fillStyle = swColor;
  ctx.beginPath();
  ctx.moveTo(cx - hw, base - hh);
  ctx.lineTo(cx, base);
  ctx.lineTo(cx, base - height);
  ctx.lineTo(cx - hw, base - hh - height);
  ctx.closePath();
  ctx.fill();

  // SE wall (screen bottom-right)
  ctx.fillStyle = seColor;
  ctx.beginPath();
  ctx.moveTo(cx, base);
  ctx.lineTo(cx + hw, base - hh);
  ctx.lineTo(cx + hw, base - hh - height);
  ctx.lineTo(cx, base - height);
  ctx.closePath();
  ctx.fill();

  // 2. Draw Hip Roof
  const rb = base - height;
  const ov = eave;
  const sE: [number, number] = [cx, rb + ov * 0.5];
  const eE: [number, number] = [cx + hw + ov, rb - hh];
  const nE: [number, number] = [cx, rb - hh * 2 - ov * 0.5];
  const wE: [number, number] = [cx - hw - ov, rb - hh];
  const apex: [number, number] = [cx, rb - peak];

  const darkenHex = (hex: string, r: number) => {
    const n = parseInt(hex.slice(1), 16);
    const ch = (shift: number) => Math.round(((n >> shift) & 0xff) * (1 - r)).toString(16).padStart(2, '0');
    return `#${ch(16)}${ch(8)}${ch(0)}`;
  };

  const roofLight = roofHex;
  const roofDark = darkenHex(roofHex, 0.3);
  const roofBack = darkenHex(roofHex, 0.15);

  ctx.fillStyle = roofLight;
  ctx.beginPath(); ctx.moveTo(...apex); ctx.lineTo(...wE); ctx.lineTo(...sE); ctx.closePath(); ctx.fill();

  ctx.fillStyle = roofDark;
  ctx.beginPath(); ctx.moveTo(...apex); ctx.lineTo(...sE); ctx.lineTo(...eE); ctx.closePath(); ctx.fill();

  ctx.fillStyle = roofBack;
  ctx.beginPath(); ctx.moveTo(...apex); ctx.lineTo(...nE); ctx.lineTo(...wE); ctx.closePath(); ctx.fill();

  ctx.fillStyle = roofBack;
  ctx.beginPath(); ctx.moveTo(...apex); ctx.lineTo(...eE); ctx.lineTo(...nE); ctx.closePath(); ctx.fill();

  ctx.strokeStyle = darkenHex(roofHex, 0.4);
  ctx.lineWidth = Math.max(0.5, 0.7);
  ctx.beginPath(); ctx.moveTo(...wE); ctx.lineTo(...sE); ctx.lineTo(...eE); ctx.stroke();

  // 3. Draw Chimney
  const apexY = base - height - peak;
  const nweaveY = base - height - hh * 1.4;
  const chBaseY = apexY + (nweaveY - apexY) * 0.40;
  const rx = cx - hw * 0.25;
  const cw = 3.5 * zoom;
  const ch = 7.5 * zoom;

  ctx.fillStyle = '#f0ebe4';
  ctx.fillRect(rx - cw * 0.5, chBaseY - ch, cw * 0.7, ch);
  ctx.fillStyle = '#d4cec8';
  ctx.fillRect(rx + cw * 0.2, chBaseY - ch, cw * 0.4, ch);
  ctx.fillStyle = '#ccc6be';
  ctx.fillRect(rx - cw * 0.6, chBaseY - ch - zoom, cw * 1.3, zoom * 1.2);

  // 4. Render Door & Window onto the appropriate visible face (combo rendering)
  // When facing='west' & camera rot=0 -> effectiveRot = 1.
  // EffectiveRot values mapping:
  //   effectiveRot === 0 -> Front door on SE screen face (facing South road)
  //   effectiveRot === 1 -> Front door on SW screen face (facing West road)
  //   effectiveRot === 2 -> Rear view (door hidden on NW/back face)
  //   effectiveRot === 3 -> Door on NE/back face (door hidden)
  if (effectiveRot === 0 || effectiveRot === 1) {
    const onSW = effectiveRot === 1;
    const u = 0.3;
    const wFrac = 0.25;
    const hFrac = 0.65;

    const origX = onSW ? cx - hw + u * hw : cx + u * hw;
    const origY = onSW ? base - hh + u * hh : base - u * hh;

    const widthVecX = wFrac * hw;
    const widthVecY = onSW ? wFrac * hh : -wFrac * hh;
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

    const knobX = origX + widthVecX * 0.78;
    const knobY = origY + widthVecY * 0.78 - heightVal * 0.48;

    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.arc(knobX, knobY, Math.max(1, 1.2 * zoom), 0, Math.PI * 2);
    ctx.fill();
  }

  // Window renders on the side wall:
  //   effectiveRot === 0 -> Window on SW face
  //   effectiveRot === 1 -> Window on SE face
  //   effectiveRot === 2 || 3 -> Rear wall window on visible back faces
  const renderWindowOnFace = (onSE: boolean, isRear = false) => {
    const u = isRear ? 0.38 : 0.35;
    const v = 0.45;
    const wFrac = isRear ? 0.28 : 0.32;
    const hFrac = 0.35;

    const origX = onSE ? cx + u * hw : cx - hw + u * hw;
    const origY = onSE ? base - u * hh - v * height : base - hh + u * hh - v * height;

    const widthVecX = wFrac * hw;
    const widthVecY = onSE ? -wFrac * hh : wFrac * hh;
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
  };

  if (effectiveRot === 0 || effectiveRot === 1) {
    renderWindowOnFace(effectiveRot === 1, false);
  } else {
    // When viewing from the rear (effectiveRot === 2 or 3), render rear windows and garden bushes
    renderWindowOnFace(false, true);
    renderWindowOnFace(true, true);

    // Backyard garden bushes / potted plants for realistic rear view
    if (zoom >= 0.4) {
      const p1 = { x: cx - hw * 0.4, y: base - hh * 0.4 };
      ctx.fillStyle = '#2d6a4f';
      ctx.beginPath();
      ctx.arc(p1.x, p1.y - 2 * zoom, 3 * zoom, 0, Math.PI * 2);
      ctx.fill();

      const p2 = { x: cx + hw * 0.4, y: base - hh * 0.4 };
      ctx.fillStyle = '#40916c';
      ctx.beginPath();
      ctx.arc(p2.x, p2.y - 2 * zoom, 3.5 * zoom, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
