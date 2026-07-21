import { chromium } from 'playwright';

const baseUrl = process.env.METROPOLICA_URL ?? 'http://localhost:3001';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
page.once('dialog', dialog => void dialog.accept());
await page.goto(baseUrl, { waitUntil: 'networkidle' });
await page.locator('#city-size').selectOption('big');
await page.getByRole('button', { name: 'Empezar de cero' }).click();
await page.locator('#city-canvas').waitFor({ state: 'visible' });
await page.waitForTimeout(1500);
const placement = await page.evaluate(async () => {
  const tilemap = await (await fetch('/api/tilemap')).json();
  const grass = tilemap.tiles.filter((tile: any) => tile.type === 'grass');
  const hospital = grass[0], mall = grass[1];
  const place = async (tile: any, specialty: string) => fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'PLACE_ZONE', zoneType: 'zone-c', specialty, district: tile.owner, col: tile.col, row: tile.row }) });
  const hospitalResult = hospital ? await place(hospital, 'hospital') : undefined;
  const mallResult = mall ? await place(mall, 'mall-government') : undefined;
  return { hospital: hospitalResult?.status, mallGovernment: mallResult?.status };
});
console.log(JSON.stringify({ placement }));
await page.waitForTimeout(800);
await page.screenshot({ path: '/tmp/metropolica-dedicated-buildings.png' });
let inspector: string | null = null;
for (let y = 100; y < 800 && !inspector?.includes('Nivel: 3'); y += 35) for (let x = 180; x < 1400 && !inspector?.includes('Nivel: 3'); x += 35) {
  await page.mouse.click(x, y);
  inspector = await page.locator('.citizen-inspector').textContent().catch(() => null);
  if (inspector && !inspector.includes('Nivel: 3')) {
    const more = page.getByRole('button', { name: 'Ver más' });
    if (await more.count()) await more.click();
    inspector = await page.locator('.citizen-inspector').textContent().catch(() => null);
  }
}
await page.screenshot({ path: '/tmp/metropolica-commute-inspector.png' });
console.log(JSON.stringify({ inspector }));
for (const [index, delay] of [0, 1200, 2400, 3600].entries()) {
  if (delay) await page.waitForTimeout(delay);
  await page.screenshot({ path: `/tmp/metropolica-traffic-${index + 1}.png` });
}
console.log(JSON.stringify({ url: baseUrl, screenshots: [1, 2, 3, 4].map(index => `/tmp/metropolica-traffic-${index}.png`) }));
await browser.close();
