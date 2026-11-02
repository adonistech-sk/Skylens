// Lays printed figures out on one review sheet. usage: node contact.mjs <dir> <out.jpg> [cols] [suffix] ids...
import path from 'node:path';
import sharp from 'sharp';

const [dir, out, cols, suffix, ...ids] = process.argv.slice(2);
const n = Number(cols), cell = Math.floor(1560 / n);
const pics = await Promise.all(ids.map(async (id, i) => ({
  input: await sharp(path.join(dir, `${id}${suffix === '-' ? '' : suffix}.jpg`)).resize(cell - 8, cell - 8, { fit: 'contain', background: '#000' }).jpeg().toBuffer(),
  left: (i % n) * cell + 4, top: Math.floor(i / n) * cell + 4,
})));
await sharp({ create: { width: cell * n, height: cell * Math.ceil(ids.length / n), channels: 3, background: '#111520' } }).composite(pics).jpeg({ quality: 84 }).toFile(out);
