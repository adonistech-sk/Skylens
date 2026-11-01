// Grades the hero images toward the locked design. Every edit here is disclosed in
// ASSET_CREDITS.md, as CC BY terms require. Images may be rotated, because space has no
// up, but never mirrored: a flipped galaxy would be a false picture of it.
//
// usage: node scripts/grade-heroes.mjs <assets-source-dir> [andromeda] [orion] [location] [saturn]
import fs from 'node:fs';
import sharp from 'sharp';

const [src, ...only] = process.argv.slice(2);
const want = (n) => !only.length || only.includes(n);
const out = 'assets/images';
const jpg = { quality: 84, mozjpeg: true };
const clamp = (x) => Math.max(0, Math.min(1, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

/** Applies fn(r, g, b, x, y) over 0..1 channels and returns a sharp instance. */
async function perPixel(input, fn) {
  const { data, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const o = Buffer.alloc(W * H * 3);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 3;
    const [r, g, b] = fn(data[i] / 255, data[i + 1] / 255, data[i + 2] / 255, x / W, y / H);
    o[i] = clamp(r) * 255; o[i + 1] = clamp(g) * 255; o[i + 2] = clamp(b) * 255;
  }
  return sharp(o, { raw: { width: W, height: H, channels: 3 } });
}

// M31, NOIRLab true-colour mosaic. Rotated 75 degrees so the disc rises to the right as
// in the design; the blown core is rolled down to its warm colour, the blue sky pedestal
// is removed, and the disc's own colours are strengthened.
if (want('andromeda')) {
  const size = 3000;
  const turned = await sharp(`${src}/noao-m31.jpg`).resize(size).rotate(-75, { background: '#000' }).toBuffer();
  const m = await sharp(turned).metadata();
  // The core stays at the source centre: place it right of centre and high, as designed.
  const W = 1179, H = 1158, S = 2.42;
  const cw = Math.round(W * S), ch = Math.round(H * S);
  const left = Math.round(m.width / 2 - cw * 0.61), top = Math.round(m.height / 2 - ch * 0.56);
  const framed = await sharp(turned).extract({ left: Math.max(0, left), top: Math.max(0, top), width: Math.min(cw, m.width - Math.max(0, left)), height: Math.min(ch, m.height - Math.max(0, top)) }).resize(W, H).toBuffer();
  // The core clips in the source, so its falloff is recovered from a wide blur of the light.
  const { data: wide } = await sharp(framed).greyscale().blur(46).raw().toBuffer({ resolveWithObject: true });
  const grade = (r, g, b, x, y) => {
    const glow = wide[Math.floor(y * H) * W + Math.floor(x * W)] / 255;
    // Take away the blue pedestal of the sky, keeping stars and arms.
    const floor = Math.min(r, g);
    const lit = (r + g) / 2;
    b = floor + Math.max(0, b - floor) * (0.4 + 0.5 * smooth(0.14, 0.42, lit));
    let l = (r + g + b) / 3;
    const curve = (v) => Math.pow(v, 1.62) * 1.34;
    let R = curve(r), G = curve(g), B = curve(b);
    // Roll the core off to warm amber rather than clipped white.
    const hot = smooth(0.42, 1.0, l);
    const fall = Math.pow(smooth(0.22, 0.96, glow), 2.6);
    R = R * (1 - hot) + hot * (0.70 + 0.36 * fall);
    G = G * (1 - hot) + hot * (0.30 + 0.62 * fall);
    B = B * (1 - hot) + hot * (0.15 + 0.66 * fall);
    // Stronger colour in the disc.
    l = (R + G + B) / 3;
    const sat = 1.5;
    R = l + (R - l) * sat; G = l + (G - l) * sat; B = l + (B - l) * sat;
    // The rotated corners and far edges fall away into the page.
    const dx = (x - 0.6) / (x < 0.6 ? 0.66 : 1.0), dy = (y - 0.52) / 0.86;
    const fade = 1 - smooth(0.5, 1.0, Math.hypot(dx, dy));
    return [R * fade, G * fade, B * fade];
  };
  await (await perPixel(framed, grade)).jpeg(jpg).toFile(`${out}/andromeda-hero.jpg`);
  const thumb = await sharp(turned).extract({ left: Math.round(m.width / 2 - 1100), top: Math.round(m.height / 2 - 1100), width: 2200, height: 2200 }).resize(240, 240).toBuffer();
  await (await perPixel(thumb, (r, g, b) => {
    const floor = Math.min(r, g);
    b = floor + Math.max(0, b - floor) * 0.5;
    const v = (c) => Math.pow(c, 1.4) * 1.1;
    return [v(r), v(g), v(b)];
  })).jpeg(jpg).toFile(`${out}/thumb-andromeda.jpg`);
}

// Orion Nebula: cropped in on the Trapezium, the pink of its hydrogen deepened, edges held back.
if (want('orion')) {
  const framed = await sharp(`${src}/orion_nebula.jpg`).extract({ left: 780, top: 1000, width: 2500, height: 1560 }).resize(1179, 736).toBuffer();
  await (await perPixel(framed, (r, g, b, x, y) => {
    const v = (c) => Math.pow(c, 1.28) * 1.14;
    const fade = 1 - 0.62 * smooth(0.46, 1.05, Math.hypot((x - 0.54) / 0.9, (y - 0.42) / 0.8));
    const l = (r + g + b) / 3;
    const R = l + (r - l) * 1.5, G = l + (g - l) * 1.5, B = l + (b - l) * 1.5;
    return [v(R) * 0.98 * fade, v(G) * 0.7 * fade, v(B) * 1.3 * fade];
  })).jpeg(jpg).toFile(`${out}/orion-nebula-hero.jpg`);
}

// Pro: Cassini's open-ringed Saturn at the top right, rings sweeping off to the upper
// left, warmed toward the design's tan, and smaller in frame than before.
if (want('saturn')) {
  const turned = await sharp(`${src}/saturn_alt.jpg`, { limitInputPixels: false }).flatten({ background: '#000' }).resize(3600).rotate(32, { background: '#000' }).toBuffer();
  const tm = await sharp(turned).metadata();
  const scaled = await sharp(turned).resize(Math.round(tm.width * 0.76)).modulate({ saturation: 2.1, brightness: 1.0 }).tint({ r: 255, g: 216, b: 178 }).toBuffer();
  const sm = await sharp(scaled).metadata();
  const cx = Math.round(sm.width / 2), cy = Math.round(sm.height / 2);
  await sharp(scaled).extract({ left: cx - 1090, top: cy - 640, width: 1179, height: 1560 }).jpeg(jpg).toFile(`${out}/saturn-pro.jpg`);
}

console.log('graded');
