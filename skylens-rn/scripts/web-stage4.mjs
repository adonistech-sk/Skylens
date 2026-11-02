// Drives the Stage 4 constellation experience in the web build and captures its states.
// Web under software GL: this is logic and design evidence, never iOS evidence or a frame rate.
// usage: node scripts/web-stage4.mjs <outDir>     ONLY=<text> runs one flow.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const out = process.argv[2];
fs.mkdirSync(out, { recursive: true });
const base = process.env.BASE ?? 'http://localhost:8099';
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const phone = { viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, hasTouch: true };
const ctx = await browser.newContext(phone);
const results = [];
const flow = async (name, fn, context = ctx) => {
  if (process.env.ONLY && !name.includes(process.env.ONLY)) return;
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 240)));
  const started = Date.now();
  try {
    await fn(page);
    if (errors.length) throw new Error(errors[0]);
    results.push(['PASS', name]);
    console.log('PASS', name, `${Math.round((Date.now() - started) / 1000)}s`);
  } catch (e) {
    results.push(['FAIL', name, String(e).slice(0, 300)]);
    console.log('FAIL', name, String(e).slice(0, 300));
    await page.screenshot({ path: path.join(out, `fail-${name.replace(/\W+/g, '_')}.png`) }).catch(() => {});
  }
  await page.close();
};
const open = (p, route) => p.goto(`${base}/${route}${route.includes('?') ? '&' : '?'}demo=1`, { waitUntil: 'load', timeout: 120000 });
const id = (p, t) => p.getByTestId(t);
const text = (p, t) => p.getByText(t, { exact: false }).first();
const visible = (l, timeout = 25000) => l.waitFor({ state: 'visible', timeout });
const sky = (p) => id(p, 'sky-canvas').screenshot().then((b) => b.toString('base64'));
const ready = async (p, route = 'sky') => {
  await open(p, route);
  await visible(id(p, 'sky-more'));
  await p.waitForFunction(() => globalThis.__skyProbe?.view, null, { timeout: 60000 });
  await p.waitForTimeout(6000);
};
const probe = (p, name, ...args) => p.evaluate(([n, a]) => globalThis.__skyProbe[n](...a), [name, args]);
const shot = async (p, name, wait = 0) => { if (wait) await p.waitForTimeout(wait); await p.screenshot({ path: path.join(out, `${name}.png`) }); };
const settled = (p) => p.waitForFunction(() => !globalThis.__skyProbe?.animating(), null, { timeout: 20000 });

/** Every figure on screen must sit on its stars in this exact frame. */
async function anchored(p, limit = 1.2, label = '') {
  const errors = await probe(p, 'anchors');
  const ids = Object.keys(errors ?? {});
  if (!ids.length) throw new Error(`no figure on screen to measure ${label}`);
  const worst = Math.max(...Object.values(errors).filter((v) => v !== null && !Number.isNaN(v)));
  if (worst > limit) throw new Error(`figure ${worst.toFixed(2)} pt from its stars ${label}`);
  console.log(`   anchors ${label}: ${ids.join(' ')} worst ${worst.toFixed(3)} pt`);
  return worst;
}

async function toggle(p, name) {
  await id(p, 'sky-layers').click();
  await visible(p.getByRole('switch', { name }));
  await p.getByRole('switch', { name }).click();
  await id(p, 'sky-layers').click();
  await p.waitForTimeout(1500);
}

async function changes(p, name) {
  const before = await sky(p);
  await toggle(p, name);
  await settled(p);
  await p.waitForTimeout(600);
  const after = await sky(p);
  if (before === after) throw new Error(`${name} changed nothing`);
  await toggle(p, name);
  await settled(p);
}

await flow('Explore shows the figure, anchored, on opening', async (p) => {
  await ready(p);
  const art = await probe(p, 'artwork');
  if (!art.includes('Ori')) throw new Error(`Orion not drawn: ${art}`);
  await anchored(p, 1.2, 'on opening');
  await shot(p, 'art-01-opening');
});

await flow('anchoring holds through pan, pinch, zoom and rotation of the view', async (p) => {
  await ready(p);
  const box = await id(p, 'sky-canvas').boundingBox();
  const drag = async (dx, dy) => {
    await p.mouse.move(box.width / 2, box.height / 2);
    await p.mouse.down();
    await p.mouse.move(box.width / 2 + dx, box.height / 2 + dy, { steps: 8 });
    await p.mouse.up();
    await p.waitForTimeout(1600);
  };
  await anchored(p, 1.2, 'start');
  await drag(-90, 40);
  await anchored(p, 1.2, 'after a pan');
  await shot(p, 'art-02-panned');
  await drag(120, -120);
  await anchored(p, 1.2, 'after a second pan');
  const cdp = await p.context().newCDPSession(p);
  const pinch = async (a, b) => {
    const pts = (g) => [{ x: 196 - g / 2, y: 420, id: 1 }, { x: 196 + g / 2, y: 420, id: 2 }];
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pts(a) });
    for (let i = 1; i <= 18; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pts(a + ((b - a) * i) / 18) }); await p.waitForTimeout(16); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await p.waitForTimeout(1800);
  };
  await pinch(90, 220);
  await anchored(p, 1.6, 'zoomed in');
  await shot(p, 'art-03-zoomed-in');
  await pinch(240, 70);
  await anchored(p, 1.2, 'zoomed back out');
  await shot(p, 'art-04-zoomed-out');
  await pinch(240, 70);
  await pinch(240, 70);
  // Past the art's range the figures fade by design, so there is nothing left to measure.
  const wide = await probe(p, 'view');
  if (wide.fov < 92 && !(await probe(p, 'artwork')).length) throw new Error(`figures gone at ${wide.fov}°`);
});

const landscape = await browser.newContext({ viewport: { width: 852, height: 393 }, deviceScaleFactor: 2, hasTouch: true });
await flow('anchoring holds in a landscape viewport', async (p) => {
  await ready(p);
  await anchored(p, 1.2, 'landscape');
  await shot(p, 'art-05-landscape');
}, landscape);
await landscape.close();

await flow('Time Travel carries figures with the sky and with proper motion', async (p) => {
  await ready(p);
  const start = Date.parse('2027-01-17T20:25:00Z');
  const opening = await sky(p);
  await probe(p, 'time', start + 2 * 3_600_000);
  await p.waitForTimeout(2500);
  if (opening === await sky(p)) throw new Error('the sky did not move with the clock');
  await anchored(p, 1.2, 'two hours later');
  await shot(p, 'art-06-time-2h');
  await probe(p, 'time', Date.UTC(2199, 0, 17, 20, 25));
  await p.waitForTimeout(3500);
  await anchored(p, 1.6, 'the year 2199');
  await shot(p, 'art-07-time-2199');
  await probe(p, 'time', Date.UTC(1801, 0, 17, 20, 25));
  await p.waitForTimeout(3500);
  await anchored(p, 1.6, 'the year 1801');
  await shot(p, 'art-08-time-1801');
});

await flow('tapping the figure chooses it and the reveal runs, ending anchored', async (p) => {
  await ready(p);
  const at = await probe(p, 'point', 'star:26311');
  // Beside the belt: on the drawn torso, away from any star's tap radius.
  await id(p, 'sky-canvas').click({ position: { x: at.x + 2, y: at.y - 74 } });
  await visible(id(p, 'sky-selection'));
  await p.waitForFunction(() => document.body.innerText.includes('Constellation ·'), null, { timeout: 8000 });
  await settled(p);
  // The reveal runs at real speed in the app. Software GL can't screenshot fast enough to catch
  // it, so its clock is held at four moments, which shows each stage exactly.
  for (const [age, name] of [[0.35, 'reveal-1-lines'], [0.85, 'reveal-2-trace'], [1.3, 'reveal-3-plate']]) {
    await probe(p, 'hold', age);
    await shot(p, name, 900);
    await anchored(p, 1.2, `at ${age} s of the reveal`);
  }
  await probe(p, 'hold', null);
  await settled(p);
  await shot(p, 'reveal-4-complete', 300);
  await anchored(p, 1.2, 'after the reveal');
});

await flow('a selected star lights its corner of the figure', async (p) => {
  await ready(p);
  const at = await probe(p, 'point', 'star:27989');
  await id(p, 'sky-canvas').click({ position: { x: at.x, y: at.y } });
  await visible(text(p, 'Betelgeuse'));
  await shot(p, 'selected-star', 1400);
});

await flow('artwork, lines, names, animation and opacity are independent controls', async (p) => {
  await ready(p);
  await changes(p, 'Constellation artwork');
  await changes(p, 'Constellation lines');
  await changes(p, 'Constellation names');
  // Lines off leaves the art, and art off leaves the lines.
  await toggle(p, 'Constellation lines');
  await shot(p, 'layers-art-without-lines', 800);
  await toggle(p, 'Constellation lines');
  await toggle(p, 'Constellation artwork');
  await shot(p, 'layers-lines-without-art', 800);
  await toggle(p, 'Constellation artwork');
  await id(p, 'sky-layers').click();
  await visible(p.getByRole('switch', { name: 'Constellation animation' }));
  await shot(p, 'layers-panel');
  await id(p, 'layers-art-opacity').scrollIntoViewIfNeeded();
  await shot(p, 'layers-panel-opacity', 300);
  const before = await sky(p);
  const slider = await id(p, 'layers-art-opacity').boundingBox();
  await p.mouse.click(slider.x + slider.width * 0.1, slider.y + slider.height * 0.7);
  await p.waitForTimeout(1500);
  if (before === await sky(p)) throw new Error('opacity changed nothing');
});

await flow('the animation switch makes a chosen figure arrive complete', async (p) => {
  await ready(p);
  await toggle(p, 'Constellation animation');
  const at = await probe(p, 'point', 'star:26311');
  await id(p, 'sky-canvas').click({ position: { x: at.x + 2, y: at.y - 74 } });
  await visible(id(p, 'sky-selection'));
  await p.waitForTimeout(250);
  if (await probe(p, 'animating')) throw new Error('still animating with the switch off');
  await shot(p, 'motion-off');
});

const reduced = await browser.newContext({ ...phone, reducedMotion: 'reduce' });
await flow('Reduce Motion wins over the animation switch', async (p) => {
  await ready(p);
  await id(p, 'sky-layers').click();
  await id(p, 'layers-art-opacity').scrollIntoViewIfNeeded();
  await visible(text(p, 'Reduce Motion is on'));
  await id(p, 'sky-layers').click();
  const at = await probe(p, 'point', 'star:26311');
  await id(p, 'sky-canvas').click({ position: { x: at.x + 2, y: at.y - 74 } });
  await visible(id(p, 'sky-selection'));
  await p.waitForTimeout(250);
  if (await probe(p, 'animating')) throw new Error('animating under Reduce Motion');
  await shot(p, 'motion-reduced');
}, reduced);
await reduced.close();

await flow('Observe and Deep Atlas keep art off until asked, then quiet', async (p) => {
  await ready(p);
  await id(p, 'segment-observe').click();
  await p.waitForTimeout(2500);
  if ((await probe(p, 'artwork')).length) throw new Error('art drawn in Observe by default');
  await shot(p, 'mode-observe-default');
  await toggle(p, 'Constellation artwork');
  await settled(p);
  await shot(p, 'mode-observe-art-on', 600);
  await id(p, 'segment-atlas').click();
  await p.waitForTimeout(2500);
  if ((await probe(p, 'artwork')).length) throw new Error('art drawn in Deep Atlas by default');
  await toggle(p, 'Constellation artwork');
  await settled(p);
  await shot(p, 'mode-atlas-art-on', 600);
});

await flow('search by everyday name, Find in Sky, and Story', async (p) => {
  await ready(p);
  await id(p, 'sky-search').click();
  await id(p, 'search-input').fill('Big Dipper');
  await visible(id(p, 'result-Ursa Major'));
  await shot(p, 'search-big-dipper', 500);
  await id(p, 'result-Ursa Major').click();
  await visible(id(p, 'constellation-story'));
  await shot(p, 'detail-ursa-major', 1800);
  await id(p, 'find-in-sky').click();
  await visible(id(p, 'sky-selection'));
  await settled(p);
  await shot(p, 'find-ursa-major', 600);
});

await flow('Story keeps science, history and tradition apart, with attribution', async (p) => {
  await open(p, 'object/con:Ori');
  await visible(id(p, 'constellation-story'));
  await visible(text(p, 'The science'));
  await visible(text(p, 'Stories people tell'));
  await visible(id(p, 'story-disclaimer'));
  await visible(text(p, 'Greek tradition'));
  await visible(text(p, 'Babylonian tradition'));
  await p.waitForTimeout(2500);
  await shot(p, 'story-01-hero');
  await id(p, 'constellation-story').scrollIntoViewIfNeeded();
  await text(p, 'Stories people tell').scrollIntoViewIfNeeded();
  await shot(p, 'story-02-traditions', 700);
  await open(p, 'object/con:Tel');
  await visible(text(p, 'It has no ancient story of its own'));
  await text(p, 'It has no ancient story of its own').scrollIntoViewIfNeeded();
  await shot(p, 'story-03-modern-no-myth', 800);
});

await flow('guided tour flies stop to stop, each from the engine, and finishes on the figure', async (p) => {
  await open(p, 'object/con:Ori');
  await visible(id(p, 'detail-tour'));
  await id(p, 'detail-tour').click();
  await visible(id(p, 'tour-card'));
  await p.waitForFunction(() => globalThis.__skyProbe?.view, null, { timeout: 60000 });
  await p.waitForTimeout(3500);
  await shot(p, 'tour-1');
  const stops = ['star:27989', 'star:25336', 'star:26311', 'dso:M42', 'star:24436'];
  for (let i = 0; i < stops.length; i++) {
    const at = await probe(p, 'point', stops[i]);
    if (!at || Math.abs(at.x - 196.5) > 40 || at.y < 150 || at.y > 700) throw new Error(`stop ${i + 1} is not centred: ${JSON.stringify(at)}`);
    if (i === 3) await shot(p, 'tour-4-nebula', 600);
    if (i < stops.length - 1) { await id(p, 'tour-next').click(); await p.waitForTimeout(2600); }
  }
  await id(p, 'tour-prev').click();
  await p.waitForTimeout(2200);
  await visible(text(p, 'Orion Nebula'));
  await id(p, 'tour-next').click();
  await p.waitForTimeout(2000);
  await id(p, 'tour-next').click();
  await visible(id(p, 'sky-selection'));
  await visible(text(p, 'Orion'));
  if (await id(p, 'tour-card').count()) throw new Error('the tour card outlived the tour');
  await shot(p, 'tour-9-finished', 2800);
});

await flow('a tour ends when something else is chosen, and the selection card offers one', async (p) => {
  await ready(p);
  const at = await probe(p, 'point', 'star:26311');
  await id(p, 'sky-canvas').click({ position: { x: at.x + 2, y: at.y - 74 } });
  await visible(id(p, 'sky-tour'));
  await id(p, 'sky-tour').click();
  await visible(id(p, 'tour-card'));
  await p.waitForTimeout(2500);
  const other = await probe(p, 'point', 'star:26207');
  await id(p, 'sky-canvas').click({ position: { x: other.x, y: other.y } });
  await visible(id(p, 'sky-selection'));
  if (await id(p, 'tour-card').count()) throw new Error('tour survived a new selection');
});

await flow('a tour for a constellation below the horizon says so truthfully', async (p) => {
  await open(p, 'object/con:Cru');
  await visible(id(p, 'detail-tour'));
  await id(p, 'detail-tour').click();
  await visible(id(p, 'tour-card'));
  await visible(text(p, 'never rises from your latitude'));
  await shot(p, 'tour-below-horizon', 2500);
});

await flow('the panel leads with the constellation in view', async (p) => {
  await ready(p);
  await id(p, 'sheet-handle').click();
  await visible(id(p, 'sheet-suggest-0'));
  await p.waitForTimeout(1600);
  const label = await id(p, 'sheet-suggest-0').innerText();
  if (!/Constellation/.test(label)) throw new Error(`first suggestion: ${label}`);
  await shot(p, 'discovery-panel');
});

await flow('the constellation list shows drawn figures', async (p) => {
  await open(p, 'category/constellations');
  await visible(text(p, 'Andromeda'));
  await shot(p, 'list-constellations', 2500);
});

await browser.close();
const failed = results.filter((r) => r[0] === 'FAIL');
console.log(`\n${results.length - failed.length} of ${results.length} passed`);
for (const f of failed) console.log('FAIL', f[1], f[2]);
fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 1));
process.exit(failed.length ? 1 : 0);
