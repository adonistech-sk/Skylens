// Copies the JPL Horizons and USNO reference values out of the Swift test fixtures
// without changing them, so the TypeScript engine faces exactly the same evidence.
import fs from 'node:fs';

const src = fs.readFileSync(new URL('../../Packages/SkyLensKit/Tests/AstronomyCoreTests/ReferenceFixtures.swift', import.meta.url), 'utf8');
const field = (l, k) => {
  const m = l.match(new RegExp('\\b' + k + ': ("([^"]*)"|nil|-?[0-9.eE+-]+)'));
  if (!m || m[1] === 'nil') return null;
  return m[2] !== undefined ? m[2] : Number(m[1]);
};
const horizons = [], usno = [], phases = [], seasons = [];
let mode = '';
const pick = (l, keys) => Object.fromEntries(keys.map((k) => [k, field(l, k)]));
for (const l of src.split('\n')) {
  if (l.includes('static let horizons')) mode = 'h';
  else if (l.includes('static let usnoDays')) mode = 'u';
  else if (l.includes('static let moonPhases')) mode = 'p';
  else if (l.includes('static let seasons')) mode = 's';
  else if (mode === 'h' && l.includes('.init(')) horizons.push(pick(l, ['site', 'lat', 'lon', 'km', 'body', 'utc', 'raJ2000', 'decJ2000', 'azimuth', 'altitude', 'distanceAU']));
  else if (mode === 'u' && l.includes('.init(')) usno.push(pick(l, ['site', 'date', 'lat', 'lon', 'sunRise', 'sunSet', 'sunTransit', 'civilBegin', 'civilEnd', 'moonRise', 'moonSet', 'moonTransit', 'curphase', 'fracillum']));
  else if (mode === 'p' || mode === 's') {
    const q = [...l.matchAll(/"([^"]*)"/g)].map((m) => m[1]);
    if (q.length >= 2) (mode === 'p' ? phases : seasons).push({ name: q[0], utc: q[1] });
  }
}
fs.mkdirSync(new URL('../tests/fixtures/', import.meta.url), { recursive: true });
fs.writeFileSync(new URL('../tests/fixtures/reference.json', import.meta.url), JSON.stringify({ horizons, usno, phases, seasons }));
console.log({ horizons: horizons.length, usno: usno.length, phases: phases.length, seasons: seasons.length });
