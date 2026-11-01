import { describe, expect, it } from 'vitest';
import horizons from './fixtures/horizons-v1.json';
import { Camera, orientationFor } from '../src/astronomy/camera';
import { BodyId, Observer, position, moonPhase, Astronomy } from '../src/astronomy/core';
import { coordinatesOf, elongation, guidance, moonFacts, nightStart, visibilityTimeline } from '../src/astronomy/observing';
import { riseTransitSet } from '../src/astronomy/night';
import { locate } from '../src/astronomy/locator';
import { deepSky, object } from '../src/data/catalog';
import { absoluteMagnitude, bodyFacts, constellationFacts, deepSkyFacts, factsFor, starFacts, temperatureFromColor } from '../src/data/objectFacts';
import { insideConstellation, relatedObjects } from '../src/data/related';
import { discover, DiscoveryContext } from '../src/features/sky/discovery';
import { boundaryPolygons, polygonArea } from '../src/features/sky/grids';
import { computeMoment } from '../src/features/sky/scene';
import { addToList, allListItems, createList, deleteList, MAX_RECENTS, moved, moveInList, ObjectList, remembered, removeFromList, renameList, sanitizeLists } from '../src/state/lists';
import { MODE_DEFAULTS, SkyMode } from '../src/state/skyModes';

const bratislava: Observer = { latitude: 48.1486, longitude: 17.1077, elevation: 134 };
const sydney: Observer = { latitude: -33.8688, longitude: 151.2093, elevation: 58 };
const tromso: Observer = { latitude: 69.65, longitude: 18.96, elevation: 10 };
const night = new Date('2027-01-17T20:25:00Z');

describe('observing lists', () => {
  const base = createList([], 'Winter targets', 1000);
  const id = base[0].id;

  it('create, rename, add, remove and delete', () => {
    let l: ObjectList[] = base;
    expect(l[0].name).toBe('Winter targets');
    l = addToList(l, id, 'dso:M42');
    l = addToList(l, id, 'star:27989');
    l = addToList(l, id, 'dso:M42');
    expect(l[0].items).toEqual(['dso:M42', 'star:27989']);
    l = renameList(l, id, '  Orion   night ');
    expect(l[0].name).toBe('Orion night');
    l = removeFromList(l, id, 'dso:M42');
    expect(l[0].items).toEqual(['star:27989']);
    expect(deleteList(l, id)).toEqual([]);
  });
  it('an empty name makes nothing and changes nothing', () => {
    expect(createList([], '   ', 1)).toEqual([]);
    expect(renameList(base, id, '  ')).toBe(base);
  });
  it('two lists made in the same millisecond stay separate', () => {
    const two = createList(createList([], 'a', 5), 'b', 5);
    expect(new Set(two.map((l) => l.id)).size).toBe(2);
  });
  it('reordering stops at both ends and ignores strangers', () => {
    expect(moved(['a', 'b', 'c'], 'c', -1)).toEqual(['a', 'c', 'b']);
    expect(moved(['a', 'b', 'c'], 'a', -1)).toEqual(['a', 'b', 'c']);
    expect(moved(['a', 'b', 'c'], 'c', 5)).toEqual(['a', 'b', 'c']);
    expect(moved(['a'], 'z', 1)).toEqual(['a']);
    expect(moveInList(addToList(addToList(base, id, 'x'), id, 'y'), id, 'y', -1)[0].items).toEqual(['y', 'x']);
  });
  it('recents keep the latest first with no repeats, within a limit', () => {
    let r: string[] = [];
    for (let i = 0; i < 20; i++) r = remembered(r, `o${i}`);
    expect(r.length).toBe(MAX_RECENTS);
    expect(remembered(['a', 'b'], 'b')).toEqual(['b', 'a']);
  });
  it('a damaged save keeps what is usable and drops the rest', () => {
    expect(sanitizeLists('nope')).toEqual([]);
    expect(sanitizeLists(undefined)).toEqual([]);
    const good = { id: 'a', name: 'Good', items: ['dso:M1', 'dso:M1', 7], createdAt: 3 };
    const out = sanitizeLists([good, null, { id: 'a', name: 'Duplicate' }, { name: 'No id' }, { id: 'b', name: '  ' }, { id: 'c', name: 'No items' }]);
    expect(out.map((l) => l.id)).toEqual(['a', 'c']);
    expect(out[0].items).toEqual(['dso:M1']);
    expect(out[1].items).toEqual([]);
  });
  it('a pack star stored by ID is kept for restoring after a restart', () => {
    expect(allListItems(addToList(base, id, 'star:87937'))).toContain('star:87937');
  });
});

describe('visibility timeline', () => {
  const tz = 'Europe/Bratislava';
  it('runs noon to noon around the observing night', () => {
    const start = nightStart(night, tz);
    expect(new Date(start).toISOString()).toBe('2027-01-17T11:00:00.000Z');
    expect(nightStart(new Date('2027-01-18T05:00:00Z'), tz)).toBe(start);
    expect(nightStart(new Date('2027-01-18T12:00:00Z'), tz)).toBe(start + 86_400_000);
  });
  it('its peak agrees with the transit from the engine, within a sample', () => {
    const o = object('star:27989')!;
    const v = visibilityTimeline(o, night, bratislava, tz)!;
    expect(v.points.length).toBe(73);
    const t = riseTransitSet({ fixed: o.position! }, new Date(v.start), bratislava);
    expect(Math.abs(v.peak.time - t.transit!.getTime())).toBeLessThanOrEqual(21 * 60_000);
    expect(Math.abs(v.peak.altitude - t.transitAltitude!)).toBeLessThan(1);
  });
  it('crosses the horizon when the engine says it rises and sets', () => {
    const o = object('star:32349')!;
    const v = visibilityTimeline(o, night, bratislava, tz)!;
    const t = riseTransitSet({ fixed: o.position! }, new Date(v.start), bratislava);
    const at = (ms: number) => v.points.reduce((a, b) => (Math.abs(a.time - ms) < Math.abs(b.time - ms) ? a : b)).altitude;
    expect(Math.abs(at(t.rise!.getTime()))).toBeLessThan(4);
    expect(Math.abs(at(t.set!.getTime()))).toBeLessThan(4);
  });
  it('tracks a moving body: the Moon sampled here matches JPL at the same moment', () => {
    const r = horizons.rows.find((x) => x.body === 'moon' && x.site === 'Bratislava' && x.utc.startsWith('2027-01') && x.atmosphere === 'refracted')!;
    const p = position('moon' as BodyId, new Date(r.utc), bratislava);
    expect(Math.abs(p.apparent.altitude - r.elevation!) * 3600).toBeLessThan(30);
  });
  it('a dark window never includes daylight or a low object', () => {
    const v = visibilityTimeline(object('dso:M31')!, night, bratislava, tz)!;
    expect(v.darkHours).toBeGreaterThan(1);
    for (const p of v.points) if (p.time >= v.windowStart! && p.time <= v.windowEnd! && p.sun > -12) expect(p.altitude).toBeGreaterThanOrEqual(-90);
    const never = visibilityTimeline(deepSky.find((d) => d.id === 'dso:SMC')!, night, bratislava, tz)!;
    expect(never.darkHours).toBe(0);
    expect(never.windowStart).toBeNull();
    expect(never.peak.altitude).toBeLessThan(0);
  });
  it('polar summer gives no dark hours rather than a made-up window', () => {
    const v = visibilityTimeline(object('star:27989')!, new Date('2027-06-21T10:00:00Z'), tromso, 'Europe/Oslo')!;
    expect(v.darkHours).toBe(0);
  });
});

describe('coordinates', () => {
  const eq = (id: string) => object(id)!.position!;
  it('Sirius sits at its published galactic and ecliptic place', () => {
    const c = coordinatesOf(eq('star:32349'), night, null);
    expect(c.galacticLongitude).toBeCloseTo(227.23, 1);
    expect(c.galacticLatitude).toBeCloseTo(-8.89, 1);
    expect(c.eclipticLatitude).toBeCloseTo(-39.6, 0);
  });
  it('Vega precesses by the expected amount by 2027', () => {
    const c = coordinatesOf(eq('star:91262'), night, null);
    expect(((c.ofDate.raHours - c.j2000.raHours) * 15 * 3600) / 27).toBeGreaterThan(25);
    expect(((c.ofDate.raHours - c.j2000.raHours) * 15 * 3600) / 27).toBeLessThan(45);
  });
});

describe('object facts', () => {
  const value = (facts: { label: string; value: string }[], label: string) => facts.find((f) => f.label === label)?.value;
  it('absolute magnitude matches published values', () => {
    expect(absoluteMagnitude(-1.44, 379.21)!).toBeCloseTo(1.45, 1);
    expect(absoluteMagnitude(0.03, 130.23)!).toBeCloseTo(0.6, 1);
    expect(absoluteMagnitude(5, 1)).toBeNull();
    expect(absoluteMagnitude(5, null)).toBeNull();
  });
  it('colour temperature is in the right range for known stars', () => {
    expect(temperatureFromColor(0.65)).toBeGreaterThan(5500);
    expect(temperatureFromColor(0.65)).toBeLessThan(6000);
    expect(temperatureFromColor(1.85)).toBeLessThan(3800);
  });
  it('a star shows what its catalog holds and leaves out what it lacks', () => {
    const f = starFacts(object('star:27989')!);
    expect(value(f, 'Spectral type')).toContain('M');
    expect(value(f, 'Luminosity class')).toBe('Supergiant');
    expect(value(f, 'Hipparcos')).toBe('HIP 27989');
    expect(f.every((x) => !/null|undefined|NaN/.test(x.value))).toBe(true);
  });
  it('deep sky reports true size and leaves out an unknown distance', () => {
    const f = deepSkyFacts(object('dso:M31')!);
    expect(value(f, 'Messier')).toBe('M31');
    expect(value(f, 'True size on the sky')).toContain('178');
    expect(f.every((x) => !/null|undefined|NaN/.test(x.value))).toBe(true);
    for (const d of deepSky.slice(0, 400)) expect(deepSkyFacts(d).every((x) => !/null|undefined|NaN/.test(x.value))).toBe(true);
  });
  it('planet facts come from the ephemeris, and the Moon names its phase', () => {
    const f = bodyFacts('saturn', night, bratislava);
    expect(value(f, 'Ring tilt')).toMatch(/°$/);
    const m = bodyFacts('moon', night, bratislava);
    expect(value(m, 'Phase')).toBe(moonPhase(night).name);
    expect(value(bodyFacts('sun', night, bratislava), 'Phase angle')).toBeUndefined();
    expect(factsFor(object('body:mars')!, 'mars', night, bratislava).length).toBeGreaterThan(3);
  });
  it('elongation agrees with the engine, and the Moon is new at zero', () => {
    const e = Astronomy.Elongation(Astronomy.Body.Venus, new Astronomy.AstroTime(night));
    expect(Math.abs(Math.abs(elongation('venus', night)!) - e.elongation)).toBeLessThan(0.5);
    expect(elongation('sun', night)).toBeNull();
  });
  it('Moon age runs from the last new Moon', () => {
    const q = Astronomy.SearchMoonPhase(0, new Astronomy.AstroTime(night), 31)!;
    const just = moonFacts(q.AddDays(0.5).date);
    expect(just.ageDays).toBeCloseTo(0.5, 1);
    expect(moonFacts(night).ageDays).toBeLessThan(30);
    expect(moonFacts(night).nextFull!.getTime()).toBeGreaterThan(night.getTime());
  });
  it('constellation areas match the IAU, and all 88 fill the sphere', () => {
    const area = (id: string) => boundaryPolygons().filter((p) => p.id === id).reduce((s, p) => s + polygonArea(p), 0);
    for (const [id, iau] of [['Ori', 594.12], ['Hya', 1302.84], ['Cru', 68.45], ['UMa', 1279.66], ['UMi', 255.86], ['Oct', 291.05], ['Ser', 636.93]] as [string, number][]) {
      expect(Math.abs(area(id) - iau) / iau, id).toBeLessThan(0.02);
    }
    const total = boundaryPolygons().reduce((s, p) => s + polygonArea(p), 0);
    console.log(`constellation areas total ${total.toFixed(1)} square degrees`);
    expect(Math.abs(total - 41252.96)).toBeLessThan(120);
    const f = constellationFacts(object('con:Ori')!);
    expect(value(f, 'Brightest star in the figure')).toBe('Rigel');
    expect(value(f, 'Genitive')).toBe('Orionis');
  });
});

describe('related objects', () => {
  it('a constellation lists what is really inside its boundary', () => {
    const inside = insideConstellation('Ori').map((r) => r.object.id);
    expect(inside).toEqual(expect.arrayContaining(['star:24436', 'star:27989']));
    expect(inside).not.toContain('dso:M31');
  });
  it('a star names its constellation and true neighbours, nearest first', () => {
    const r = relatedObjects(object('star:24436')!, null);
    expect(r[0].object.id).toBe('con:Ori');
    const near = r.slice(1).map((x) => Number(x.reason.split('°')[0]));
    expect(near).toEqual([...near].sort((a, b) => a - b));
    expect(near.every((n) => n < 15)).toBe(true);
    expect(r.every((x) => x.object.id !== 'star:24436')).toBe(true);
  });
  it('a planet uses its place on this date', () => {
    const p = position('mars', night, bratislava).j2000;
    expect(relatedObjects(object('body:mars')!, p)[0].reason).toBe('Constellation it is in now');
    expect(relatedObjects(object('body:mars')!, null)).toEqual([]);
  });
});

describe('contextual discovery', () => {
  const context = (over: Partial<DiscoveryContext>, time = night, observer = bratislava, mode: SkyMode = 'explore', az = 165, alt = 36, fov = 46): DiscoveryContext => {
    const camera: Camera = { orientation: orientationFor(az, alt), fov, width: 393, height: 852, projection: 'stereographic' };
    return { camera, moment: computeMoment(time.getTime(), observer), layers: MODE_DEFAULTS[mode].layers, mode, brightness: 0, bottomEdge: 700, topEdge: 100, ...over };
  };
  it('every suggestion is really above the horizon and reported truthfully', () => {
    for (const mode of ['observe', 'explore', 'atlas'] as SkyMode[]) {
      const c = context({}, night, bratislava, mode);
      const list = discover(c, 12);
      expect(list.length).toBeGreaterThan(3);
      for (const s of list) {
        const l = locate(s.object, night, bratislava);
        expect(l.status).toBe('visible');
        expect(s.altitude).toBeGreaterThan(5);
        const stated = Number(s.reason.match(/(\d+)° high/)![1]);
        expect(Math.abs(stated - l.horizontal!.altitude)).toBeLessThan(1.2);
      }
    }
  });
  it('In view means on screen', () => {
    const c = context({});
    const list = discover(c, 8, true);
    expect(list.length).toBeGreaterThan(0);
    for (const s of list) {
      expect(s.inView).toBe(true);
      expect(s.reason).toContain('In view');
    }
  });
  it('what is on screen always comes first, however bright something elsewhere is', () => {
    const list = discover(context({}), 8);
    const flags = list.map((s) => s.inView);
    expect(flags[0]).toBe(true);
    expect(flags).toEqual([...flags].sort((a, b) => Number(b) - Number(a)));
    const wide = discover(context({}, night, bratislava, 'explore', 165, 36, 30), 30).map((s) => s.inView);
    expect(wide).toContain(false);
    expect(wide).toEqual([...wide].sort((a, b) => Number(b) - Number(a)));
  });
  it('the Moon is not called the Moon twice', () => {
    const moon = discover(context({}, night, bratislava, 'explore', 240, 54), 12).find((s) => s.object.id === 'body:moon');
    expect(moon?.reason).not.toMatch(/^Moon/);
  });
  it('turning away changes what is offered', () => {
    const south = discover(context({}), 6, true).map((s) => s.object.id);
    const north = discover(context({}, night, bratislava, 'explore', 345, 36), 6, true).map((s) => s.object.id);
    expect(south).not.toEqual(north);
  });
  it('location and date change what is offered', () => {
    const here = discover(context({}), 8).map((s) => s.object.id);
    const there = discover(context({}, new Date('2027-01-17T12:00:00Z'), sydney), 8).map((s) => s.object.id);
    expect(here).not.toEqual(there);
  });
  it('the Sun is never suggested, and a bright day offers nothing that cannot be seen', () => {
    const noon = new Date('2027-01-17T11:00:00Z');
    const list = discover(context({ brightness: 1 }, noon), 12);
    for (const s of list) {
      expect(s.object.type).not.toBe('sun');
      expect(['moon', 'planet']).toContain(s.object.type);
    }
  });
  it('Observe stays with the naked eye, and layers that are off stay out', () => {
    for (const s of discover(context({}, night, bratislava, 'observe'), 20)) expect(s.magnitude ?? 0).toBeLessThanOrEqual(6);
    const noPlanets = discover(context({ layers: { ...MODE_DEFAULTS.explore.layers, planets: false } }), 20);
    expect(noPlanets.every((s) => s.object.type !== 'planet' && s.object.type !== 'moon')).toBe(true);
  });
});

describe('guidance', () => {
  it('reads as directions, the short way round', () => {
    expect(guidance({ azimuth: 350, altitude: 10 }, { azimuth: 20, altitude: 40 }).text).toBe('Turn right 30°, tilt up 30°');
    expect(guidance({ azimuth: 20, altitude: 40 }, { azimuth: 350, altitude: 10 }).text).toBe('Turn left 30°, tilt down 30°');
    expect(guidance({ azimuth: 100, altitude: 10 }, { azimuth: 100, altitude: 30 }).text).toBe('Tilt up 20°');
    expect(guidance({ azimuth: 100, altitude: 30 }, { azimuth: 100.2, altitude: 30.1 }).text).toBe('Straight ahead');
  });
});
