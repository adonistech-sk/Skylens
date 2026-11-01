#!/usr/bin/env node
// Fetches independent reference values and writes them as a Swift fixture, so the
// astronomy tests compare against authorities rather than against themselves.
//
//   JPL Horizons   topocentric planetary positions, ssd.jpl.nasa.gov
//   USNO           rise, set, transit, twilight, Moon phases, seasons, aa.usno.navy.mil
//
// Only fixed test coordinates are sent. Re-run to refresh:
//   node Tools/reference-data/fetch.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, '../../Packages/SkyLensKit/Tests/AstronomyCoreTests/ReferenceFixtures.swift');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, json = true) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'SkyLens-reference-fixtures/1.0' }, signal: AbortSignal.timeout(40000) });
      if (r.ok) return json ? r.json() : r.text();
      if (r.status !== 503 && r.status !== 429) throw new Error(`${r.status} ${url}`);
    } catch (e) {
      if (attempt === 3) throw e;
    }
    await sleep(2500 * (attempt + 1));
  }
  throw new Error(`gave up on ${url}`);
}

const sites = [
  { name: 'Greenwich', lat: 51.4769, lon: 0.0, km: 0.046 },
  { name: 'Sydney', lat: -33.8568, lon: 151.2153, km: 0.02 },
  { name: 'Quito (equator)', lat: -0.1807, lon: -78.4678, km: 2.85 },
  { name: 'Tromso (arctic)', lat: 69.6492, lon: 18.9553, km: 0.01 },
  { name: 'Apia (date line)', lat: -13.8333, lon: -171.7667, km: 0.002 },
  { name: 'McMurdo (antarctic)', lat: -77.8419, lon: 166.6863, km: 0.01 },
];
const bodies = [
  ['sun', '10'], ['moon', '301'], ['mercury', '199'], ['venus', '299'], ['mars', '499'],
  ['jupiter', '599'], ['saturn', '699'], ['uranus', '799'], ['neptune', '899'],
];
const instants = ['1805-03-15 06:00', '1905-07-01 18:30', '2000-01-01 12:00', '2024-04-08 18:17', '2026-11-01 21:00', '2100-02-28 03:15', '2199-06-30 23:00'];

async function horizons(id, site) {
  const p = new URLSearchParams({
    format: 'json', COMMAND: `'${id}'`, OBJ_DATA: 'NO', MAKE_EPHEM: 'YES', EPHEM_TYPE: 'OBSERVER',
    CENTER: "'coord@399'", COORD_TYPE: 'GEODETIC', SITE_COORD: `'${site.lon},${site.lat},${site.km}'`,
    TLIST: instants.map((t) => `'${t}'`).join(' '), TIME_TYPE: 'UT', QUANTITIES: "'1,2,4,20'",
    ANG_FORMAT: 'DEG', EXTRA_PREC: 'YES', CSV_FORMAT: 'YES', APPARENT: 'AIRLESS',
  });
  const j = await get(`https://ssd.jpl.nasa.gov/api/horizons.api?${p}`);
  const text = j.result ?? '';
  const a = text.indexOf('$$SOE'), b = text.indexOf('$$EOE');
  if (a < 0 || b < 0) throw new Error(`Horizons: no ephemeris for ${id}\n${text.slice(0, 600)}`);
  return text.slice(a + 5, b).trim().split('\n').map((line) => {
    const c = line.split(',').map((s) => s.trim());
    // Date, flags, flags, RA(ICRF), DEC(ICRF), RA(app), DEC(app), Az, El, delta, deldot
    const nums = c.slice(1).map(Number).filter((n, i) => c[i + 1] !== '' && !Number.isNaN(n));
    return { date: c[0], raJ2000: nums[0], decJ2000: nums[1], azimuth: nums[4], altitude: nums[5], distance: nums[6] };
  });
}

const iso = (s) => {
  const m = s.match(/(\d{4})-(\w{3})-(\d{2}) (\d{2}):(\d{2})/);
  const mon = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ').indexOf(m[2]) + 1;
  return `${m[1]}-${String(mon).padStart(2, '0')}-${m[3]}T${m[4]}:${m[5]}:00Z`;
};

const horizonRows = [];
for (const site of sites) {
  for (const [name, id] of bodies) {
    process.stdout.write(`horizons ${site.name} ${name}\n`);
    for (const r of await horizons(id, site)) horizonRows.push({ site: site.name, lat: site.lat, lon: site.lon, km: site.km, body: name, utc: iso(r.date), ...r });
    await sleep(400);
  }
}

const usnoDays = [
  ['2026-06-21', 51.4769, 0.0, 'Greenwich'], ['2026-12-21', 51.4769, 0.0, 'Greenwich'],
  ['2026-03-20', -33.8568, 151.2153, 'Sydney'], ['2026-09-23', -33.8568, 151.2153, 'Sydney'],
  ['2026-06-21', -0.1807, -78.4678, 'Quito'], ['2026-11-01', -13.8333, -171.7667, 'Apia'],
  ['2026-02-10', 69.6492, 18.9553, 'Tromso'], ['2026-06-21', 69.6492, 18.9553, 'Tromso'],
  ['2026-12-21', 69.6492, 18.9553, 'Tromso'], ['2026-12-21', -77.8419, 166.6863, 'McMurdo'],
  ['2026-06-21', -77.8419, 166.6863, 'McMurdo'], ['2026-07-04', 40.7128, -74.006, 'New York'],
  ['2026-11-01', 35.6762, 139.6503, 'Tokyo'],
];
const riseRows = [];
for (const [date, lat, lon, name] of usnoDays) {
  const j = await get(`https://aa.usno.navy.mil/api/rstt/oneday?date=${date}&coords=${lat},${lon}&tz=0`);
  const data = j.properties.data;
  const pick = (list, phen) => list.find((e) => e.phen === phen)?.time ?? null;
  const fmt = (t) => (t ? `${date}T${t}:00Z` : null);
  riseRows.push({
    site: name, date, lat, lon,
    sunRise: fmt(pick(data.sundata, 'Rise')), sunSet: fmt(pick(data.sundata, 'Set')), sunTransit: fmt(pick(data.sundata, 'Upper Transit')),
    civilBegin: fmt(pick(data.sundata, 'Begin Civil Twilight')), civilEnd: fmt(pick(data.sundata, 'End Civil Twilight')),
    moonRise: fmt(pick(data.moondata, 'Rise')), moonSet: fmt(pick(data.moondata, 'Set')), moonTransit: fmt(pick(data.moondata, 'Upper Transit')),
    curphase: data.curphase ?? null, fracillum: data.fracillum ? parseFloat(data.fracillum) : null,
  });
  await sleep(350);
}

const phaseRows = [];
for (const year of [1950, 2026, 2100]) {
  const j = await get(`https://aa.usno.navy.mil/api/moon/phases/year?year=${year}`);
  for (const p of j.phasedata) {
    phaseRows.push({ phase: p.phase, utc: `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}T${p.time}:00Z` });
  }
  await sleep(350);
}

const seasonRows = [];
for (const year of [1950, 2026, 2100]) {
  const j = await get(`https://aa.usno.navy.mil/api/seasons?year=${year}`);
  for (const p of j.data) {
    if (!['Equinox', 'Solstice'].includes(p.phenom)) continue;
    seasonRows.push({ phenom: p.phenom, utc: `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}T${p.time}:00Z` });
  }
  await sleep(350);
}

const str = (s) => (s == null ? 'nil' : JSON.stringify(s));
const num = (n) => (n == null || Number.isNaN(n) ? 'nil' : String(n));
const swift = `// Generated by Tools/reference-data/fetch.mjs on ${new Date().toISOString().slice(0, 10)}. Do not edit.
// Sources: NASA JPL Horizons (DE441) and the US Naval Observatory data services.

struct HorizonsRow {
    let site: String, lat: Double, lon: Double, km: Double, body: String, utc: String
    let raJ2000: Double, decJ2000: Double, azimuth: Double, altitude: Double, distanceAU: Double
}

struct USNODay {
    let site: String, date: String, lat: Double, lon: Double
    let sunRise: String?, sunSet: String?, sunTransit: String?
    let civilBegin: String?, civilEnd: String?
    let moonRise: String?, moonSet: String?, moonTransit: String?
    let curphase: String?, fracillum: Double?
}

enum ReferenceFixtures {
    static let horizons: [HorizonsRow] = [
${horizonRows.map((r) => `        .init(site: ${str(r.site)}, lat: ${r.lat}, lon: ${r.lon}, km: ${r.km}, body: ${str(r.body)}, utc: ${str(r.utc)}, raJ2000: ${r.raJ2000}, decJ2000: ${r.decJ2000}, azimuth: ${r.azimuth}, altitude: ${r.altitude}, distanceAU: ${r.distance}),`).join('\n')}
    ]

    static let usnoDays: [USNODay] = [
${riseRows.map((r) => `        .init(site: ${str(r.site)}, date: ${str(r.date)}, lat: ${r.lat}, lon: ${r.lon}, sunRise: ${str(r.sunRise)}, sunSet: ${str(r.sunSet)}, sunTransit: ${str(r.sunTransit)}, civilBegin: ${str(r.civilBegin)}, civilEnd: ${str(r.civilEnd)}, moonRise: ${str(r.moonRise)}, moonSet: ${str(r.moonSet)}, moonTransit: ${str(r.moonTransit)}, curphase: ${str(r.curphase)}, fracillum: ${num(r.fracillum)}),`).join('\n')}
    ]

    static let moonPhases: [(phase: String, utc: String)] = [
${phaseRows.map((r) => `        (${str(r.phase)}, ${str(r.utc)}),`).join('\n')}
    ]

    static let seasons: [(phenom: String, utc: String)] = [
${seasonRows.map((r) => `        (${str(r.phenom)}, ${str(r.utc)}),`).join('\n')}
    ]
}
`;
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, swift);
console.log(`wrote ${out}: ${horizonRows.length} Horizons rows, ${riseRows.length} USNO days, ${phaseRows.length} phases, ${seasonRows.length} seasons`);
