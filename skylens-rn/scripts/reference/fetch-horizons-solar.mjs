// Freezes JPL Horizons answers for the 3D Solar System and the Moon Atlas: positions in space,
// the satellites, and which way each body faces. The app never calls Horizons.
// usage: node scripts/reference/fetch-horizons-solar.mjs
import crypto from 'node:crypto';
import fs from 'node:fs';

const DATES = ['1900-03-01 00:00', '1999-08-11 11:00', '2027-01-17 20:25', '2027-08-02 10:30', '2100-06-15 00:00'];
const NEAR = ['2000-01-01 12:00', '2025-03-14 06:30', '2026-11-02 00:00', '2027-01-17 20:25', '2035-09-02 02:00', '2050-05-20 12:00'];
const API = 'https://ssd.jpl.nasa.gov/api/horizons.api?';
const sources = [];
let signature = null;

async function ask(params) {
  const url = API + new URLSearchParams({ format: 'json', OBJ_DATA: 'NO', MAKE_EPHEM: 'YES', CSV_FORMAT: 'YES', ...params }).toString();
  const res = await fetch(url);
  const raw = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${raw.slice(0, 200)}`);
  const json = JSON.parse(raw);
  signature = json.signature;
  sources.push({ url, sha256: crypto.createHash('sha256').update(raw).digest('hex') });
  await new Promise((r) => setTimeout(r, 350));
  return json.result;
}

function table(text) {
  const start = text.indexOf('$$SOE'), end = text.indexOf('$$EOE');
  if (start < 0) throw new Error(text.slice(0, 500));
  const head = text.slice(0, start).trim().split('\n').filter((l) => l.includes('Date__(') || l.includes('JDTDB') || l.includes('JDUT')).pop().split(',').map((c) => c.trim());
  return { head, rows: text.slice(start + 5, end).trim().split('\n').map((l) => l.split(',').map((c) => c.trim())) };
}

async function vectors(id, center, plane, dates) {
  const { head, rows } = table(await ask({ COMMAND: `'${id}'`, EPHEM_TYPE: 'VECTORS', CENTER: `'500@${center}'`, REF_PLANE: plane, REF_SYSTEM: 'ICRF', TLIST: dates.map((d) => `'${d}'`).join(','), VEC_TABLE: '1', OUT_UNITS: 'KM-S', VEC_CORR: 'NONE', TLIST_TYPE: 'CAL', TIME_TYPE: 'UT' }));
  const col = (n) => head.indexOf(n);
  return rows.map((r, i) => ({ utc: `${dates[i].replace(' ', 'T')}:00Z`, x: Number(r[col('X')]), y: Number(r[col('Y')]), z: Number(r[col('Z')]) }));
}

const out = { heliocentric: {}, moon: [], galilean: {}, satellites: {}, orientation: {} };

for (const [name, id] of Object.entries({ mercury: 199, venus: 299, earth: 399, mars: 499, jupiter: 599, saturn: 699, uranus: 799, neptune: 899 })) {
  out.heliocentric[name] = await vectors(id, 10, 'ECLIPTIC', DATES);
  console.log(name);
}
out.moon = await vectors(301, 399, 'FRAME', DATES);
for (const [name, id] of Object.entries({ io: 501, europa: 502, ganymede: 503, callisto: 504 })) out.galilean[name] = await vectors(id, 599, 'FRAME', DATES);
// Kept to test any future model of the other major moons. JPL's mean elements failed here.
for (const [name, planet, id] of [['phobos', 499, 401], ['deimos', 499, 402], ['mimas', 699, 601], ['enceladus', 699, 602], ['tethys', 699, 603], ['dione', 699, 604], ['rhea', 699, 605], ['titan', 699, 606], ['iapetus', 699, 608], ['miranda', 799, 705], ['ariel', 799, 701], ['umbriel', 799, 702], ['titania', 799, 703], ['oberon', 799, 704], ['triton', 899, 801]]) {
  out.satellites[name] = { planet, rows: await vectors(id, planet, 'FRAME', NEAR) };
}
console.log('satellites done');

// Where the Earth and the Sun stand over each body, seen from Earth's centre.
for (const [name, id] of Object.entries({ moon: 301, mars: 499, jupiter: 599, saturn: 699, venus: 299, mercury: 199 })) {
  const { head, rows } = table(await ask({ COMMAND: `'${id}'`, EPHEM_TYPE: 'OBSERVER', CENTER: "'500@399'", TLIST: DATES.map((d) => `'${d}'`).join(','), TIME_TYPE: 'UT', TIME_DIGITS: 'MINUTES', QUANTITIES: "'10,14,15,17,24'", ANG_FORMAT: 'DEG', EXTRA_PREC: 'YES', APPARENT: 'AIRLESS' }));
  const clean = head.map((h) => h.replace(/_+/g, ''));
  const col = (n, nth = 0) => { let seen = -1; for (let i = 0; i < clean.length; i++) if (clean[i] === n && ++seen === nth) return i; return -1; };
  console.log(name, clean.filter(Boolean).join(' '));
  out.orientation[name] = rows.map((r, i) => {
    const v = (n, nth) => { const c = col(n, nth); return c < 0 || r[c] === 'n.a.' ? null : Number(r[c]); };
    return { utc: `${DATES[i].replace(' ', 'T')}:00Z`, illumination: v('Illu%'), observerLon: v('ObsSub-LON'), observerLat: v('ObsSub-LAT'), sunLon: v('SunSub-LON'), sunLat: v('SunSub-LAT'), poleAngle: v('NP.ang'), poleDistance: v('NP.dist'), phaseAngle: v('S-T-O') };
  });
}

fs.writeFileSync(new URL('../../tests/fixtures/horizons-solar-v1.json', import.meta.url), JSON.stringify({ source: 'NASA/JPL Horizons API', signature, retrievedUtc: new Date().toISOString(), dates: DATES, nearDates: NEAR, requests: sources.length, sources, ...out }));
console.log('requests', sources.length, signature);
