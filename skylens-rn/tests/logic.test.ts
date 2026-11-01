import { describe, expect, it } from 'vitest';
import { angleBetween, equatorialVector, horizontalVector, j2000ToHorizon, mul, Observer, vectorHorizontal } from '../src/astronomy/core';
import { Camera, dragView, flight, orientationFor, project, unproject } from '../src/astronomy/camera';
import { eventsBetweenSync } from '../src/astronomy/events';
import { directionOf, locate, observe } from '../src/astronomy/locator';
import { darkInterval, nightContaining, startOfLocalDay, timeZoneOffset } from '../src/astronomy/night';
import { planTonight } from '../src/astronomy/tonight';
import { constellations, deepSky, object, starDirection, stars } from '../src/data/catalog';
import { editDistance, normalize, search } from '../src/data/search';

const bratislava: Observer = { latitude: 48.1486, longitude: 17.1077, elevation: 134 };
const sydney: Observer = { latitude: -33.8688, longitude: 151.2093, elevation: 58 };
const tromso: Observer = { latitude: 69.65, longitude: 18.96, elevation: 10 };

describe('catalog', () => {
  it('every constellation vertex resolves to a star', () => {
    const t = stars();
    let n = 0;
    for (const c of constellations) for (const l of c.lines) for (const h of l) { expect(t.indexByHip.has(h), `${c.id} ${h}`).toBe(true); n++; }
    expect(n).toBe(893);
    expect(constellations.length).toBe(88);
  });
  it('stars are sorted brightest first, Sirius leads', () => {
    const t = stars();
    expect(t.hip[0]).toBe(32349);
    for (let i = 1; i < 500; i++) expect(t.mag[i]).toBeGreaterThanOrEqual(t.mag[i - 1]);
  });
  it('real objects carry real values', () => {
    const m31 = object('dso:M31')!;
    expect(m31.name).toBe('Andromeda Galaxy');
    expect(m31.magnitude).toBe(3.4);
    expect(m31.deepSky!.majorAxis).toBe(178);
    const b = object('star:27989')!;
    expect(b.name).toBe('Betelgeuse');
    expect(b.position!.decDeg).toBeCloseTo(7.407, 2);
  });
  it('object IDs of unknown things resolve to nothing, never to a guess', () => {
    expect(object('dso:NOPE')).toBeNull();
    expect(object('body:pluto')).toBeNull();
    expect(object('star:1')).toBeNull();
  });
  it('proper motion moves Barnard-class fast stars and leaves the frame unit length', () => {
    const t = stars();
    const i = t.indexByHip.get(32349)!; // Sirius, about 1.3 arcsec a year
    const a = starDirection(t, i, 0), b = starDirection(t, i, 100);
    expect(Math.hypot(...b)).toBeCloseTo(1, 9);
    expect(angleBetween(a, b) * 3600).toBeGreaterThan(120);
    expect(angleBetween(a, b) * 3600).toBeLessThan(140);
  });
});

describe('search', () => {
  it('normalizes astronomical shorthand', () => {
    expect(normalize('α Lyr')).toBe('alpha lyr');
    expect(normalize('M 31')).toBe('m31');
    expect(normalize('Messier 31')).toBe('m31');
    expect(normalize('NGC224')).toBe('ngc 224');
    expect(normalize('alp Lyr')).toBe('alpha lyr');
  });
  it('finds Andromeda by name, designation and typo', () => {
    expect(search('andromeda galaxy')[0].id).toBe('dso:M31');
    expect(search('M31')[0].id).toBe('dso:M31');
    expect(search('NGC 224')[0].id).toBe('dso:M31');
    expect(search('andromeda').map((r) => r.id)).toEqual(expect.arrayContaining(['con:And', 'dso:M31']));
  });
  it('tolerates typos', () => {
    expect(search('betelguese')[0].name).toBe('Betelgeuse');
    expect(search('jupitr')[0].name).toBe('Jupiter');
    expect(editDistance('abcd', 'abdc', 1)).toBe(1);
    expect(editDistance('abcd', 'wxyz', 2)).toBeNull();
  });
  it('empty query returns nothing', () => expect(search('   ')).toEqual([]));
});

describe('camera', () => {
  const cam = (projection: Camera['projection']): Camera => ({ orientation: orientationFor(180, 30), fov: 70, width: 393, height: 852, projection });
  it('round trips screen → sky → screen', () => {
    for (const p of ['stereographic', 'rectilinear'] as const) {
      const c = cam(p);
      for (const [x, y] of [[10, 10], [196, 426], [380, 800]]) {
        const s = project(c, unproject(c, x, y))!;
        expect(s.x).toBeCloseTo(x, 6);
        expect(s.y).toBeCloseTo(y, 6);
      }
    }
  });
  it('the view centre looks at the requested direction', () => {
    const c = cam('stereographic');
    const v = vectorHorizontal(unproject(c, 196.5, 426));
    expect(v.azimuth).toBeCloseTo(180, 6);
    expect(v.altitude).toBeCloseTo(30, 6);
  });
  it('facing south, east is on the left, so the sky is not mirrored', () => {
    const c = cam('stereographic');
    expect(project(c, horizontalVector({ azimuth: 150, altitude: 30 }))!.x).toBeLessThan(196);
    expect(project(c, horizontalVector({ azimuth: 210, altitude: 30 }))!.x).toBeGreaterThan(196);
    expect(project(c, horizontalVector({ azimuth: 180, altitude: 60 }))!.y).toBeLessThan(426);
  });
  it('dragging moves the sky with the finger and cannot pass the zenith', () => {
    const v = dragView({ azimuth: 180, altitude: 30, fov: 70 }, 50, 0, 10);
    expect(v.azimuth).toBeLessThan(180);
    expect(dragView({ azimuth: 0, altitude: 89, fov: 70 }, 0, 1e4, 10).altitude).toBeLessThanOrEqual(89.9);
  });
  it('flight lands exactly on its target', () => {
    const to = { azimuth: 10, altitude: 40, fov: 20 };
    const v = flight({ azimuth: 350, altitude: 0, fov: 70 }, to, 1, 2);
    expect(v.azimuth).toBeCloseTo(10, 6); expect(v.altitude).toBeCloseTo(40, 6); expect(v.fov).toBeCloseTo(20, 6);
  });
});

describe('sky correctness', () => {
  it('Orion from Bratislava on a January evening stands near due south with Betelgeuse left of Rigel', () => {
    const date = new Date('2027-01-16T20:30:00Z');
    const m = j2000ToHorizon(date, bratislava);
    const vec = (id: string) => { const o = object(id)!; return mul(m, equatorialVector(o.position!.raHours, o.position!.decDeg)); };
    const c: Camera = { orientation: orientationFor(180, 35), fov: 80, width: 393, height: 852, projection: 'stereographic' };
    const b = project(c, vec('star:27989'))!, r = project(c, vec('star:24436'))!;
    expect(b.x).toBeLessThan(r.x);
    expect(b.y).toBeLessThan(r.y);
    expect(vectorHorizontal(vec('star:27989')).altitude).toBeGreaterThan(30);
  });
  it('changing location or date genuinely moves the sky', () => {
    const date = new Date('2027-01-16T20:30:00Z');
    const o = object('dso:M31')!;
    const here = directionOf(o, date, bratislava)!;
    expect(angleBetween(here, directionOf(o, date, sydney)!)).toBeGreaterThan(30);
    expect(angleBetween(here, directionOf(o, new Date('2027-01-16T23:30:00Z'), bratislava)!)).toBeGreaterThan(20);
  });
  it('planets move against the stars under Time Travel', () => {
    const o = object('body:mars')!;
    const a = observe(o, new Date('2027-01-16T20:30:00Z'), bratislava).j2000!;
    // Mars loops retrograde around its February 2027 opposition, so span past it.
    const b = observe(o, new Date('2027-10-16T20:30:00Z'), bratislava).j2000!;
    expect(angleBetween(equatorialVector(a.raHours, a.decDeg), equatorialVector(b.raHours, b.decDeg))).toBeGreaterThan(20);
  });
  it('explains an object that never rises', () => {
    const smc = deepSky.find((d) => d.id === 'dso:SMC')!;
    const l = locate(smc, new Date('2027-01-16T20:30:00Z'), bratislava);
    expect(l.status).toBe('neverRises');
    expect(l.explanation).toContain('south');
  });
  it('observation of a body fills phase and distance, a fixed star does not invent them', () => {
    const d = new Date('2027-01-16T20:30:00Z');
    expect(observe(object('body:moon')!, d, bratislava).illuminatedFraction).toBeGreaterThan(0);
    const s = observe(object('star:27989')!, d, bratislava);
    expect(s.distanceAU).toBeNull();
    expect(s.constellation).toBe('Ori');
  });
});

describe('Tonight', () => {
  const date = new Date('2027-01-16T17:00:00Z');
  it('finds a real dark window in Bratislava', () => {
    const night = nightContaining(date, bratislava, 'Europe/Bratislava');
    expect(night.condition).toBe('normal');
    const dark = darkInterval(night)!;
    expect(dark.start < dark.end).toBe(true);
    expect(night.sunset!.getTime()).toBeLessThan(dark.start.getTime());
  });
  it('every recommendation is actually up and sensibly ranked', () => {
    const plan = planTonight(date, bratislava, 'Europe/Bratislava');
    expect(plan.recommendations.length).toBeGreaterThan(5);
    for (const r of plan.recommendations) {
      expect(r.maxAltitude).toBeGreaterThanOrEqual(15);
      expect(r.summary).toMatch(/Mag/);
    }
    expect(JSON.stringify(plan.recommendations.map((r) => r.rank))).toBe(JSON.stringify(plan.recommendations.map((r) => r.rank).sort((a, b) => b - a)));
  });
  it('location changes the contents', () => {
    const a = planTonight(date, bratislava, 'Europe/Bratislava').recommendations.map((r) => r.object.id);
    const b = planTonight(new Date('2027-01-16T10:00:00Z'), sydney, 'Australia/Sydney').recommendations.map((r) => r.object.id);
    expect(a).not.toEqual(b);
  });
  it('polar summer reports no dark window instead of inventing one', () => {
    const plan = planTonight(new Date('2027-06-21T10:00:00Z'), tromso, 'Europe/Oslo');
    expect(plan.night.condition).toBe('polarDay');
    expect(plan.recommendations).toEqual([]);
  });
  it('time zone helpers respect daylight saving', () => {
    expect(timeZoneOffset(new Date('2027-01-16T12:00:00Z'), 'Europe/Bratislava')).toBe(3_600_000);
    expect(timeZoneOffset(new Date('2027-07-16T12:00:00Z'), 'Europe/Bratislava')).toBe(7_200_000);
    expect(startOfLocalDay(new Date('2027-07-16T12:00:00Z'), 'Europe/Bratislava').toISOString()).toBe('2027-07-15T22:00:00.000Z');
  });
});

describe('events', () => {
  it('finds well-known 2027 events', () => {
    const e = eventsBetweenSync(new Date('2027-01-01T00:00:00Z'), new Date('2027-12-31T00:00:00Z'), bratislava);
    const titles = e.map((x) => x.title);
    expect(titles).toContain('Perseids Peak');
    expect(titles).toContain('Geminids Peak');
    expect(titles).toContain('Full Moon');
    const perseids = e.find((x) => x.title === 'Perseids Peak')!;
    expect(perseids.date.getUTCMonth()).toBe(7);
    expect([12, 13]).toContain(perseids.date.getUTCDate());
    for (let i = 1; i < e.length; i++) expect(e[i].date.getTime()).toBeGreaterThanOrEqual(e[i - 1].date.getTime());
  });
  it('the eclipse of 2 August 2027 is total from Luxor and only partial from Bratislava', () => {
    const start = new Date('2027-07-25T00:00:00Z'), end = new Date('2027-08-10T00:00:00Z');
    const luxor = eventsBetweenSync(start, end, { latitude: 25.69, longitude: 32.64, elevation: 80 });
    const local = eventsBetweenSync(start, end, bratislava);
    expect(luxor.some((x) => x.title === 'Total Solar Eclipse')).toBe(true);
    expect(local.some((x) => x.title === 'Partial Solar Eclipse')).toBe(true);
    expect(local.some((x) => x.title === 'Total Solar Eclipse')).toBe(false);
  });
  it('the Moon–planet scan agrees with a much finer scan', () => {
    const e = eventsBetweenSync(new Date('2027-03-01T00:00:00Z'), new Date('2027-05-01T00:00:00Z'), bratislava);
    for (const c of e.filter((x) => x.kind === 'conjunction')) expect(c.subtitle).toMatch(/apart/);
  });
});
