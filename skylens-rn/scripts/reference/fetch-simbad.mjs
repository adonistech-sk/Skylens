// Freezes reference J2000 coordinates from SIMBAD (CDS) for stars and deep-sky objects that
// the app ships, so the catalog is checked against an independent source rather than its own
// build. Test data only: nothing from SIMBAD is bundled into the app.
// usage: node scripts/reference/fetch-simbad.mjs
import crypto from 'node:crypto';
import fs from 'node:fs';

const res = new URL('../../../Packages/SkyLensKit/Sources/SkyCatalog/Resources/', import.meta.url);
const bin = fs.readFileSync(new URL('stars.bin', res));
const n = bin.readUInt32LE(4), RECORD = 28;

// The brightest stars, the highest proper motions, the poles of the sky and a seeded spread
// over the whole magnitude range, including stars only the deep pack carries.
const stars = [];
for (let i = 0; i < n; i++) {
  const o = 8 + i * RECORD;
  stars.push({ hip: bin.readUInt32LE(o), ra: bin.readFloatLE(o + 4), dec: bin.readFloatLE(o + 8), pmRA: bin.readFloatLE(o + 12), pmDec: bin.readFloatLE(o + 16), mag: bin.readInt16LE(o + 24) / 100 });
}
const chosen = new Map();
const take = (s) => chosen.set(s.hip, s);
stars.slice(0, 60).forEach(take);
[...stars].sort((a, b) => Math.hypot(b.pmRA, b.pmDec) - Math.hypot(a.pmRA, a.pmDec)).slice(0, 25).forEach(take);
[...stars].sort((a, b) => Math.abs(b.dec) - Math.abs(a.dec)).slice(0, 15).forEach(take);
let seed = 20261101;
const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; };
for (let i = 0; i < 300; i++) take(stars[Math.floor(rand() * stars.length)]);

const deep = fs.readFileSync(new URL('deepsky.tsv', res), 'utf8').trim().split('\n').map((l) => l.split('\t'));
const deepIds = deep.filter((f) => f[1]).map((f) => ({ id: f[0], name: `M ${f[1]}` }));

async function tap(query) {
  const body = new URLSearchParams({ request: 'doQuery', lang: 'adql', format: 'json', query });
  const r = await fetch('https://simbad.harvard.edu/simbad/sim-tap/sync', { method: 'POST', body });
  const raw = await r.text();
  if (!r.ok) throw new Error(`${r.status}: ${raw.slice(0, 300)}`);
  return { json: JSON.parse(raw), sha256: crypto.createHash('sha256').update(raw).digest('hex') };
}

const sources = [];
const starRows = [];
const list = [...chosen.keys()];
for (let i = 0; i < list.length; i += 120) {
  const ids = list.slice(i, i + 120).map((h) => `'HIP ${h}'`).join(',');
  const { json, sha256 } = await tap(`SELECT i.id, b.ra, b.dec, b.pmra, b.pmdec FROM ident AS i JOIN basic AS b ON i.oidref = b.oid WHERE i.id IN (${ids})`);
  sources.push({ sha256, rows: json.data.length });
  for (const r of json.data) starRows.push({ hip: Number(String(r[0]).replace('HIP', '').trim()), ra: r[1], dec: r[2], pmRA: r[3], pmDec: r[4] });
  await new Promise((d) => setTimeout(d, 600));
}
const { json, sha256 } = await tap(`SELECT i.id, b.ra, b.dec FROM ident AS i JOIN basic AS b ON i.oidref = b.oid WHERE i.id IN (${deepIds.map((d) => `'${d.name}'`).join(',')})`);
sources.push({ sha256, rows: json.data.length });
const deepRows = json.data.map((r) => ({ id: String(r[0]).replace(/\s+/g, ''), ra: r[1], dec: r[2] }));

const out = new URL('../../tests/fixtures/simbad-v1.json', import.meta.url);
fs.writeFileSync(out, JSON.stringify({ source: 'SIMBAD, CDS Strasbourg, through the simbad.harvard.edu mirror, TAP sync', frame: 'ICRS, epoch J2000', retrievedUtc: new Date().toISOString(), sources, stars: starRows, deepSky: deepRows }));
console.log({ requested: chosen.size, stars: starRows.length, deep: deepRows.length, of: deepIds.length });
