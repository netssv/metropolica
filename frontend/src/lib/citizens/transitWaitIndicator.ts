/**
 * transitWaitIndicator.ts
 * Draws a small pulsing indicator above vehicles waiting in queue or at a red signal.
 * Signal waiters get a red dot; following-queue waiters get an amber dot;
 * each vehicle after the first in a queue shows its sequence number.
 */

export type WaitIndicatorState = 'signal' | 'queue' | 'none';

/**
 * Determines which indicator to show based on vehicle state.
 * 'following' means the vehicle is queued behind another stopped vehicle.
 */
export function waitIndicatorState(vehicleState: string | undefined): WaitIndicatorState {
  if (vehicleState === 'waiting_for_signal') return 'signal';
  if (vehicleState === 'waiting_for_space' || vehicleState === 'queued') return 'queue';
  // Also treat 'following' resolved by trafficDecision as queue indicator
  return 'none';
}

/**
 * Draw the wait indicator at (0, 0) in local vehicle space.
 * Call this inside a ctx.save()/restore() block after translate to vehicle center.
 * @param ctx Canvas 2D context
 * @param state  'signal' (red) | 'queue' (amber)
 * @param time   Current timestamp for pulse animation
 * @param zoom   Current zoom level
 * @param queueIndex  How many vehicles are already stopped ahead (0 = first in queue)
 */
export function drawWaitIndicator(
  ctx: CanvasRenderingContext2D,
  state: WaitIndicatorState,
  time: number,
  zoom: number,
  queueIndex: number,
): void {
  if (state === 'none') return;

  const pulse = 0.65 + 0.35 * Math.sin(time / 280 + queueIndex * 0.9);
  const r = Math.max(2, 3 * zoom);
  const yOffset = -(10 * zoom + r);

  ctx.save();
  ctx.globalAlpha = 0.82 * pulse;

  // Glow ring
  const glowColor = state === 'signal' ? 'rgba(255,60,60,0.35)' : 'rgba(255,180,0,0.35)';
  ctx.beginPath();
  ctx.arc(0, yOffset, r * 1.8, 0, Math.PI * 2);
  ctx.fillStyle = glowColor;
  ctx.fill();

  // Core dot
  ctx.beginPath();
  ctx.arc(0, yOffset, r, 0, Math.PI * 2);
  ctx.fillStyle = state === 'signal' ? '#ff3c3c' : '#ffb800';
  ctx.fill();

  // White center highlight
  ctx.beginPath();
  ctx.arc(-r * 0.25, yOffset - r * 0.25, r * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fill();

  ctx.restore();
}
