// Crops and grades the verified source photographs for the app. Every edit made here is
// disclosed in ASSET_CREDITS.md, as CC BY and ESO terms require.
// usage: node scripts/prepare-images.mjs <assets-source-dir>
import fs from 'node:fs';
import sharp from 'sharp';

const src = process.argv[2];
const out = 'assets/images';
fs.mkdirSync(out, { recursive: true });
const jpg = { quality: 82, mozjpeg: true };

// A soft circular mask for planet thumbnails.
const disc = (size) => Buffer.from(`<svg width="${size}" height="${size}"><defs><radialGradient id="g"><stop offset="94%" stop-color="#fff"/><stop offset="100%" stop-color="#000"/></radialGradient></defs><rect width="100%" height="100%" fill="#000"/><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="url(#g)"/></svg>`);

async function square(file, name, size = 240, extract, modulate = {}) {
  let s = sharp(`${src}/${file}`, { limitInputPixels: false }).flatten({ background: '#000' });
  if (extract) s = s.extract(extract);
  await s.resize(size, size, { fit: 'cover' }).modulate(modulate).jpeg(jpg).toFile(`${out}/${name}.jpg`);
}

// Trims black margins so every planet fills its thumbnail the same way.
async function planet(file, name, modulate = {}) {
  const trimmed = await sharp(`${src}/${file}`, { limitInputPixels: false }).flatten({ background: '#000' }).trim({ threshold: 28 }).toBuffer();
  const m = await sharp(trimmed).metadata();
  const edge = Math.max(m.width, m.height);
  await sharp(trimmed).extend({ top: Math.floor((edge - m.height) / 2 + edge * 0.03), bottom: Math.ceil((edge - m.height) / 2 + edge * 0.03), left: Math.floor((edge - m.width) / 2 + edge * 0.03), right: Math.ceil((edge - m.width) / 2 + edge * 0.03), background: '#000' })
    .resize(240, 240).modulate(modulate).jpeg(jpg).toFile(`${out}/${name}.jpg`);
}

// Object Detail hero. The source is a neutral wide-field frame, so foreground stars are
// held back with a median filter and the galaxy's own recorded colour is strengthened.
{
  const crop = await sharp(`${src}/andromeda.png`).flatten({ background: '#000' }).extract({ left: 500, top: 210, width: 1080, height: 810 }).rotate(16, { background: '#000' }).toBuffer();
  const m = await sharp(crop).metadata();
  const framed = await sharp(crop).extract({ left: Math.round((m.width - 1000) / 2), top: Math.round((m.height - 750) / 2), width: 1000, height: 750 }).toBuffer();
  const glow = await sharp(framed).median(7).gamma(1.6).linear(2.5, -62).modulate({ saturation: 3.4 }).tint({ r: 255, g: 222, b: 196 }).toBuffer();
  const points = await sharp(framed).linear(0.42, 0).toBuffer();
  await sharp(glow).composite([{ input: points, blend: 'screen' }]).resize(1179, 884).jpeg(jpg).toFile(`${out}/andromeda-hero.jpg`);
}
await square('andromeda.png', 'thumb-andromeda', 240, { left: 620, top: 270, width: 780, height: 780 }, { saturation: 1.6, brightness: 1.2 });

await sharp(`${src}/orion_nebula.jpg`).extract({ left: 400, top: 700, width: 3200, height: 2000 }).resize(1179, 737).modulate({ saturation: 1.18, brightness: 1.06 }).jpeg(jpg).toFile(`${out}/orion-nebula-hero.jpg`);
await square('orion_nebula.jpg', 'thumb-orion-nebula', 240, { left: 1100, top: 900, width: 1900, height: 1900 }, { saturation: 1.25, brightness: 1.15 });

await sharp(`${src}/deepsky_thumb_m51.jpg`).resize(1179).jpeg(jpg).toFile(`${out}/m51-hero.jpg`);
await square('deepsky_thumb_m51.jpg', 'thumb-m51', 240, { left: 300, top: 150, width: 2500, height: 2500 });
await sharp(`${src}/deepsky_thumb_pleiades.jpg`).resize(1179).jpeg(jpg).toFile(`${out}/pleiades-hero.jpg`);
await square('deepsky_thumb_pleiades.jpg', 'thumb-pleiades');
await sharp(`${src}/deepsky_thumb_lagoon.jpg`).resize(1179).jpeg(jpg).toFile(`${out}/lagoon-hero.jpg`);
await square('deepsky_thumb_lagoon.jpg', 'thumb-lagoon');

for (const [file, name, m] of [['jupiter.jpg', 'planet-jupiter'], ['mars.jpg', 'planet-mars'], ['venus.jpg', 'planet-venus'], ['mercury.jpg', 'planet-mercury'], ['uranus.tif', 'planet-uranus'], ['neptune.tif', 'planet-neptune']]) await planet(file, name, m);
await square('saturn.jpg', 'planet-saturn', 240, { left: 610, top: 0, width: 3400, height: 2233 });
await planet('moon_nearside_render.jpg', 'planet-moon');
await sharp(`${src}/moon_nearside_render.jpg`).resize(900, 900).jpeg({ quality: 86, mozjpeg: true }).toFile(`${out}/moon-disc.jpg`);

for (const [file, name] of [['jupiter.jpg', 'jupiter'], ['mars.jpg', 'mars']]) {
  await sharp(`${src}/${file}`).flatten({ background: '#000' }).resize(1179, 880, { fit: 'contain', background: '#000' }).jpeg(jpg).toFile(`${out}/${name}-hero.jpg`);
}

// Paywall: Cassini's open-ringed Saturn at the top right, rings sweeping off to the
// upper left, warmed toward the reference's tan.
const turned = await sharp(`${src}/saturn_alt.jpg`, { limitInputPixels: false }).flatten({ background: '#000' }).resize(3600).rotate(32, { background: '#000' }).toBuffer();
const tm = await sharp(turned).metadata();
const scaled = await sharp(turned).resize(Math.round(tm.width * 0.82)).modulate({ saturation: 2.4, brightness: 1.2 }).tint({ r: 255, g: 216, b: 178 }).toBuffer();
const sm = await sharp(scaled).metadata();
const cx = Math.round(sm.width / 2), cy = Math.round(sm.height / 2);
await sharp(scaled).extract({ left: cx - 1050, top: cy - 640, width: 1179, height: 1560 }).jpeg(jpg).toFile(`${out}/saturn-pro.jpg`);

// Location: the Tetons at dusk, cropped to sky and peaks, with the photo's own pink band deepened.
await sharp(`${src}/mountain_twilight_alt.jpg`).extract({ left: 1740, top: 420, width: 1560, height: 1320 })
  .resize(1179, 998).gamma(1.3).linear(1.25, -36).modulate({ saturation: 1.7, brightness: 0.86 }).jpeg(jpg).toFile(`${out}/location-mountains.jpg`);

// Screenshot-mode stand-in for the camera feed: the photo's trees as a silhouette over
// a generated dusk gradient. Never shown to users, and labelled on screen in test mode.
{
  const W = 590, H = 1278;
  const { data } = await sharp(`${src}/pine_silhouette_twilight.jpg`).extract({ left: 1100, top: 0, width: 1180, height: 2556 }).resize(W, H).greyscale().raw().toBuffer({ resolveWithObject: true });
  const buf = Buffer.alloc(W * H * 3);
  const stops = [[0, [18, 28, 66]], [0.42, [50, 56, 120]], [0.68, [150, 92, 130]], [0.86, [226, 130, 92]], [1, [240, 170, 110]]];
  for (let y = 0; y < H; y++) {
    const t = y / H;
    let i = 0;
    while (i < stops.length - 2 && t > stops[i + 1][0]) i++;
    const f = (t - stops[i][0]) / (stops[i + 1][0] - stops[i][0]);
    const c = stops[i][1].map((v, k) => v + (stops[i + 1][1][k] - v) * f);
    for (let x = 0; x < W; x++) {
      const g = y < H * 0.26 ? 1 : data[Math.floor((y - H * 0.26) * 0.86 + H * 0.14) * W + x] / 255;
      const sky = Math.min(1, Math.max(0, (g - 0.18) / 0.22));
      for (let k = 0; k < 3; k++) buf[(y * W + x) * 3 + k] = c[k] * sky + 4 * (1 - sky);
    }
  }
  await sharp(buf, { raw: { width: W, height: H, channels: 3 } }).resize(1179, 2556).jpeg({ quality: 70, mozjpeg: true }).toFile(`${out}/ar-standin.jpg`);
}

// A faint backdrop of real stars for list screens, from the NASA all-sky map.
await sharp('assets/sky/allsky.jpg').extract({ left: 3380, top: 340, width: 620, height: 1344 }).resize(1179, 2556, { kernel: 'lanczos3' }).modulate({ brightness: 0.34, saturation: 0.6 }).blur(0.5).jpeg({ quality: 60, mozjpeg: true }).toFile(`${out}/backdrop.jpg`);

void disc;
console.log(fs.readdirSync(out).map((f) => `${f} ${Math.round(fs.statSync(`${out}/${f}`).size / 1024)}K`).join('\n'));
