// Builds the Solar System and Moon Atlas assets from the sources that
// scripts/reference/fetch-solar-sources.mjs recorded. Nothing here invents surface detail:
// every edit is listed in assets/solar/provenance.json next to the file it applied to.
// usage: node scripts/build-solar-assets.mjs <sourceDir>
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { crc32 } from '../src/data/catalogs/grid.ts';

const src = process.argv[2];
const solar = new URL('../assets/solar/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const moon = new URL('../assets/moon/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
fs.mkdirSync(solar, { recursive: true });
fs.mkdirSync(moon, { recursive: true });
sharp.cache(false);

const sources = JSON.parse(fs.readFileSync(path.join(src, 'sources.json'), 'utf8'));
const open = (f) => sharp(path.join(src, f), { limitInputPixels: false });

const OPAL = {
  license: 'CC BY 4.0', licenseUrl: 'https://archive.stsci.edu/hlsp/opal',
  credit: 'NASA/ESA HST, OPAL program (PI: Simon, GO13937), archived by STScI. doi:10.17909/T9G593',
  longitude: '0 to 360 east, from the left edge (OPAL: left edge = 360 W, decreasing to the right). Planetographic latitude',
};
const USGS = { license: 'Public domain', longitude: '-180 to 180 east, centred on 0' };
const RIGHTS = {
  mercury: { ...USGS, credit: 'USGS Astrogeology Science Center, NASA MESSENGER', licenseUrl: 'https://astrogeology.usgs.gov/search/map/mercury_messenger_mdis_global_mosaic_250m', note: 'USGS Astropedia lists this product as public domain with no use constraints. Monochrome' },
  venus: { ...USGS, credit: 'USGS Astrogeology Science Center, NASA Magellan', licenseUrl: 'https://astrogeology.usgs.gov/search/map/venus_magellan_global_c3_mdir_synthetic_color_mosaic_4641m', note: 'A radar map of the surface in synthetic colour. The eye would see only cloud' },
  earth: { license: 'NASA imagery, free to reuse with credit', licenseUrl: 'https://visibleearth.nasa.gov/image-use-policy', credit: 'NASA Earth Observatory, Reto Stöckli, Blue Marble Next Generation', longitude: '-180 to 180 east, centred on 0' },
  earthNight: { license: 'NASA imagery, free to reuse with credit', licenseUrl: 'https://visibleearth.nasa.gov/image-use-policy', credit: 'NASA Earth Observatory, Suomi NPP VIIRS, Black Marble 2012', longitude: '-180 to 180 east, centred on 0' },
  mars: { ...USGS, credit: 'USGS Astrogeology Science Center, NASA Viking, NASA Ames colorized MDIM 2.1', licenseUrl: 'https://astrogeology.usgs.gov/search/map/mars_viking_colorized_global_mosaic_232m' },
  jupiter: OPAL, saturn: OPAL, uranus: OPAL, neptune: OPAL,
  io: { ...USGS, credit: 'USGS Astrogeology Science Center, NASA Galileo SSI and Voyager', licenseUrl: 'https://astrogeology.usgs.gov/search/map/io_galileo_ssi_global_color_merge_mosaic_1km', longitude: 'Longitude direction of this map is not independently tested' },
  europa: { license: 'No access or use constraints stated. Cite the authors', credit: 'Becker et al. 2010, USGS Astrogeology Science Center, NASA Galileo and Voyager', licenseUrl: 'https://astrogeology.usgs.gov/search/map/europa_voyager_galileo_ssi_global_mosaic_500m', longitude: 'Longitude direction of this map is not independently tested' },
  ganymede: { ...USGS, credit: 'USGS Astrogeology Science Center, NASA Galileo and Voyager', licenseUrl: 'https://astrogeology.usgs.gov/search/map/ganymede_voyager_galileo_ssi_global_mosaic_1km', longitude: 'Longitude direction of this map is not independently tested' },
  callisto: { ...USGS, credit: 'USGS Astrogeology Science Center, NASA Galileo and Voyager', licenseUrl: 'https://astrogeology.usgs.gov/search/map/callisto_galileo_voyager_global_mosaic_1km', longitude: 'Longitude direction of this map is not independently tested' },
  moon: { license: 'NASA, credit requested. Built from PDS-archived LROC WAC and LOLA data', licenseUrl: 'https://svs.gsfc.nasa.gov/4720/', credit: "NASA's Scientific Visualization Studio, CGI Moon Kit. LRO LROC WAC and LOLA", longitude: '-180 to 180 east, centred on 0' },
};

const records = [];
function record(file, body, source, edits) {
  const full = path.join(file.startsWith('moon/') ? moon : solar, file.replace(/^moon\//, ''));
  const bytes = fs.readFileSync(full);
  const s = sources[source];
  records.push({ file: `assets/${file.startsWith('moon/') ? file : `solar/${file}`}`, bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex'), body, sourceUrl: s.url, sourceSha256: s.sha256, retrievedUtc: s.retrievedUtc, edits, ...RIGHTS[body] });
}

async function rgb(file) {
  const { data, info } = await open(file).removeAlpha().raw().toBuffer({ resolveWithFile: false, resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

/** Fills rows with no data from the nearest rows that have it, by latitude only. */
function fillPolarGaps(img, threshold = 12) {
  const { data, width, height } = img;
  const lit = new Float32Array(height), mean = new Float32Array(height * 3);
  for (let y = 0; y < height; y++) {
    let n = 0, r = 0, g = 0, b = 0;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 3;
      if (data[i] + data[i + 1] + data[i + 2] > threshold) { n++; r += data[i]; g += data[i + 1]; b += data[i + 2]; }
    }
    lit[y] = n / width;
    if (n) { mean[y * 3] = r / n; mean[y * 3 + 1] = g / n; mean[y * 3 + 2] = b / n; }
  }
  const good = [...Array(height).keys()].filter((y) => lit[y] > 0.5);
  let filled = 0;
  for (let y = 0; y < height; y++) {
    const near = good.reduce((a, b) => (Math.abs(b - y) < Math.abs(a - y) ? b : a), good[0]);
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 3;
      if (data[i] + data[i + 1] + data[i + 2] <= threshold) {
        data[i] = mean[near * 3]; data[i + 1] = mean[near * 3 + 1]; data[i + 2] = mean[near * 3 + 2];
        filled++;
      }
    }
  }
  return filled / (width * height);
}

/** The median of each latitude. Keeps real zonal banding and removes map-edge artifacts. */
function zonalMedian(img) {
  const { data, width, height } = img;
  const out = Buffer.alloc(data.length);
  const rows = [];
  for (let y = 0; y < height; y++) {
    const chan = [[], [], []];
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 3;
      if (data[i] + data[i + 1] + data[i + 2] > 40) for (let c = 0; c < 3; c++) chan[c].push(data[i + c]);
    }
    // A latitude with little data sits at the edge of the map, where the artifacts are.
    rows.push(chan[0].length > width * 0.75 ? chan.map((v) => v.sort((a, b) => a - b)[v.length >> 1]) : null);
  }
  const good = rows.map((r, y) => (r ? y : -1)).filter((y) => y >= 0);
  for (let y = 0; y < height; y++) {
    const near = rows[y] ?? rows[good.reduce((a, b) => (Math.abs(b - y) < Math.abs(a - y) ? b : a), good[0])];
    for (let x = 0; x < width; x++) for (let c = 0; c < 3; c++) out[(y * width + x) * 3 + c] = near[c];
  }
  return { data: out, width, height };
}

/**
 * Uranus and Neptune show almost nothing in visible light, and each OPAL map covers only the
 * hemisphere turned to Earth in its year. So the bands' brightness comes from the map, the
 * unseen hemisphere repeats the last observed latitude, and the colour is set to each
 * planet's pale overall colour. OPAL's filter composite stretches the hue, which would
 * otherwise make Uranus look cream.
 */
function iceGiantBands(img, tint) {
  const { data, width, height } = zonalMedian(img);
  const light = [];
  for (let y = 0; y < height; y++) { const i = y * width * 3; light.push(0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2]); }
  const middle = [...light].sort((a, b) => a - b)[height >> 1];
  const seen = light.map((l, y) => (l > middle * 0.72 ? y : -1)).filter((y) => y >= 0);
  const out = Buffer.alloc(data.length);
  for (let y = 0; y < height; y++) {
    const from = seen.reduce((a, b) => (Math.abs(b - y) < Math.abs(a - y) ? b : a), seen[0]);
    const k = Math.max(0.74, Math.min(1.1, 0.92 + 0.34 * (light[from] / middle - 1)));
    for (let x = 0; x < width; x++) for (let c = 0; c < 3; c++) out[(y * width + x) * 3 + c] = Math.min(255, tint[c] * k);
  }
  return { img: { data: out, width, height }, unseen: 1 - seen.length / height };
}

const fromRaw = (img) => sharp(img.data, { raw: { width: img.width, height: img.height, channels: 3 } });

async function publish(name, pipeline, big, small, quality = 80) {
  const buffer = await pipeline.png().toBuffer();
  if (big) await sharp(buffer).resize(big, big / 2, { fit: 'fill', kernel: 'lanczos3' }).jpeg({ quality, mozjpeg: true }).toFile(path.join(solar, `${name}.jpg`));
  await sharp(buffer).resize(small, small / 2, { fit: 'fill', kernel: 'lanczos3' }).jpeg({ quality: Math.min(quality, 78), mozjpeg: true }).toFile(path.join(solar, `${name}-s.jpg`));
}

// ---- Rocky planets ----
await publish('mercury', open('mercury.jpg'), 2048, 512);
await publish('venus', open('venus.jpg'), 2048, 512);
await publish('mars', open('mars.jpg'), 2048, 512);
await publish('earth', open('earth-day.jpg'), 2048, 512);
await open('earth-night.jpg').resize(1024, 512, { fit: 'fill', kernel: 'lanczos3' }).jpeg({ quality: 78, mozjpeg: true }).toFile(path.join(solar, 'earth-night.jpg'));
for (const [body, source] of [['mercury', 'mercury.jpg'], ['venus', 'venus.jpg'], ['mars', 'mars.jpg'], ['earth', 'earth-day.jpg']]) {
  record(`${body}.jpg`, body, source, 'Resized to 2048 by 1024');
  record(`${body}-s.jpg`, body, source, 'Resized to 512 by 256');
}
record('earth-night.jpg', 'earthNight', 'earth-night.jpg', 'Resized to 1024 by 512');

// ---- Giant planets ----
for (const body of ['jupiter', 'saturn']) {
  const img = await rgb(`${body}.tif`);
  const filled = fillPolarGaps(img);
  await publish(body, fromRaw(img), 2048, 512);
  const edit = `Resized. ${(filled * 100).toFixed(1)}% of the map had no data, mostly polar, and was filled from the nearest observed latitude`;
  record(`${body}.jpg`, body, `${body}.tif`, edit);
  record(`${body}-s.jpg`, body, `${body}.tif`, edit);
  console.log(body, 'filled', (filled * 100).toFixed(1), '%');
}
for (const [body, tint] of [['uranus', [188, 226, 230]], ['neptune', [146, 190, 226]]]) {
  const { img, unseen } = iceGiantBands(await rgb(`${body}.tif`), tint);
  await publish(body, fromRaw(img), 512, 512);
  fs.rmSync(path.join(solar, `${body}-s.jpg`));
  record(`${body}.jpg`, body, `${body}.tif`, `Brightness by latitude from the map's median at each latitude. ${Math.round(unseen * 100)}% of latitudes were not observed and repeat the nearest observed one. Colour set to the planet's pale overall colour, approximately, not taken from the filter composite`);
  console.log(body, 'unseen', (unseen * 100).toFixed(0), '%');
}

// ---- Galilean moons ----
for (const body of ['io', 'europa', 'ganymede', 'callisto']) {
  await open(`${body}.jpg`).resize(1024, 512, { fit: 'fill', kernel: 'lanczos3' }).jpeg({ quality: 76, mozjpeg: true }).toFile(path.join(solar, `${body}.jpg`));
  record(`${body}.jpg`, body, `${body}.jpg`, 'Resized to 1024 by 512');
}

// ---- The Moon ----
await open('moon-color-8k.tif').resize(2048, 1024, { kernel: 'lanczos3' }).jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(moon, 'moon-base.jpg'));
await open('moon-color-8k.tif').resize(512, 256, { kernel: 'lanczos3' }).jpeg({ quality: 78, mozjpeg: true }).toFile(path.join(moon, 'moon-s.jpg'));
record('moon/moon-base.jpg', 'moon', 'moon-color-8k.tif', 'Resized to 2048 by 1024. Offline base map');
record('moon/moon-s.jpg', 'moon', 'moon-color-8k.tif', 'Resized to 512 by 256');

// Tiles, each with a 2 pixel gutter so linear filtering never shows a seam.
const TILE = 512, GUTTER = 2, LEVELS = [{ level: 1, width: 4096 }, { level: 2, width: 8192 }];
const entries = [], blobs = [];
for (const { level, width } of LEVELS) {
  const height = width / 2, cols = width / TILE, rows = height / TILE;
  const sized = width === 8192 ? await open('moon-color-8k.tif').removeAlpha().raw().toBuffer() : await open('moon-color-8k.tif').resize(width, height, { kernel: 'lanczos3' }).removeAlpha().raw().toBuffer();
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const tile = Buffer.alloc((TILE + 2 * GUTTER) ** 2 * 3);
      for (let y = 0; y < TILE + 2 * GUTTER; y++) {
        const sy = Math.max(0, Math.min(height - 1, row * TILE + y - GUTTER));
        for (let x = 0; x < TILE + 2 * GUTTER; x++) {
          const sx = (col * TILE + x - GUTTER + width) % width;
          sized.copy(tile, (y * (TILE + 2 * GUTTER) + x) * 3, (sy * width + sx) * 3, (sy * width + sx) * 3 + 3);
        }
      }
      const jpeg = await sharp(tile, { raw: { width: TILE + 2 * GUTTER, height: TILE + 2 * GUTTER, channels: 3 } }).jpeg({ quality: 72, mozjpeg: true }).toBuffer();
      entries.push({ level, col, row, bytes: jpeg.length, crc: crc32(jpeg) });
      blobs.push(jpeg);
    }
  }
}
const HEADER = 16, ENTRY = 12;
let offset = HEADER + entries.length * ENTRY;
const head = Buffer.alloc(offset);
head.write('SKM1', 0, 'latin1');
head.writeUInt32LE(1, 4); head.writeUInt32LE(entries.length, 8); head.writeUInt32LE(TILE + 2 * GUTTER, 12);
entries.forEach((e, i) => {
  head.writeUInt32LE(offset, HEADER + i * ENTRY); head.writeUInt32LE(e.bytes, HEADER + i * ENTRY + 4); head.writeUInt32LE(e.crc, HEADER + i * ENTRY + 8);
  offset += e.bytes;
});
fs.writeFileSync(path.join(moon, 'moon-tiles-v1.db'), Buffer.concat([head, ...blobs]));
record('moon/moon-tiles-v1.db', 'moon', 'moon-color-8k.tif', '32 tiles at 4K and 128 tiles at 8K, each with a 2 pixel gutter, JPEG quality 72');

// Elevation. The file is an uncompressed 16-bit TIFF, read directly so nothing rescales it.
const tif = fs.readFileSync(path.join(src, 'moon-dem-4ppd.tif'));
const le = tif.toString('latin1', 0, 2) === 'II';
const u16 = (o) => (le ? tif.readUInt16LE(o) : tif.readUInt16BE(o)), u32 = (o) => (le ? tif.readUInt32LE(o) : tif.readUInt32BE(o));
const ifd = u32(4), tags = {};
for (let i = 0; i < u16(ifd); i++) {
  const o = ifd + 2 + i * 12, type = u16(o + 2), count = u32(o + 4);
  tags[u16(o)] = { type, count, value: type === 3 && count === 1 ? u16(o + 8) : u32(o + 8) };
}
if (tags[259].value !== 1 || tags[258].value !== 16) throw new Error('unexpected elevation format');
const demW = tags[256].value, demH = tags[257].value, strips = tags[273], stripRows = tags[278].value;
const dem = new Float32Array(demW * demH);
for (let s = 0, y = 0; y < demH; s++, y += stripRows) {
  const start = strips.count === 1 ? strips.value : u32(strips.value + s * 4);
  for (let r = 0; r < Math.min(stripRows, demH - y); r++) for (let x = 0; x < demW; x++) dem[(y + r) * demW + x] = (u16(start + (r * demW + x) * 2) - 20000) / 2000;
}
let low = Infinity, high = -Infinity;
for (const v of dem) { if (v < low) low = v; if (v > high) high = v; }
console.log('elevation km', low.toFixed(2), high.toFixed(2));
// 16-bit metres at half resolution for reading a value, 8-bit for the shader's relief.
const w2 = demW / 2, h2 = demH / 2, ints = Buffer.alloc(w2 * h2 * 2);
for (let y = 0; y < h2; y++) for (let x = 0; x < w2; x++) {
  const i = y * 2 * demW + x * 2;
  ints.writeInt16LE(Math.round(((dem[i] + dem[i + 1] + dem[i + demW] + dem[i + demW + 1]) / 4) * 1000), (y * w2 + x) * 2);
}
fs.writeFileSync(path.join(moon, 'moon-dem-v1.db'), ints);
const gray = Buffer.alloc(demW * demH);
const LOW = -11, HIGH = 11;
for (let i = 0; i < dem.length; i++) gray[i] = Math.round(((dem[i] - LOW) / (HIGH - LOW)) * 255);
await sharp(gray, { raw: { width: demW, height: demH, channels: 1 } }).jpeg({ quality: 88 }).toFile(path.join(moon, 'moon-relief.jpg'));
record('moon/moon-dem-v1.db', 'moon', 'moon-dem-4ppd.tif', 'Averaged to 2 pixels a degree, Int16 metres from 1737.4 km, row 0 at the north pole');
record('moon/moon-relief.jpg', 'moon', 'moon-dem-4ppd.tif', 'Elevation -11 to +11 km mapped to 8-bit grey');

// Named features.
const dbf = fs.readFileSync(path.join(src, 'nom', 'MOON_nomenclature_center_pts.dbf'));
const count = dbf.readUInt32LE(4), headerLength = dbf.readUInt16LE(8), recordLength = dbf.readUInt16LE(10), fields = [];
for (let o = 32; dbf[o] !== 0x0d; o += 32) fields.push({ name: dbf.toString('latin1', o, o + 11).replace(/\0.*/, ''), length: dbf[o + 16] });
const features = [];
for (let i = 0; i < count; i++) {
  let at = headerLength + i * recordLength + 1;
  const r = {};
  for (const f of fields) { r[f.name] = dbf.toString('utf8', at, at + f.length).trim(); at += f.length; }
  if (r.approval !== 'Adopted by IAU') continue;
  const lon = Number(r.center_lon) > 180 ? Number(r.center_lon) - 360 : Number(r.center_lon);
  const satellite = r.code === 'SF';
  features.push([r.clean_name, r.code, Math.round(Number(r.center_lat) * 1000) / 1000, Math.round(lon * 1000) / 1000, Math.round(Number(r.diameter) * 10) / 10, satellite ? 0 : r.origin.replace(/\s+/g, ' ').trim(), Number(r.link.split('/').pop())]);
}
features.sort((a, b) => b[4] - a[4]);
// Escaped to pure ASCII, so the app needs no text decoder to read it.
const json = [...JSON.stringify(features)].map((c) => (c.charCodeAt(0) < 128 ? c : `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`)).join('');
fs.writeFileSync(path.join(moon, 'moon-features-v1.db'), json);
const nomenclature = sources['moon-nomenclature.zip'];
const featureBytes = fs.readFileSync(path.join(moon, 'moon-features-v1.db'));
records.push({ file: 'assets/moon/moon-features-v1.db', bytes: featureBytes.length, sha256: crypto.createHash('sha256').update(featureBytes).digest('hex'), body: 'moon', sourceUrl: nomenclature.url, sourceSha256: nomenclature.sha256, retrievedUtc: nomenclature.retrievedUtc, edits: `${features.length} IAU-adopted features. Name, code, latitude, longitude converted to -180..180 east, diameter, origin, feature ID`, license: 'Public domain', licenseUrl: 'https://planetarynames.wr.usgs.gov/Page/FAQ', credit: 'Gazetteer of Planetary Nomenclature, IAU WGPSN, USGS Astrogeology Science Center', longitude: 'Planetocentric, east positive' });

fs.writeFileSync(path.join(solar, 'provenance.json'), JSON.stringify({ builtUtc: new Date().toISOString(), files: records }, null, 2));
const total = records.reduce((s, r) => s + r.bytes, 0);
console.log({ files: records.length, totalMB: +(total / 1e6).toFixed(2), tilesMB: +(fs.statSync(path.join(moon, 'moon-tiles-v1.db')).size / 1e6).toFixed(2), features: features.length });
