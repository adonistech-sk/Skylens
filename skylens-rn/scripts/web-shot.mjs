// Captures the React Native Web build in headless Chrome at iPhone 16 size. This is the
// fast design loop on Windows. It is not iOS: real device-class evidence comes from the
// Simulator run in .github/workflows/rn-ios.yml.
//
// A capture only counts if the page really painted. It waits for rendered text, lets the
// sky settle, then rejects a frame that is one flat colour, because a blank page once
// passed as "clean" here.
//
// usage: node scripts/web-shot.mjs <outDir> [route[=name] ...]
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const [outDir, ...routes] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const base = process.env.BASE ?? 'http://localhost:8099';
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const [vw, vh] = (process.env.VIEWPORT ?? '393x852').split('x').map(Number);
const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 2, hasTouch: true });
let failed = 0;
for (const r of routes) {
  const [route, name] = r.split('=');
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', (m) => { if (m.type() === 'error') logs.push(m.text().slice(0, 300)); });
  page.on('pageerror', (e) => logs.push(`PAGEERROR ${String(e).slice(0, 400)}`));
  const sep = route.includes('?') ? '&' : '?';
  await page.goto(`${base}/${route}${sep}demo=1`, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => document.body.innerText.trim().length > 0 || document.querySelector('canvas'), null, { timeout: 120000 }).catch(() => logs.push('nothing rendered'));
  await page.waitForTimeout(Number(process.env.WAIT ?? 6000));
  const file = path.join(outDir, `${(name ?? route.replace(/\W+/g, '_')).replace(/^_/, '') || 'root'}.png`);
  await page.screenshot({ path: file });
  const { channels } = await sharp(file).stats();
  const flat = channels.slice(0, 3).every((c) => c.stdev < 2);
  if (flat) { failed++; logs.push('BLANK FRAME'); }
  console.log(file, logs.length ? logs.slice(0, 6) : 'clean');
  await page.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
