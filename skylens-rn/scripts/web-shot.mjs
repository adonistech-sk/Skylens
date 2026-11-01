// Captures the React Native Web build in headless Chrome at iPhone 16 size. This is the
// fast design loop on Windows. It is not iOS: real device-class evidence comes from the
// Simulator run in .github/workflows/rn-ios.yml.
//
// usage: node scripts/web-shot.mjs <outDir> [route[=name] ...]
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const [outDir, ...routes] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const base = process.env.BASE ?? 'http://localhost:8099';
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, hasTouch: true });
for (const r of routes) {
  const [route, name] = r.split('=');
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', (m) => { if (m.type() === 'error') logs.push(m.text().slice(0, 300)); });
  page.on('pageerror', (e) => logs.push(`PAGEERROR ${String(e).slice(0, 400)}`));
  const sep = route.includes('?') ? '&' : '?';
  await page.goto(`${base}/${route}${sep}demo=1`, { waitUntil: 'load', timeout: 120000 });
  await page.waitForTimeout(Number(process.env.WAIT ?? 5000));
  const file = path.join(outDir, `${(name ?? route.replace(/\W+/g, '_')).replace(/^_/, '') || 'root'}.png`);
  await page.screenshot({ path: file });
  console.log(file, logs.length ? logs.slice(0, 6) : 'clean');
  await page.close();
}
await browser.close();
