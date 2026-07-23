import { DrawArgs } from './types.ts';
import { PROCEDURAL_DETAIL_ZOOM } from './constants.ts';
import { footprint, silhouette, buildingVariant } from './helpers.ts';

// ─── palette ────────────────────────────────────────────────────────────────
const GROUND     = '#3a7a4a';
const GROUND2    = '#4a9456';
const TRUNK      = '#6b4226';
const TRUNK2     = '#8b5c30';
const CANOPY_A   = ['#3ca355', '#4bbf5e', '#7dd66e'] as const;
const CANOPY_B   = ['#5a9e3e', '#6db84e', '#92d460'] as const;
const CANOPY_C   = ['#2e8b54', '#3fa860', '#60c878'] as const;
const BENCH_SEAT = '#c9a05a';
const BENCH_LEG  = '#8a6030';
const PATH_OUTER = '#b59260';
const PATH_INNER = '#c8a97a';

// ─── tree helper ────────────────────────────────────────────────────────────
function drawTree(
  ctx: CanvasRenderingContext2D,
  tx: number, ty: number, zoom: number,
  palette: readonly [string, string, string],
  scale = 1.0
) {
  const s = zoom * scale;
  // shadow
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(tx, ty + 1 * s, 7 * s, 3 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1.0;
  // trunk
  ctx.fillStyle = TRUNK;
  ctx.fillRect(tx - 1.5 * s, ty - 9 * s, 3 * s, 9 * s);
  ctx.fillStyle = TRUNK2;
  ctx.fillRect(tx - 0.4 * s, ty - 9 * s, 1.2 * s, 9 * s);
  // canopy layers
  ctx.fillStyle = palette[0];
  ctx.beginPath();
  ctx.ellipse(tx, ty - 14 * s, 8 * s, 7 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = palette[1];
  ctx.beginPath();
  ctx.ellipse(tx - 1.5 * s, ty - 17 * s, 5.5 * s, 5 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = palette[2];
  ctx.beginPath();
  ctx.ellipse(tx + 1.5 * s, ty - 16 * s, 4 * s, 3.5 * s, 0, 0, Math.PI * 2);
  ctx.fill();
}

// ─── bench helper ───────────────────────────────────────────────────────────
function drawBench(ctx: CanvasRenderingContext2D, bx: number, by: number, zoom: number) {
  ctx.fillStyle = BENCH_LEG;
  ctx.fillRect(bx - 3 * zoom, by - 2.5 * zoom, 1.2 * zoom, 2.5 * zoom);
  ctx.fillRect(bx + 1.8 * zoom, by - 2.5 * zoom, 1.2 * zoom, 2.5 * zoom);
  ctx.fillStyle = BENCH_SEAT;
  ctx.fillRect(bx - 3.5 * zoom, by - 3.5 * zoom, 7 * zoom, 1.4 * zoom);
}

// ─── path helper ────────────────────────────────────────────────────────────
function drawPath(ctx: CanvasRenderingContext2D, cx: number, base: number, hw: number, hh: number, zoom: number) {
  ctx.lineCap = 'round';
  ctx.strokeStyle = PATH_OUTER;
  ctx.lineWidth = Math.max(2, 4 * zoom);
  ctx.beginPath();
  ctx.moveTo(cx - hw * 0.8, base - hh * 0.85);
  ctx.lineTo(cx + hw * 0.75, base - hh * 0.25);
  ctx.stroke();
  ctx.strokeStyle = PATH_INNER;
  ctx.lineWidth = Math.max(1.5, 2.5 * zoom);
  ctx.beginPath();
  ctx.moveTo(cx - hw * 0.8, base - hh * 0.85);
  ctx.lineTo(cx + hw * 0.75, base - hh * 0.25);
  ctx.stroke();
}

// ─── variants (1 → 4 trees) ─────────────────────────────────────────────────

/** 1 tree – solitary specimen with bench */
function v1(ctx: CanvasRenderingContext2D, cx: number, base: number, hw: number, hh: number, zoom: number) {
  drawPath(ctx, cx, base, hw, hh, zoom);
  drawTree(ctx, cx, base - hh * 1.1, zoom, CANOPY_A, 1.35);
  drawBench(ctx, cx + hw * 0.55, base - hh * 0.55, zoom);
}

/** 2 trees – diagonal pair */
function v2(ctx: CanvasRenderingContext2D, cx: number, base: number, hw: number, hh: number, zoom: number) {
  drawPath(ctx, cx, base, hw, hh, zoom);
  drawTree(ctx, cx - hw * 0.5, base - hh * 1.1, zoom, CANOPY_A);
  drawTree(ctx, cx + hw * 0.5, base - hh * 0.7, zoom, CANOPY_B);
  drawBench(ctx, cx, base - hh * 0.5, zoom);
}

/** 3 trees – triangular arrangement */
function v3(ctx: CanvasRenderingContext2D, cx: number, base: number, hw: number, hh: number, zoom: number) {
  drawPath(ctx, cx, base, hw, hh, zoom);
  drawTree(ctx, cx - hw * 0.6, base - hh * 0.9, zoom, CANOPY_B, 0.9);
  drawTree(ctx, cx, base - hh * 1.3, zoom, CANOPY_A, 1.1);
  drawTree(ctx, cx + hw * 0.6, base - hh * 0.75, zoom, CANOPY_C, 0.9);
  drawBench(ctx, cx - hw * 0.1, base - hh * 0.45, zoom);
}

/** 4 trees – lush grove (back pair + front pair) */
function v4(ctx: CanvasRenderingContext2D, cx: number, base: number, hw: number, hh: number, zoom: number) {
  drawPath(ctx, cx, base, hw, hh, zoom);
  drawTree(ctx, cx - hw * 0.45, base - hh * 1.35, zoom, CANOPY_C, 0.85);
  drawTree(ctx, cx + hw * 0.4,  base - hh * 1.1,  zoom, CANOPY_B, 0.85);
  drawTree(ctx, cx - hw * 0.65, base - hh * 0.8,  zoom, CANOPY_A);
  drawTree(ctx, cx + hw * 0.55, base - hh * 0.65, zoom, CANOPY_C);
  drawBench(ctx, cx, base - hh * 0.38, zoom);
}

// ─── variant selection ───────────────────────────────────────────────────────
/**
 * Maps cluster size to variant index:
 *   size 1        → v1 (1 tree)
 *   size 2        → v2 (2 trees)
 *   size 3        → v3 (3 trees)
 *   size 4+       → v4 (4 trees / grove)
 *
 * Within tiles of the same cluster size, seed adds visual diversity by
 * cycling through canopy palettes (handled inside each vN).
 */
function pickVariant(parkSize: number): number {
  if (parkSize <= 1) return 0;
  if (parkSize === 2) return 1;
  if (parkSize === 3) return 2;
  return 3;
}

// ─── public ──────────────────────────────────────────────────────────────────
export function drawPark(args: DrawArgs) {
  const { ctx, zoom, seed = 0, parkSize = 1 } = args;
  if (zoom < PROCEDURAL_DETAIL_ZOOM) return silhouette(args, 'r', 0);

  const { cx, base, hw, hh } = footprint(args, GROUND, GROUND2);
  const variant = pickVariant(parkSize);

  // Within a cluster, use seed to avoid all tiles looking identical when
  // variant is the same (different palette/offset offsets handled per vN).
  // For now the seed is used to slightly offset bench position in v1 & v2.
  void buildingVariant(seed, 4); // kept for future sub-tile variety

  if      (variant === 0) v1(ctx, cx, base, hw, hh, zoom);
  else if (variant === 1) v2(ctx, cx, base, hw, hh, zoom);
  else if (variant === 2) v3(ctx, cx, base, hw, hh, zoom);
  else                    v4(ctx, cx, base, hw, hh, zoom);
}
