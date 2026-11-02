// Stage 3: the 3D scene, picking, and the Moon Atlas against the real shipped catalog and tile
// pack. The JPL comparisons for positions and orientation are in solar-v1.test.ts.
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { dot, mul, RAD, Vec3 } from '../src/astronomy/core';
import { moonGeometry, surfacePoint } from '../src/astronomy/moonGeometry';
import { cameraBasis, OrbitCamera, projectPoint } from '../src/astronomy/orbitCamera';
import { displayDistance, heliocentricEcliptic, PLANET_IDS } from '../src/astronomy/solar';
import { earthViewCamera, featureAt, featureRing, formatElevation, formatLunarPosition, MOON_KM, sunLine, surfaceAt, visibleFeatures, WHOLE } from '../src/features/moon/atlas';
import { bytesToText, FeatureIndex, parseFeatures, tileAt, tileIndex } from '../src/features/moon/moonData';
import { TileCache } from '../src/features/moon/tileCache';
import { distancesFor, FOCUS_DISTANCE, localOrbits, localReach, localScene, moonDistanceKm, moonsOf, orbitPath, overviewCamera, pickGlobe, sunlitView, systemOf, systemScene } from '../src/features/solar/scene';

const WHEN = new Date('2027-01-17T20:25:00Z');
const W = 393, H = 852;

const features = parseFeatures(bytesToText(new Uint8Array(fs.readFileSync('assets/moon/moon-features-v1.db'))));
const index = new FeatureIndex(features);
const byName = (name: string) => features.find((f) => f.name === name)!;
const moonCam = (lat: number, lon: number, distance = WHOLE): OrbitCamera => ({ target: [0, 0, 0], yaw: lon, pitch: lat, distance, roll: 0, fov: 40, width: W, height: H });

const angle = (a: Vec3, b: Vec3) => Math.acos(Math.max(-1, Math.min(1, dot(a, b) / Math.hypot(...a) / Math.hypot(...b)))) * RAD;

describe('the system scene', () => {
  const scene = systemScene(WHEN, 'illustrative');
  it('holds the Sun and eight planets, Sun at the centre', () => {
    expect(scene.map((g) => g.id)).toEqual(['sun', ...PLANET_IDS]);
    expect(scene[0].position).toEqual([0, 0, 0]);
  });
  it('lights each planet from the true direction of the Sun, in either scale', () => {
    for (const mode of ['illustrative', 'true'] as const) {
      for (const g of systemScene(WHEN, mode).slice(1)) {
        const real = heliocentricEcliptic(g.id as (typeof PLANET_IDS)[number], WHEN);
        expect(angle(g.sun, [-real[0], -real[1], -real[2]]), g.id).toBeLessThan(1e-4);
      }
    }
  });
  it('fits Neptune’s orbit across a phone in the opening view', () => {
    const c = overviewCamera('illustrative', W, H), b = cameraBasis(c), o = orbitPath('neptune', WHEN, 'illustrative');
    for (let i = 0; i < o.length; i += 3) {
      const p = projectPoint(c, b, [o[i], o[i + 1], o[i + 2]])!;
      expect(p.x).toBeGreaterThan(-20); expect(p.x).toBeLessThan(W + 20);
    }
  });
  it('fits Neptune’s orbit in true scale too', () => {
    const c = overviewCamera('true', W, H), b = cameraBasis(c), o = orbitPath('neptune', WHEN, 'true');
    for (let i = 0; i < o.length; i += 3) { const p = projectPoint(c, b, [o[i], o[i + 1], o[i + 2]])!; expect(Math.abs(p.x - W / 2)).toBeLessThan(W / 2 + 20); }
  });
  it('draws each orbit through the planet’s own distance', () => {
    for (const id of PLANET_IDS) {
      const o = orbitPath(id, WHEN, 'illustrative'), radii: number[] = [];
      for (let i = 0; i < o.length; i += 3) radii.push(Math.hypot(o[i], o[i + 1], o[i + 2]));
      const now = displayDistance(Math.hypot(...heliocentricEcliptic(id, WHEN)), 'illustrative');
      expect(now, id).toBeGreaterThan(Math.min(...radii) * 0.97);
      expect(now, id).toBeLessThan(Math.max(...radii) * 1.03);
    }
  });
});

describe('body orientation in the scene', () => {
  const subSolar = (date: Date) => {
    const e = systemScene(date, 'true').find((g) => g.id === 'earth')!;
    const s = mul(e.toBody, e.sun);
    return { lat: Math.asin(s[2]) * RAD, lon: Math.atan2(s[1], s[0]) * RAD };
  };
  it('puts the Sun over the tropic at the June solstice', () => {
    expect(subSolar(new Date('2027-06-21T12:00:00Z')).lat).toBeCloseTo(23.43, 0);
  });
  it('puts the Sun over the Greenwich meridian near noon UTC, so Earth’s map is aligned', () => {
    // On this date the equation of time is small, about a minute and a half.
    expect(Math.abs(subSolar(new Date('2027-06-13T12:00:00Z')).lon)).toBeLessThan(1);
  });
  it('keeps the frames as pure rotations', () => {
    for (const g of systemScene(WHEN, 'true')) {
      const m = g.toBody;
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) expect(m[i * 3] * m[j * 3] + m[i * 3 + 1] * m[j * 3 + 1] + m[i * 3 + 2] * m[j * 3 + 2], g.id).toBeCloseTo(i === j ? 1 : 0, 9);
    }
  });
});

describe('the local scene', () => {
  it('puts the body in focus at the origin with radius one', () => {
    for (const id of ['jupiter', 'io', 'earth', 'moon'] as const) {
      const g = localScene(id, WHEN).find((x) => x.id === id)!;
      expect(Math.hypot(...g.position), id).toBeCloseTo(0, 9);
      expect(g.radius, id).toBeCloseTo(1, 9);
    }
  });
  it('keeps true sizes and distances between Earth and the Moon', () => {
    const s = localScene('earth', WHEN), m = s.find((g) => g.id === 'moon')!;
    expect(m.radius).toBeCloseTo(1737.4 / 6378.137, 3);
    expect(Math.hypot(...m.position)).toBeGreaterThan(55);
    expect(Math.hypot(...m.position)).toBeLessThan(64);
  });
  it('keeps true distances to the Galilean moons', () => {
    const s = localScene('jupiter', WHEN), r = (id: string) => Math.hypot(...s.find((g) => g.id === id)!.position);
    expect(r('io')).toBeCloseTo(421800 / 71492, 0);
    expect(r('callisto')).toBeGreaterThan(25.5);
    expect(r('callisto')).toBeLessThan(27.5);
  });
  it('turns a moon’s near side to its planet', () => {
    const s = localScene('jupiter', WHEN), io = s.find((g) => g.id === 'io')!;
    const toJupiter: Vec3 = [-io.position[0], -io.position[1], -io.position[2]];
    const fixed = mul(io.toBody, toJupiter), n = Math.hypot(...fixed);
    expect(Math.abs(Math.atan2(fixed[1], fixed[0]) * RAD)).toBeLessThan(0.1);
    expect(Math.abs(Math.asin(fixed[2] / n) * RAD)).toBeLessThan(0.1);
  });
  it('shows moons only for the bodies with verified models', () => {
    expect(moonsOf('earth')).toEqual(['moon']);
    expect(moonsOf('jupiter')).toEqual(['io', 'europa', 'ganymede', 'callisto']);
    for (const id of ['mercury', 'venus', 'mars', 'saturn', 'uranus', 'neptune', 'sun'] as const) expect(moonsOf(id), id).toEqual([]);
    expect(systemOf('europa')).toBe('jupiter');
    expect(systemOf('moon')).toBe('earth');
  });
  it('traces moon orbits at their real size', () => {
    const io = localOrbits('jupiter', WHEN).find((o) => o.id === 'io')!.points;
    for (let i = 0; i < io.length; i += 3) expect(Math.hypot(io[i], io[i + 1], io[i + 2])).toBeCloseTo(421800 / 71492, 0);
    const moon = localOrbits('earth', WHEN)[0].points;
    for (let i = 0; i < moon.length; i += 3) { const r = Math.hypot(moon[i], moon[i + 1], moon[i + 2]); expect(r).toBeGreaterThan(55); expect(r).toBeLessThan(64); }
  });
  it('can always pull back past the outermost moon', () => {
    expect(localReach('jupiter', WHEN)).toBeGreaterThan(27);
    expect(localReach('earth', WHEN)).toBeGreaterThan(60);
    expect(localReach('mercury', WHEN)).toBeGreaterThanOrEqual(12);
  });
  it('reports distances from true positions', () => {
    const d = distancesFor('jupiter', WHEN);
    expect(d.fromSunAU).toBeGreaterThan(4.9); expect(d.fromSunAU).toBeLessThan(5.5);
    expect(d.fromEarthAU).toBeGreaterThan(3.9);
    expect(distancesFor('earth', WHEN).fromEarthAU).toBeNull();
    expect(moonDistanceKm('moon', WHEN)).toBeGreaterThan(356000);
    expect(moonDistanceKm('moon', WHEN)).toBeLessThan(407000);
    expect(moonDistanceKm('jupiter', WHEN)).toBeNull();
  });
});

describe('camera choices', () => {
  it('arrives on the sunlit side', () => {
    for (const g of systemScene(WHEN, 'true').slice(1)) {
      const v = sunlitView(g.sun, -70, 30), c: OrbitCamera = { target: [0, 0, 0], ...v, distance: FOCUS_DISTANCE, roll: 0, fov: 50, width: W, height: H };
      expect(angle(cameraBasis(c).eye, g.sun), g.id).toBeLessThan(50);
    }
  });
  it('leaves the view alone for the Sun, which lights itself', () => {
    expect(sunlitView([0, 0, 1], -70, 30)).toEqual({ yaw: -70, pitch: 30 });
  });
});

describe('picking', () => {
  const c = overviewCamera('illustrative', W, H), b = cameraBasis(c), scene = systemScene(WHEN, 'illustrative');
  it('finds each planet at its projected position', () => {
    for (const g of scene) {
      const p = projectPoint(c, b, g.position)!;
      const others = scene.filter((o) => o.id !== g.id).map((o) => projectPoint(c, b, o.position)!);
      if (others.some((o) => Math.hypot(o.x - p.x, o.y - p.y) < 20)) continue;
      expect(pickGlobe(scene, c, b, p.x, p.y, 8), g.id).toBe(g.id);
    }
  });
  it('chooses the planet the finger is on over a nearer one close by', () => {
    const big = { ...scene[1], id: 'jupiter' as const, position: [-3, 0, 0] as Vec3, radius: 0.3 }, small = { ...scene[1], id: 'mars' as const, position: [3, 0.3, 0] as Vec3, radius: 0.02 };
    const look: OrbitCamera = { ...c, yaw: 0, pitch: 0 }, lb = cameraBasis(look), p = projectPoint(look, lb, big.position)!;
    expect(pickGlobe([big, small], look, lb, p.x, p.y)).toBe('jupiter');
  });
  it('picks the nearest of two tiny bodies by distance from the finger', () => {
    const a = { ...scene[1], id: 'mars' as const, position: [0, -0.4, 0] as Vec3, radius: 0.001 }, d = { ...scene[1], id: 'venus' as const, position: [0, 0.4, 0] as Vec3, radius: 0.001 };
    const look: OrbitCamera = { ...c, yaw: 0, pitch: 0, distance: 30 }, lb = cameraBasis(look), p = projectPoint(look, lb, d.position)!;
    expect(pickGlobe([a, d], look, lb, p.x - 2, p.y)).toBe('venus');
  });
  it('finds nothing in empty space', () => {
    expect(pickGlobe(scene, c, b, 8, 8)).toBeNull();
  });
  it('prefers the body nearer the camera where two overlap', () => {
    const far = { ...scene[1], id: 'mars' as const, position: [-5, 0, 0] as Vec3 }, near = { ...scene[1], id: 'venus' as const, position: [5, 0, 0] as Vec3 };
    const look: OrbitCamera = { ...c, yaw: 0, pitch: 0 }, lb = cameraBasis(look);
    expect(pickGlobe([far, near], look, lb, W / 2, H / 2)).toBe('venus');
  });
  it('ignores what’s behind the camera', () => {
    const look: OrbitCamera = { ...c, target: [0, 0, 0], yaw: 0, pitch: 0, distance: 2 };
    const behind = { ...scene[1], position: [5, 0, 0] as Vec3 };
    expect(pickGlobe([behind], look, cameraBasis(look), W / 2, H / 2)).toBeNull();
  });
});

describe('Moon Atlas labels', () => {
  it('names the great maria on the whole disc', () => {
    const c = moonCam(0, 0), names = visibleFeatures(features, c, cameraBasis(c)).map((v) => v.feature.name);
    for (const n of ['Mare Imbrium', 'Mare Serenitatis', 'Mare Tranquillitatis', 'Oceanus Procellarum']) expect(names, n).toContain(n);
  });
  it('places a label exactly over its coordinates', () => {
    const t = byName('Tycho'), c = moonCam(t.lat, t.lon, 1.4), v = visibleFeatures(features, c, cameraBasis(c)).find((x) => x.feature.name === 'Tycho')!;
    expect(v.x).toBeCloseTo(W / 2, 6);
    expect(v.y).toBeCloseTo(H / 2, 6);
  });
  it('never names a feature on the far side of the globe', () => {
    const c = moonCam(0, 180), b = cameraBasis(c);
    for (const v of visibleFeatures(features, c, b)) expect(dot(surfacePoint(v.feature.lat, v.feature.lon), b.eye)).toBeGreaterThan(1);
    expect(visibleFeatures(features, c, b).map((v) => v.feature.name)).not.toContain('Mare Imbrium');
  });
  it('shows more and smaller names as the camera closes in', () => {
    const far = moonCam(-30, 0), near = moonCam(-30, 0, 1.25);
    const a = visibleFeatures(features, far, cameraBasis(far)), b = visibleFeatures(features, near, cameraBasis(near));
    expect(Math.min(...b.map((v) => v.feature.diameter))).toBeLessThan(Math.min(...a.map((v) => v.feature.diameter)));
  });
  it('keeps to the budget', () => {
    const c = moonCam(0, 0, 1.15);
    expect(visibleFeatures(features, c, cameraBasis(c), 20).length).toBeLessThanOrEqual(20);
  });
});

describe('Moon Atlas tapping', () => {
  it('turns a screen point back into the same surface point', () => {
    const c = moonCam(12, -30, 2), b = cameraBasis(c);
    for (const [lat, lon] of [[12, -30], [30, -10], [-5, -50]]) {
      const p = projectPoint(c, b, surfacePoint(lat, lon))!, s = surfaceAt(c, b, p.x, p.y)!;
      expect(s.lat).toBeCloseTo(lat, 5);
      expect(s.lon).toBeCloseTo(lon, 5);
    }
  });
  it('still lands true with the picture shifted and turned', () => {
    const c: OrbitCamera = { ...moonCam(12, -30, 2), shiftY: 60, roll: 25 }, b = cameraBasis(c);
    const p = projectPoint(c, b, surfacePoint(30, -10))!, s = surfaceAt(c, b, p.x, p.y)!;
    expect(s.lat).toBeCloseTo(30, 5);
    expect(s.lon).toBeCloseTo(-10, 5);
  });
  it('reports a miss beyond the limb', () => {
    const c = moonCam(0, 0), b = cameraBasis(c);
    expect(surfaceAt(c, b, 2, 2)).toBeNull();
  });
  it('selects what’s under the finger, smallest first', () => {
    const t = byName('Tycho');
    expect(featureAt(features, t.lat, t.lon, 40, 20)?.name).toBe('Tycho');
    const i = byName('Mare Imbrium');
    expect(featureAt(features, i.lat, i.lon, 40, 400)?.name).toBe('Mare Imbrium');
  });
  it('doesn’t select a pit too small to see at this zoom', () => {
    const picked = featureAt(features, 32.8, -15.6, 20, 200);
    expect(picked?.diameter ?? 999).toBeGreaterThanOrEqual(200);
  });
  it('draws the outline at the feature’s true size', () => {
    const t = byName('Tycho'), centre = surfacePoint(t.lat, t.lon);
    for (const p of featureRing(t, 16)) {
      expect(Math.hypot(...p)).toBeCloseTo(1, 9);
      expect(Math.acos(dot(p, centre)) * MOON_KM).toBeCloseTo(t.diameter / 2, 3);
    }
  });
});

describe('Earth view', () => {
  const c0 = moonCam(0, 0);
  for (const when of ['2027-01-17T20:25:00Z', '2027-02-21T04:00:00Z', '2027-06-30T12:00:00Z']) {
    const date = new Date(when), g = moonGeometry(date), c = earthViewCamera(date, c0), b = cameraBasis(c);
    it(`looks straight at the sub-Earth point on ${when.slice(0, 10)}`, () => {
      const p = projectPoint(c, b, surfacePoint(g.subEarth.lat, g.subEarth.lon))!;
      expect(p.x).toBeCloseTo(W / 2, 6);
      expect(p.y).toBeCloseTo(H / 2, 6);
    });
    it(`turns lunar north to its position angle on the sky on ${when.slice(0, 10)}`, () => {
      // East is on the left of a north-up view of the sky.
      const pole = projectPoint(c, b, [0, 0, 1])!;
      const seen = (Math.atan2(-(pole.x - W / 2), H / 2 - pole.y) * RAD + 360) % 360;
      const expected = (g.poleAngle + 360) % 360;
      expect(Math.abs(((seen - expected + 540) % 360) - 180)).toBeLessThan(0.01);
    });
  }
  it('lights the western limb, on the right, while the Moon waxes', () => {
    const date = new Date('2027-01-17T20:25:00Z'), g = moonGeometry(date), c = earthViewCamera(date, c0), b = cameraBasis(c);
    expect(dot(g.sun, b.right)).toBeGreaterThan(0.3);
  });
});

describe('the tile pack', () => {
  const pack = fs.readFileSync('assets/moon/moon-tiles-v1.db');
  const reader = (offset: number, length: number) => Promise.resolve(new Uint8Array(pack.subarray(offset, offset + length)));
  const open = async (read = reader, capacity = 3) => {
    let ready = 0, disposed = 0;
    const cache = new TileCache<Uint8Array>({ read, decode: (b) => b, dispose: () => { disposed++; }, onReady: () => { ready++; } }, capacity);
    await cache.open();
    return { cache, ready: () => ready, disposed: () => disposed };
  };
  const settle = () => new Promise((r) => setTimeout(r, 15));
  const jpeg = (b: Uint8Array) => b[0] === 0xff && b[1] === 0xd8;

  it('reads real JPEG tiles and verifies them', async () => {
    const { cache, ready } = await open();
    const t = tileAt(1, 33, -15);
    expect(cache.get(t)).toBeNull();
    await settle();
    expect(jpeg(cache.get(t)!)).toBe(true);
    expect(ready()).toBe(1);
  });
  it('holds only as many tiles as allowed, dropping the least recent', async () => {
    const { cache, disposed } = await open();
    for (const lon of [-160, -110, -60, -10, 40]) { cache.get(tileAt(1, 10, lon)); await settle(); }
    expect(cache.loaded).toBe(3);
    expect(disposed()).toBe(2);
  });
  it('rejects a damaged tile and doesn’t ask for it again', async () => {
    let reads = 0;
    const damaged = (offset: number, length: number) => {
      if (length > 1000) reads++;
      return reader(offset, length).then((b) => { if (length > 1000 && length < 500_000) b[100] ^= 255; return b; });
    };
    const { cache } = await open(damaged);
    const before = reads, t = tileAt(2, 0, 0);
    cache.get(t); await settle();
    expect(cache.get(t)).toBeNull(); await settle();
    expect(cache.failures).toBe(1);
    expect(reads - before).toBe(1);
  });
  it('falls back to the base map when the pack can’t be opened', async () => {
    const { cache } = await open(() => Promise.reject(new Error('gone')));
    expect(cache.unavailable).toBe(true);
    expect(cache.get(tileAt(1, 0, 0))).toBeNull();
    expect(cache.loaded).toBe(0);
  });
  it('rejects a file that isn’t a tile pack', async () => {
    const { cache } = await open(() => Promise.resolve(new Uint8Array(4096)));
    expect(cache.unavailable).toBe(true);
  });
  it('holds every tile in its level', () => {
    expect(new Set([tileIndex({ level: 1, col: 7, row: 3 }), tileIndex({ level: 2, col: 0, row: 0 })]).size).toBe(2);
    expect(tileIndex({ level: 2, col: 15, row: 7 })).toBe(159);
  });
});

describe('what the card says', () => {
  it('formats position with hemispheres', () => {
    expect(formatLunarPosition(-43.31, -11.36)).toBe('43.3° S, 11.4° W');
    expect(formatLunarPosition(32.8, 15.6)).toBe('32.8° N, 15.6° E');
  });
  it('formats elevation with a sign', () => {
    expect(formatElevation(-2900)).toBe('−2.9 km');
    expect(formatElevation(1200)).toBe('+1.2 km');
  });
  it('describes the Sun plainly', () => {
    expect(sunLine(15.4)).toBe('Sun 15° up');
    expect(sunLine(-12)).toBe('In lunar night');
    expect(sunLine(0.1)).toBe('Sun on the horizon');
  });
  it('searches the real catalog', () => {
    expect(index.search('tycho')[0].name).toBe('Tycho');
    expect(index.search('tranquillitatis')[0].name).toBe('Mare Tranquillitatis');
    expect(index.search('copernicas')[0]?.name).toBe('Copernicus');
  });
});

describe('frame cost in Node, as a floor and not a device result', () => {
  const measure = (fn: () => void, n = 40) => {
    const t = performance.now();
    for (let i = 0; i < n; i++) fn();
    return (performance.now() - t) / n;
  };
  it('prepares a system frame within budget', () => {
    let i = 0;
    const ms = measure(() => { systemScene(new Date(WHEN.getTime() + i++ * 3_600_000), 'illustrative'); });
    console.log(`systemScene ${ms.toFixed(2)} ms`);
    expect(ms).toBeLessThan(8);
  });
  it('prepares a local frame within budget', () => {
    let i = 0;
    const ms = measure(() => { localScene('jupiter', new Date(WHEN.getTime() + i++ * 3_600_000)); });
    console.log(`localScene ${ms.toFixed(2)} ms`);
    expect(ms).toBeLessThan(8);
  });
  it('filters 9,087 features within budget', () => {
    const c = moonCam(0, 0, 1.3), b = cameraBasis(c);
    const ms = measure(() => { visibleFeatures(features, c, b); });
    console.log(`visibleFeatures ${ms.toFixed(2)} ms`);
    expect(ms).toBeLessThan(6);
  });
  it('resolves a tap within budget', () => {
    const ms = measure(() => { featureAt(features, 10, 20, 30, 10); });
    console.log(`featureAt ${ms.toFixed(2)} ms`);
    expect(ms).toBeLessThan(16);
  });
  it('computes the Moon’s state within budget', () => {
    let i = 0;
    const ms = measure(() => { moonGeometry(new Date(WHEN.getTime() + i++ * 3_600_000)); });
    console.log(`moonGeometry ${ms.toFixed(2)} ms`);
    expect(ms).toBeLessThan(4);
  });
});
