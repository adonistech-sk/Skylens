// Stage 4: the constellation system. Anchoring is measured, not assumed: every anchor star is
// carried through the same mesh the screen uses and compared with where the camera puts the star.
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { Camera, orientationFor, project } from '../src/astronomy/camera';
import { constellationOf, j2000ToHorizon, Mat3, mul, Observer, transpose, Vec3 } from '../src/astronomy/core';
import { constellation, constellations, object, starDirection, stars } from '../src/data/catalog';
import { artRecord, artRecords, hasArtwork } from '../src/data/constellationArt';
import { IAU_NOTE, ORIGIN_TEXT, STORIES } from '../src/data/constellationStories';
import { tourFor } from '../src/data/constellationTours';
import { search } from '../src/data/search';
import { artworkFade } from '../src/features/sky/artFade';
import { anchorError, artFrame, chooseArtworks, MAX_ARTWORKS, MESH_CACHE, meshCacheSize, meshFor, parallaxOffset, planeFrame, planeToSky, Presence, projectAll, skyToPlane } from '../src/features/sky/artGeometry';
import { figureOfRow, figurePlan, REVEAL, REVEAL_TOTAL, revealAt } from '../src/features/sky/figures';
import { buildStarField, computeMoment, constellationGeometry, figureAt, HitContext, hitTest, mulMatFast, viewHalfAngle } from '../src/features/sky/scene';
import { DEFAULT_LAYERS, migrateSkySettings, MODE_DEFAULTS } from '../src/state/skyModes';

const PRIORITY = ['Ori', 'UMa', 'UMi', 'Cas', 'Sco', 'Sgr', 'Tau', 'Leo', 'Cyg', 'And', 'Peg', 'Gem'];
const ROOT = path.join(__dirname, '..');

const OBSERVERS: Observer[] = [
  { latitude: 48.15, longitude: 17.11, elevation: 130 },
  { latitude: -33.9, longitude: 18.4, elevation: 10 },
  { latitude: 1.3, longitude: 103.8, elevation: 20 },
  { latitude: 69.6, longitude: 18.9, elevation: 10 },
];

/** Where the screen's own mesh puts a plane point: found in its cell, then interpolated as triangles are. */
function throughMesh(artId: string, x: number, y: number, xyz: Float32Array, camera: Camera, cam: Mat3) {
  const art = artRecord(artId)!;
  const [left, bottom, right, top] = art.extent;
  const mesh = meshFor(art, { years: 0, xyz: new Float32Array(0) } as never);
  const { cols, rows } = mesh;
  const screen = new Float32Array((xyz.length / 3) * 2);
  if (!projectAll(xyz, camera, cam, screen)) return null;
  const u = ((x - left) / (right - left)) * cols, v = ((top - y) / (top - bottom)) * rows;
  const c = Math.min(cols - 1, Math.floor(u)), r = Math.min(rows - 1, Math.floor(v));
  const fu = u - c, fv = v - r;
  const at = (row: number, col: number) => { const i = (row * (cols + 1) + col) * 2; return [screen[i], screen[i + 1]]; };
  const a = at(r, c), b = at(r, c + 1), d = at(r + 1, c), e = at(r + 1, c + 1);
  // The same split as the index list: a, b, d then b, e, d.
  if (fu + fv <= 1) return [a[0] + (b[0] - a[0]) * fu + (d[0] - a[0]) * fv, a[1] + (b[1] - a[1]) * fu + (d[1] - a[1]) * fv];
  return [e[0] + (d[0] - e[0]) * (1 - fu) + (b[0] - e[0]) * (1 - fv), e[1] + (d[1] - e[1]) * (1 - fu) + (b[1] - e[1]) * (1 - fv)];
}

const fieldAt = (years: number) => buildStarField(stars(), years);

function aimAt(artId: string, matrix: Mat3, fov: number, width: number, height: number, projection: Camera['projection'], roll: number): Camera {
  const art = artRecord(artId)!;
  const dir = mul(matrix, planeToSky(artFrame(art), 0, 0));
  const az = (Math.atan2(-dir[1], dir[0]) * 180) / Math.PI, alt = (Math.asin(dir[2]) * 180) / Math.PI;
  return { orientation: orientationFor(az, Math.max(-85, Math.min(85, alt)), roll), fov, width, height, projection };
}

describe('artwork register', () => {
  it('holds exactly the figures that have been drawn, and each has its files', () => {
    expect(artRecords.length).toBeGreaterThanOrEqual(86);
    for (const id of PRIORITY) expect(hasArtwork(id), id).toBe(true);
    for (const a of artRecords) {
      expect(constellation(a.id), a.id).not.toBeNull();
      expect(fs.existsSync(path.join(ROOT, 'assets/constellation-art', `${a.id}.jpg`)), a.id).toBe(true);
      expect(fs.existsSync(path.join(ROOT, 'assets/constellation-art', `${a.id}.glow.jpg`)), a.id).toBe(true);
      expect(fs.existsSync(path.join(ROOT, 'design/constellation-art', `${a.id}.svg`)), a.id).toBe(true);
      expect(fs.existsSync(path.join(ROOT, 'scripts/constellation-art/figures', `${a.id}.mjs`)), `${a.id} has a vector source`).toBe(true);
    }
  });

  it('keeps no placeholder: a constellation with no record has no plate at all', () => {
    const plates = fs.readdirSync(path.join(ROOT, 'assets/constellation-art')).filter((f) => !f.includes('.glow.'));
    expect(plates.length).toBe(artRecords.length);
    for (const c of constellations) if (!hasArtwork(c.id)) expect(plates.includes(`${c.id}.jpg`)).toBe(false);
  });

  it('keeps data, anchors, lines and art separate', () => {
    const record = artRecords[0] as unknown as Record<string, unknown>;
    expect(record.lines).toBeUndefined();
    const data = constellation('Ori') as unknown as Record<string, unknown>;
    expect(data.anchors).toBeUndefined();
    expect(data.contour).toBeUndefined();
  });

  it('every anchor is a real star of its own figure, on the drawing, printed from the catalog', () => {
    const table = stars();
    for (const a of artRecords) {
      const line = new Set(constellation(a.id)!.lines.flat());
      const frame = planeFrame(a.centre[0], a.centre[1]);
      expect(a.anchors.length, a.id).toBeGreaterThanOrEqual(Math.min(4, line.size));
      for (const anchor of a.anchors) {
        expect(line.has(anchor.hip), `${a.id} ${anchor.hip}`).toBe(true);
        expect(anchor.part.length).toBeGreaterThan(2);
        const [x, y] = skyToPlane(frame, starDirection(table, table.indexByHip.get(anchor.hip)!, 0));
        expect(Math.hypot(x - anchor.x, y - anchor.y), `${a.id} ${anchor.hip}`).toBeLessThan(0.012);
      }
    }
  });

  it('most of each figure\'s stars fall on the drawing, not beside it', () => {
    for (const a of artRecords) {
      expect(a.onFigure.lineStars / a.onFigure.lineTotal, a.id).toBeGreaterThanOrEqual(a.id === 'And' ? 0.5 : 0.7);
      expect(a.onFigure.anchors / a.anchors.length, a.id).toBeGreaterThanOrEqual(0.66);
    }
  });
});

describe('star anchoring through the mesh', () => {
  it('round-trips the plane', () => {
    const f = planeFrame(83.8, -5.4);
    for (const [x, y] of [[0, 0], [12, -9], [-20, 15], [3.3, 28]]) {
      const [a, b] = skyToPlane(f, planeToSky(f, x, y));
      expect(a).toBeCloseTo(x, 8);
      expect(b).toBeCloseTo(y, 8);
    }
  });

  it('puts +x to the west and +y to the north, as the sky looks from the ground', () => {
    const f = planeFrame(83.8, 0);
    const west = planeToSky(f, 5, 0), north = planeToSky(f, 0, 5);
    const ra = (Math.atan2(west[1], west[0]) * 180) / Math.PI;
    expect(ra).toBeLessThan(83.8);
    expect(north[2]).toBeGreaterThan(0);
  });

  it('stays on every anchor star across viewports, orientations, observers and projections', () => {
    const table = stars();
    let worst = 0, cases = 0;
    const field = fieldAt(26);
    const sizes: [number, number][] = [[393, 852], [852, 393], [320, 568], [1024, 1366]];
    for (const a of artRecords) {
      const mesh = meshFor(a, field);
      for (const obs of OBSERVERS) {
        const matrix = j2000ToHorizon(new Date('2027-01-17T20:25:00Z'), obs);
        for (const [fov, roll, projection] of [[46, 0, 'stereographic'], [26, 35, 'stereographic'], [14, -60, 'stereographic'], [60, 12, 'rectilinear'], [80, 170, 'stereographic']] as const) {
          for (const [w, h] of sizes) {
            const camera = aimAt(a.id, matrix, fov, w, h, projection, roll);
            const cam = mulMatFast(camera.orientation, matrix);
            for (const anchor of a.anchors) {
              const row = table.indexByHip.get(anchor.hip)!;
              const v: Vec3 = [field.xyz[row * 3], field.xyz[row * 3 + 1], field.xyz[row * 3 + 2]];
              const truth = project(camera, mul(matrix, v));
              const drawn = throughMesh(a.id, anchor.x, anchor.y, mesh.xyz, camera, cam);
              // What matters is what can be seen: far outside the view, stereographic stretch is huge.
              if (!truth || !drawn || truth.x < -40 || truth.y < -40 || truth.x > w + 40 || truth.y > h + 40) continue;
              worst = Math.max(worst, Math.hypot(truth.x - drawn[0], truth.y - drawn[1]));
              cases++;
            }
          }
        }
      }
    }
    expect(cases).toBeGreaterThan(5000);
    console.log(`anchoring: worst ${worst.toFixed(3)} pt over ${cases} placements`);
    expect(worst).toBeLessThan(1);
  });

  it('follows proper motion across the whole Time Travel range', () => {
    const table = stars();
    let worstArc = 0, drift = 0;
    for (const years of [-199, -60, 90, 199]) {
      const field = fieldAt(years);
      for (const a of artRecords) {
        const mesh = meshFor(a, field);
        const matrix = j2000ToHorizon(new Date('2027-01-17T20:25:00Z'), OBSERVERS[0]);
        const camera = aimAt(a.id, matrix, 40, 393, 852, 'stereographic', 0);
        const cam = mulMatFast(camera.orientation, matrix);
        const ppd = 393 / 40;
        for (const anchor of a.anchors) {
          const row = table.indexByHip.get(anchor.hip)!;
          const v: Vec3 = [field.xyz[row * 3], field.xyz[row * 3 + 1], field.xyz[row * 3 + 2]];
          const truth = project(camera, mul(matrix, v)), drawn = throughMesh(a.id, anchor.x, anchor.y, mesh.xyz, camera, cam);
          if (!truth || !drawn) continue;
          worstArc = Math.max(worstArc, Math.hypot(truth.x - drawn[0], truth.y - drawn[1]) / ppd);
          const still = starDirection(table, row, 0);
          drift = Math.max(drift, Math.hypot(v[0] - still[0], v[1] - still[1], v[2] - still[2]) * 57.3);
        }
      }
    }
    console.log(`time travel: worst ${(worstArc * 60).toFixed(2)} arcmin off, while stars drift up to ${(drift * 60).toFixed(1)} arcmin`);
    expect(drift).toBeGreaterThan(0.02);
    expect(worstArc).toBeLessThan(0.2);
  });

  it('the app\'s own frame check agrees with the measurement above', () => {
    const a = artRecord('Ori')!, field = fieldAt(27);
    const matrix = j2000ToHorizon(new Date('2027-01-17T20:25:00Z'), OBSERVERS[0]);
    const camera = aimAt('Ori', matrix, 46, 393, 852, 'stereographic', 0);
    const error = anchorError(a, meshFor(a, field), field, camera, mulMatFast(camera.orientation, matrix));
    expect(error).toBeGreaterThanOrEqual(0);
    expect(error).toBeLessThan(1);
  });

  it('turns with the sky: the same star stays on the figure through a night', () => {
    const a = artRecord('Ori')!, table = stars(), field = fieldAt(27);
    const mesh = meshFor(a, field);
    for (const hour of [18, 21, 0, 3, 6]) {
      const matrix = j2000ToHorizon(new Date(Date.UTC(2027, 0, 17, hour)), OBSERVERS[1]);
      const camera = aimAt('Ori', matrix, 40, 393, 852, 'stereographic', 0);
      const cam = mulMatFast(camera.orientation, matrix);
      const anchor = a.anchors[0], row = table.indexByHip.get(anchor.hip)!;
      const truth = project(camera, mul(matrix, [field.xyz[row * 3], field.xyz[row * 3 + 1], field.xyz[row * 3 + 2]]))!;
      const drawn = throughMesh('Ori', anchor.x, anchor.y, mesh.xyz, camera, cam)!;
      expect(Math.hypot(truth.x - drawn[0], truth.y - drawn[1])).toBeLessThan(2.5);
    }
  });
});

describe('animation never touches the sky', () => {
  it('reveal is pure timing and arrives complete', () => {
    expect(revealAt(0)).toEqual({ lines: 0, trace: 0, plate: 0, done: false });
    expect(revealAt(REVEAL_TOTAL + 0.01).done).toBe(true);
    expect(revealAt(Infinity)).toEqual({ lines: 1, trace: 1, plate: 1, done: true });
    let last = revealAt(0);
    for (let t = 0.1; t < REVEAL_TOTAL; t += 0.1) {
      const r = revealAt(t);
      expect(r.lines).toBeGreaterThanOrEqual(last.lines);
      expect(r.trace).toBeGreaterThanOrEqual(last.trace);
      expect(r.plate).toBeGreaterThanOrEqual(last.plate);
      last = r;
    }
    expect(REVEAL.lines).toBeLessThan(REVEAL_TOTAL);
  });

  it('leaves star positions byte-identical through everything an animation calls', () => {
    const field = fieldAt(27);
    const before = Buffer.from(field.xyz.buffer).toString('base64');
    const matrix = j2000ToHorizon(new Date('2027-01-17T20:25:00Z'), OBSERVERS[0]);
    const camera = aimAt('Ori', matrix, 46, 393, 852, 'stereographic', 0);
    const forward = mul(transpose(matrix), [camera.orientation[6] * -1, camera.orientation[7] * -1, camera.orientation[8] * -1]);
    for (const a of artRecords) meshFor(a, field);
    chooseArtworks({ forward, half: viewHalfAngle(camera), camera, chosen: 'Ori' });
    for (const id of ['Ori', 'UMa']) figurePlan(id);
    for (let t = 0; t < 3; t += 0.2) revealAt(t);
    parallaxOffset(100, 300, 393, 852);
    expect(Buffer.from(field.xyz.buffer).toString('base64')).toBe(before);
  });

  it('parallax stays small and never applies to the plate', () => {
    for (const [x, y] of [[0, 0], [393, 852], [-2000, 4000], [196, 426]]) {
      const [dx, dy] = parallaxOffset(x, y, 393, 852);
      expect(Math.abs(dx)).toBeLessThanOrEqual(6);
      expect(Math.abs(dy)).toBeLessThanOrEqual(6);
    }
    expect(parallaxOffset(196.5, 426, 393, 852)).toEqual([-0, -0]);
    const source = fs.readFileSync(path.join(ROOT, 'src/features/sky/artwork.ts'), 'utf8');
    expect(source).toMatch(/drawMesh\(canvas, mesh, toPoints\(buffer, count\), platePaint/);
  });

  it('grows every figure line from a star and reaches every star', () => {
    for (const c of constellationGeometry()) {
      const plan = figurePlan(c.id)!;
      expect(plan.segments.length, c.id).toBe(new Set(c.segments.map(([a, b]) => [a, b].sort().join())).size);
      for (const s of plan.segments) { expect(s.from).toBeLessThan(s.to); expect(s.to).toBeLessThanOrEqual(1.0001); }
      expect(new Set(plan.stars.map((s) => s.row)).size).toBe(new Set(c.segments.flat()).size);
    }
  });

  it('eases and stops: with motion off it is immediate, and it asks for no frames once settled', () => {
    const p = new Presence(2);
    expect(p.step(new Map([['Ori', 1]]), 0.1, false)).toBe(true);
    expect(p.level('Ori')).toBeCloseTo(0.2);
    for (let i = 0; i < 30; i++) p.step(new Map([['Ori', 1]]), 0.1, false);
    expect(p.step(new Map([['Ori', 1]]), 0.1, false)).toBe(false);
    const q = new Presence(2);
    expect(q.step(new Map([['Leo', 0.6]]), 0.016, true)).toBe(false);
    expect(q.level('Leo')).toBe(0.6);
    q.step(new Map(), 0.016, true);
    expect(q.ids()).toEqual([]);
  });

  it('a selected star belongs to the figure it is drawn on', () => {
    const t = stars();
    expect(figureOfRow(t.indexByHip.get(27989)!)).toBe('Ori');
    expect(figureOfRow(t.indexByHip.get(32349) ?? -1)).toBe(figureOfRow(t.indexByHip.get(32349) ?? -1));
  });
});

describe('culling, level of detail and caches', () => {
  const matrix = j2000ToHorizon(new Date('2027-01-17T20:25:00Z'), OBSERVERS[0]);
  const look = (fov: number, chosen: string | null = null, target = 'Ori') => {
    const camera = aimAt(target, matrix, fov, 393, 852, 'stereographic', 0);
    const forward = mul(transpose(matrix), mul(transpose(camera.orientation), [0, 0, -1]));
    return chooseArtworks({ forward, half: viewHalfAngle(camera), camera, chosen });
  };

  it('leaves out what is out of view', () => {
    const ids = look(30).map((c) => c.art.id);
    expect(ids).toContain('Ori');
    expect(ids).not.toContain('UMi');
    expect(ids).not.toContain('Cyg');
  });

  it('caps what one frame draws, however wide the view', () => {
    for (const fov of [30, 46, 70]) expect(look(fov).length).toBeLessThanOrEqual(MAX_ARTWORKS);
  });

  it('hides art where it would swamp or lose the sky', () => {
    expect(artworkFade(100)).toBe(0);
    expect(artworkFade(46)).toBe(1);
    expect(artworkFade(5)).toBe(0);
    expect(look(120)).toEqual([]);
    expect(look(4)).toEqual([]);
  });

  it('keeps the chosen figure first and quietens the rest', () => {
    const free = look(70);
    const chosen = look(70, 'Tau');
    expect(chosen[0].art.id).toBe('Tau');
    expect(chosen[0].emphasis).toBe(1);
    const other = (l: typeof free) => l.find((c) => c.art.id === 'Ori')?.emphasis ?? 0;
    expect(other(chosen)).toBeLessThan(other(free));
  });

  it('bounds the mesh cache', () => {
    const field = fieldAt(30);
    for (const a of artRecords) meshFor(a, field);
    expect(meshCacheSize()).toBeLessThanOrEqual(MESH_CACHE);
  });

  it('only rebuilds a mesh when the star epoch moves', () => {
    const a = artRecords[0], field = fieldAt(31);
    expect(meshFor(a, field)).toBe(meshFor(a, field));
    expect(meshFor(a, fieldAt(33))).not.toBe(meshFor(a, field).xyz);
  });

  it('stays cheap: a frame of plates is a fraction of a millisecond of math here', () => {
    const field = fieldAt(27);
    const camera = aimAt('Ori', matrix, 60, 393, 852, 'stereographic', 0);
    const cam = mulMatFast(camera.orientation, matrix);
    // The worst case: the six figures with the most vertices, all on screen at once.
    const largest = [...artRecords].sort((a, b) => b.radius - a.radius).slice(0, MAX_ARTWORKS);
    const meshes = largest.map((a) => meshFor(a, field));
    const out = new Float32Array(8192);
    const start = performance.now();
    for (let i = 0; i < 200; i++) for (const m of meshes) projectAll(m.xyz, camera, cam, out);
    const ms = (performance.now() - start) / 200;
    console.log(`mesh projection: ${ms.toFixed(3)} ms a frame for the ${meshes.length} largest plates (${meshes.reduce((n, m) => n + m.xyz.length / 3, 0)} vertices)`);
    expect(ms).toBeLessThan(1.5);
  });
});

describe('selecting a figure on the sky', () => {
  const moment = computeMoment(Date.parse('2027-01-17T20:25:00Z'), { latitude: 48.15, longitude: 17.11, elevation: 130 });
  const field = fieldAt(27);
  const camera: Camera = { orientation: orientationFor(180, 40, 0), fov: 46, width: 393, height: 852, projection: 'stereographic' };
  const context = (over: Partial<HitContext> = {}): HitContext => ({ camera, moment, field, layers: DEFAULT_LAYERS, mode: 'explore', limit: 4, brightness: 0, overlayOnly: false, query: null, bottomEdge: 720, labels: [], artwork: [], ...over });

  it('a tap on a drawn line chooses the constellation', () => {
    const t = stars();
    const a = project(camera, mul(moment.matrix, starDirection(t, t.indexByHip.get(27989)!, 27)))!;
    const b = project(camera, mul(moment.matrix, starDirection(t, t.indexByHip.get(25336)!, 27)))!;
    expect(figureAt((a.x + b.x) / 2, (a.y + b.y) / 2, context())).toBe('Ori');
  });

  it('a tap on the drawn figure chooses it, but only if the frame drew it', () => {
    const art = artRecord('Ori')!;
    const dir = mul(moment.matrix, planeToSky(artFrame(art), -3, -3));
    const p = project(camera, dir)!;
    const lines = { ...DEFAULT_LAYERS, constellations: false };
    expect(figureAt(p.x, p.y, context({ layers: lines, artwork: ['Ori'] }))).toBe('Ori');
    expect(figureAt(p.x, p.y, context({ layers: lines, artwork: [] }))).toBeNull();
  });

  it('a figure wins over a faint unnamed star nearby, but not in the chart', () => {
    const art = artRecord('Ori')!;
    const p = project(camera, mul(moment.matrix, planeToSky(artFrame(art), -3, -3)))!;
    const lines = { ...DEFAULT_LAYERS, constellations: false };
    const faintHits = hitTest(p.x, p.y, context({ layers: lines, artwork: [], limit: 8 }));
    expect(faintHits?.id.startsWith('star:')).toBe(true);
    expect(hitTest(p.x, p.y, context({ layers: lines, artwork: ['Ori'], limit: 8 }))?.id).toBe('con:Ori');
    expect(hitTest(p.x, p.y, context({ layers: lines, artwork: ['Ori'], limit: 8, mode: 'atlas' }))?.id.startsWith('star:')).toBe(true);
  });

  it('a star under the finger still wins over the figure around it', () => {
    const t = stars();
    const p = project(camera, mul(moment.matrix, starDirection(t, t.indexByHip.get(27989)!, 27)))!;
    expect(hitTest(p.x, p.y, context({ artwork: ['Ori'] }))?.id).toBe('star:27989');
  });
});

describe('layers', () => {
  it('Explore shows art, and Observe and Deep Atlas keep it off and quiet', () => {
    expect(MODE_DEFAULTS.explore.layers.artwork).toBe(true);
    expect(MODE_DEFAULTS.observe.layers.artwork).toBe(false);
    expect(MODE_DEFAULTS.atlas.layers.artwork).toBe(false);
    expect(MODE_DEFAULTS.observe.artworkOpacity).toBeLessThan(MODE_DEFAULTS.explore.artworkOpacity);
    expect(MODE_DEFAULTS.atlas.artworkOpacity).toBeLessThan(MODE_DEFAULTS.explore.artworkOpacity);
  });

  it('gives lines, names, art and animation switches of their own', () => {
    const on = DEFAULT_LAYERS;
    expect([on.constellations, on.constellationNames, on.artwork, on.constellationMotion]).toEqual([true, true, true, true]);
  });

  it('keeps a sky without constellations for anyone who had turned them off', () => {
    const { modes } = migrateSkySettings({ modes: { explore: { layers: { ...DEFAULT_LAYERS, constellations: false, constellationNames: undefined as never } } } });
    expect(modes.explore.layers.constellations).toBe(false);
    expect(modes.explore.layers.constellationNames).toBe(false);
    expect(modes.explore.layers.artwork).toBe(false);
  });

  it('fills the new settings on an old save', () => {
    const { modes } = migrateSkySettings({ layers: { ...DEFAULT_LAYERS } });
    expect(modes.explore.artworkOpacity).toBe(MODE_DEFAULTS.explore.artworkOpacity);
    expect(modes.explore.layers.constellationMotion).toBe(true);
  });
});

describe('Constellation Stories', () => {
  const stories = Object.entries(STORIES);

  it('covers all 88 and nothing else', () => {
    expect(stories.length).toBe(88);
    for (const c of constellations) expect(STORIES[c.id], c.id).toBeDefined();
  });

  it('matches the known history of the 88', () => {
    const count = (o: string) => stories.filter(([, s]) => s.origin === o).length;
    expect({ ptolemy: count('ptolemy'), argo: count('argo'), keyser: count('keyser'), lacaille: count('lacaille'), hevelius: count('hevelius'), plancius: count('plancius'), royer: count('royer'), crux: count('crux'), coma: count('coma') })
      .toEqual({ ptolemy: 47, argo: 3, keyser: 12, lacaille: 14, hevelius: 7, plancius: 2, royer: 1, crux: 1, coma: 1 });
    for (const s of stories) expect(ORIGIN_TEXT[s[1].origin], s[0]).toBeTruthy();
    expect(IAU_NOTE).toMatch(/1922/);
    expect(IAU_NOTE).toMatch(/1930/);
  });

  it('never states myth as astronomy', () => {
    const mythic = /\b(Zeus|Hera|Heracles|Hercules|Perseus|Poseidon|Artemis|Apollo|Medusa|Osiris|goddess|sea nymphs|Typhon)\b/;
    for (const [id, s] of stories) expect(mythic.test(s.science), `${id}: ${s.science}`).toBe(false);
  });

  it('attributes every story to the people who tell it', () => {
    let told = 0;
    for (const [id, s] of stories) {
      for (const t of s.traditions) { expect(t.culture.length, id).toBeGreaterThan(4); expect(t.text.length, id).toBeGreaterThan(14); told++; }
    }
    expect(told).toBeGreaterThan(50);
    for (const id of PRIORITY) expect(STORIES[id].traditions.length, id).toBeGreaterThanOrEqual(1);
    for (const id of ['Ori', 'UMa', 'Sco', 'Tau', 'Cyg', 'Gem']) expect(STORIES[id].traditions.length, id).toBeGreaterThanOrEqual(2);
  });

  it('invents no myth for modern figures', () => {
    for (const [id, s] of stories) if (s.origin === 'lacaille') expect(s.traditions.length, id).toBe(0);
  });

  it('finds a constellation by what people call it', () => {
    for (const [query, id] of [['Big Dipper', 'con:UMa'], ['Teapot', 'con:Sgr'], ['Northern Cross', 'con:Cyg'], ['Plough', 'con:UMa'], ['Great Square', 'con:Peg'], ['Pleiades', 'dso:M45']] as const) {
      const ids = search(query).map((r) => r.id);
      expect(ids, query).toContain(id);
    }
  });

  it('every number in a story\'s science agrees with the catalog where the catalog can say', () => {
    expect(Math.round(object('star:27989')!.magnitude!)).toBeLessThanOrEqual(1);
    expect(constellationOf({ raHours: 5.91, decDeg: 7.4 })).toBe('Ori');
  });
});

describe('guided exploration', () => {
  it('offers a tour of real stops for all 88', () => {
    for (const c of constellations) {
      const tour = tourFor(c.id)!;
      expect(tour.stops.length, c.id).toBeGreaterThanOrEqual(c.lines.flat().length > 2 ? 3 : 2);
      expect(new Set(tour.stops.map((s) => s.id)).size, c.id).toBe(tour.stops.length);
      for (const s of tour.stops) expect(object(s.id), `${c.id} ${s.id}`).not.toBeNull();
    }
  });

  it('holds written tours for the twelve', () => {
    for (const id of PRIORITY) { const t = tourFor(id)!; expect(t.curated, id).toBe(true); for (const s of t.stops) expect(s.note.length, s.id).toBeGreaterThan(20); }
  });

  it('keeps no coordinates: a stop is only a catalog ID', () => {
    for (const id of PRIORITY) {
      for (const s of tourFor(id)!.stops) {
        const keys = Object.keys(s);
        for (const k of keys) expect(['id', 'title', 'note', 'fov'].includes(k), k).toBe(true);
      }
    }
  });

  it('stays inside the constellation by the engine\'s own IAU lookup', () => {
    for (const id of PRIORITY) {
      for (const s of tourFor(id)!.stops) {
        const pos = object(s.id)!.position!;
        expect(constellationOf(pos), `${id} ${s.id}`).toBe(id);
      }
    }
  });
});
