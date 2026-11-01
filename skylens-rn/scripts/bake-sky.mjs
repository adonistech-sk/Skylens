// Turns NASA's Deep Star Maps 2020 (1.7 billion real stars from Hipparcos-2, Tycho-2
// and Gaia DR2) into the all-sky texture the renderer samples. Nothing is painted in:
// every pixel keeps its real position, and only tone and colour grading change.
//
// usage: node scripts/bake-sky.mjs <starmap.exr> <out.jpg> <tools-node_modules-dir>
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const [exrPath, outPath, toolsDir] = process.argv.slice(2);
const require = createRequire(path.join(toolsDir, 'x.js'));
const sharp = require('sharp');
const { EXRLoader } = await import(pathToFileURL(path.join(toolsDir, 'three/examples/jsm/loaders/EXRLoader.js')).href);
const THREE = require('three');

const buf = fs.readFileSync(exrPath);
const loader = new EXRLoader();
loader.setDataType(THREE.FloatType);
const parsed = loader.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
const { width, height, data } = parsed;
const channels = data.length / (width * height);
console.log({ width, height, channels });

// Report the flux distribution so the grade below can be set from data.
const lum = new Float32Array(width * height);
for (let i = 0; i < lum.length; i++) lum[i] = 0.2126 * data[i * channels] + 0.7152 * data[i * channels + 1] + 0.0722 * data[i * channels + 2];
const sorted = Float32Array.from(lum).sort();
const q = (p) => sorted[Math.floor(p * (sorted.length - 1))];
console.log({ p10: q(0.1), p50: q(0.5), p90: q(0.9), p99: q(0.99), p999: q(0.999), max: q(1) });

const out = Buffer.alloc(width * height * 3);
const shadow = q(0.02), white = q(0.9992);
const grade = (v) => {
  const t = Math.max(0, (v - shadow) / (white - shadow));
  return Math.min(1, Math.pow(Math.log1p(t * 40) / Math.log1p(40), 1.5));
};
for (let y = 0; y < height; y++) {
  // EXR rows arrive bottom-up from this loader.
  const row = height - 1 - y;
  for (let x = 0; x < width; x++) {
    const i = (row * width + x) * channels;
    const l = lum[row * width + x];
    const g = grade(l);
    const s = l > 0 ? g / l : 0;
    let r = data[i] * s, gg = data[i + 1] * s, b = data[i + 2] * s;
    // Diffuse starlight shifts from the map's neutral toward violet and rose, as the
    // reference does. Bright points keep their measured colour.
    const haze = Math.max(0, 1 - g * 1.4);
    r = r * (1 + 0.42 * haze);
    gg = gg * (1 - 0.14 * haze);
    b = b * (1 + 0.55 * haze);
    const o = (y * width + x) * 3;
    out[o] = Math.min(255, r * 255);
    out[o + 1] = Math.min(255, gg * 255);
    out[o + 2] = Math.min(255, b * 255);
  }
}
await sharp(out, { raw: { width, height, channels: 3 } }).blur(0.72).jpeg({ quality: 84, mozjpeg: true }).toFile(outPath);
console.log('wrote', outPath, fs.statSync(outPath).size);
