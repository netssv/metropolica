function darken(hex: string, r: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (shift: number) =>
    Math.round(((n >> shift) & 0xff) * (1 - r)).toString(16).padStart(2, '0');
  return `#${ch(16)}${ch(8)}${ch(0)}`;
}

export { drawOrientedHouse } from './houseFeatures.ts';

export interface HousePalette {
  wallLight: string;
  wallShade: string;
  roof:      string;
}

export const HOUSE_PALETTES: HousePalette[] = [
  // 0. Classic Cream & Red Roof
  { wallLight: '#f2ede8', wallShade: '#d8d2cb', roof: '#b83232' },
  // 1. Warm Terracotta Sand
  { wallLight: '#f5ebe0', wallShade: '#e3d5ca', roof: '#8a5a3c' },
  // 2. Coastal Slate Blue
  { wallLight: '#e2e8f0', wallShade: '#cbd5e1', roof: '#4a5568' },
  // 3. Pastel Sage Cream
  { wallLight: '#e8efe9', wallShade: '#d2dfd4', roof: '#c05621' },
];

export function getHousePalette(seed = 0): HousePalette {
  const idx = Math.abs(seed >>> 0) % HOUSE_PALETTES.length;
  return HOUSE_PALETTES[idx];
}

/** White/colored isometric box walls (SW lit, SE shaded). */
export function drawWhiteBox(
  ctx: CanvasRenderingContext2D,
  cx: number, base: number, hw: number, hh: number, height: number,
  wallLight = '#f2ede8', wallShade = '#d8d2cb'
) {
  // SW face (W→S) — lit
  ctx.fillStyle = wallLight;
  ctx.beginPath();
  ctx.moveTo(cx - hw, base - hh);
  ctx.lineTo(cx,      base);
  ctx.lineTo(cx,      base - height);
  ctx.lineTo(cx - hw, base - hh - height);
  ctx.closePath();
  ctx.fill();

  // SE face (S→E) — shaded
  ctx.fillStyle = wallShade;
  ctx.beginPath();
  ctx.moveTo(cx,      base);
  ctx.lineTo(cx + hw, base - hh);
  ctx.lineTo(cx + hw, base - hh - height);
  ctx.lineTo(cx,      base - height);
  ctx.closePath();
  ctx.fill();
}

/** Hip roof with eave overhang. */
export function drawHipRoof(
  ctx: CanvasRenderingContext2D,
  cx: number, base: number, hw: number, hh: number,
  height: number, peak: number,
  roofHex: string, eave: number
) {
  const rb = base - height;
  const ov = eave;
  const sE: [number,number] = [cx,         rb + ov * 0.5];
  const eE: [number,number] = [cx + hw + ov, rb - hh];
  const nE: [number,number] = [cx,         rb - hh * 2 - ov * 0.5];
  const wE: [number,number] = [cx - hw - ov, rb - hh];

  const apex: [number,number] = [cx, rb - peak];

  const roofLight = roofHex;
  const roofDark  = darken(roofHex, 0.3);
  const roofBack  = darken(roofHex, 0.15);

  ctx.fillStyle = roofLight;
  ctx.beginPath();
  ctx.moveTo(...apex); ctx.lineTo(...wE); ctx.lineTo(...sE);
  ctx.closePath(); ctx.fill();

  ctx.fillStyle = roofDark;
  ctx.beginPath();
  ctx.moveTo(...apex); ctx.lineTo(...sE); ctx.lineTo(...eE);
  ctx.closePath(); ctx.fill();

  ctx.fillStyle = roofBack;
  ctx.beginPath();
  ctx.moveTo(...apex); ctx.lineTo(...nE); ctx.lineTo(...wE);
  ctx.closePath(); ctx.fill();

  ctx.fillStyle = roofBack;
  ctx.beginPath();
  ctx.moveTo(...apex); ctx.lineTo(...eE); ctx.lineTo(...nE);
  ctx.closePath(); ctx.fill();

  ctx.strokeStyle = darken(roofHex, 0.4);
  ctx.lineWidth = Math.max(0.5, 0.7);
  ctx.beginPath();
  ctx.moveTo(...wE); ctx.lineTo(...sE); ctx.lineTo(...eE);
  ctx.stroke();
}

/** Chimney on the NW back-left slope of the roof. */
export function drawChimney(
  ctx: CanvasRenderingContext2D,
  cx: number, base: number, hw: number, hh: number,
  height: number, peak: number, zoom: number,
  night: boolean, time: number, seed: number
) {
  const apexY = base - height - peak;
  const nweaveY = base - height - hh * 1.4;
  const chBaseY = apexY + (nweaveY - apexY) * 0.40;
  const rx = cx - hw * 0.25;
  const cw = 3.5 * zoom;
  const ch = 7.5 * zoom;

  // Lit SW face
  ctx.fillStyle = '#f0ebe4';
  ctx.fillRect(rx - cw * 0.5, chBaseY - ch, cw * 0.7, ch);
  // Shaded SE face
  ctx.fillStyle = '#d4cec8';
  ctx.fillRect(rx + cw * 0.2, chBaseY - ch, cw * 0.4, ch);

  // Top cap rim
  ctx.fillStyle = '#ccc6be';
  ctx.fillRect(rx - cw * 0.6, chBaseY - ch - zoom, cw * 1.3, zoom * 1.2);

  if (night) {
    ctx.fillStyle = 'rgba(220,228,220,0.25)';
    const phase = time / 700 + seed;
    for (let p = 0; p < 3; p++) {
      const drift = Math.sin(phase + p) * 2 * zoom;
      ctx.beginPath();
      ctx.arc(rx + drift, chBaseY - ch - (p + 1) * 3.5 * zoom, (1.5 + p * 0.5) * zoom, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
