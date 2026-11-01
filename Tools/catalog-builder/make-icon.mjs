#!/usr/bin/env node
// Draws the app icon from the catalog: Orion's actual stars and figure, at their real
// positions and relative brightness, so the icon needs no licensed artwork.
//
//   node Tools/catalog-builder/make-icon.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const here = path.dirname(fileURLToPath(import.meta.url));
const res = path.resolve(here, '../../Packages/SkyLensKit/Sources/SkyCatalog/Resources');
const outDir = path.resolve(here, '../../SkyLens/Resources/Assets.xcassets/AppIcon.appiconset');
const size = 1024;

const bin = fs.readFileSync(path.join(res, 'stars.bin'));
const count = bin.readUInt32LE(4);
const stars = new Map();
for (let i = 0; i < count; i++) {
  const o = 8 + i * 28;
  const mag = bin.readInt16LE(o + 24) / 100;
  if (mag > 6) break; // Sorted brightest first.
  stars.set(bin.readUInt32LE(o), { ra: bin.readFloatLE(o + 4), dec: bin.readFloatLE(o + 8), mag, bv: bin.readInt16LE(o + 26) / 1000 });
}
const orion = JSON.parse(fs.readFileSync(path.join(res, 'constellations.json'), 'utf8')).find((c) => c.id === 'Ori');

// A gnomonic view centred on the figure, rotated so it stands upright as it does when
// culminating. Right ascension increases to the left, as it does on the sky.
const rad = Math.PI / 180;
const ra0 = 83.8 * rad, dec0 = 1.5 * rad, scale = 1950;
const project = (ra, dec) => {
  const a = ra * rad, d = dec * rad;
  const c = Math.sin(dec0) * Math.sin(d) + Math.cos(dec0) * Math.cos(d) * Math.cos(a - ra0);
  const x = Math.cos(d) * Math.sin(a - ra0) / c;
  const y = (Math.cos(dec0) * Math.sin(d) - Math.sin(dec0) * Math.cos(d) * Math.cos(a - ra0)) / c;
  return [size / 2 - x * scale, size / 2 - y * scale];
};

const px = new Float32Array(size * size * 3);
const srgbToLinear = (c) => Math.pow(c / 255, 2.2);
const top = [0x0b, 0x14, 0x24].map(srgbToLinear), bottom = [0x05, 0x09, 0x10].map(srgbToLinear);
for (let y = 0; y < size; y++) {
  const t = y / size;
  for (let x = 0; x < size; x++) {
    // A faint lift behind the figure gives the mark some depth.
    const dx = (x - size / 2) / size, dy = (y - size * 0.45) / size;
    const lift = 0.012 * Math.exp(-(dx * dx + dy * dy) * 7);
    for (let k = 0; k < 3; k++) {
      px[(y * size + x) * 3 + k] = top[k] + (bottom[k] - top[k]) * t + lift * [0.55, 0.72, 1][k];
    }
  }
}

const splat = (cx, cy, radius, rgb, gain) => {
  const reach = Math.ceil(radius * 3.2);
  for (let y = Math.max(0, Math.floor(cy - reach)); y < Math.min(size, cy + reach); y++) {
    for (let x = Math.max(0, Math.floor(cx - reach)); x < Math.min(size, cx + reach); x++) {
      const d2 = (x - cx) ** 2 + (y - cy) ** 2;
      const v = gain * Math.exp(-d2 / (radius * radius));
      for (let k = 0; k < 3; k++) px[(y * size + x) * 3 + k] += rgb[k] * v;
    }
  }
};

const gold = [0xd7, 0xbd, 0x92].map(srgbToLinear);
for (const strip of orion.lines) {
  const pts = strip.map((h) => stars.get(h)).filter(Boolean).map((s) => project(s.ra, s.dec));
  for (let i = 0; i + 1 < pts.length; i++) {
    const [[x0, y0], [x1, y1]] = [pts[i], pts[i + 1]];
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
    for (let s = 0; s <= n; s += 1) splat(x0 + (x1 - x0) * s / n, y0 + (y1 - y0) * s / n, 2.6, gold, 0.1);
  }
}

const tint = (bv) => (bv > 1 ? [1, 0.72, 0.5] : bv < 0.1 ? [0.74, 0.84, 1] : [1, 0.97, 0.92]);
const members = new Set(orion.lines.flat());
for (const h of members) {
  const s = stars.get(h);
  if (!s) continue;
  const [x, y] = project(s.ra, s.dec);
  const radius = Math.max(7, 22 - s.mag * 7);
  splat(x, y, radius * 3, tint(s.bv), 0.1);
  splat(x, y, radius, tint(s.bv), 1.6);
}

// No alpha: App Store icons must be opaque.
const raw = Buffer.alloc((size * 3 + 1) * size);
for (let y = 0; y < size; y++) {
  const row = y * (size * 3 + 1) + 1;
  for (let x = 0; x < size * 3; x++) {
    raw[row + x] = Math.round(Math.min(1, Math.pow(Math.max(0, px[y * size * 3 + x]), 1 / 2.2)) * 255);
  }
}
const table = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (b) => { let c = 0xffffffff; for (const v of b) c = table[(c ^ v) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const sum = Buffer.alloc(4); sum.writeUInt32BE(crc(body));
  return Buffer.concat([len, body, sum]);
};
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 2;
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'icon-1024.png'), Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0)),
]));
fs.writeFileSync(path.join(outDir, 'Contents.json'), `${JSON.stringify({
  images: [{ filename: 'icon-1024.png', idiom: 'universal', platform: 'ios', size: '1024x1024' }],
  info: { author: 'xcode', version: 1 },
}, null, 2)}\n`);
console.log('wrote', path.join(outDir, 'icon-1024.png'));
