// Strict comparison of real screenshots against the locked references.
//
// The showcase phones are squat: about 0.56 wide-to-tall against 0.46 for an iPhone 16.
// So each reference is cropped to its screen (bezel removed) and aligned by normalized
// coordinates: same width, and the same top and bottom edges. That stretches the
// reference about 20% vertically, which is an alignment aid for spotting misplacement.
// Panels: reference at true proportions | aligned reference | app | app over reference |
// difference heatmap.
//
// The percentages are blurred colour distances, reported only to see whether an edit
// moved a screen toward its reference. They are not a similarity score.
//
// usage: node scripts/visual-compare.mjs <shotDir> <outDir> [names...]
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const [shots, out, ...only] = process.argv.slice(2);
const refs = '../skylens_rn_implementation_pack/reference_screens';
fs.mkdirSync(out, { recursive: true });
const W = 393, H = 852, GAP = 12;
const BEZEL = 7; // Reference pixels of phone frame on every side.

async function reference(file) {
  const { width, height } = await sharp(file).metadata();
  return sharp(file).extract({ left: BEZEL, top: BEZEL, width: width - BEZEL * 2, height: height - BEZEL * 2 });
}

const raw = (s) => s.removeAlpha().raw().toBuffer();
const rows = [];
for (const f of fs.readdirSync(refs).sort()) {
  const name = f.replace('.png', '');
  if (only.length && !only.some((o) => name.startsWith(o))) continue;
  const shot = path.join(shots, f);
  if (!fs.existsSync(shot)) { console.log('missing', f); continue; }
  const refPath = path.join(refs, f);
  const true_ = await (await reference(refPath)).resize({ width: W }).png().toBuffer();
  const aligned = await (await reference(refPath)).resize(W, H, { fit: 'fill' }).png().toBuffer();
  const app = await sharp(shot).resize(W, H, { fit: 'fill' }).png().toBuffer();
  const overlay = await sharp(aligned).composite([{ input: await sharp(app).ensureAlpha(0.5).png().toBuffer() }]).png().toBuffer();

  // Heatmap and a coarse distance from images blurred to about one row of text.
  const SW = 98, SH = 213;
  const a = await raw(sharp(aligned).blur(6).resize(SW, SH, { fit: 'fill' }));
  const b = await raw(sharp(app).blur(6).resize(SW, SH, { fit: 'fill' }));
  const heat = Buffer.alloc(SW * SH * 3);
  let total = 0;
  const bands = [0, 0, 0];
  for (let y = 0; y < SH; y++) {
    for (let x = 0; x < SW; x++) {
      const i = (y * SW + x) * 3;
      const d = (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2])) / 3;
      total += d;
      bands[Math.min(2, Math.floor((y / SH) * 3))] += d;
      const v = Math.min(255, d * 3);
      heat[i] = v; heat[i + 1] = v * 0.45; heat[i + 2] = 255 - v;
    }
  }
  const pct = (n, area) => ((n / area / 255) * 100).toFixed(1);
  const heatPng = await sharp(heat, { raw: { width: SW, height: SH, channels: 3 } }).resize(W, H, { kernel: 'nearest' }).png().toBuffer();
  const trueH = (await sharp(true_).metadata()).height;
  const panels = [true_, aligned, app, overlay, heatPng];
  const canvasW = panels.length * W + (panels.length - 1) * GAP;
  await sharp({ create: { width: canvasW, height: H, channels: 3, background: '#2b2f38' } })
    .composite(panels.map((input, i) => ({ input, left: i * (W + GAP), top: i === 0 ? Math.round((H - trueH) / 2) : 0 })))
    .jpeg({ quality: 86 }).toFile(path.join(out, `${name}.jpg`));
  const row = { name, distance: pct(total, SW * SH), top: pct(bands[0], (SW * SH) / 3), middle: pct(bands[1], (SW * SH) / 3), bottom: pct(bands[2], (SW * SH) / 3) };
  rows.push(row);
  console.log(row.name.padEnd(30), `all ${row.distance}%  top ${row.top}%  mid ${row.middle}%  bottom ${row.bottom}%`);
}
fs.writeFileSync(path.join(out, 'distances.json'), JSON.stringify(rows, null, 2));
