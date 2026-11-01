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

// Andromeda, the Orion Nebula and Saturn are graded by scripts/grade-heroes.mjs. The
// Location mountains and the AR stand-in are generated art, see ASSET_CREDITS.md.
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

// A faint backdrop of real stars for list screens, from the NASA all-sky map.
await sharp('assets/sky/allsky.jpg').extract({ left: 3380, top: 340, width: 620, height: 1344 }).resize(1179, 2556, { kernel: 'lanczos3' }).modulate({ brightness: 0.34, saturation: 0.6 }).blur(0.5).jpeg({ quality: 60, mozjpeg: true }).toFile(`${out}/backdrop.jpg`);

void disc;
console.log(fs.readdirSync(out).map((f) => `${f} ${Math.round(fs.statSync(`${out}/${f}`).size / 1024)}K`).join('\n'));
