// A reference beside each real screenshot, for reviewing the whole product at a glance.
// usage: node scripts/contact-sheet.mjs <shotDir> <out.jpg> [names...]
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const [shots, out, ...only] = process.argv.slice(2);
const refs = '../skylens_rn_implementation_pack/reference_screens';
const H = 620, GAP = 6, PAIR_GAP = 26;
const inputs = [];
let x = 0;
for (const f of fs.readdirSync(refs).sort()) {
  if (only.length && !only.some((o) => f.startsWith(o))) continue;
  const shot = path.join(shots, f);
  if (!fs.existsSync(shot)) continue;
  const m = await sharp(path.join(refs, f)).metadata();
  const ref = await sharp(path.join(refs, f)).extract({ left: 7, top: 7, width: m.width - 14, height: m.height - 14 }).resize({ height: H }).png().toBuffer();
  const app = await sharp(shot).resize({ height: H }).png().toBuffer();
  const rw = (await sharp(ref).metadata()).width, aw = (await sharp(app).metadata()).width;
  inputs.push({ input: ref, left: x, top: 0 }, { input: app, left: x + rw + GAP, top: 0 });
  x += rw + aw + GAP + PAIR_GAP;
}
await sharp({ create: { width: x - PAIR_GAP, height: H, channels: 3, background: '#2b2f38' } }).composite(inputs).jpeg({ quality: 88 }).toFile(out);
