import { chromium } from 'playwright';

const baseUrl = process.env.METROPOLICA_URL ?? 'http://localhost:3001';
const browser = await chromium.launch({ headless: true });
const results: Array<{ specialty: string; tier: number; zoom: string; path: string; canvas: boolean }> = [];

for (const specialty of ['hospital', 'mall-government'] as const) {
  for (const tier of [0, 1, 2] as const) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    await page.route('**/api/tilemap', async route => {
      const response = await route.fetch();
      const data = await response.json();
      const commercial = data.tiles.filter((tile: any) => tile.type === 'bldg-c');
      if (commercial[0]) Object.assign(commercial[0], { specialty, level: tier });
      await route.fulfill({ response, body: JSON.stringify(data) });
    });

    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    const start = page.getByRole('button', { name: 'Continuar' });
    if (await start.isVisible()) await start.click();
    await page.locator('#city-canvas').waitFor({ state: 'visible' });
    await page.locator('.menu-overlay').waitFor({ state: 'hidden' });
    await page.waitForTimeout(900);

    const normalPath = `/tmp/metropolica-specialty-${specialty}-${tier}-normal.png`;
    await page.screenshot({ path: normalPath });
    results.push({ specialty, tier, zoom: 'normal', path: normalPath, canvas: await page.locator('#city-canvas').isVisible() });

    await page.mouse.move(720, 450);
    await page.mouse.wheel(0, 1400);
    await page.waitForTimeout(250);
    const zoomedPath = `/tmp/metropolica-specialty-${specialty}-${tier}-zoomed-out.png`;
    await page.screenshot({ path: zoomedPath });
    results.push({ specialty, tier, zoom: 'zoomed-out', path: zoomedPath, canvas: await page.locator('#city-canvas').isVisible() });
    await page.close();
  }
}

console.log(JSON.stringify({ screenshots: results }, null, 2));
await browser.close();
