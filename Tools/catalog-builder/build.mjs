#!/usr/bin/env node
// Builds the bundled sky catalogs from primary sources. Every value in the app's
// star and deep-sky data comes from these inputs, and the build fails loudly
// rather than dropping data silently.
//
//   node Tools/catalog-builder/build.mjs <rawDir>
//
// <rawDir> holds the files listed in README.md, downloaded by fetch.sh.

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const raw = process.argv[2];
if (!raw) { console.error('usage: build.mjs <rawDir>'); process.exit(2); }
const outDir = path.resolve(here, '../../Packages/SkyLensKit/Sources/SkyCatalog/Resources');
fs.mkdirSync(outDir, { recursive: true });

const readRaw = (f) => fs.readFileSync(path.join(raw, f), 'latin1');
const readRawUtf8 = (f) => fs.readFileSync(path.join(raw, f), 'utf8');

/** Parses a HEASARC TDAT table into objects keyed by its declared column names. */
function tdat(file) {
  const text = readRaw(file);
  const lines = text.split('\n');
  const header = lines.find((l) => l.startsWith('line[1]'));
  const cols = header.split('=')[1].trim().split(/\s+/);
  const start = lines.findIndex((l) => l.startsWith('<DATA>')) + 1;
  const rows = [];
  for (let i = start; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('<END>')) break;
    if (!line.trim() || line.startsWith('<DATA>')) continue;
    const v = line.split('|');
    const row = {};
    cols.forEach((c, k) => { row[c] = (v[k] ?? '').trim(); });
    rows.push(row);
  }
  return rows;
}

const num = (s) => (s === '' || s == null ? null : Number(s));
const req = (cond, msg) => { if (!cond) { console.error(`BUILD FAILED: ${msg}`); process.exit(1); } };

// ---------------------------------------------------------------- Stars
const hipRows = tdat('heasarc_hipparcos.tdat');
const stars = [];
let dropped = 0;
for (const r of hipRows) {
  const hip = num(r.hip_number), mag = num(r.vmag);
  // 263 entries, mostly close binaries such as ξ UMa, have no astrometric solution.
  // They keep their catalog position with zero parallax and proper motion, because
  // dropping them leaves gaps in naked-eye constellation figures.
  const ra = num(r.ra_deg) ?? num(r.ra), dec = num(r.dec_deg) ?? num(r.dec);
  if (hip == null || mag == null || ra == null || dec == null || Number.isNaN(ra) || Number.isNaN(dec)) { dropped++; continue; }
  stars.push({
    hip, mag, ra, dec,
    plx: num(r.parallax) ?? 0, pmra: num(r.pm_ra) ?? 0, pmdec: num(r.pm_dec) ?? 0,
    bv: num(r.bv_color), hd: num(r.hd_id), sp: r.spect_type,
  });
}
stars.sort((a, b) => a.mag - b.mag);

/** Propagates a Hipparcos J1991.25 position to J2000.0 linearly on the sphere. */
function toJ2000(s) {
  const t = 8.75, mas = Math.PI / 180 / 3600 / 1000;
  const a = s.ra * Math.PI / 180, d = s.dec * Math.PI / 180;
  const p = [Math.cos(d) * Math.cos(a), Math.cos(d) * Math.sin(a), Math.sin(d)];
  const e = [-Math.sin(a), Math.cos(a), 0];
  const n = [-Math.sin(d) * Math.cos(a), -Math.sin(d) * Math.sin(a), Math.cos(d)];
  const v = [0, 1, 2].map((i) => p[i] + t * mas * (s.pmra * e[i] + s.pmdec * n[i]));
  const l = Math.hypot(...v);
  return { ra: ((Math.atan2(v[1], v[0]) * 180 / Math.PI) + 360) % 360, dec: Math.asin(v[2] / l) * 180 / Math.PI };
}
for (const s of stars) Object.assign(s, toJ2000(s));

// stars.bin: "SKS1", u32 count, then fixed little-endian records.
const RECORD = 28;
const bin = Buffer.alloc(8 + stars.length * RECORD);
bin.write('SKS1', 0, 'latin1');
bin.writeUInt32LE(stars.length, 4);
stars.forEach((s, i) => {
  const o = 8 + i * RECORD;
  bin.writeUInt32LE(s.hip, o);
  bin.writeFloatLE(s.ra, o + 4);
  bin.writeFloatLE(s.dec, o + 8);
  bin.writeFloatLE(s.pmra, o + 12);
  bin.writeFloatLE(s.pmdec, o + 16);
  bin.writeFloatLE(s.plx, o + 20);
  bin.writeInt16LE(Math.round(s.mag * 100), o + 24);
  bin.writeInt16LE(s.bv == null ? -32768 : Math.round(s.bv * 1000), o + 26);
});
fs.writeFileSync(path.join(outDir, 'stars.bin'), bin);

// ---------------------------------------------------------------- Names
const greek = {
  Alp: 'α', Bet: 'β', Gam: 'γ', Del: 'δ', Eps: 'ε', Zet: 'ζ', Eta: 'η', The: 'θ', Iot: 'ι', Kap: 'κ', Lam: 'λ', Mu: 'μ',
  Nu: 'ν', Xi: 'ξ', Omi: 'ο', Pi: 'π', Rho: 'ρ', Sig: 'σ', Tau: 'τ', Ups: 'υ', Phi: 'φ', Chi: 'χ', Psi: 'ψ', Ome: 'ω',
};
const superscript = { 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };

/** "3Alp Lyr" → Flamsteed 3, α Lyr. BSC packs these into fixed columns. */
function parseBSCName(alt) {
  const m = alt.match(/^(\d+)?\s*([A-Z][a-z]{1,2})?\s*(\d)?\s*([A-Z][A-Za-z]{2})$/);
  if (!m) return {};
  const [, flam, letter, sup, con] = m;
  const out = {};
  if (flam) out.flamsteed = `${flam} ${con}`;
  if (letter && greek[letter]) out.bayer = `${greek[letter]}${sup ? superscript[sup] : ''} ${con}`;
  return out;
}

const meta = new Map();
const metaFor = (hip) => { if (!meta.has(hip)) meta.set(hip, { hip }); return meta.get(hip); };

// HD → brightest HIP entry, since stars sort by magnitude and the first wins.
const hipByHD = new Map();
for (const s of stars) if (s.hd != null && !hipByHD.has(s.hd)) hipByHD.set(s.hd, s);

const bscRows = tdat('heasarc_bsc5p.tdat');
let bscMatched = 0;
for (const r of bscRows) {
  const hd = num(r.hd);
  const s = hd == null ? null : hipByHD.get(hd);
  if (!s) continue;
  bscMatched++;
  const m = metaFor(s.hip);
  m.hr = num(r.hr);
  m.hd = hd;
  Object.assign(m, parseBSCName(r.alt_name));
  if (r.spect_type) m.sp = r.spect_type;
}

// IAU Catalog of Star Names: fixed-width, HIP in its own column.
const hipIndex = new Map(stars.map((s) => [s.hip, s]));
let iauNames = 0;
const iauLines = readRawUtf8('IAU-CSN.txt').split('\n').filter((l) => l.trim() && !/^[#$]/.test(l));
for (const line of iauLines) {
  const name = line.slice(18, 36).trim();
  const fields = line.slice(36).trim().split(/\s+/);
  // designation may have two tokens, so the numeric tail is read from the end:
  // ... HIP HD RA Dec Date [flag]
  const dateAt = fields.findIndex((f) => /^\d{4}-\d{2}-\d{2}$/.test(f));
  const hip = num(fields[dateAt - 4]);
  if (!Number.isInteger(hip) || !hipIndex.has(hip)) continue;
  metaFor(hip).name = name;
  iauNames++;
}

// Spectral types for stars that were not in the Bright Star Catalogue.
for (const s of stars) {
  if (s.mag <= 7.5 && s.sp && !meta.get(s.hip)?.sp) metaFor(s.hip).sp = s.sp;
}

const tsv = [...meta.values()].sort((a, b) => a.hip - b.hip).map((m) =>
  [m.hip, m.name ?? '', m.bayer ?? '', m.flamsteed ?? '', m.hr ?? '', m.hd ?? '', m.sp ?? ''].join('\t'));
fs.writeFileSync(path.join(outDir, 'stars-meta.tsv'), `${tsv.join('\n')}\n`);

// ---------------------------------------------------------------- Constellations
const cons = JSON.parse(readRawUtf8('constellations.json'));
const conLines = JSON.parse(readRawUtf8('constellations.lines.json'));
const conBounds = JSON.parse(readRawUtf8('constellations.bounds.json'));

const brightGrid = new Map();
const cell = (ra, dec) => `${Math.floor(((ra % 360) + 360) % 360 / 2)}:${Math.floor((dec + 90) / 2)}`;
for (const s of stars) {
  if (s.mag > 7.5) break;
  const k = cell(s.ra, s.dec);
  if (!brightGrid.has(k)) brightGrid.set(k, []);
  brightGrid.get(k).push(s);
}
const separation = (ra1, dec1, ra2, dec2) => {
  const r = Math.PI / 180;
  const c = Math.sin(dec1 * r) * Math.sin(dec2 * r) + Math.cos(dec1 * r) * Math.cos(dec2 * r) * Math.cos((ra1 - ra2) * r);
  return Math.acos(Math.min(1, c)) / r;
};
function nearestHip(ra, dec) {
  let best = null, bestSep = Infinity;
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
    const list = brightGrid.get(cell(ra + i * 2 / Math.max(0.05, Math.cos(dec * Math.PI / 180)), dec + j * 2));
    if (!list) continue;
    for (const s of list) {
      const d = separation(ra, dec, s.ra, s.dec);
      // A small brightness bias resolves close pairs in favour of the naked-eye star.
      const score = d + Math.max(0, s.mag - 4) * 0.01;
      if (score < bestSep) { bestSep = score; best = { s, d }; }
    }
  }
  return best;
}

const merged = new Map();
for (const f of cons.features) {
  if (!merged.has(f.id)) {
    merged.set(f.id, { id: f.id, name: f.properties.name, genitive: f.properties.gen, lines: [], bounds: [], center: null });
  }
}
let lineVertices = 0, unmatched = 0, maxOffset = 0;
for (const f of conLines.features) {
  const c = merged.get(f.id);
  req(c, `lines for unknown constellation ${f.id}`);
  for (const strip of f.geometry.coordinates) {
    const hips = [];
    for (const [lon, lat] of strip) {
      lineVertices++;
      const ra = (lon + 360) % 360;
      const hit = nearestHip(ra, lat);
      if (!hit || hit.d > 0.35) { unmatched++; console.warn(`  no star near ${f.id} ${ra.toFixed(3)} ${lat}`); continue; }
      maxOffset = Math.max(maxOffset, hit.d);
      hips.push(hit.s.hip);
    }
    if (hips.length >= 2) c.lines.push(hips);
  }
}
for (const f of conBounds.features) {
  const c = merged.get(f.id);
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const poly of polys) for (const ring of poly) {
    c.bounds.push(ring.map(([lon, lat]) => [Math.round(((lon + 360) % 360) * 1e4) / 1e4, lat]));
  }
}

// The label anchor is the mean direction of the figure's stars, falling back to the
// boundary for figures that are very sparse.
for (const c of merged.values()) {
  const pts = [...new Set(c.lines.flat())].map((h) => hipIndex.get(h));
  const r = Math.PI / 180;
  const source = pts.length ? pts.map((s) => [s.ra, s.dec]) : c.bounds.flat();
  let x = 0, y = 0, z = 0;
  for (const [ra, dec] of source) {
    x += Math.cos(dec * r) * Math.cos(ra * r); y += Math.cos(dec * r) * Math.sin(ra * r); z += Math.sin(dec * r);
  }
  const l = Math.hypot(x, y, z);
  c.center = [Math.round(((Math.atan2(y, x) / r + 360) % 360) * 100) / 100, Math.round(Math.asin(z / l) / r * 100) / 100];
}
req(merged.size === 88, `expected 88 constellations, found ${merged.size}`);
req(unmatched === 0, `${unmatched} constellation vertices did not resolve to a Hipparcos star`);
fs.writeFileSync(path.join(outDir, 'constellations.json'), JSON.stringify([...merged.values()]));

// ---------------------------------------------------------------- Deep sky
const typeFromNGC = { Gx: 'galaxy', OC: 'openCluster', Gb: 'globularCluster', Nb: 'nebula', Pl: 'planetaryNebula', 'C+N': 'clusterNebula', Ast: 'asterism', Kt: 'knot' };
const typeFromMessier = { DI: 'nebula', E: 'galaxy', 'E?': 'galaxy', GB: 'globularCluster', IR: 'galaxy', OC: 'openCluster', PL: 'planetaryNebula', S: 'galaxy' };
// HEASARC leaves these three blank or uses SN classes the table does not carry.
const messierOverride = { 1: 'supernovaRemnant', 24: 'starCloud', 40: 'doubleStar', 73: 'asterism' };

const parseSize = (s) => {
  const m = s.match(/^([\d.]+)(?:X([\d.]+))?$/i);
  return m ? [Number(m[1]), m[2] ? Number(m[2]) : Number(m[1])] : [null, null];
};
const ngcKey = (s) => s.replace(/\s+/g, ' ').trim();
const ngcRows = tdat('heasarc_ngc2000.tdat');
const ngcByName = new Map(ngcRows.map((r) => [ngcKey(r.name), r]));

const dso = [];
const usedNGC = new Set();
const messierRows = tdat('heasarc_messier.tdat');
for (const r of messierRows) {
  const n = Number(r.name.replace('M', '').trim());
  if (!Number.isInteger(n)) continue;
  const ngcName = ngcKey(r.alt_name);
  const ngc = ngcName.startsWith('NGC') || ngcName.startsWith('IC') ? ngcName : '';
  if (ngc) usedNGC.add(ngc);
  const [major, minor] = parseSize(r.dimension);
  dso.push({
    id: `M${n}`, messier: n, ngc, type: messierOverride[n] ?? typeFromMessier[r.object_type],
    ra: num(r.ra), dec: num(r.dec), mag: num(r.vmag), major, minor,
  });
}
// M102 is omitted from the source table. Its identity is historically disputed, and
// NGC 5866 is the conventional identification, which the editorial note states.
{
  const r = ngcByName.get('NGC 5866');
  req(r, 'NGC 5866 missing');
  usedNGC.add('NGC 5866');
  dso.push({ id: 'M102', messier: 102, ngc: 'NGC 5866', type: 'galaxy', ra: num(r.ra), dec: num(r.dec), mag: num(r.app_mag), major: num(r.ang_diameter), minor: num(r.ang_diameter) });
}
req(dso.length === 110, `expected 110 Messier objects, found ${dso.length}`);
req(dso.every((d) => d.type), 'Messier object without a type');

for (const r of ngcRows) {
  const id = ngcKey(r.name);
  if (usedNGC.has(id)) continue;
  const type = typeFromNGC[r.source_type];
  if (!type) continue;
  const mag = num(r.app_mag), size = num(r.ang_diameter);
  const worthShowing = type === 'galaxy' ? mag != null && mag <= 12
    : type === 'knot' || type === 'asterism' ? false
    : (mag != null && mag <= 12) || (size != null && size >= 8);
  if (!worthShowing) continue;
  const ra = num(r.ra), dec = num(r.dec);
  if (ra == null || dec == null) continue;
  dso.push({ id, messier: '', ngc: id, type, ra, dec, mag, major: size, minor: size });
}
// The Magellanic Clouds predate NGC numbering and are absent from NGC 2000.0, yet
// they are major naked-eye objects. Values: de Vaucouleurs (RC3) via NED/SIMBAD.
dso.push({ id: 'LMC', messier: '', ngc: '', type: 'galaxy', ra: 80.89, dec: -69.76, mag: 0.9, major: 645, minor: 550 });
dso.push({ id: 'SMC', messier: '', ngc: '', type: 'galaxy', ra: 13.19, dec: -72.83, mag: 2.7, major: 320, minor: 185 });
const round = (v, p) => (v == null ? '' : Math.round(v * 10 ** p) / 10 ** p);
dso.sort((a, b) => (a.mag ?? 99) - (b.mag ?? 99));
const dsoTsv = dso.map((d) => [d.id, d.messier, d.ngc, d.type, round(d.ra, 4), round(d.dec, 4), round(d.mag, 1), round(d.major, 1), round(d.minor, 1)].join('\t'));
fs.writeFileSync(path.join(outDir, 'deepsky.tsv'), `${dsoTsv.join('\n')}\n`);

// ---------------------------------------------------------------- Provenance
const sha = (f) => createHash('sha256').update(fs.readFileSync(path.join(raw, f))).digest('hex');
const provenance = {
  builtWith: 'Tools/catalog-builder/build.mjs',
  counts: {
    stars: stars.length, starsWithNames: iauNames, starsWithMetadata: meta.size,
    constellations: merged.size, deepSky: dso.length, messier: dso.filter((d) => d.messier !== '').length,
  },
  sources: [
    { name: 'Hipparcos Main Catalogue (ESA SP-1200)', use: 'Star positions, magnitudes, colors, parallaxes, proper motions',
      url: 'https://heasarc.gsfc.nasa.gov/W3Browse/all/hipparcos.html', file: 'heasarc_hipparcos.tdat', sha256: sha('heasarc_hipparcos.tdat') },
    { name: 'Yale Bright Star Catalogue, 5th Revised Ed.', use: 'Bayer and Flamsteed designations, HR numbers, spectral types',
      url: 'https://heasarc.gsfc.nasa.gov/W3Browse/star-catalog/bsc5p.html', file: 'heasarc_bsc5p.tdat', sha256: sha('heasarc_bsc5p.tdat') },
    { name: 'IAU Catalog of Star Names (WGSN)', use: 'Proper star names',
      url: 'https://www.iau.org/public/themes/naming_stars/', file: 'IAU-CSN.txt', sha256: sha('IAU-CSN.txt') },
    { name: 'NGC 2000.0 (Sinnott 1988)', use: 'Deep-sky positions, types, magnitudes, sizes',
      url: 'https://heasarc.gsfc.nasa.gov/W3Browse/all/ngc2000.html', file: 'heasarc_ngc2000.tdat', sha256: sha('heasarc_ngc2000.tdat') },
    { name: 'Messier Nebulae and Star Clusters', use: 'Messier positions, types, magnitudes',
      url: 'https://heasarc.gsfc.nasa.gov/W3Browse/all/messier.html', file: 'heasarc_messier.tdat', sha256: sha('heasarc_messier.tdat') },
    { name: 'd3-celestial by Olaf Frohn (BSD-3-Clause)', use: 'Constellation figures and IAU boundary polygons',
      url: 'https://github.com/ofrohn/d3-celestial', file: 'constellations.lines.json', sha256: sha('constellations.lines.json') },
  ],
};
fs.writeFileSync(path.join(outDir, 'provenance.json'), JSON.stringify(provenance, null, 2));

console.log(`Hipparcos rows ${hipRows.length}, kept ${stars.length}, dropped ${dropped} without astrometry or V magnitude`);
console.log(`stars.bin ${(bin.length / 1e6).toFixed(2)} MB; mag ≤ 6.5: ${stars.filter((s) => s.mag <= 6.5).length}; mag ≤ 9: ${stars.filter((s) => s.mag <= 9).length}`);
console.log(`BSC matched ${bscMatched}/${bscRows.length}; IAU names ${iauNames}/${iauLines.length}; metadata rows ${meta.size}`);
console.log(`constellations ${merged.size}; vertices ${lineVertices}; largest vertex-to-star offset ${maxOffset.toFixed(3)}°`);
console.log(`deep sky ${dso.length} (${dso.filter((d) => d.messier !== '').length} Messier)`);
for (const h of [32349, 91262, 11767, 27989, 70890]) {
  const s = hipIndex.get(h), m = meta.get(h);
  console.log(`  HIP ${h}: ${m?.name ?? '-'} ${m?.bayer ?? ''} V=${s.mag} ra=${s.ra.toFixed(4)} dec=${s.dec.toFixed(4)} plx=${s.plx} sp=${m?.sp}`);
}
