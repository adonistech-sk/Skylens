import crypto from 'node:crypto';
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { Camera, orientationFor, project } from '../src/astronomy/camera';
import { equatorialVector, j2000ToHorizon, mul, Observer, vectorHorizontal } from '../src/astronomy/core';
import { directionAt, object, starDirection, stars } from '../src/data/catalog';
import { buildCellIndex, starIndex } from '../src/data/catalogs';
import { DeepPack } from '../src/data/catalogs/deepPack';
import { CELL_COUNT, cellGeometry, cellOf, crc32, PACK_RECORD, packRecordsOffset } from '../src/data/catalogs/grid';
import { DEEP_PACK } from '../src/data/generated/deepPack';
import { buildStarField, computeMoment, eachStar, hitTest, newCellBuffer, querySky, SkyMoment, yearsSinceJ2000 } from '../src/features/sky/scene';
import { MODE_DEFAULTS, starLimit } from '../src/state/skyModes';
import { fileStorage, PACK_FILE, readPackRows, settled } from './helpers';

const site: Observer = { latitude: 48.1486, longitude: 17.1077, elevation: 134 };
const newPack = (open = async () => fileStorage(), maxLoadedStars?: number) => new DeepPack(open, { direction: directionAt, maxLoadedStars });

describe('the grid', () => {
  it('covers the sphere with cells that stay close to one size', () => {
    const { radii } = cellGeometry();
    expect(CELL_COUNT).toBe(1536);
    expect(Math.max(...radii)).toBeLessThan(6);
    expect(Math.min(...radii)).toBeGreaterThan(3);
  });

  it('every direction falls inside its cell radius, including poles, RA 0 and cube edges', () => {
    const { centers, radii } = cellGeometry();
    const check = (x: number, y: number, z: number) => {
      const l = Math.hypot(x, y, z), c = cellOf(x, y, z);
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThan(CELL_COUNT);
      const dot = (centers[c * 3] * x + centers[c * 3 + 1] * y + centers[c * 3 + 2] * z) / l;
      expect((Math.acos(Math.min(1, dot)) * 180) / Math.PI).toBeLessThanOrEqual(radii[c] + 1e-3);
    };
    for (const v of [[0, 0, 1], [0, 0, -1], [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [1, 1, 0], [1, 1, 1], [-1, -1, -1], [1, -1, 1], [1, 0, 1e-9]]) check(v[0], v[1], v[2]);
    let seed = 7;
    const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32 - 0.5; };
    for (let i = 0; i < 20000; i++) check(rand(), rand(), rand());
  });
});

describe('the star index', () => {
  it('holds every bundled star exactly once, brightest first in each cell', () => {
    const t = stars(), idx = buildCellIndex(t);
    expect(idx.rows.length).toBe(t.count);
    expect(new Set(idx.rows).size).toBe(t.count);
    for (let c = 0; c < CELL_COUNT; c++) {
      for (let k = idx.starts[c] + 1; k < idx.starts[c + 1]; k++) expect(t.mag[idx.rows[k]]).toBeGreaterThanOrEqual(t.mag[idx.rows[k - 1]]);
    }
  });

  // Aim points chosen to sit where a spatial index usually fails.
  const aims: [string, number, number][] = [
    ['RA 0', 0, 0], ['RA 0 north', 0, 40], ['RA 24 side', 23.999, -30], ['north pole', 0, 90], ['south pole', 12, -90], ['near pole', 6, 88], ['face edge', 3, 35.26], ['face corner', 21, -35.26],
    ['Orion', 5.6, 0], ['Scorpius', 16.5, -26], ['Barnard', 17.96, 4.69], ['Crux', 12.5, -60],
  ];

  it('never loses a star that is really on screen: zero false negatives against a brute-force scan', () => {
    const t = stars(), pack = [...readPackRows().values()];
    const buffer = newCellBuffer();
    const date = new Date('2027-01-17T20:25:00Z');
    const matrix = j2000ToHorizon(date, site);
    let checked = 0, missed = 0, cameras = 0;
    const packFastest = new Float32Array(CELL_COUNT);
    for (const s of pack) {
      const r = (s.ra * Math.PI) / 180, d = (s.dec * Math.PI) / 180;
      const c = cellOf(Math.cos(d) * Math.cos(r), Math.cos(d) * Math.sin(r), Math.sin(d));
      packFastest[c] = Math.max(packFastest[c], Math.hypot(s.pmRA, s.pmDec));
    }
    const baseCell = (i: number) => { const r = (t.ra[i] * Math.PI) / 180, d = (t.dec[i] * Math.PI) / 180; return cellOf(Math.cos(d) * Math.cos(r), Math.cos(d) * Math.sin(r), Math.sin(d)); };
    for (const years of [-199.9, 0, 26, 199.9]) {
      for (const fov of [2, 8, 30, 90]) {
        for (const [, ra, dec] of aims) {
          const aim = vectorHorizontal(mul(matrix, equatorialVector(ra, dec)));
          const camera: Camera = { orientation: orientationFor(aim.azimuth, Math.min(89, aim.altitude)), fov, width: 393, height: 852, projection: 'stereographic' };
          const moment = { matrix } as SkyMoment;
          const q = querySky(camera, moment, years, (c) => packFastest[c], buffer);
          const cells = new Set(q.cells.subarray(0, q.count));
          cameras++;
          const onScreen = (v: [number, number, number]) => { const p = project(camera, mul(matrix, v)); return p !== null && p.x >= 0 && p.y >= 0 && p.x <= 393 && p.y <= 852; };
          for (let i = 0; i < t.count; i += fov > 20 ? 7 : 1) {
            if (onScreen(starDirection(t, i, years))) { checked++; if (!cells.has(baseCell(i))) missed++; }
          }
          for (let i = 0; i < pack.length; i += fov > 20 ? 7 : 1) {
            const s = pack[i];
            if (onScreen(directionAt(s.ra, s.dec, s.pmRA, s.pmDec, years))) {
              checked++;
              const r = (s.ra * Math.PI) / 180, d = (s.dec * Math.PI) / 180;
              if (!cells.has(cellOf(Math.cos(d) * Math.cos(r), Math.cos(d) * Math.sin(r), Math.sin(d)))) missed++;
            }
          }
        }
      }
    }
    console.log(`index check: ${cameras} cameras, ${checked} on-screen stars, ${missed} missed`);
    expect(cameras).toBe(4 * 4 * aims.length);
    expect(checked).toBeGreaterThan(100000);
    expect(missed).toBe(0);
  });

  it('the indexed path scans far fewer stars at a tight zoom, and the same stars on screen', () => {
    const t = stars(), buffer = newCellBuffer();
    const matrix = j2000ToHorizon(new Date('2027-01-17T20:25:00Z'), site);
    const aim = vectorHorizontal(mul(matrix, equatorialVector(5.6, 0)));
    const camera: Camera = { orientation: orientationFor(aim.azimuth, aim.altitude), fov: 6, width: 393, height: 852, projection: 'stereographic' };
    const q = querySky(camera, { matrix } as SkyMoment, 27, null, buffer);
    const seen = (query: typeof q | null) => { const s = new Set<number>(); eachStar(query, 8, (i) => { const p = project(camera, mul(matrix, starDirection(t, i, 27))); if (p && p.x >= 0 && p.y >= 0 && p.x <= 393 && p.y <= 852) s.add(i); }); return s; };
    const linear = seen(null), indexed = seen(q);
    expect([...linear].sort()).toEqual([...indexed].sort());
    let viaIndex = 0;
    const scanned = eachStar(q, 8, () => { viaIndex++; });
    console.log(`scan at 6 degrees: ${eachStar(null, 8, () => {})} linear, ${scanned} indexed, ${linear.size} on screen`);
    expect(viaIndex).toBeLessThan(t.count / 10);
    expect(starIndex().rows.length).toBe(t.count);
  });
});

describe('the deep star pack', () => {
  it('matches its manifest and its checksum', () => {
    const bytes = fs.readFileSync(PACK_FILE);
    expect(bytes.length).toBe(DEEP_PACK.bytes);
    expect(crypto.createHash('sha256').update(bytes).digest('hex')).toBe(DEEP_PACK.sha256);
    expect(readPackRows().size).toBe(DEEP_PACK.stars);
  });

  it('together with the bundled stars it is exactly stars.bin: nothing lost, added or changed', () => {
    const bin = fs.readFileSync(`${__dirname}/../../Packages/SkyLensKit/Sources/SkyCatalog/Resources/stars.bin`);
    const n = bin.readUInt32LE(4), t = stars(), pack = readPackRows();
    expect(t.count + pack.size).toBe(n);
    for (let i = 0; i < n; i++) {
      const o = 8 + i * 28, hip = bin.readUInt32LE(o);
      const inBase = t.indexByHip.has(hip), row = pack.get(hip);
      expect(inBase !== !!row, `HIP ${hip}`).toBe(true);
      if (row) {
        expect(row.ra).toBe(bin.readFloatLE(o + 4));
        expect(row.dec).toBe(bin.readFloatLE(o + 8));
        expect(row.mag).toBe(bin.readInt16LE(o + 24) / 100);
      }
    }
  });

  it('loads a tile off the frame and fills in only what was asked for', async () => {
    const log = { reads: 0 };
    let changes = 0;
    const pack = new DeepPack(async () => fileStorage(PACK_FILE, undefined, log), { direction: directionAt, onChange: () => { changes++; } });
    const cell = cellOf(Math.cos(0), 0.05, 0.01);
    pack.want([cell], 1, 27);
    expect(pack.tile(cell)).toBeUndefined();
    await settled(() => !!pack.tile(cell));
    const t = pack.tile(cell)!;
    expect(t.count).toBeGreaterThan(0);
    expect(pack.loadedTiles).toBe(1);
    expect(log.reads).toBe(2); // The directory, then one tile.
    expect(changes).toBeGreaterThan(0);
    for (let i = 1; i < t.count; i++) expect(t.mag[i]).toBeGreaterThanOrEqual(t.mag[i - 1]);
    const row = readPackRows().get(t.hip[0])!;
    expect(t.ra[0]).toBe(row.ra);
    expect(Math.hypot(t.xyz[0], t.xyz[1], t.xyz[2])).toBeCloseTo(1, 5);
  });

  it('never holds more than its budget, however far the view roams', async () => {
    const pack = newPack(undefined, 5000);
    await pack.start();
    let peak = 0;
    for (let c = 0; c < CELL_COUNT; c += 16) {
      pack.want([c, c + 1, c + 2, c + 3], 4, 27);
      await settled(() => !!pack.tile(c + 3));
      peak = Math.max(peak, pack.loadedStars);
    }
    expect(peak).toBeLessThanOrEqual(5000 + 400);
    expect(pack.loadedStars).toBeLessThanOrEqual(5000);
  });

  it('a newer request replaces an older one, so a fast pan skips sky already gone', async () => {
    const log = { reads: 0 };
    const pack = new DeepPack(async () => fileStorage(PACK_FILE, undefined, log), { direction: directionAt, tilesPerTick: 1 });
    await pack.start();
    const before = log.reads;
    const first = Array.from({ length: 400 }, (_, i) => i);
    pack.want(first, first.length, 27);
    pack.want([1000], 1, 27);
    await settled(() => !!pack.tile(1000));
    expect(log.reads - before).toBeLessThan(5);
  });

  it('a damaged tile stays empty and is counted, and the rest keep working', async () => {
    const records = packRecordsOffset();
    const pack = newPack(async () => fileStorage(PACK_FILE, (b, offset) => { if (offset >= records && offset < records + 60 * PACK_RECORD) b[0] ^= 255; }));
    await pack.start();
    pack.want([0, 900], 2, 27);
    await settled(() => !!pack.tile(900));
    expect(pack.status).toBe('ready');
    expect(pack.badTiles).toBe(1);
    expect(pack.tile(0)).toBeUndefined();
    expect(pack.tile(900)).toBeTruthy();
  });

  it('a file that is not a pack, or is missing, is a reported state and not a crash', async () => {
    const bad = newPack(async () => fileStorage(PACK_FILE, (b, offset) => { if (offset === 0) b[0] = 0; }));
    await bad.start();
    expect(bad.status).toBe('failed');
    expect(bad.failure).toContain('Not a star pack');
    bad.want([1], 1, 27);
    expect(bad.tile(1)).toBeUndefined();
    const gone = newPack(async () => { throw new Error('no such file'); });
    await gone.start();
    expect(gone.status).toBe('failed');
    expect(gone.failure).toBe('no such file');
  });

  it('a pack star can be tapped, then named from its record, and it was never in the bundled table', async () => {
    const date = new Date('2027-01-17T20:25:00Z');
    const moment = computeMoment(date.getTime(), site);
    const years = yearsSinceJ2000(date.getTime());
    const field = buildStarField(stars(), years);
    const pack = newPack();
    await pack.start();
    const t0 = readPackRows();
    const row = [...t0.values()].find((s) => s.mag > 9 && s.mag < 10 && vectorHorizontal(mul(moment.matrix, directionAt(s.ra, s.dec, s.pmRA, s.pmDec, years))).altitude > 30)!;
    expect(object(`star:${row.hip}`)).toBeNull();
    const dir = mul(moment.matrix, directionAt(row.ra, row.dec, row.pmRA, row.pmDec, years));
    const aim = vectorHorizontal(dir);
    const camera: Camera = { orientation: orientationFor(aim.azimuth, aim.altitude), fov: 4, width: 393, height: 852, projection: 'stereographic' };
    const query = querySky(camera, moment, years, (c) => pack.fastest(c), newCellBuffer());
    pack.want(query.cells, query.count, years);
    await settled(() => Array.from(query.cells.subarray(0, query.count)).every((c) => !!pack.tile(c)));
    query.tiles = Array.from(query.cells.subarray(0, query.count)).map((c) => pack.tile(c)!).filter((x) => x.count);
    const settings = MODE_DEFAULTS.atlas;
    const p = project(camera, dir)!;
    const hit = hitTest(p.x, p.y, { camera, moment, field, layers: settings.layers, mode: 'atlas', limit: starLimit('atlas', settings, 4, 0, false), brightness: 0, overlayOnly: false, query, bottomEdge: 720, labels: [] }, 6);
    expect(hit?.id).toBe(`star:${row.hip}`);
    const o = object(hit!.id)!;
    expect(o.name).toBe(`HIP ${row.hip}`);
    expect(o.magnitude).toBe(row.mag);
    expect(o.position!.decDeg).toBeCloseTo(row.dec, 5);
  });

  it('finds saved stars anywhere in the pack', async () => {
    const pack = newPack();
    const wanted = [...readPackRows().keys()].filter((_, i) => i % 20000 === 3);
    const rows = await pack.find(new Set(wanted));
    expect(rows.map((r) => r.hip).sort()).toEqual([...wanted].sort());
    expect(crc32(new Uint8Array([1, 2, 3]))).toBe(1438416925);
  });
});
