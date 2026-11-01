import { describe, expect, it } from 'vitest';
import { anchorView, Camera, dragView, focusView, framingFov, lowestView, orientationFor, project, unproject } from '../src/astronomy/camera';
import { angleBetween, Astronomy, equatorialVector, horizontalVector, j2000ToHorizon, mul, Observer, vectorEquatorial, vectorHorizontal } from '../src/astronomy/core';
import { constellations, object, starDirection, stars } from '../src/data/catalog';
import { boundaryPolygons, gridLabel, gridLines, gridStep, gridToJ2000, lonLat, polygonContains } from '../src/features/sky/grids';
import { labelAt, LabelCandidate, placeLabels, PRIORITY } from '../src/features/sky/labels';
import { clampTop, panelStops, restingDetent } from '../src/features/sky/detents';
import { buildStarField, computeMoment, deepGroup, hitCandidates, HitContext, hitTest, newCellBuffer, querySky, visibleDeepSky, yearsSinceJ2000 } from '../src/features/sky/scene';
import { DEFAULT_LAYERS, fovForMagnitude, labelBudget, labelLimit, migrateSkySettings, MODE_DEFAULTS, NO_CAP, SkyMode, starLimit } from '../src/state/skyModes';

const site: Observer = { latitude: 48.1486, longitude: 17.1077, elevation: 134 };
const when = new Date('2027-01-17T20:25:00Z');
const original = (fov: number, brightness: number, moving: boolean) => {
  // The formula the renderer used before the modes, copied here to hold Explore to it.
  const l = Math.max(0, Math.log10(60 / Math.max(fov, 0.5)));
  return 6.1 + 2.2 * l - 7 * brightness + Math.max(0, 3.2 * Math.log10(60 / fov)) - (moving ? 0.5 : 0);
};

describe('sky modes', () => {
  it('Explore keeps the original star limit exactly', () => {
    for (const fov of [2, 5, 17, 26, 46, 60, 90, 150]) for (const b of [0, 0.3, 1]) for (const moving of [false, true]) {
      expect(starLimit('explore', MODE_DEFAULTS.explore, fov, b, moving)).toBeCloseTo(original(fov, b, moving), 9);
    }
  });
  it('Explore keeps today layers, and the new layers start off', () => {
    const l = MODE_DEFAULTS.explore.layers;
    expect([l.constellations, l.labels, l.deepSky, l.planets, l.milkyWay, l.artwork, l.ground, l.framing]).toEqual(Array(8).fill(true));
    expect([l.boundaries, l.gridEquatorial, l.gridHorizontal, l.gridEcliptic, l.gridGalactic]).toEqual(Array(5).fill(false));
  });
  it('Observe stays near the naked eye at any zoom, Deep Atlas goes deeper than Explore', () => {
    for (const fov of [2, 10, 46, 120]) {
      expect(starLimit('observe', MODE_DEFAULTS.observe, fov, 0, false)).toBeLessThanOrEqual(6.5);
      expect(starLimit('atlas', MODE_DEFAULTS.atlas, fov, 0, false)).toBeGreaterThan(starLimit('explore', MODE_DEFAULTS.explore, fov, 0, false));
    }
    expect(starLimit('atlas', MODE_DEFAULTS.atlas, 10, 0, false)).toBeGreaterThan(8);
  });
  it('the density and magnitude controls change the limit', () => {
    const base = MODE_DEFAULTS.explore;
    expect(starLimit('explore', { ...base, density: 1 }, 46, 0, false) - starLimit('explore', base, 46, 0, false)).toBeCloseTo(1.5, 6);
    expect(starLimit('explore', { ...base, density: 0 }, 46, 0, false) - starLimit('explore', base, 46, 0, false)).toBeCloseTo(-1.5, 6);
    expect(starLimit('explore', { ...base, magnitudeCap: 4 }, 46, 0, false)).toBe(4);
  });
  it('label density moves the cutoff and the budget, and Explore starts where it always did', () => {
    expect(labelLimit('explore', 0.5, 46)).toBe(1);
    expect(labelLimit('explore', 0.5, 12)).toBe(2.6);
    expect(labelLimit('explore', 0.5, 5)).toBe(4.2);
    expect(labelLimit('atlas', 0.7, 5)).toBeGreaterThan(labelLimit('observe', 0.3, 5));
    expect(labelBudget(0.9)).toBeGreaterThan(labelBudget(0.1));
  });
  it('a file saved before the modes keeps its layers, as Explore', () => {
    const { skyMode, modes } = migrateSkySettings({ layers: { ...DEFAULT_LAYERS, framing: false, artwork: false } });
    expect(skyMode).toBe('explore');
    expect(modes.explore.layers.framing).toBe(false);
    expect(modes.explore.layers.artwork).toBe(false);
    expect(modes.explore.layers.stars).toBe(true);
    expect(modes.atlas.layers.framing).toBe(false);
    expect(modes.observe.layers.constellations).toBe(false);
  });
  it('per-mode choices survive, and missing or corrupt fields fall back', () => {
    const saved = migrateSkySettings({ skyMode: 'atlas', modes: { atlas: { ...MODE_DEFAULTS.atlas, density: 0.9, layers: { ...MODE_DEFAULTS.atlas.layers, gridGalactic: true } } } });
    expect(saved.skyMode).toBe('atlas');
    expect(saved.modes.atlas.density).toBe(0.9);
    expect(saved.modes.atlas.layers.gridGalactic).toBe(true);
    expect(saved.modes.observe).toEqual(MODE_DEFAULTS.observe);
    expect(migrateSkySettings({ skyMode: 'nonsense' as SkyMode }).skyMode).toBe('explore');
    expect(migrateSkySettings({}).modes.explore.magnitudeCap).toBe(NO_CAP);
  });
});

describe('labels', () => {
  const box = (x: number, y: number) => ({ x, y, w: 60, h: 16 });
  const bounds = { w: 393, top: 0, bottom: 700 };
  const overlap = (a: ReturnType<typeof box>, b: ReturnType<typeof box>) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  it('never overlap, however dense the sky', () => {
    let seed = 3;
    const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; };
    const many: LabelCandidate[] = Array.from({ length: 600 }, (_, i) => {
      const x = rand() * 330, y = rand() * 680;
      return { text: `s${i}`, style: 'star', priority: rand() * 500, boxes: [box(x, y), box(x - 70, y), box(x, y - 20)] };
    });
    const placed = placeLabels(many, bounds, 500);
    expect(placed.length).toBeGreaterThan(40);
    for (let i = 0; i < placed.length; i++) for (let j = i + 1; j < placed.length; j++) expect(overlap(placed[i].box, placed[j].box)).toBe(false);
  });
  it('the important label wins a collision, and the budget holds', () => {
    const list: LabelCandidate[] = [
      { text: 'faint', style: 'star', priority: PRIORITY.star, boxes: [box(100, 100)] },
      { text: 'Jupiter', style: 'body', priority: PRIORITY.body, boxes: [box(110, 104)] },
      { text: 'other', style: 'grid', priority: PRIORITY.grid, boxes: [box(200, 300)] },
    ];
    expect(placeLabels(list, bounds, 10).map((p) => p.candidate.text)).toEqual(['Jupiter', 'other']);
    expect(placeLabels(list, bounds, 1).map((p) => p.candidate.text)).toEqual(['Jupiter']);
  });
  it('the selected object is always named, even past the budget', () => {
    const list: LabelCandidate[] = [
      { text: 'a', style: 'body', priority: PRIORITY.body, boxes: [box(10, 10)] },
      { text: 'Selected', style: 'selection', priority: PRIORITY.selection, boxes: [box(200, 200)] },
    ];
    expect(placeLabels(list, bounds, 0).map((p) => p.candidate.text)).toEqual(['Selected']);
  });
  it('a label falls back to its next place, and stays out of the bars', () => {
    const list: LabelCandidate[] = [
      { text: 'a', style: 'body', priority: 9, boxes: [box(100, 100)] },
      { text: 'b', style: 'star', priority: 1, boxes: [box(105, 100), box(100, 130)] },
      { text: 'off', style: 'star', priority: 0, boxes: [box(380, 300), box(100, 710)] },
    ];
    const placed = placeLabels(list, bounds, 10);
    expect(placed.map((p) => p.candidate.text)).toEqual(['a', 'b']);
    expect(placed[1].box.y).toBe(130);
    expect(labelAt([{ candidate: { ...list[0], id: 'con:Ori' }, box: box(100, 100) }], 120, 108)?.candidate.id).toBe('con:Ori');
    expect(labelAt([{ candidate: { ...list[0], id: 'con:Ori' }, box: box(100, 100) }], 300, 300)).toBeNull();
  });
});

describe('grids', () => {
  const eq = (m: ReturnType<typeof gridToJ2000>, lon: number, lat: number) => vectorEquatorial(mul(m, lonLat(lon, lat)));
  it('the north galactic pole is where the IAU put it', () => {
    const p = eq(gridToJ2000('galactic'), 0, 90);
    expect(angleBetween(equatorialVector(p.raHours, p.decDeg), equatorialVector(192.8595 / 15, 27.1284)) * 60).toBeLessThan(2);
  });
  it('the galactic centre is in Sagittarius', () => {
    const p = eq(gridToJ2000('galactic'), 0, 0);
    expect(angleBetween(equatorialVector(p.raHours, p.decDeg), equatorialVector(266.405 / 15, -28.936)) * 60).toBeLessThan(2);
  });
  it('the ecliptic pole is at RA 18h, Dec 66.56, and the ecliptic passes through the equinox', () => {
    const p = eq(gridToJ2000('ecliptic'), 0, 90);
    expect(angleBetween(equatorialVector(p.raHours, p.decDeg), equatorialVector(18, 66.5607)) * 60).toBeLessThan(1);
    const q = eq(gridToJ2000('ecliptic'), 0, 0);
    expect(angleBetween(equatorialVector(q.raHours, q.decDeg), equatorialVector(0, 0)) * 3600).toBeLessThan(2);
  });
  it('spacing tightens with zoom, and lines reach all round a pole', () => {
    expect(gridStep(120)).toBeGreaterThan(gridStep(30));
    expect(gridStep(30)).toBeGreaterThan(gridStep(2));
    const polar = gridLines(0, 88, 20, 10).filter((l) => l.axis === 'lon');
    expect(polar.length).toBe(36);
    expect(gridLines(359, 0, 10, 5).some((l) => l.axis === 'lon' && l.value === 0)).toBe(true);
  });
  it('labels read as astronomers write them', () => {
    expect(gridLabel('equatorial', { axis: 'lon', value: 75, major: false, points: [] })).toBe('5h');
    expect(gridLabel('equatorial', { axis: 'lon', value: 82.5, major: false, points: [] })).toBe('5h 30m');
    expect(gridLabel('equatorial', { axis: 'lat', value: -20, major: false, points: [] })).toBe('−20°');
    expect(gridLabel('galactic', { axis: 'lon', value: 120, major: false, points: [] })).toBe('120°');
  });
});

describe('constellation boundaries', () => {
  it('cover all 88 constellations', () => {
    expect(new Set(boundaryPolygons().map((p) => p.id)).size).toBe(88);
    expect(constellations.every((c) => boundaryPolygons().some((p) => p.id === c.id))).toBe(true);
  });
  it('agree with the IAU boundaries inside Astronomy Engine at 99% of random points', () => {
    const polys = boundaryPolygons();
    let seed = 11, agree = 0, unclaimed = 0;
    const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; };
    const n = 1500;
    for (let i = 0; i < n; i++) {
      const ra = rand() * 24, dec = (Math.asin(2 * rand() - 1) * 180) / Math.PI;
      const owner = polys.find((p) => polygonContains(p, equatorialVector(ra, dec)));
      if (!owner) { unclaimed++; continue; }
      if (owner.id === Astronomy.Constellation(ra, dec).symbol) agree++;
    }
    console.log(`boundaries: ${agree}/${n} agree, ${unclaimed} unclaimed`);
    expect(agree / n).toBeGreaterThan(0.99);
  });
});

describe('zoom about the fingers', () => {
  const camera = (v: { azimuth: number; altitude: number; fov: number }): Camera => ({ orientation: orientationFor(v.azimuth, v.altitude), fov: v.fov, width: 393, height: 852, projection: 'stereographic' });
  it('the sky under the fingers stays there', () => {
    let held = 0, clamped = 0;
    for (const start of [{ azimuth: 180, altitude: 30, fov: 46 }, { azimuth: 350, altitude: 60, fov: 90 }, { azimuth: 10, altitude: 5, fov: 20 }, { azimuth: 90, altitude: 70, fov: 12 }]) {
      for (const [x, y] of [[100, 200], [300, 600], [196, 426], [40, 500]]) {
        for (const fov of [start.fov * 0.5, start.fov * 0.2, start.fov * 1.4]) {
          const target = unproject(camera(start), x, y);
          const v = anchorView({ ...start, fov }, target, x, y, 393, 852, 'stereographic');
          // The view can't tip past the zenith, so there the anchor has to give way.
          if (v.altitude >= 89.8 || v.altitude <= -19.9) { clamped++; continue; }
          const p = project(camera(v), target)!;
          held++;
          expect(Math.hypot(p.x - x, p.y - y), `${JSON.stringify(start)} ${x},${y} fov ${fov}`).toBeLessThan(1);
        }
      }
    }
    expect(held).toBeGreaterThan(40);
    expect(clamped).toBeLessThan(6);
  });
  it('stays well behaved next to the zenith', () => {
    const start = { azimuth: 30, altitude: 89.5, fov: 40 };
    const v = anchorView({ ...start, fov: 20 }, unproject(camera(start), 196, 426), 196, 426, 393, 852, 'stereographic');
    expect(Number.isFinite(v.azimuth)).toBe(true);
    expect(v.altitude).toBeLessThanOrEqual(89.9);
  });
});

describe('the panel rests where a finger leaves it', () => {
  const stops = panelStops(852, 59, 648);
  it('the nearest stop wins a slow release', () => {
    expect(restingDetent(630, 0, stops)).toBe('collapsed');
    expect(restingDetent(420, 100, stops)).toBe('half');
    expect(restingDetent(120, -100, stops)).toBe('full');
  });
  it('a flick moves one stop that way, and stops at the ends', () => {
    expect(restingDetent(640, -900, stops)).toBe('half');
    expect(restingDetent(380, -900, stops)).toBe('full');
    expect(restingDetent(100, 900, stops)).toBe('half');
    expect(restingDetent(400, 900, stops)).toBe('collapsed');
    expect(restingDetent(stops.full, -900, stops)).toBe('full');
    expect(restingDetent(stops.collapsed, 900, stops)).toBe('collapsed');
  });
  it('dragging can never pass either end', () => {
    expect(clampTop(-50, stops)).toBe(stops.full);
    expect(clampTop(900, stops)).toBe(stops.collapsed);
    expect(stops.full).toBeLessThan(stops.half);
    expect(stops.half).toBeLessThan(stops.collapsed);
  });
});

describe('flights', () => {
  it('reach a target near the zenith instead of stopping short', () => {
    expect(focusView({ azimuth: 40, altitude: 88 }, { azimuth: 0, altitude: 30, fov: 46 }, true).altitude).toBe(88);
  });
  it('stop at the ground, but follow a target below it when no ground is drawn', () => {
    expect(focusView({ azimuth: 40, altitude: -36 }, { azimuth: 0, altitude: 30, fov: 46 }, true).altitude).toBe(-5);
    expect(focusView({ azimuth: 40, altitude: -36 }, { azimuth: 0, altitude: 30, fov: 46 }, false).altitude).toBe(-36);
    expect(dragView({ azimuth: 0, altitude: 0, fov: 40 }, 0, -1e5, 10, lowestView(true)).altitude).toBe(-20);
    expect(dragView({ azimuth: 0, altitude: 0, fov: 40 }, 0, -1e5, 10, lowestView(false)).altitude).toBe(-89);
  });
  it('keep the view no wider than 60 degrees, and frame a constellation', () => {
    expect(focusView({ azimuth: 0, altitude: 10 }, { azimuth: 0, altitude: 0, fov: 120 }, true).fov).toBe(60);
    expect(framingFov(5)).toBe(24);
    expect(framingFov(25)).toBeCloseTo(67.5, 5);
    expect(framingFov(90)).toBe(100);
  });
  it('choose a Deep Atlas view that really draws the star', () => {
    for (const mag of [8.5, 9.54, 11, 13]) {
      const fov = fovForMagnitude(mag);
      expect(starLimit('atlas', MODE_DEFAULTS.atlas, fov, 0, false), `V ${mag}`).toBeGreaterThanOrEqual(mag);
    }
  });
});

describe('selection only reaches what the frame drew', () => {
  const t = stars();
  const moment = computeMoment(when.getTime(), site);
  const field = buildStarField(t, yearsSinceJ2000(when.getTime()));
  const context = (over: Partial<HitContext>, azimuth: number, altitude: number, fov: number, mode: SkyMode = 'explore'): HitContext => {
    const camera: Camera = { orientation: orientationFor(azimuth, altitude), fov, width: 393, height: 852, projection: 'stereographic' };
    const layers = MODE_DEFAULTS[mode].layers;
    const limit = starLimit(mode, MODE_DEFAULTS[mode], fov, 0, false);
    return { camera, moment, field, layers, mode, limit, brightness: 0, overlayOnly: false, query: querySky(camera, moment, field.years, null, newCellBuffer()), bottomEdge: 720, labels: [], ...over };
  };
  const star = (hip: number) => { const i = t.indexByHip.get(hip)!; return mul(moment.matrix, starDirection(t, i, field.years)); };
  const aimed = (v: ReturnType<typeof star>, fov: number, mode?: SkyMode, over: Partial<HitContext> = {}) => {
    const h = vectorHorizontal(v);
    const c = context(over, h.azimuth, h.altitude, fov, mode);
    return { c, p: project(c.camera, v)! };
  };

  it('finds a named star at several zooms', () => {
    for (const fov of [90, 46, 20, 5]) {
      const { c, p } = aimed(star(24436), fov);
      expect(hitTest(p.x, p.y, c)?.id, `fov ${fov}`).toBe('star:24436');
    }
  });
  it('a faint star past the old 6,000-star cutoff is selectable once it is drawn', () => {
    let i = 30000;
    while (vectorHorizontal(mul(moment.matrix, starDirection(t, i, field.years))).altitude < 25) i++;
    const { c, p } = aimed(mul(moment.matrix, starDirection(t, i, field.years)), 3, 'explore');
    expect(t.mag[i]).toBeGreaterThan(7);
    const id = hitTest(p.x, p.y, c, 8)?.id;
    expect(id).toBe(`star:${t.hip[i]}`);
  });
  it('stars and planets stop being selectable when their layer is off', () => {
    const { c, p } = aimed(star(24436), 20);
    expect(hitTest(p.x, p.y, { ...c, layers: { ...c.layers, stars: false } }, 8)?.id).not.toBe('star:24436');
    const body = moment.bodies.find((b) => b.id === 'jupiter')!;
    const j = aimed(body.dir, 20);
    expect(hitTest(j.p.x, j.p.y, j.c)?.id).toBe('body:jupiter');
    expect(hitTest(j.p.x, j.p.y, { ...j.c, layers: { ...j.c.layers, planets: false } })?.id).not.toBe('body:jupiter');
  });
  it('a star fainter than the limit is not selectable, because it is not drawn', () => {
    const i = t.indexByHip.get(24436)!;
    const faint = 7000;
    const v = mul(moment.matrix, starDirection(t, faint, field.years));
    const { c, p } = aimed(v, 46);
    expect(t.mag[faint]).toBeGreaterThan(t.mag[i]);
    expect(hitTest(p.x, p.y, { ...c, limit: 3 }, 2)?.id).not.toBe(`star:${t.hip[faint]}`);
  });
  it('deep sky can only be tapped where it is drawn', () => {
    const m42 = object('dso:M42')!;
    const v = mul(moment.matrix, equatorialVector(m42.position!.raHours, m42.position!.decDeg));
    const wide = aimed(v, 46);
    expect(hitTest(wide.p.x, wide.p.y, wide.c, 6)?.id).not.toBe('dso:M42');
    const close = aimed(v, 12);
    expect(hitTest(close.p.x, close.p.y, close.c, 6)?.id).toBe('dso:M42');
    expect(hitTest(wide.p.x, wide.p.y, { ...wide.c, ...aimed(v, 46, 'atlas').c }, 6)?.id).toBe('dso:M42');
  });
  it('the ground and the compass take no sky taps', () => {
    const below = context({}, 180, 0, 90);
    const p = project(below.camera, horizontalVector({ azimuth: 180, altitude: -8 }))!;
    expect(hitTest(p.x, p.y, below)).toBeNull();
    expect(hitTest(196, 760, context({}, 180, 40, 90))).toBeNull();
  });
  it('a long press lists neighbours best first, each object once', () => {
    const { c, p } = aimed(star(26311), 12);
    const near = hitCandidates(p.x, p.y, c, 60, 4);
    expect(near.length).toBeGreaterThan(1);
    expect(near[0].id).toBe('star:26311');
    expect(new Set(near.map((h) => h.id)).size).toBe(near.length);
    expect(hitTest(p.x, p.y, c, 60)?.id).toBe(near[0].id);
  });
  it('a long press on the ground finds nothing', () => {
    const below = context({}, 180, 0, 90);
    const p = project(below.camera, horizontalVector({ azimuth: 180, altitude: -8 }))!;
    expect(hitCandidates(p.x, p.y, below)).toEqual([]);
  });
  it('tapping a constellation name selects the constellation', () => {
    const { c } = aimed(star(24436), 20);
    const labels = [{ candidate: { text: 'ORION', style: 'constellation' as const, priority: 1, id: 'con:Ori', boxes: [] }, box: { x: 100, y: 300, w: 100, h: 14 } }];
    expect(hitTest(150, 306, { ...c, labels })?.id).toBe('con:Ori');
  });
  it('every deep-sky type sits in a layer group, and groups really filter', () => {
    const all = visibleDeepSky('atlas', MODE_DEFAULTS.atlas.layers, 3, 0, false);
    expect(all.length).toBe(1643);
    const noGalaxies = visibleDeepSky('atlas', { ...MODE_DEFAULTS.atlas.layers, galaxies: false }, 3, 0, false);
    expect(noGalaxies.length).toBe(1643 - 974 - 0);
    expect(noGalaxies.every((m) => deepGroup(m.object.type) !== 'galaxies')).toBe(true);
    expect(visibleDeepSky('explore', MODE_DEFAULTS.explore.layers, 46, 0, false)).toEqual([]);
    expect(visibleDeepSky('observe', MODE_DEFAULTS.observe.layers, 30, 0, false)).toEqual([]);
    expect(visibleDeepSky('atlas', MODE_DEFAULTS.atlas.layers, 3, 0.9, true)).toEqual([]);
  });
  it('changing mode never moves anything: an object sits at the same point in all three', () => {
    const at = (mode: SkyMode) => { const { c, p } = aimed(star(24436), 20, mode); const hit = hitTest(p.x, p.y, c, 8)!; return [hit.id, hit.x, hit.y]; };
    expect(at('observe')).toEqual(at('explore'));
    expect(at('atlas')).toEqual(at('explore'));
    expect(computeMoment(when.getTime(), site).matrix).toEqual(j2000ToHorizon(when, site));
  });
});
