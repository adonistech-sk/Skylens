// The catalog as the artwork tools see it. Every figure is drawn in a star's-eye plane: a
// stereographic plane touching the sky at the figure's centre, so a shape drawn here keeps
// its proportions on the sky. Stars are read from the app's own generated catalog and are
// never typed in by hand.
// Plane units are degrees at the centre. +x is to the right and +y is north, as the sky
// looks from the ground with north up, so west is to the right.
import fs from 'node:fs';

const root = new URL('../../src/data/generated/', import.meta.url);
const catalog = JSON.parse(fs.readFileSync(new URL('catalog.json', root), 'utf8'));
const DEG = Math.PI / 180;

function readStars() {
  const source = fs.readFileSync(new URL('stars.ts', root), 'utf8');
  const count = Number(source.match(/STAR_COUNT\s*=\s*(\d+)/)[1]);
  const record = Number(source.match(/STAR_RECORD\s*=\s*(\d+)/)[1]);
  const b64 = source.match(/STARS_B64\s*=\s*['"`]([^'"`]+)['"`]/)[1];
  const bytes = Buffer.from(b64, 'base64');
  const out = new Map();
  for (let i = 0; i < count; i++) {
    const o = i * record;
    const hip = bytes.readUInt32LE(o);
    out.set(hip, { hip, ra: bytes.readFloatLE(o + 4), dec: bytes.readFloatLE(o + 8), mag: bytes.readInt16LE(o + 24) / 100 });
  }
  return out;
}

const table = readStars();
const meta = new Map(catalog.starMeta.map((r) => [r[0], { name: r[1] || null, bayer: r[2] || null, flamsteed: r[3] || null }]));

const vector = (ra, dec) => {
  const a = ra * DEG, d = dec * DEG;
  return [Math.cos(d) * Math.cos(a), Math.cos(d) * Math.sin(a), Math.sin(d)];
};
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const normalize = (v) => { const l = Math.hypot(...v); return v.map((c) => c / l); };

/** Tangent basis at a centre: east along rising right ascension, north toward the pole. */
export function planeBasis(ra, dec) {
  const c = vector(ra, dec);
  const east = normalize([-c[1], c[0], 0]);
  const north = [c[1] * east[2] - c[2] * east[1], c[2] * east[0] - c[0] * east[2], c[0] * east[1] - c[1] * east[0]];
  return { c, east, north };
}

export function toPlane(basis, v) {
  const k = 2 / (1 + dot(v, basis.c));
  return [-dot(v, basis.east) * k / DEG, dot(v, basis.north) * k / DEG];
}

/** The mean direction of a figure's stars, which is where its plane touches the sky. */
function figureCentre(hips) {
  const sum = [0, 0, 0];
  for (const h of hips) { const s = table.get(h); const v = vector(s.ra, s.dec); sum[0] += v[0]; sum[1] += v[1]; sum[2] += v[2]; }
  const v = normalize(sum);
  let ra = Math.atan2(v[1], v[0]) / DEG;
  if (ra < 0) ra += 360;
  return [ra, Math.asin(v[2]) / DEG];
}

export const constellationIds = () => catalog.constellations.map((c) => c.id);

/** A constellation laid out in its plane: stars by name and number, and the figure's lines. */
export function constellationPlane(id) {
  const c = catalog.constellations.find((x) => x.id === id);
  if (!c) throw new Error(`no constellation ${id}`);
  const hips = [...new Set(c.lines.flat())];
  const centre = figureCentre(hips);
  const basis = planeBasis(centre[0], centre[1]);
  const stars = hips.map((hip) => {
    const s = table.get(hip), m = meta.get(hip);
    const [x, y] = toPlane(basis, vector(s.ra, s.dec));
    return { hip, x, y, mag: s.mag, name: m?.name ?? null, bayer: m?.bayer ?? null };
  });
  const byHip = new Map(stars.map((s) => [s.hip, s]));
  return { id, name: c.name, genitive: c.genitive, centre, basis, stars, byHip, lines: c.lines };
}

/** Any catalog star in a figure's plane, for stars that sit outside its lines. */
export function starInPlane(plane, hip) {
  const s = table.get(hip);
  if (!s) throw new Error(`no star HIP ${hip}`);
  return toPlane(plane.basis, vector(s.ra, s.dec));
}

/** Catalog stars around a figure, for the drawing sheets. */
export function fieldStars(plane, radius, limit = 4.8) {
  const out = [];
  for (const s of table.values()) {
    if (s.mag > limit) continue;
    const v = vector(s.ra, s.dec);
    if (dot(v, plane.basis.c) < Math.cos(radius * DEG)) continue;
    const [x, y] = toPlane(plane.basis, v);
    out.push({ hip: s.hip, x, y, mag: s.mag, name: meta.get(s.hip)?.name ?? null });
  }
  return out;
}
