// Puts each reference beside its real screenshot at the same height, for side-by-side
// review. usage: node scripts/compare.mjs <screenshotDir> <outDir> [names...]
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const [shots, out, ...only] = process.argv.slice(2);
const refs = '../skylens_rn_implementation_pack/reference_screens';
fs.mkdirSync(out, { recursive: true });
const H = 900;
for (const f of fs.readdirSync(refs).sort()) {
  const name = f.replace('.png', '');
  if (only.length && !only.some((o) => name.startsWith(o))) continue;
  const shot = path.join(shots, f);
  if (!fs.existsSync(shot)) { console.log('missing', f); continue; }
  const a = await sharp(path.join(refs, f)).resize({ height: H }).png().toBuffer();
  const b = await sharp(shot).resize({ height: H }).png().toBuffer();
  const wa = (await sharp(a).metadata()).width, wb = (await sharp(b).metadata()).width;
  await sharp({ create: { width: wa + wb + 24, height: H, channels: 3, background: '#30343c' } })
    .composite([{ input: a, left: 0, top: 0 }, { input: b, left: wa + 24, top: 0 }]).jpeg({ quality: 88 }).toFile(path.join(out, `${name}.jpg`));
}
