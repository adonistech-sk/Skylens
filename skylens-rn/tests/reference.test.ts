import { describe, expect, it } from 'vitest';
import fixtures from './fixtures/reference.json';
import { angleBetween, Astronomy, BodyId, equatorialVector, horizontalVector, j2000ToHorizon, moonPhase, mul, Observer, position, vectorHorizontal } from '../src/astronomy/core';
import { riseTransitSet, twilightCrossing } from '../src/astronomy/night';

const minutes = (a: Date | null, b: string | null) => {
  if (a === null && b === null) return 0;
  if (a === null || b === null) return Infinity;
  return Math.abs(a.getTime() - Date.parse(b)) / 60000;
};

describe('JPL Horizons (same 378 fixtures as the Swift package)', () => {
  it('has all fixtures', () => expect(fixtures.horizons.length).toBe(378));

  it('J2000 positions within 60 arcseconds', () => {
    let worst = 0;
    for (const r of fixtures.horizons) {
      const o: Observer = { latitude: r.lat!, longitude: r.lon!, elevation: r.km! * 1000 };
      const p = position(r.body as BodyId, new Date(r.utc!), o);
      const e = angleBetween(equatorialVector(p.j2000.raHours, p.j2000.decDeg), equatorialVector(r.raJ2000! / 15, r.decJ2000!)) * 3600;
      worst = Math.max(worst, e);
      expect(e, `${r.body} ${r.site} ${r.utc}`).toBeLessThan(60);
    }
    console.log('worst J2000 error arcsec', worst.toFixed(1));
  });

  it('airless altitude/azimuth within 60 arcseconds', () => {
    let worst = 0;
    for (const r of fixtures.horizons) {
      const o: Observer = { latitude: r.lat!, longitude: r.lon!, elevation: r.km! * 1000 };
      const p = position(r.body as BodyId, new Date(r.utc!), o);
      const e = angleBetween(horizontalVector(p.geometric), horizontalVector({ azimuth: r.azimuth!, altitude: r.altitude! })) * 3600;
      worst = Math.max(worst, e);
      expect(e, `${r.body} ${r.site} ${r.utc}`).toBeLessThan(60);
    }
    console.log('worst alt/az error arcsec', worst.toFixed(1));
  });

  it('distances within 0.02%', () => {
    for (const r of fixtures.horizons) {
      const o: Observer = { latitude: r.lat!, longitude: r.lon!, elevation: r.km! * 1000 };
      const p = position(r.body as BodyId, new Date(r.utc!), o);
      expect(Math.abs(p.distanceAU - r.distanceAU!) / r.distanceAU!).toBeLessThan(2e-4);
    }
  });

  it('the per-frame matrix agrees with the full position path, so stars and planets cannot drift apart', () => {
    for (const r of fixtures.horizons.filter((x) => x.body === 'jupiter')) {
      const o: Observer = { latitude: r.lat!, longitude: r.lon!, elevation: r.km! * 1000 };
      const d = new Date(r.utc!);
      const p = position('jupiter', d, o);
      const via = vectorHorizontal(mul(j2000ToHorizon(d, o), equatorialVector(p.j2000.raHours, p.j2000.decDeg)));
      expect(angleBetween(horizontalVector(via), horizontalVector(p.geometric)) * 3600).toBeLessThan(1);
    }
  });
});

describe('US Naval Observatory', () => {
  const days = fixtures.usno;
  const midnight = (d: string) => new Date(`${d}T00:00:00Z`);

  it('Sun rise, set and transit within 2 minutes', () => {
    for (const d of days) {
      const e = riseTransitSet({ body: 'sun' }, midnight(d.date!), { latitude: d.lat!, longitude: d.lon!, elevation: 0 });
      expect(minutes(e.rise, d.sunRise), `${d.site} ${d.date} rise`).toBeLessThanOrEqual(2);
      expect(minutes(e.set, d.sunSet), `${d.site} ${d.date} set`).toBeLessThanOrEqual(2);
      if (d.sunTransit) expect(minutes(e.transit, d.sunTransit)).toBeLessThanOrEqual(2);
    }
  });

  it('Moon rise and set within 2 minutes', () => {
    for (const d of days) {
      const e = riseTransitSet({ body: 'moon' }, midnight(d.date!), { latitude: d.lat!, longitude: d.lon!, elevation: 0 });
      expect(minutes(e.rise, d.moonRise), `${d.site} ${d.date} moonrise`).toBeLessThanOrEqual(2);
      expect(minutes(e.set, d.moonSet), `${d.site} ${d.date} moonset`).toBeLessThanOrEqual(2);
    }
  });

  it('civil twilight within 2 minutes', () => {
    for (const d of days) {
      const o = { latitude: d.lat!, longitude: d.lon!, elevation: 0 };
      expect(minutes(twilightCrossing(-6, true, midnight(d.date!), o), d.civilBegin)).toBeLessThanOrEqual(2);
      expect(minutes(twilightCrossing(-6, false, midnight(d.date!), o), d.civilEnd)).toBeLessThanOrEqual(2);
    }
  });

  it('Moon illumination close to USNO', () => {
    for (const d of days) {
      if (d.fracillum == null) continue;
      expect(Math.abs(moonPhase(midnight(d.date!)).illuminatedFraction * 100 - d.fracillum)).toBeLessThan(7);
    }
  });

  it('149 lunar phases', () => {
    const ours: { q: number; t: number }[] = [];
    for (const year of [1950, 2026, 2100]) {
      let q = Astronomy.SearchMoonQuarter(new Date(Date.UTC(year, 0, 1)));
      while (q.time.date.getUTCFullYear() === year) {
        ours.push({ q: q.quarter, t: q.time.date.getTime() });
        q = Astronomy.NextMoonQuarter(q);
      }
    }
    const names: Record<string, number> = { 'New Moon': 0, 'First Quarter': 1, 'Full Moon': 2, 'Last Quarter': 3 };
    expect(fixtures.phases.length).toBe(149);
    for (const r of fixtures.phases) {
      const t = Date.parse(r.utc);
      const m = ours.find((o) => Math.abs(o.t - t) < 6 * 3600_000);
      expect(m, r.utc).toBeTruthy();
      expect(m!.q).toBe(names[r.name]);
      expect(Math.abs(m!.t - t) / 60000).toBeLessThanOrEqual(r.utc.startsWith('2100') ? 4 : 2);
    }
  });

  it('equinoxes and solstices within 2 minutes', () => {
    const ours: number[] = [];
    for (const y of [1950, 2026, 2100]) {
      const s = Astronomy.Seasons(y);
      ours.push(...[s.mar_equinox, s.jun_solstice, s.sep_equinox, s.dec_solstice].map((t) => t.date.getTime()));
    }
    for (const r of fixtures.seasons) {
      const t = Date.parse(r.utc);
      expect(Math.min(...ours.map((o) => Math.abs(o - t))) / 60000).toBeLessThanOrEqual(2);
    }
  });
});
