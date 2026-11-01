// The catalog, ported from SkyCatalog/Catalog.swift. Object IDs keep the Swift format
// ("star:27989", "body:mars", "con:Ori", "dso:M31") so saved data stays compatible.
import { ALL_BODIES, BodyId, bodyName, constellationOf, DEG, Equatorial, Vec3 } from '../astronomy/core';
import raw from './generated/catalog.json';
import editorial from './generated/editorial.json';
import { STAR_COUNT, STAR_RECORD, STARS_B64 } from './generated/stars';

export type ObjectType =
  | 'star' | 'planet' | 'moon' | 'sun' | 'constellation' | 'galaxy' | 'nebula' | 'openCluster' | 'globularCluster'
  | 'planetaryNebula' | 'supernovaRemnant' | 'clusterNebula' | 'starCloud' | 'asterism' | 'doubleStar';

export const TYPE_NAMES: Record<ObjectType, string> = {
  star: 'Star', planet: 'Planet', moon: 'Moon', sun: 'Star', constellation: 'Constellation', galaxy: 'Galaxy',
  nebula: 'Nebula', openCluster: 'Open Cluster', globularCluster: 'Globular Cluster', planetaryNebula: 'Planetary Nebula',
  supernovaRemnant: 'Supernova Remnant', clusterNebula: 'Cluster with Nebula', starCloud: 'Star Cloud', asterism: 'Asterism', doubleStar: 'Double Star',
};

const DEEP_TYPES = new Set<ObjectType>(['galaxy', 'nebula', 'openCluster', 'globularCluster', 'planetaryNebula', 'supernovaRemnant', 'clusterNebula', 'starCloud', 'asterism', 'doubleStar']);
export const isDeepSkyType = (t: ObjectType) => DEEP_TYPES.has(t);

export interface StarProperties {
  hip: number;
  spectralType: string | null;
  colorIndex: number | null;
  parallaxMas: number | null;
  bayer: string | null;
  flamsteed: string | null;
  hr: number | null;
  hd: number | null;
}

export interface DeepSkyProperties {
  messier: number | null;
  ngc: string | null;
  /** Arcminutes. */
  majorAxis: number | null;
  minorAxis: number | null;
  distanceLy: number | null;
}

export interface SkyObject {
  id: string;
  type: ObjectType;
  name: string;
  designations: string[];
  /** J2000. Null for moving objects. */
  position: Equatorial | null;
  magnitude: number | null;
  star?: StarProperties;
  deepSky?: DeepSkyProperties;
}

export interface ConstellationData {
  id: string;
  name: string;
  genitive: string;
  lines: number[][];
  center: [number, number];
}

export const bodyIdOf = (id: string): BodyId | null => (id.startsWith('body:') ? (id.slice(5) as BodyId) : null);

// ---- Stars ----

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function decodeBase64(s: string): Uint8Array {
  const table = new Uint8Array(128);
  for (let i = 0; i < 64; i++) table[B64.charCodeAt(i)] = i;
  let len = (s.length * 3) >> 2;
  if (s[s.length - 1] === '=') len--;
  if (s[s.length - 2] === '=') len--;
  const out = new Uint8Array(len);
  let p = 0;
  for (let i = 0; i < s.length; i += 4) {
    const a = table[s.charCodeAt(i)], b = table[s.charCodeAt(i + 1)], c = table[s.charCodeAt(i + 2)], d = table[s.charCodeAt(i + 3)];
    out[p++] = (a << 2) | (b >> 4);
    if (p < len) out[p++] = ((b & 15) << 4) | (c >> 2);
    if (p < len) out[p++] = ((c & 3) << 6) | d;
  }
  return out;
}

export interface StarTable {
  count: number;
  hip: Uint32Array;
  ra: Float32Array;
  dec: Float32Array;
  pmRA: Float32Array;
  pmDec: Float32Array;
  parallax: Float32Array;
  mag: Float32Array;
  /** NaN where not measured. */
  bv: Float32Array;
  indexByHip: Map<number, number>;
}

let starTable: StarTable | null = null;

/** Sorted brightest first, like the Swift table. */
export function stars(): StarTable {
  if (starTable) return starTable;
  const bytes = decodeBase64(STARS_B64);
  const v = new DataView(bytes.buffer);
  const n = STAR_COUNT;
  const t: StarTable = {
    count: n, hip: new Uint32Array(n), ra: new Float32Array(n), dec: new Float32Array(n), pmRA: new Float32Array(n),
    pmDec: new Float32Array(n), parallax: new Float32Array(n), mag: new Float32Array(n), bv: new Float32Array(n), indexByHip: new Map(),
  };
  for (let i = 0; i < n; i++) {
    const o = i * STAR_RECORD;
    t.hip[i] = v.getUint32(o, true);
    t.ra[i] = v.getFloat32(o + 4, true);
    t.dec[i] = v.getFloat32(o + 8, true);
    t.pmRA[i] = v.getFloat32(o + 12, true);
    t.pmDec[i] = v.getFloat32(o + 16, true);
    t.parallax[i] = v.getFloat32(o + 20, true);
    t.mag[i] = v.getInt16(o + 24, true) / 100;
    const c = v.getInt16(o + 26, true);
    t.bv[i] = c === -32768 ? NaN : c / 1000;
    t.indexByHip.set(t.hip[i], i);
  }
  starTable = t;
  return t;
}

/** J2000 unit vector with linear proper motion applied. */
export function starDirection(t: StarTable, i: number, years: number): Vec3 {
  const a = t.ra[i] * DEG, d = t.dec[i] * DEG;
  const sa = Math.sin(a), ca = Math.cos(a), sd = Math.sin(d), cd = Math.cos(d);
  const scale = ((years / 3_600_000) * Math.PI) / 180;
  const e = t.pmRA[i] * scale, n = t.pmDec[i] * scale;
  const x = cd * ca - sa * e - sd * ca * n;
  const y = cd * sa + ca * e - sd * sa * n;
  const z = sd + cd * n;
  const l = Math.hypot(x, y, z);
  return [x / l, y / l, z / l];
}

/** Effective temperature (Ballesteros 2012), then Tanner Helland's Planckian fit. */
export function starColor(bv: number): [number, number, number] {
  const c = Math.max(-0.4, Math.min(2, Number.isNaN(bv) ? 0.6 : bv));
  const t = (4600 * (1 / (0.92 * c + 1.7) + 1 / (0.92 * c + 0.62))) / 100;
  const r = t <= 66 ? 255 : 329.698727446 * Math.pow(t - 60, -0.1332047592);
  const g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * Math.pow(t - 60, -0.0755148492);
  const b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  const f = (v: number) => Math.max(0, Math.min(255, v)) / 255;
  return [f(r), f(g), f(b)];
}

const colorName = (bv: number) => (bv < 0 ? 'blue-white' : bv < 0.3 ? 'white' : bv < 0.6 ? 'yellow-white' : bv < 0.85 ? 'yellow' : bv < 1.3 ? 'orange' : 'red-orange');

// ---- Lookups ----

type Meta = { name: string | null; bayer: string | null; flamsteed: string | null; hr: number | null; hd: number | null; spectral: string | null };
const starMeta = new Map<number, Meta>();
for (const r of raw.starMeta as (string | number)[][]) {
  starMeta.set(r[0] as number, {
    name: (r[1] as string) || null, bayer: (r[2] as string) || null, flamsteed: (r[3] as string) || null,
    hr: (r[4] as number) || null, hd: (r[5] as number) || null, spectral: (r[6] as string) || null,
  });
}

export const constellations = raw.constellations as ConstellationData[];
const constellationById = new Map(constellations.map((c) => [c.id, c]));
export const constellationName = (id: string | null) => (id ? constellationById.get(id)?.name ?? null : null);
export const constellation = (id: string) => constellationById.get(id) ?? null;

type DeepEditorial = { name?: string; note?: string; distanceLy?: number };
const deepEditorial = editorial.deepSky as Record<string, DeepEditorial>;
const starEditorial = editorial.stars as Record<string, { name?: string; note?: string; distanceLy?: number }>;

export const deepSky: SkyObject[] = (raw.deepSky as (string | number | null)[][]).map((f) => {
  const id = f[0] as string;
  const note = deepEditorial[id];
  const ngc = (f[2] as string) || null;
  const designations: string[] = [];
  if (id.startsWith('M') && ngc) designations.push(ngc);
  if (note?.name) designations.push(id);
  return {
    id: `dso:${id}`,
    type: f[3] as ObjectType,
    name: note?.name ?? id,
    designations,
    position: { raHours: (f[4] as number) / 15, decDeg: f[5] as number },
    magnitude: f[6] as number | null,
    deepSky: { messier: (f[1] as number) || null, ngc, majorAxis: f[7] as number | null, minorAxis: f[8] as number | null, distanceLy: note?.distanceLy ?? null },
  };
});
const deepById = new Map(deepSky.map((d) => [d.id, d]));

export function bodyObject(b: BodyId): SkyObject {
  return { id: `body:${b}`, type: b === 'sun' ? 'sun' : b === 'moon' ? 'moon' : 'planet', name: bodyName(b), designations: [], position: null, magnitude: null };
}

export function constellationObject(c: ConstellationData): SkyObject {
  return { id: `con:${c.id}`, type: 'constellation', name: c.name, designations: [c.id, c.genitive], position: { raHours: c.center[0] / 15, decDeg: c.center[1] }, magnitude: null };
}

export function starObject(hip: number): SkyObject | null {
  const t = stars();
  const i = t.indexByHip.get(hip);
  if (i === undefined) return null;
  const m = starMeta.get(hip);
  const labels: string[] = [];
  if (m?.name && m.bayer) labels.push(m.bayer);
  if (m?.flamsteed) labels.push(m.flamsteed);
  if (m?.hr) labels.push(`HR ${m.hr}`);
  if (m?.hd) labels.push(`HD ${m.hd}`);
  labels.push(`HIP ${hip}`);
  const primary = m?.name ?? m?.bayer ?? m?.flamsteed ?? `HIP ${hip}`;
  return {
    id: `star:${hip}`, type: 'star', name: primary, designations: labels.filter((l) => l !== primary),
    position: { raHours: t.ra[i] / 15, decDeg: t.dec[i] },
    magnitude: Math.round(t.mag[i] * 100) / 100,
    star: {
      hip, spectralType: m?.spectral ?? null, colorIndex: Number.isNaN(t.bv[i]) ? null : t.bv[i],
      parallaxMas: t.parallax[i] > 0 ? t.parallax[i] : null, bayer: m?.bayer ?? null, flamsteed: m?.flamsteed ?? null, hr: m?.hr ?? null, hd: m?.hd ?? null,
    },
  };
}

export function object(id: string): SkyObject | null {
  if (id.startsWith('star:')) return starObject(Number(id.slice(5)));
  if (id.startsWith('body:')) return ALL_BODIES.includes(id.slice(5) as BodyId) ? bodyObject(id.slice(5) as BodyId) : null;
  if (id.startsWith('con:')) { const c = constellation(id.slice(4)); return c ? constellationObject(c) : null; }
  return deepById.get(id) ?? null;
}

export const properName = (hip: number) => starMeta.get(hip)?.name ?? null;

let named: number[] | null = null;
/** Hipparcos numbers of named stars, brightest first. */
export function namedStars(limit = Infinity): number[] {
  if (!named) {
    const t = stars();
    named = [...starMeta.entries()].filter(([h, m]) => m.name && t.indexByHip.has(h)).map(([h]) => h)
      .sort((a, b) => t.mag[t.indexByHip.get(a)!] - t.mag[t.indexByHip.get(b)!]);
  }
  return named.slice(0, limit === Infinity ? undefined : limit);
}

export const messier = () => deepSky.filter((d) => d.deepSky?.messier).sort((a, b) => a.deepSky!.messier! - b.deepSky!.messier!);

export interface BodyEditorial { summary: string; learn: string; facts: { label: string; value: string }[]; observing: string }
export const bodyEditorial = (b: BodyId) => (editorial.bodies as Record<string, BodyEditorial>)[b] ?? null;
export const constellationMeaning = (id: string) => (editorial.constellations as Record<string, string>)[id] ?? null;

export function objectNote(o: SkyObject): string | null {
  if (o.star) return starEditorial[String(o.star.hip)]?.note ?? null;
  if (o.deepSky) return deepEditorial[o.id.slice(4)]?.note ?? null;
  return null;
}

/** Distance in light-years, or null when unknown. Below 2 mas Hipparcos is unreliable. */
export function distanceLightYears(o: SkyObject): number | null {
  if (o.deepSky) return o.deepSky.distanceLy;
  if (o.star) {
    const curated = starEditorial[String(o.star.hip)]?.distanceLy;
    if (curated) return curated;
    const p = o.star.parallaxMas;
    return p !== null && p >= 2 ? 3261.56 / p : null;
  }
  return null;
}

function luminosity(type: string): string | null {
  const t = type.toUpperCase();
  if (t.includes('IA') || t.includes('IB')) return 'supergiant';
  if (t.includes('III')) return 'giant';
  if (t.includes('IV')) return 'subgiant';
  if (t.includes('II')) return 'bright giant';
  if (t.includes('V')) return 'main-sequence star';
  return null;
}

/** Sentences built only from measured catalog values, for objects with no curated note. */
export function describeObject(o: SkyObject): string {
  const place = o.position ? constellationName(constellationOf(o.position)) : null;
  if (o.star) {
    const color = o.star.colorIndex !== null ? colorName(o.star.colorIndex) : null;
    const kind = (o.star.spectralType && luminosity(o.star.spectralType)) || 'star';
    let text = `A ${color ? `${color} ` : ''}${kind}`;
    if (place) text += ` in ${place}`;
    const d = distanceLightYears(o);
    if (d) text += `, about ${Math.round(d).toLocaleString('en-US')} light-years away`;
    return `${text}.`;
  }
  if (isDeepSkyType(o.type)) {
    const name = TYPE_NAMES[o.type];
    let text = `${'AEIOU'.includes(name[0]) ? 'An' : 'A'} ${name.toLowerCase()}`;
    if (place) text += ` in ${place}`;
    if (o.magnitude !== null) text += `, magnitude ${o.magnitude.toFixed(1)}`;
    if (o.deepSky?.majorAxis) text += `, ${(o.deepSky.majorAxis / 60).toFixed(1)}° across`;
    return `${text}.`;
  }
  return TYPE_NAMES[o.type];
}

export const starMetaEntries = () => starMeta.entries();
export const genitiveOf = (id: string) => constellationById.get(id)?.genitive ?? null;
