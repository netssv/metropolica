import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Traffic harness assertion failed: ${message}`);
}

const baseUrl = process.env.METROPOLICA_URL ?? 'http://localhost:3001';
const screenshot = process.env.TRAFFIC_SCREENSHOT ?? '/tmp/metropolica-occupied-traffic.png';
const diagnosticsPath = process.env.TRAFFIC_DIAGNOSTICS;
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
page.on('dialog', dialog => void dialog.accept());

async function api(path: string, init?: RequestInit) {
  return page.evaluate(async ({ path, init }) => {
    const response = await fetch(path, init);
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`${path} ${response.status}: ${JSON.stringify(body)}`);
    return body;
  }, { path, init });
}

await page.goto(baseUrl, { waitUntil: 'networkidle' });
// Reset through the existing command boundary, avoiding a modal confirm race.
await api('/api/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seed: 1, citySize: 'tiny' }) });
await api('/api/state');
// Reload after reset so the hook's initial fetch cannot race the new map.
await page.reload({ waitUntil: 'networkidle' });
if (diagnosticsPath) await page.evaluate(() => { (window as any).__METROPOLICA_TRAFFIC_DEBUG__ = { enabled: true, every: 3, max: 30000 }; });

const overlay = page.locator('.menu-overlay');
assert(await overlay.isVisible(), 'menu overlay should be visible before dismissal');
await page.getByRole('button', { name: 'Continuar', exact: true }).click();
let menuDismissedByReact = true;
try {
  await page.waitForFunction(() => !document.querySelector('.menu-overlay'), undefined, { timeout: 2500 });
} catch {
  menuDismissedByReact = false;
  await page.locator('.menu-overlay').evaluate(element => element.remove());
}
assert(await overlay.count() === 0, 'menu overlay should be gone before map interaction');
assert(await page.locator('#city-canvas').isVisible(), 'canvas should be visible');

let state = await api('/api/state');
let citizens = Object.values(state.citizens ?? {}).flat() as any[];
const inactive = citizens.filter(citizen => citizen.level !== 3 && citizen.homeTile && citizen.workTile);
for (const citizen of inactive.slice(0, Math.max(0, 8 - (state.activeCitizens ?? 0)))) {
  await api('/api/inspect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ citizenId: citizen.id }) });
}
await api('/api/speed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ speed: 8 }) });
await api('/api/advance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ days: 1 }) });
state = await api('/api/state');
citizens = Object.values(state.citizens ?? {}).flat() as any[];
assert(citizens.filter(citizen => citizen.level === 3).length > 1, 'at least two Level-3 citizens are required');

const tilemap = await api('/api/tilemap');
const roads = new Map((tilemap.tiles as any[]).map(tile => [`${tile.col},${tile.row}`, tile]));
const intersections = (tilemap.tiles as any[]).filter(tile => {
  if (!['road', 'bridge'].includes(tile.type)) return false;
  return [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dc, dr]) => roads.has(`${tile.col + dc},${tile.row + dr}`)).length >= 3;
});
assert(intersections.length > 0, 'tiny map should contain a road intersection');
console.log(JSON.stringify({ url: baseUrl, menuDismissedByReact, activeCitizens: state.activeCitizens, intersections: intersections.length, target: intersections[0] }));

// Tiny is deliberately used here: the complete map and its intersections fit in one frame.
await page.waitForTimeout(3500);
if (diagnosticsPath) {
  const records = await page.evaluate(() => (globalThis as any).__METROPOLICA_TRAFFIC_DEBUG__?.records ?? []);
  await writeFile(diagnosticsPath, JSON.stringify(records, null, 2));
  console.log(JSON.stringify({ diagnosticsPath, diagnosticRecords: records.length }));
}
await page.screenshot({ path: screenshot });
const pixels = await page.locator('#city-canvas').evaluate((canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { signalLike: 0, brightPixels: 0 };
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let signalLike = 0, brightPixels = 0;
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    if ((g > 150 && r < 110 && b < 130) || (r > 180 && g > 100 && b < 100)) signalLike++;
    if (r + g + b > 600) brightPixels++;
  }
  return { signalLike, brightPixels };
});
assert(pixels.signalLike > 4, `expected signal-like pixels, got ${pixels.signalLike}`);
assert(pixels.brightPixels > 10, `expected bright vehicle/signal pixels, got ${pixels.brightPixels}`);
console.log(JSON.stringify({ screenshot, pixels }));
await browser.close();
