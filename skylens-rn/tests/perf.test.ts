// Node timing of the star loop, only when BENCH=1. This is a comparison between two code
// paths on one machine. V8 has a JIT and Hermes doesn't, so it says nothing about a phone.
import { describe, it } from 'vitest';
import { Camera, cameraScale, orientationFor } from '../src/astronomy/camera';
import { equatorialVector, j2000ToHorizon, mul, Observer, vectorHorizontal } from '../src/astronomy/core';
import { directionAt, stars } from '../src/data/catalog';
import { DeepPack } from '../src/data/catalogs/deepPack';
import { CELL_COUNT } from '../src/data/catalogs/grid';
import { buildStarField, computeMoment, eachStar, mulMatFast, newCellBuffer, querySky, SkyMoment } from '../src/features/sky/scene';
import { MODE_DEFAULTS, SkyMode, starLimit } from '../src/state/skyModes';
import { visibilityTimeline } from '../src/astronomy/observing';
import { object } from '../src/data/catalog';
import { relatedObjects } from '../src/data/related';
import { installDeepSearch, numberMatches, prepareSearch } from '../src/data/search';
import { discover } from '../src/features/sky/discovery';
import { fileStorage, settled } from './helpers';

const site: Observer = { latitude: 48.1486, longitude: 17.1077, elevation: 134 };

describe.runIf(process.env.BENCH === '1')('Stage 2 work on the JS thread', () => {
  it('times each new calculation once, as a person would trigger it', async () => {
    const time = (name: string, fn: () => void) => { const a = performance.now(); fn(); console.log(name.padEnd(34), (performance.now() - a).toFixed(2), 'ms'); };
    const night = new Date('2027-01-17T20:25:00Z');
    time('search index, first build', () => prepareSearch());
    const pack = new DeepPack(async () => fileStorage(), { direction: directionAt });
    const a = performance.now();
    const index = (await pack.index())!;
    console.log('pack number index, read', (performance.now() - a).toFixed(2), 'ms');
    time('pack numbers into search', () => { installDeepSearch(index.hips, index.extra); numberMatches('hip', '1', 1); });
    const o = object('body:moon')!;
    time('visibility timeline, the Moon', () => visibilityTimeline(o, night, site, 'Europe/Bratislava'));
    time('visibility timeline, a star', () => visibilityTimeline(object('star:27989')!, night, site, 'Europe/Bratislava'));
    time('related objects, first', () => relatedObjects(object('star:27989')!, null));
    time('related objects, again', () => relatedObjects(object('dso:M42')!, null));
    const moment = computeMoment(night.getTime(), site);
    const camera: Camera = { orientation: orientationFor(165, 36), fov: 46, width: 393, height: 852, projection: 'stereographic' };
    time('discovery, 20 passes', () => { for (let i = 0; i < 20; i++) discover({ camera, moment, layers: MODE_DEFAULTS.explore.layers, mode: 'explore', brightness: 0, topEdge: 100, bottomEdge: 700 }, 12, true); });
  });
});

describe.runIf(process.env.BENCH === '1')('star loop', () => {
  it('times the original scan against the index', async () => {
    const t = stars(), years = 27;
    const matrix = j2000ToHorizon(new Date('2027-01-17T20:25:00Z'), site);
    const moment = { matrix } as SkyMoment;
    const field = buildStarField(t, years);
    const aim = vectorHorizontal(mul(matrix, equatorialVector(5.6, 0)));
    const buffer = newCellBuffer();
    const pack = new DeepPack(async () => fileStorage(), { direction: directionAt, maxLoadedStars: 80000 });
    await pack.start();
    const rows: string[] = [];
    for (const [mode, fov] of [['explore', 46], ['explore', 26], ['explore', 6], ['atlas', 26], ['atlas', 6], ['atlas', 2]] as [SkyMode, number][]) {
      const limit = starLimit(mode, MODE_DEFAULTS[mode], fov, 0, false);
      const camera: Camera = { orientation: orientationFor(aim.azimuth, aim.altitude), fov, width: 393, height: 852, projection: 'stereographic' };
      const cam = mulMatFast(camera.orientation, matrix), scale = cameraScale(camera);
      let drawn = 0;
      const visit = (i: number) => {
        const a = i * 3, x0 = field.xyz[a], y0 = field.xyz[a + 1], z0 = field.xyz[a + 2];
        const k = 1 - (cam[6] * x0 + cam[7] * y0 + cam[8] * z0);
        const s = scale / k;
        const x = 196 + (cam[0] * x0 + cam[1] * y0 + cam[2] * z0) * s, y = 426 - (cam[3] * x0 + cam[4] * y0 + cam[5] * z0) * s;
        if (x >= 0 && y >= 0 && x <= 393 && y <= 852) drawn++;
      };
      const time = (fn: () => void) => { const r: number[] = []; for (let i = 0; i < 60; i++) { const a = performance.now(); fn(); r.push(performance.now() - a); } return r.sort((p, q) => p - q)[30]; };
      const query = querySky(camera, moment, years, (c) => pack.fastest(c), buffer);
      const linear = time(() => { eachStar(null, limit, visit); new Float32Array(t.count * 2).fill(NaN); });
      const indexed = time(() => { eachStar(querySky(camera, moment, years, (c) => pack.fastest(c), buffer), limit, visit); });
      let packStars = 0;
      if (mode === 'atlas') {
        pack.want(query.cells, query.count, years);
        await settled(() => Array.from(query.cells.subarray(0, query.count)).every((c) => !!pack.tile(c)));
        packStars = pack.loadedStars;
      }
      drawn = 0;
      const scanned = eachStar(query, limit, visit);
      rows.push(`${mode.padEnd(8)} fov ${String(fov).padStart(3)} V<=${limit.toFixed(1).padStart(5)} scan ${String(eachStar(null, limit, () => {})).padStart(6)} -> ${String(scanned).padStart(6)}  drawn ${String(drawn).padStart(5)}  median ${linear.toFixed(3)} -> ${indexed.toFixed(3)} ms  cells ${query.count}/${CELL_COUNT}  pack ${packStars}`);
    }
    console.log(rows.join('\n'));
  });
});
