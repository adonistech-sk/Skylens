import { describe, expect, it } from 'vitest';
import { angleBetween, Observer } from '../src/astronomy/core';
import { directionOf } from '../src/astronomy/locator';
import { directionAt, object, rememberDeepStar, rememberStarMeta, stars, starDirection, yearsSinceJ2000 } from '../src/data/catalog';
import { DeepPack } from '../src/data/catalogs/deepPack';
import { Category, deepSearchReady, installDeepSearch, numberMatches, prepareSearch, search } from '../src/data/search';
import { computeMoment } from '../src/features/sky/scene';
import { fileStorage, readPackRows } from './helpers';

const site: Observer = { latitude: 48.1486, longitude: 17.1077, elevation: 134 };

describe('universal search', () => {
  const ids = (q: string, n = 40, c?: Category) => search(q, n, c).map((r) => r.id);

  it('keeps every earlier promise', () => {
    expect(ids('andromeda galaxy')[0]).toBe('dso:M31');
    expect(ids('M31')[0]).toBe('dso:M31');
    expect(ids('NGC 224')[0]).toBe('dso:M31');
    expect(ids('andromeda')).toEqual(expect.arrayContaining(['con:And', 'dso:M31']));
    expect(search('betelguese')[0].name).toBe('Betelgeuse');
    expect(search('jupitr')[0].name).toBe('Jupiter');
  });
  it('finds a star by HIP, HD, HR, Bayer letter and genitive, always one result per object', () => {
    expect(ids('HIP 27989')[0]).toBe('star:27989');
    expect(ids('HD 39801')[0]).toBe('star:27989');
    expect(ids('HR 2061')[0]).toBe('star:27989');
    expect(ids('α Ori')[0]).toBe('star:27989');
    expect(ids('alpha orionis')[0]).toBe('star:27989');
    for (const q of ['Betelgeuse', 'HIP 27989', 'orion', 'M42', 'sirius', 'NGC 1976']) expect(new Set(ids(q)).size, q).toBe(ids(q).length);
  });
  it('a typo, a later word, a reversed order and a shorthand all work', () => {
    expect(ids('andromeda nebula', 5)).toBeDefined();
    expect(ids('nebula orion')).toContain('dso:M42');
    expect(ids('galaxy whirlpool')).toContain('dso:M51');
    expect(ids('Luna')[0]).toBe('body:moon');
    expect(ids('Sol')[0]).toBe('body:sun');
    expect(ids('Ori')).toContain('con:Ori');
    expect(search('siirus')[0].name).toBe('Sirius');
    expect(search('plaiedes').length).toBeGreaterThan(0);
  });
  it('ranks the expected object first', () => {
    expect(search('sir')[0].name).toBe('Sirius');
    expect(search('veg')[0].name).toBe('Vega');
    expect(search('mar')[0].name).toBe('Mars');
    expect(search('orion')[0].id).toBe('con:Ori');
  });
  it('a category narrows the results', () => {
    expect(search('orion', 40, 'Deep Sky').every((r) => r.category === 'Deep Sky')).toBe(true);
    expect(search('orion', 40, 'Constellations').map((r) => r.id)).toEqual(['con:Ori']);
    expect(search('HIP 27989', 40, 'Deep Sky')).toEqual([]);
  });
  it('a number that does not exist finds nothing, never a guess', () => {
    expect(ids('HIP 999999')).toEqual([]);
    expect(ids('HD 999999999')).toEqual([]);
    expect(numberMatches('hip', '0123', 5)).toEqual([]);
  });
  it('a partial catalog number lists the exact star first', () => {
    expect(numberMatches('hip', '27989', 6)[0].key).toBe(27989);
    const r = numberMatches('hip', '2798', 6);
    expect(r.length).toBe(6);
    expect(r.every((x) => String(x.key).startsWith('2798'))).toBe(true);
  });
  it('is fast enough to run on every keystroke', () => {
    prepareSearch();
    const queries = ['a', 'an', 'and', 'andr', 'andromeda', 'betelguese', 'HIP 8', 'HIP 8793', 'NGC 22', 'alpha', 'alpha or', 'M3'];
    const start = performance.now();
    for (let i = 0; i < 20; i++) for (const q of queries) search(q, 30);
    const each = (performance.now() - start) / (20 * queries.length);
    console.log(`search: ${each.toFixed(3)} ms a query on Node`);
    expect(each).toBeLessThan(5);
  });
});

describe('search across the deep pack', () => {
  const pack = new DeepPack(async () => fileStorage(), { direction: directionAt });
  const barnard = 87937;

  it('before the pack is read, bundled search works and a pack star is simply not found', () => {
    expect(deepSearchReady()).toBe(false);
    expect(search('HIP 1').map((r) => r.id)).not.toContain('star:1');
  });
  it('installs every pack number, and each of the 76,806 stars can be found exactly', async () => {
    const index = (await pack.index())!;
    expect(index.hips.length).toBe(76806);
    expect(index.extra.length).toBeGreaterThan(13000);
    rememberStarMeta(index.extra);
    installDeepSearch(index.hips, index.extra);
    expect(deepSearchReady()).toBe(true);
    let missed = 0;
    for (const hip of readPackRows().keys()) {
      const r = numberMatches('hip', String(hip), 1);
      if (r[0]?.hip !== hip) missed++;
    }
    expect(missed).toBe(0);
  });
  it('a pack star found by number resolves to its real record through the tile that holds it', async () => {
    const r = search(`HIP ${barnard}`);
    expect(r[0].id).toBe(`star:${barnard}`);
    expect(object(`star:${barnard}`)).toBeNull();
    const rows = await pack.find(new Set([barnard]));
    expect(rows.length).toBe(1);
    rows.forEach(rememberDeepStar);
    const o = object(`star:${barnard}`)!;
    expect(o.magnitude).toBeCloseTo(9.54, 1);
    expect(o.position!.decDeg).toBeCloseTo(readPackRows().get(barnard)!.dec, 4);
    expect(o.star!.pmDec).toBeGreaterThan(10000);
  });
  it('a named pack star is found by its name', async () => {
    const r = search('Felixvarela');
    expect(r.length).toBeGreaterThan(0);
    const hip = Number(r[0].id.slice(5));
    (await pack.find(new Set([hip]))).forEach(rememberDeepStar);
    expect(object(r[0].id)!.name).toBe('Felixvarela');
    expect(readPackRows().has(hip)).toBe(true);
  });
  it('a bundled star that had no designations gets its HD number and spectral type from the pack', () => {
    const row = search('HD 34435');
    expect(row.length).toBe(1);
    expect(row[0].id).toBe('star:24532');
    expect(object('star:24532')!.star!.spectralType).toBe('A2III-IV');
    expect(object('star:24532')!.designations).toContain('HD 34435');
  });
});

describe('a marker stays on its star through Time Travel', () => {
  it('Barnard-class motion: the ring and the drawn star agree in 1815 and 2150', async () => {
    const pack = new DeepPack(async () => fileStorage(), { direction: directionAt });
    (await pack.find(new Set([87937]))).forEach(rememberDeepStar);
    for (const iso of ['1815-06-18T10:00:00Z', '2150-11-01T00:00:00Z']) {
      const d = new Date(iso), years = yearsSinceJ2000(d.getTime());
      const r = readPackRows().get(87937)!;
      const drawn = computeMoment(d.getTime(), site).matrix;
      const star = directionAt(r.ra, r.dec, r.pmRA, r.pmDec, years);
      const ring = directionOf(object('star:87937')!, d, site)!;
      const seen = [drawn[0] * star[0] + drawn[1] * star[1] + drawn[2] * star[2], drawn[3] * star[0] + drawn[4] * star[1] + drawn[5] * star[2], drawn[6] * star[0] + drawn[7] * star[1] + drawn[8] * star[2]] as [number, number, number];
      expect(angleBetween(seen, ring) * 3600, iso).toBeLessThan(0.5);
    }
  });
  it('holds for a bundled star as well', () => {
    const t = stars(), i = t.indexByHip.get(32349)!;
    const d = new Date('1815-06-18T10:00:00Z');
    const m = computeMoment(d.getTime(), site).matrix;
    const v = starDirection(t, i, yearsSinceJ2000(d.getTime()));
    const drawn = [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]] as [number, number, number];
    expect(angleBetween(drawn, directionOf(object('star:32349')!, d, site)!) * 3600).toBeLessThan(0.5);
  });
});
