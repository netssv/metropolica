import { chromium } from '../frontend/node_modules/playwright/index.mjs';
import { writeFile } from 'node:fs/promises';

const base = process.env.METROPOLICA_URL ?? 'http://localhost:3201';
const out = process.env.BROWSER_SWEEP_DIR ?? '/tmp/metropolica-browser-sweep';
await (await import('node:fs/promises')).mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });

async function api(path: string, init?: RequestInit) {
  return page.evaluate(async ({ path, init }) => { const r = await fetch(path, init); const b = await r.json(); if (!r.ok) throw new Error(`${path}: ${JSON.stringify(b)}`); return b; }, { path, init });
}
async function dismiss() {
  const menu = page.locator('.menu-overlay');
  if (await menu.isVisible()) await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.waitForFunction(() => !document.querySelector('.menu-overlay'));
}
async function reset(size: string) {
  await api('/api/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seed: 1, citySize: size }) });
  await page.reload({ waitUntil: 'networkidle' }); await dismiss(); await page.waitForTimeout(1200);
}
const sizes = ['tiny', 'small', 'big', 'very-big', 'enormous'];
const sizeEvidence: any[] = [];
await page.goto(base, { waitUntil: 'networkidle' });
for (const size of sizes) {
  await reset(size);
  const state = await api('/api/state');
  const tilemap = await api('/api/tilemap');
  await page.screenshot({ path: `${out}/size-${size}.png` });
  sizeEvidence.push({ size, dimensions: state.cityDimensions, tiles: tilemap.tiles.length, activeCitizens: state.activeCitizens });
}
await reset('small');
await api('/api/save', { method: 'POST' });
await api('/api/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seed: 99, citySize: 'tiny' }) });
await api('/api/load', { method: 'POST' });
const loaded = await api('/api/state');
sizeEvidence.push({ saveLoadRestored: loaded.citySize, dimensions: loaded.cityDimensions });

await reset('small');
await page.screenshot({ path: `${out}/specialties-normal.png` });
await page.evaluate(() => { const c = document.querySelector('#city-canvas') as HTMLCanvasElement; c.dispatchEvent(new WheelEvent('wheel', { deltaY: 900, clientX: 720, clientY: 450, bubbles: true })); });
await page.waitForTimeout(500);
await page.screenshot({ path: `${out}/specialties-zoomed-out.png` });
const map = await api('/api/tilemap');
const specialtyTiles = map.tiles.filter((t: any) => t.specialty === 'hospital' || t.specialty === 'mall-government');

await reset('tiny');
await page.evaluate(() => { (window as any).__METROPOLICA_TRAFFIC_DEBUG__ = { enabled: true, every: 3, max: 30000 }; });
await page.waitForTimeout(3500);
const diagnostics = await page.evaluate(() => (globalThis as any).__METROPOLICA_TRAFFIC_DEBUG__?.records ?? []);
await writeFile(`${out}/traffic.json`, JSON.stringify(diagnostics, null, 2));
await page.screenshot({ path: `${out}/traffic-arrival.png` });

// The inspector is selected through the same canvas hit-test as a player click. Scan the
// rendered canvas on a coarse grid; this avoids adding test-only state or mutating the app.
await reset('small');
let delayedInspector = false;
for (let y = 60; y < 840 && !delayedInspector; y += 24) for (let x = 60; x < 1380 && !delayedInspector; x += 24) {
  await page.mouse.click(x, y);
  const text = await page.locator('.citizen-inspector').allTextContents();
  delayedInspector = text.some(value => value.includes('Commute: Demorado'));
}
if (delayedInspector) await page.screenshot({ path: `${out}/commute-delayed-inspector.png` });
await writeFile(`${out}/browser-sweep-result.json`, JSON.stringify({ delayedInspector }, null, 2));

console.log(JSON.stringify({ sizeEvidence, specialtyTiles: specialtyTiles.map((t: any) => ({ type: t.type, level: t.level, specialty: t.specialty, col: t.col, row: t.row })), diagnosticRecords: diagnostics.length, diagnosticVehicles: new Set(diagnostics.map((r: any) => r.vehicleId)).size }, null, 2));
await browser.close();
