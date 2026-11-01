// Holds the sky to references it had no part in making: JPL Horizons for the Solar System,
// ERFA for star positions, SIMBAD for the catalog. Thresholds are stated next to each check.
// WRITE_VALIDATION=1 also writes docs/skylens-v1/VALIDATION_REPORT.json.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import erfa from './fixtures/erfa-stars-v1.json';
import horizons from './fixtures/horizons-v1.json';
import simbad from './fixtures/simbad-v1.json';
import { Camera, cameraScale, orientationFor, project } from '../src/astronomy/camera';
import { angleBetween, appearance, BodyId, equatorialVector, horizontalVector, j2000ToHorizon, mul, Observer, position, vectorHorizontal } from '../src/astronomy/core';
import { directionOf } from '../src/astronomy/locator';
import { deepSky, directionAt, object, stars } from '../src/data/catalog';
import { computeMoment, yearsSinceJ2000 } from '../src/features/sky/scene';
import { readPackRows } from './helpers';

const ARCSEC = { planet: 60, moon: 120, starToErfa: 25, catalogToSimbad: 2 };
const obs = (r: { lat: number; lon: number; km: number }): Observer => ({ latitude: r.lat, longitude: r.lon, elevation: r.km * 1000 });
const sha = (file: string) => crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname, 'fixtures', file))).digest('hex');

type Row = { test_id: string; input: Record<string, unknown>; source_id: string; reference_version: string; expected: unknown; actual: unknown; angular_error_arcsec: number; threshold: number; pass: boolean; fixture_sha256: string };
const report: Row[] = [];
const record = (r: Row) => { report.push(r); expect(r.angular_error_arcsec, `${r.test_id} ${JSON.stringify(r.input)}`).toBeLessThan(r.threshold); };
const round = (v: number, d = 6) => Number(v.toFixed(d));
const HORIZONS_SHA = sha('horizons-v1.json'), ERFA_SHA = sha('erfa-stars-v1.json'), SIMBAD_SHA = sha('simbad-v1.json');
const airless = horizons.rows.filter((r) => r.atmosphere === 'airless');

describe('Sun, Moon and planets against JPL Horizons', () => {
  const limit = (body: string) => (body === 'moon' ? ARCSEC.moon : ARCSEC.planet);

  it('has the fixture set the PRD asks for: 5 sites, 5 dates, 9 bodies', () => {
    expect(airless.length).toBe(225);
    expect(new Set(airless.map((r) => r.site)).size).toBe(5);
    expect(new Set(airless.map((r) => r.utc)).size).toBe(5);
  });

  it('apparent topocentric right ascension and declination, of date', () => {
    for (const r of airless) {
      const p = position(r.body as BodyId, new Date(r.utc), obs(r));
      const e = angleBetween(equatorialVector(p.ofDate.raHours, p.ofDate.decDeg), equatorialVector(r.raApparent! / 15, r.decApparent!)) * 3600;
      record({ test_id: `horizons.apparent.${r.body}`, input: { site: r.site, utc: r.utc, frame: 'apparent of date, topocentric, airless' }, source_id: 'jpl-horizons', reference_version: horizons.signature.version, expected: { ra: r.raApparent, dec: r.decApparent }, actual: { ra: round(p.ofDate.raHours * 15), dec: round(p.ofDate.decDeg) }, angular_error_arcsec: round(e, 2), threshold: limit(r.body), pass: e < limit(r.body), fixture_sha256: HORIZONS_SHA });
    }
  });

  it('airless azimuth and altitude', () => {
    for (const r of airless) {
      const p = position(r.body as BodyId, new Date(r.utc), obs(r));
      const e = angleBetween(horizontalVector(p.geometric), horizontalVector({ azimuth: r.azimuth!, altitude: r.elevation! })) * 3600;
      record({ test_id: `horizons.altaz.${r.body}`, input: { site: r.site, utc: r.utc, frame: 'horizon, airless' }, source_id: 'jpl-horizons', reference_version: horizons.signature.version, expected: { azimuth: r.azimuth, altitude: r.elevation }, actual: { azimuth: round(p.geometric.azimuth), altitude: round(p.geometric.altitude) }, angular_error_arcsec: round(e, 2), threshold: limit(r.body), pass: e < limit(r.body), fixture_sha256: HORIZONS_SHA });
    }
  });

  it('refracted altitude of the Sun and Moon above 5 degrees', () => {
    const rows = horizons.rows.filter((r) => r.atmosphere === 'refracted' && r.elevation! > 5);
    expect(rows.length).toBeGreaterThan(15);
    for (const r of rows) {
      const p = position(r.body as BodyId, new Date(r.utc), obs(r));
      expect(Math.abs(p.apparent.altitude - r.elevation!) * 3600, `${r.body} ${r.site} ${r.utc}`).toBeLessThan(30);
    }
  });

  it('distance, illumination and angular size', () => {
    for (const r of airless) {
      const d = new Date(r.utc), p = position(r.body as BodyId, d, obs(r)), a = appearance(r.body as BodyId, d);
      expect(Math.abs(p.distanceAU - r.distanceAU!) / r.distanceAU!).toBeLessThan(2e-4);
      if (r.illumination !== null) expect(Math.abs(a.illuminatedFraction * 100 - r.illumination)).toBeLessThan(1);
      if (r.angularDiameterArcsec !== null) expect(Math.abs(a.angularDiameter * 3600 - r.angularDiameterArcsec) / r.angularDiameterArcsec).toBeLessThan(0.02);
    }
  });

  it('magnitudes of the planets and Moon within 0.15', () => {
    for (const r of airless.filter((x) => x.body !== 'sun' && x.apparentMagnitude !== null)) {
      expect(Math.abs(appearance(r.body as BodyId, new Date(r.utc)).magnitude - r.apparentMagnitude!), `${r.body} ${r.utc}`).toBeLessThan(0.15);
    }
  });
});

describe('stars and deep sky against ERFA', () => {
  const t = stars();
  const pack = readPackRows();

  const direction = (id: string, r: { ra?: number; dec?: number }, years: number) => {
    if (id.startsWith('dso:')) return equatorialVector(r.ra! / 15, r.dec!);
    const hip = Number(id.slice(5));
    const i = t.indexByHip.get(hip);
    if (i !== undefined) return directionAt(t.ra[i], t.dec[i], t.pmRA[i], t.pmDec[i], years);
    const s = pack.get(hip)!;
    return directionAt(s.ra, s.dec, s.pmRA, s.pmDec, years);
  };

  it('every row lands within 25 arcseconds, and the gap is annual aberration, which the map omits', () => {
    expect(erfa.rows.length).toBe(875);
    for (const r of erfa.rows) {
      const d = new Date(r.utc);
      const v = mul(j2000ToHorizon(d, obs(r)), direction(r.id, r, yearsSinceJ2000(d.getTime())));
      const e = angleBetween(v, horizontalVector({ azimuth: r.azimuth, altitude: r.altitude })) * 3600;
      const h = vectorHorizontal(v);
      record({ test_id: `erfa.${r.id}`, input: { site: r.site, utc: r.utc, frame: 'horizon, airless' }, source_id: 'erfa-atco13', reference_version: erfa.source, expected: { azimuth: round(r.azimuth), altitude: round(r.altitude) }, actual: { azimuth: round(h.azimuth), altitude: round(h.altitude) }, angular_error_arcsec: round(e, 2), threshold: ARCSEC.starToErfa, pass: e < ARCSEC.starToErfa, fixture_sha256: ERFA_SHA });
    }
  });

  it('5 locations, 5 dates, 3 fields of view: the reference falls within 1.5 points of where the app draws it', () => {
    let worst = 0, n = 0;
    for (const fov of [90, 20, 2]) {
      for (const r of erfa.rows) {
        if (r.altitude < 5) continue;
        const d = new Date(r.utc);
        const camera: Camera = { orientation: orientationFor(r.azimuth, r.altitude), fov, width: 393, height: 852, projection: 'stereographic' };
        const ours = project(camera, mul(j2000ToHorizon(d, obs(r)), direction(r.id, r, yearsSinceJ2000(d.getTime()))))!;
        const ref = project(camera, horizontalVector({ azimuth: r.azimuth, altitude: r.altitude }))!;
        worst = Math.max(worst, Math.hypot(ours.x - ref.x, ours.y - ref.y));
        n++;
      }
    }
    console.log(`render fixtures: ${n}, worst ${worst.toFixed(2)} pt`);
    expect(n).toBeGreaterThan(900);
    expect(worst).toBeLessThan(1.5);
    expect(cameraScale({ orientation: orientationFor(0, 0), fov: 2, width: 393, height: 852, projection: 'stereographic' })).toBeGreaterThan(0);
  });
});

describe('the catalog against SIMBAD', () => {
  const t = stars();
  const pack = readPackRows();

  it('star positions agree within 2 arcseconds at J2000, apart from named flaws in Hipparcos', () => {
    // Each of these is a fault in the source, faithfully copied, and all three are in the deep
    // pack. HIP 67593 has a false proper motion of 5.8 arcsec a year where SIMBAD has 15 mas.
    // HIP 75901 is one of 262 Hipparcos stars with no astrometric solution. HIP 17750 has a
    // much revised proper motion. A new outlier fails this test instead of joining the list.
    const knownFlaws: Record<number, number> = { 67593: 50, 75901: 8, 17750: 3 };
    let inPack = 0;
    for (const s of simbad.stars) {
      const i = t.indexByHip.get(s.hip);
      const row = i === undefined ? pack.get(s.hip) : { ra: t.ra[i], dec: t.dec[i] };
      expect(row, `HIP ${s.hip}`).toBeTruthy();
      if (i === undefined) inPack++;
      const e = angleBetween(equatorialVector(row!.ra / 15, row!.dec), equatorialVector(s.ra / 15, s.dec)) * 3600;
      const allowed = knownFlaws[s.hip] ?? ARCSEC.catalogToSimbad;
      if (knownFlaws[s.hip]) expect(i).toBeUndefined();
      record({ test_id: knownFlaws[s.hip] ? 'simbad.starKnownFlaw' : 'simbad.star', input: { hip: s.hip, frame: 'ICRS J2000' }, source_id: 'simbad', reference_version: simbad.retrievedUtc, expected: { ra: s.ra, dec: s.dec }, actual: { ra: round(row!.ra), dec: round(row!.dec) }, angular_error_arcsec: round(e, 3), threshold: allowed, pass: e < allowed, fixture_sha256: SIMBAD_SHA });
    }
    expect(inPack).toBeGreaterThan(100);
  });

  it('Messier positions agree within 8 arcminutes or 30% of the object, apart from named clusters', () => {
    // The HEASARC Messier table is coarse, and loose clusters have no sharp centre: sources
    // differ by 22 arcminutes on M44, which is 95 arcminutes wide. M39, M41 and M67 go past
    // the rule at 13 to 15 arcminutes, so they are named here and a new outlier still fails.
    const knownCoarse: Record<string, number> = { M39: 900, M41: 900, M67: 900 };
    expect(simbad.deepSky.length).toBe(110);
    for (const d of simbad.deepSky) {
      const o = deepSky.find((x) => x.id === `dso:${d.id}`)!;
      const e = angleBetween(equatorialVector(o.position!.raHours, o.position!.decDeg), equatorialVector(d.ra / 15, d.dec)) * 3600;
      const allowed = knownCoarse[d.id] ?? Math.max(480, 0.3 * (o.deepSky?.majorAxis ?? 0) * 60);
      record({ test_id: knownCoarse[d.id] ? 'simbad.messierCoarse' : 'simbad.messier', input: { id: d.id, major_arcmin: o.deepSky?.majorAxis ?? null, frame: 'ICRS J2000' }, source_id: 'simbad', reference_version: simbad.retrievedUtc, expected: { ra: d.ra, dec: d.dec }, actual: { ra: round(o.position!.raHours * 15, 4), dec: round(o.position!.decDeg, 4) }, angular_error_arcsec: round(e, 1), threshold: allowed, pass: e < allowed, fixture_sha256: SIMBAD_SHA });
    }
  });
});

describe('everything is drawn in one frame', () => {
  it('a body and its selection ring coincide, even at the horizon', () => {
    let low = 0;
    for (const r of airless) {
      const d = new Date(r.utc), o = obs(r);
      const drawn = computeMoment(d.getTime(), o).bodies.find((b) => b.id === r.body)!.dir;
      const ring = directionOf(object(`body:${r.body}`)!, d, o)!;
      expect(angleBetween(drawn, ring) * 3600, `${r.body} ${r.site} ${r.utc}`).toBeLessThan(1);
      if (Math.abs(position(r.body as BodyId, d, o).geometric.altitude) < 6) low++;
    }
    expect(low).toBeGreaterThan(5);
  });

  it('no two bundled stars share a position', () => {
    const t = stars();
    const seen = new Set<string>();
    let same = 0;
    for (let i = 0; i < t.count; i++) {
      const key = `${t.ra[i].toFixed(6)},${t.dec[i].toFixed(6)}`;
      if (seen.has(key)) same++;
      seen.add(key);
    }
    expect(same).toBe(0);
  });
});

afterAll(() => {
  if (process.env.WRITE_VALIDATION !== '1') return;
  const groups = new Map<string, Row[]>();
  for (const r of report) { const g = r.test_id.split('.').slice(0, 2).join('.'); groups.set(g, [...(groups.get(g) ?? []), r]); }
  const summary = [...groups.entries()].map(([group, rows]) => {
    const e = rows.map((r) => r.angular_error_arcsec).sort((a, b) => a - b);
    return { group, cases: rows.length, median_arcsec: e[e.length >> 1], worst_arcsec: e[e.length - 1], failed: rows.filter((r) => !r.pass).length };
  });
  const out = path.join(__dirname, '../../docs/skylens-v1/VALIDATION_REPORT.json');
  fs.writeFileSync(out, JSON.stringify({ generatedUtc: new Date().toISOString(), note: 'Written by skylens-rn/tests/validation.test.ts from frozen fixtures. Not a certification.', fixtures: { horizons: { retrievedUtc: horizons.retrievedUtc, version: horizons.signature.version, sha256: HORIZONS_SHA, requests: horizons.requests }, erfa: { source: erfa.source, sha256: ERFA_SHA }, simbad: { source: simbad.source, retrievedUtc: simbad.retrievedUtc, sha256: SIMBAD_SHA } }, summary, cases: report }));
  console.log(JSON.stringify(summary));
});
