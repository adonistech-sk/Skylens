// Reviews constellation artwork in the real sky through the app's own search and Find in Sky.
// Web build, so this is design evidence only. usage: node scripts/web-art.mjs <outDir> Ori Leo ...
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const [out, ...ids] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const base = process.env.BASE ?? 'http://localhost:8099';
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, hasTouch: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));
await page.goto(`${base}/sky?demo=1`, { waitUntil: 'load', timeout: 180000 });
await page.waitForFunction(() => globalThis.__skyProbe?.view, null, { timeout: 120000 });
await page.waitForTimeout(3000);
for (const id of ids) {
  // Sets the clock so the figure is high in a dark sky, then looks at it from the demo site.
  const placed = await page.evaluate((c) => globalThis.__skyProbe.show(c), id);
  await page.waitForTimeout(Number(process.env.WAIT ?? 4500));
  await page.screenshot({ path: path.join(out, `${id}.png`) });
  console.log(id, JSON.stringify(placed));
}
if (errors.length) console.log('ERRORS', errors.slice(0, 3));
await browser.close();
