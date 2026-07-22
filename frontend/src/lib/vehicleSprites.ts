type VehicleType = 'compact' | 'pickup_old' | 'sedan' | 'suv' | 'minivan' | 'sports' | 'electric' | 'limo';

export function vehicleForIncome(income: number, seed: string): VehicleType {
  const hash = [...seed].reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 7);
  if (income < 1000) return hash % 4 === 0 ? 'pickup_old' : 'compact';
  if (income < 2500) return (['sedan', 'suv', 'minivan'] as VehicleType[])[hash % 3];
  return (['sports', 'electric', 'limo'] as VehicleType[])[hash % 3];
}

/** Canvas 2D vehicle assets, selected once per citizen household. */
export function drawVehicle(ctx: CanvasRenderingContext2D, type: VehicleType, zoom: number, angle = 0) {
  const w = (type === 'limo' ? 25 : 19) * zoom, h = 9 * zoom;
  const colors: Record<VehicleType, string> = { compact: '#10b981', pickup_old: '#a96322', sedan: '#64748b', suv: '#334155', minivan: '#475569', sports: '#dc4545', electric: '#f5f7fa', limo: '#111827' };
  ctx.rotate(angle);
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(-w / 2 + zoom, -h / 2 + 2 * zoom, w, h);
  ctx.fillStyle = colors[type]; ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.fillStyle = type === 'electric' ? '#38bdf8' : '#9dd7e7'; ctx.fillRect(-w * .2, -h * .36, w * .48, h * .72);
  if (type === 'pickup_old') { ctx.fillStyle = '#6b3f20'; ctx.fillRect(-w * .46, -h * .4, w * .35, h * .8); }
  if (type === 'sports') { ctx.fillStyle = '#111827'; ctx.fillRect(-w * .46, -h * .42, w * .12, h * .84); }
  if (type === 'electric') { ctx.fillStyle = '#0284c7'; ctx.fillRect(w * .18, -h * .3, w * .18, h * .6); }
  ctx.fillStyle = '#fef08a'; ctx.fillRect(w * .43, -h * .34, Math.max(1, zoom), 2 * zoom);
  ctx.fillStyle = '#ef4444'; ctx.fillRect(-w * .48, h * .14, Math.max(1, zoom), 2 * zoom);
  if (type === 'limo') { ctx.fillStyle = '#dbeafe'; ctx.fillRect(-zoom, -h * .45, 2 * zoom, h * .9); }
}
