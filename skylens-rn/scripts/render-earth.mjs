// Renders the Earth-limb hero scenes from NASA's Black Marble and Blue Marble maps, with
// a real-star backdrop drawn from Hipparcos and the NASA all-sky map. This is synthesized
// art built from public-domain data, not a photograph, and is credited as such.
//
// usage: node scripts/render-earth.mjs <assets-source-dir>
import fs from 'node:fs';
import sharp from 'sharp';

const src = process.argv[2];
sharp.cache(false);

async function loadMap(file, width) {
  const { data, info } = await sharp(`${src}/${file}`, { limitInputPixels: false }).resize(width).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}
const night = await loadMap('earth_night_texture.jpg', 8192);
const day = await loadMap('earth_day_texture.jpg', 4096);
const sky = await (async () => {
  const { data, info } = await sharp('assets/sky/allsky.jpg').removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
})();

const DEG = Math.PI / 180;
const norm = (v) => { const l = Math.hypot(...v); return v.map((x) => x / l); };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

function sampleMap(m, lon, lat) {
  const u = ((lon / 360 + 0.5) % 1 + 1) % 1, v = 0.5 - lat / 180;
  const x = u * (m.w - 1), y = Math.max(0, Math.min(m.h - 1.001, v * (m.h - 1)));
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0, x1 = (x0 + 1) % m.w;
  const out = [0, 0, 0];
  for (let c = 0; c < 3; c++) {
    const a = m.data[(y0 * m.w + x0) * 3 + c] * (1 - fx) + m.data[(y0 * m.w + x1) * 3 + c] * fx;
    const b = m.data[((y0 + 1) * m.w + x0) * 3 + c] * (1 - fx) + m.data[((y0 + 1) * m.w + x1) * 3 + c] * fx;
    out[c] = (a * (1 - fy) + b * fy) / 255;
  }
  return out;
}

/** Real stars: all 118,217 Hipparcos entries splatted over a crop of the NASA map. */
function backdrop(W, H, centerRA, centerDec, spanDeg, gain, starLimit = 8) {
  const buf = new Float32Array(W * H * 3);
  const px = spanDeg / W;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const ra = centerRA - (x - W / 2) * px, dec = centerDec - (y - H / 2) * px;
    const u = ((0.5 - ra / 360) % 1 + 1) % 1, v = Math.max(0, Math.min(0.9999, 0.5 - dec / 180));
    const sx = u * (sky.w - 1), sy = v * (sky.h - 1);
    const x0 = Math.floor(sx), y0 = Math.floor(sy), fx = sx - x0, fy = sy - y0;
    const i = (x + y * W) * 3;
    for (let c = 0; c < 3; c++) {
      const a = sky.data[(y0 * sky.w + x0) * 3 + c] * (1 - fx) + sky.data[(y0 * sky.w + ((x0 + 1) % sky.w)) * 3 + c] * fx;
      const b = sky.data[(Math.min(sky.h - 1, y0 + 1) * sky.w + x0) * 3 + c] * (1 - fx) + sky.data[(Math.min(sky.h - 1, y0 + 1) * sky.w + ((x0 + 1) % sky.w)) * 3 + c] * fx;
      buf[i + c] = ((a * (1 - fy) + b * fy) / 255) * gain;
    }
  }
  const bin = fs.readFileSync('../Packages/SkyLensKit/Sources/SkyCatalog/Resources/stars.bin');
  const n = bin.readUInt32LE(4);
  for (let s = 0; s < n; s++) {
    const o = 8 + s * 28;
    const mag = bin.readInt16LE(o + 24) / 100;
    if (mag > starLimit) break;
    const ra = bin.readFloatLE(o + 4), dec = bin.readFloatLE(o + 8);
    let dra = ((centerRA - ra + 540) % 360) - 180;
    const x = W / 2 + dra / px, y = H / 2 + (centerDec - dec) / px;
    if (x < 2 || y < 2 || x > W - 3 || y > H - 3) continue;
    const size = Math.max(0.5, 1.5 - mag * 0.2);
    const flux = Math.min(1, 0.04 + (starLimit - mag) * 0.14);
    const r = Math.ceil(size * 2);
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const d = Math.hypot(dx, dy) / size;
      const a = flux * Math.exp(-d * d * 1.3);
      const i = (Math.round(x) + dx + (Math.round(y) + dy) * W) * 3;
      buf[i] += a; buf[i + 1] += a; buf[i + 2] += a * 1.04;
    }
  }
  return buf;
}

/**
 * horizonY: where the limb's top sits. radius: Earth's apparent radius in pixels.
 * subLon/subLat: the point on Earth facing the viewer's lower screen.
 */
async function renderScene({ W, H, horizonY, radius, subLon, subLat, sunX, sunY, sunStrength, sunVec, ra, dec, span, gain, tilt, violet, file, daylight = 1, thinPx = 4.2, widePx = 34, rim = 1, bloom = 0.5, cityGain = 1, landGain = 1, sunwardGain = 1, starLimit = 8 }) {
  const bg = backdrop(W, H, ra, dec, span, gain, starLimit);
  if (violet) {
    // The band leans violet like the reference, and fades behind the headline on the left.
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (x + y * W) * 3;
      // Dark behind the headline, and the band climbing the top right, as designed.
      const keep = Math.min(1, Math.max(0.06, ((x / W) * 1.25 - 0.36) * 1.5)) * Math.min(1, Math.max(0, (1500 - y) / 700));
      const raw = bg[i] * 0.3 + bg[i + 1] * 0.59 + bg[i + 2] * 0.11;
      const l = Math.max(0, raw - 0.075) * 1.5;
      bg[i] = (l * 0.82 + bg[i] * 0.05) * keep;
      bg[i + 1] = (l * 0.56 + bg[i + 1] * 0.04) * keep;
      bg[i + 2] = (l * 1.36 + bg[i + 2] * 0.1) * keep;
    }
  }
  const center = [W / 2 + (tilt ?? 0) * W, horizonY + radius];
  // Earth-fixed basis at the sub-viewer point, seen from a little above the surface.
  const up = [0, 0, 1];
  const c = [Math.cos(subLat * DEG) * Math.cos(subLon * DEG), Math.cos(subLat * DEG) * Math.sin(subLon * DEG), Math.sin(subLat * DEG)];
  const east = norm(cross(up, c));
  const north = cross(c, east);
  const out = Buffer.alloc(W * H * 3);
  const sunDir = norm(sunVec);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const nx = (x - center[0]) / radius, ny = (center[1] - y) / radius;
    const r2 = nx * nx + ny * ny;
    const i = (x + y * W) * 3;
    let col = [bg[i], bg[i + 1], bg[i + 2]];
    const rr = Math.sqrt(r2);
    if (r2 < 1) {
      const z = Math.sqrt(1 - r2);
      // Surface direction in Earth coordinates.
      const p = [nx * east[0] + ny * north[0] + z * c[0], nx * east[1] + ny * north[1] + z * c[1], nx * east[2] + ny * north[2] + z * c[2]];
      const lat = Math.asin(p[2]) / DEG, lon = Math.atan2(p[1], p[0]) / DEG;
      const n = sampleMap(night, lon, lat), d = sampleMap(day, lon, lat);
      const light = nx * sunDir[0] + ny * sunDir[1] + z * sunDir[2];
      const dayAmt = daylight * Math.min(1, Math.max(0, light / 0.34));
      const lum = (n[0] * 0.5 + n[1] * 0.5);
      const city = Math.pow(Math.max(0, lum - 0.14), 1.1) * 3.6 * cityGain;
      // Tone-mapped, so dense cities stay orange instead of clipping to yellow-white.
      const glowing = 1 - Math.exp(-city * 1.5);
      const cityC = [glowing * 1.16, glowing * 0.5, glowing * 0.13];
      const land = [(0.006 + n[2] * 0.012) * landGain, (0.014 + n[2] * 0.03) * landGain, (0.05 + n[2] * 0.12) * landGain];
      col = [
        land[0] * (1 - dayAmt) + d[0] * dayAmt * 0.62 + cityC[0] * (1 - dayAmt),
        land[1] * (1 - dayAmt) + d[1] * dayAmt * 0.66 + cityC[1] * (1 - dayAmt),
        land[2] * (1 - dayAmt) + d[2] * dayAmt * 0.82 + cityC[2] * (1 - dayAmt),
      ];
      // Air thickens toward the limb.
      const limb = Math.pow(1 - z, 3.4);
      col[0] += limb * (0.10 + 0.30 * Math.max(0, light));
      col[1] += limb * (0.30 + 0.34 * Math.max(0, light));
      col[2] += limb * (0.82 + 0.26 * Math.max(0, light));
    }
    // The bright atmosphere rim, thin and strongest toward the Sun.
    const h = rr - 1;
    const angleToSun = (nx * sunDir[0] + ny * sunDir[1]) / Math.max(rr, 1e-5);
    const sunward = sunwardGain * Math.pow(Math.max(0, angleToSun * 0.5 + 0.5), 3);
    const thin = rim * Math.exp(-Math.abs(h) * radius / thinPx);
    const wide = rim * (h > 0 ? Math.exp(-h * radius / widePx) : 0);
    col[0] += thin * (0.26 + 1.1 * sunward) + wide * (0.05 + 0.44 * sunward);
    col[1] += thin * (0.54 + 0.72 * sunward) + wide * (0.13 + 0.18 * sunward);
    col[2] += thin * 1.15 + wide * (0.42 - 0.2 * sunward);
    // The Sun cresting the limb, with a warm wash.
    const sd = Math.hypot(x - sunX, y - sunY);
    const flare = sunStrength * (Math.exp(-sd / 22) * 2.4 + Math.exp(-sd / 90) * 0.7 + Math.exp(-sd / 380) * 0.42);
    const hStretch = sunStrength * 0.7 * Math.exp(-Math.abs(y - sunY) / 8) * Math.exp(-Math.abs(x - sunX) / 240);
    col[0] += flare * 1.0 + hStretch; col[1] += flare * 0.54 + hStretch * 0.6; col[2] += flare * 0.24 + hStretch * 0.34;
    for (let k = 0; k < 3; k++) out[i + k] = Math.min(255, Math.pow(Math.max(0, col[k]), 0.86) * 255);
  }
  // Lights and the limb bloom softly, as they do through a lens.
  const base = await sharp(out, { raw: { width: W, height: H, channels: 3 } }).png().toBuffer();
  const glow = await sharp(base).linear(1.5, -70).blur(12).png().toBuffer();
  const faded = await sharp(glow).ensureAlpha(bloom).png().toBuffer();
  return sharp(base).composite([{ input: faded, blend: 'screen' }]).jpeg({ quality: 82, mozjpeg: true }).toFile(file);
}

fs.mkdirSync('assets/images', { recursive: true });
// Europe's night lights under a sunrise on the left limb, the Earth rising to the right.
console.log(await renderScene({
  W: 1179, H: 2556, horizonY: 1160, radius: 2600, tilt: 0.75, subLon: 40, subLat: 4, sunX: 30, sunY: 1600, sunStrength: 1.45, sunVec: [-1, 0.2, -0.86], daylight: 0,
  ra: 281, dec: 2, span: 64, gain: 2.1, violet: true, thinPx: 5, widePx: 46, cityGain: 0.5, landGain: 1.25, sunwardGain: 0.8, starLimit: 6.6, bloom: 0.26, file: 'assets/images/earth-onboarding.jpg',
}));
// A whole curved dome under the sky: the radius comes from the design's own curvature.
console.log(await renderScene({
  W: 1179, H: 1500, horizonY: 860, radius: 950, subLon: 18, subLat: -8, sunX: -220, sunY: 1050, sunStrength: 0, sunVec: [0, 1, -0.9], daylight: 0,
  ra: 190, dec: 30, span: 30, gain: 0.3, thinPx: 5.5, widePx: 62, rim: 1.2, cityGain: 2.3, landGain: 2.1, sunwardGain: 0.2, starLimit: 7, file: 'assets/images/earth-horizon.jpg',
}));
