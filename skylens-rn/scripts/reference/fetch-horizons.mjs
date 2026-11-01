// Freezes real JPL Horizons responses as golden fixtures. The app never calls Horizons:
// this runs by hand, slowly, one request at a time, and the raw answer is checksummed so a
// result can always be traced back to what JPL returned.
// usage: node scripts/reference/fetch-horizons.mjs
import crypto from 'node:crypto';
import fs from 'node:fs';

const SITES = [
  { site: 'Bratislava', lat: 48.1486, lon: 17.1077, km: 0.134 },
  { site: 'Sydney', lat: -33.8688, lon: 151.2093, km: 0.058 },
  { site: 'Quito', lat: -0.1807, lon: -78.4678, km: 2.85 },
  { site: 'Tromso', lat: 69.65, lon: 18.96, km: 0.01 },
  { site: 'McMurdo', lat: -77.85, lon: 166.67, km: 0.01 },
];
// Both ends of Time Travel, a past eclipse, the demo evening and a future eclipse.
const DATES = ['1815-06-18 10:00', '1999-08-11 11:00', '2027-01-17 20:25', '2027-08-02 10:30', '2150-11-01 00:00'];
const BODIES = { sun: 10, moon: 301, mercury: 199, venus: 299, mars: 499, jupiter: 599, saturn: 699, uranus: 799, neptune: 899 };
const REFRACTED = ['sun', 'moon'];

const url = (id, s, refraction) => 'https://ssd.jpl.nasa.gov/api/horizons.api?' + new URLSearchParams({
  format: 'json', COMMAND: `'${id}'`, OBJ_DATA: 'NO', MAKE_EPHEM: 'YES', EPHEM_TYPE: 'OBSERVER',
  CENTER: "'coord@399'", COORD_TYPE: 'GEODETIC', SITE_COORD: `'${s.lon},${s.lat},${s.km}'`,
  TLIST: DATES.map((d) => `'${d}'`).join(','), TIME_TYPE: 'UT', TIME_DIGITS: 'MINUTES',
  QUANTITIES: "'1,2,4,9,10,13,20'", ANG_FORMAT: 'DEG', CSV_FORMAT: 'YES', EXTRA_PREC: 'YES',
  APPARENT: refraction ? 'REFRACTED' : 'AIRLESS', CAL_FORMAT: 'CAL',
}).toString();

const num = (v) => { const n = Number(v); return v === undefined || v.trim() === '' || v.trim() === 'n.a.' || Number.isNaN(n) ? null : n; };

function parse(text) {
  const start = text.indexOf('$$SOE'), end = text.indexOf('$$EOE');
  if (start < 0 || end < 0) throw new Error(text.slice(0, 600));
  const head = text.slice(0, start).trim().split('\n').filter((l) => l.includes('Date_')).pop().split(',').map((c) => c.trim());
  // Horizons pads names with a varying number of underscores, so match on the letters.
  const key = (c) => c.replace(/_+/g, '');
  const col = (name) => head.findIndex((h) => key(h) === name);
  return text.slice(start + 5, end).trim().split('\n').map((line) => {
    const f = line.split(',');
    const v = (...names) => { for (const n of names) { const i = col(n); if (i >= 0) return num(f[i]); } return null; };
    return {
      raJ2000: v('R.A.(ICRF)'), decJ2000: v('DEC(ICRF)'), raApparent: v('R.A.(a-app)', 'R.A.(r-app)'), decApparent: v('DEC(a-app)', 'DEC(r-app)'),
      azimuth: v('Azimuth(a-app)', 'Azimuth(r-app)'), elevation: v('Elevation(a-app)', 'Elevation(r-app)'),
      apparentMagnitude: v('APmag'), illumination: v('Illu%'), angularDiameterArcsec: v('Ang-diam'), distanceAU: v('delta'),
    };
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rows = [], sources = [];
let signature = null;
for (const s of SITES) {
  for (const [body, id] of Object.entries(BODIES)) {
    for (const refraction of REFRACTED.includes(body) ? [false, true] : [false]) {
      const u = url(id, s, refraction);
      const res = await fetch(u);
      if (!res.ok) throw new Error(`${res.status} for ${u}`);
      const raw = await res.text();
      const json = JSON.parse(raw);
      signature = json.signature;
      const parsed = parse(json.result);
      if (parsed.length !== DATES.length) throw new Error(`${s.site} ${body}: ${parsed.length} rows`);
      parsed.forEach((p, i) => rows.push({ site: s.site, lat: s.lat, lon: s.lon, km: s.km, body, utc: `${DATES[i].replace(' ', 'T')}:00Z`, atmosphere: refraction ? 'refracted' : 'airless', ...p }));
      sources.push({ url: u, sha256: crypto.createHash('sha256').update(raw).digest('hex') });
      await sleep(400);
    }
  }
  console.log(s.site, rows.length);
}

const out = new URL('../../tests/fixtures/horizons-v1.json', import.meta.url);
fs.writeFileSync(out, JSON.stringify({ source: 'NASA/JPL Horizons API', signature, retrievedUtc: new Date().toISOString(), sites: SITES, dates: DATES, requests: sources.length, sources, rows }, null, 0));
console.log('rows', rows.length, 'nulls', rows.filter((r) => r.azimuth === null || r.raApparent === null).length, signature);
