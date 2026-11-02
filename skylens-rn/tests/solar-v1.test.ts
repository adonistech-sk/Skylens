import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import f from './fixtures/horizons-solar-v1.json';
import { angleBetween, Astronomy, AU_KM, moonPhase, mul, normalize180, Vec3 } from '../src/astronomy/core';
import { sunAltitudeAt, moonGeometry, surfacePoint } from '../src/astronomy/moonGeometry';
import { blendCameras, cameraBasis, clampPitch, orbitBy, OrbitCamera, pixelRay, projectDirection, projectPoint, raySphere } from '../src/astronomy/orbitCamera';
import { bodyFixedFrame, displayDistance, displayPosition, displayRadius, geocentricMoon, heliocentricEcliptic, lockedFrame, orbitalPeriodYears, orbitPoints, PHYSICAL, PLANET_IDS, PlanetId, satellitesOf, subPoint } from '../src/astronomy/solar';
import { Elevation, FeatureIndex, levelFor, parseFeatures, readTileDirectory, surfacePixelsPerDegree, tileAt, tileBounds, tileIndex, tilesAround } from '../src/features/moon/moonData';

const ASSETS = path.join(__dirname, '../assets');
const moonFile = (name: string) => new Uint8Array(fs.readFileSync(path.join(ASSETS, 'moon', name)));

describe('the Solar System against JPL Horizons', () => {
  it('planets within 20 arcseconds as seen from the Sun, 1900 to 2100', () => {
    let worst = 0, n = 0;
    for (const [id, rows] of Object.entries(f.heliocentric)) {
      for (const r of rows) {
        const v = heliocentricEcliptic(id as PlanetId, new Date(r.utc));
        const ref: Vec3 = [r.x / AU_KM, r.y / AU_KM, r.z / AU_KM];
        const e = angleBetween(v, ref) * 3600;
        worst = Math.max(worst, e); n++;
        expect(e, `${id} ${r.utc}`).toBeLessThan(20);
        expect(Math.abs(Math.hypot(...v) - Math.hypot(...ref)) / Math.hypot(...ref)).toBeLessThan(1e-4);
      }
    }
    expect(n).toBe(40);
    console.log(`heliocentric worst ${worst.toFixed(1)} arcsec`);
  });
  it('the Moon within 15 km of the Earth-centred reference', () => {
    for (const r of f.moon) {
      const v = geocentricMoon(new Date(r.utc));
      expect(Math.hypot(v[0] * AU_KM - r.x, v[1] * AU_KM - r.y, v[2] * AU_KM - r.z), r.utc).toBeLessThan(15);
    }
  });
  it('the Galilean moons within 500 km, a small fraction of their orbits', () => {
    for (const [id, rows] of Object.entries(f.galilean)) {
      for (const r of rows) {
        const s = satellitesOf('jupiter', new Date(r.utc)).find((x) => x.id === id)!;
        expect(Math.hypot(s.km[0] - r.x, s.km[1] - r.y, s.km[2] - r.z), `${id} ${r.utc}`).toBeLessThan(500);
      }
    }
  });
  it('only satellites with a verified model are offered', () => {
    expect(satellitesOf('saturn', new Date()).length).toBe(0);
    expect(satellitesOf('uranus', new Date()).length).toBe(0);
    expect(satellitesOf('neptune', new Date()).length).toBe(0);
    expect(satellitesOf('mars', new Date()).length).toBe(0);
    expect(satellitesOf('earth', new Date()).map((s) => s.id)).toEqual(['moon']);
    expect(satellitesOf('jupiter', new Date()).length).toBe(4);
  });
  it('one traced orbit closes on itself', () => {
    const date = new Date('2027-01-17T20:25:00Z');
    for (const id of PLANET_IDS) {
      const o = orbitPoints(id, date, 48);
      const first: Vec3 = [o[0], o[1], o[2]], last: Vec3 = [o[144], o[145], o[146]];
      expect(angleBetween(first, last), id).toBeLessThan(1);
    }
    expect(orbitalPeriodYears('earth')).toBeCloseTo(1, 3);
  });
  it('time really moves the planets', () => {
    const a = heliocentricEcliptic('mars', new Date('2027-01-01T00:00:00Z')), b = heliocentricEcliptic('mars', new Date('2027-07-01T00:00:00Z'));
    expect(angleBetween(a, b)).toBeGreaterThan(70);
  });
});

describe('which way each body faces, against JPL', () => {
  // Horizons counts west for bodies that spin forwards, east for Venus. The scene counts east.
  const westward = new Set(['mars', 'jupiter', 'saturn', 'mercury']);
  const seenFromEarth = (body: 'mars' | 'jupiter' | 'saturn' | 'venus' | 'mercury', utc: string) => {
    const d = new Date(utc), t = new Astronomy.AstroTime(d);
    const g = Astronomy.GeoVector((body[0].toUpperCase() + body.slice(1)) as Astronomy.Body, t, false);
    const tau = Math.hypot(g.x, g.y, g.z) * 499.005 * 1000;
    return subPoint(mul(bodyFixedFrame(body, new Date(d.getTime() - tau)), [-g.x, -g.y, -g.z]));
  };
  it('prime meridians within 0.05 degrees, for all five', () => {
    for (const body of ['mars', 'jupiter', 'saturn', 'venus', 'mercury'] as const) {
      for (const r of f.orientation[body]) {
        const s = seenFromEarth(body, r.utc);
        const lon = westward.has(body) ? 360 - s.lon : s.lon;
        expect(Math.abs(normalize180(lon - r.observerLon!)), `${body} ${r.utc}`).toBeLessThan(0.05);
      }
    }
  });
  it('body poles: Earth tilts 23.4 degrees, Uranus lies on its side, Venus turns backwards', () => {
    const d = new Date('2027-01-17T20:25:00Z');
    const toEcl = (id: 'earth' | 'uranus' | 'venus' | 'jupiter') => { const m = bodyFixedFrame(id, d); return mul([1, 0, 0, 0, 0.9174821, 0.3977772, 0, -0.3977772, 0.9174821], [m[6], m[7], m[8]]); };
    expect(angleBetween(toEcl('earth'), [0, 0, 1])).toBeCloseTo(23.44, 0);
    // The IAU calls north whichever pole lies on the ecliptic's north side, so a backward
    // spin shows as a falling prime meridian rather than as a flipped pole.
    expect(angleBetween(toEcl('uranus'), [0, 0, 1])).toBeGreaterThan(75);
    expect(angleBetween(toEcl('uranus'), [0, 0, 1])).toBeLessThan(90);
    expect(angleBetween(toEcl('jupiter'), [0, 0, 1])).toBeLessThan(5);
    const spin = (body: Astronomy.Body, h: number) => { const t = new Astronomy.AstroTime(d); return ((Astronomy.RotationAxis(body, t.AddDays(h / 24)).spin - Astronomy.RotationAxis(body, t).spin + 540) % 360) - 180; };
    expect(spin(Astronomy.Body.Venus, 24)).toBeLessThan(0);
    expect(spin(Astronomy.Body.Uranus, 1)).toBeLessThan(0);
    expect(spin(Astronomy.Body.Mars, 1)).toBeGreaterThan(0);
  });
  it('a locked moon keeps its +x axis on its planet', () => {
    const m = lockedFrame([1, 2, 3], [0, 0, 1]);
    const n = Math.hypot(1, 2, 3);
    expect(mul(m, [1 / n, 2 / n, 3 / n])[0]).toBeCloseTo(1, 9);
  });
  it('sizes come out right: Jupiter is flattened and about 11 Earths wide', () => {
    expect(PHYSICAL.jupiter.radius / PHYSICAL.earth.radius).toBeCloseTo(11.2, 1);
    expect(PHYSICAL.saturn.polar).toBeLessThan(0.91);
  });
});

describe('the Moon against JPL', () => {
  const near = (a: number, b: number) => Math.abs(normalize180(a - b));
  it('libration: the point facing Earth within 0.01 degrees', () => {
    for (const r of f.orientation.moon) {
      const g = moonGeometry(new Date(r.utc));
      expect(near(g.subEarth.lon, r.observerLon!), r.utc).toBeLessThan(0.01);
      expect(Math.abs(g.subEarth.lat - r.observerLat!), r.utc).toBeLessThan(0.01);
    }
  });
  it('the terminator: the sub-solar point within 0.01 degrees', () => {
    for (const r of f.orientation.moon) {
      const g = moonGeometry(new Date(r.utc));
      expect(near(g.subSolar.lon, r.sunLon!), r.utc).toBeLessThan(0.01);
      expect(Math.abs(g.subSolar.lat - r.sunLat!), r.utc).toBeLessThan(0.01);
    }
  });
  it('phase within 0.05 percentage points, and in step with the app', () => {
    for (const r of f.orientation.moon) {
      const d = new Date(r.utc), g = moonGeometry(d);
      expect(Math.abs(g.illuminated * 100 - r.illumination!), r.utc).toBeLessThan(0.05);
      expect(Math.abs(g.illuminated - moonPhase(d).illuminatedFraction), r.utc).toBeLessThan(0.01);
    }
  });
  it('the pole position angle within 0.02 degrees', () => {
    for (const r of f.orientation.moon) expect(near(moonGeometry(new Date(r.utc)).poleAngle, r.poleAngle!), r.utc).toBeLessThan(0.02);
  });
  it('at full Moon the Sun is overhead near the middle of the near side, at new Moon the far side', () => {
    const t = new Astronomy.AstroTime(new Date('2027-01-01T00:00:00Z'));
    const full = moonGeometry(Astronomy.SearchMoonPhase(180, t, 40)!.date), fresh = moonGeometry(Astronomy.SearchMoonPhase(0, t, 40)!.date);
    expect(sunAltitudeAt(0, 0, full.sun)).toBeGreaterThan(75);
    expect(sunAltitudeAt(0, 0, fresh.sun)).toBeLessThan(-75);
    expect(full.illuminated).toBeGreaterThan(0.995);
    expect(fresh.illuminated).toBeLessThan(0.005);
  });
  it('near-side orientation: surface points sit where the geometry says', () => {
    expect(surfacePoint(0, 0)).toEqual([1, 0, 0]);
    expect(surfacePoint(0, 90)[1]).toBeCloseTo(1, 9);
    expect(surfacePoint(90, 0)[2]).toBeCloseTo(1, 9);
  });
});

describe('the orbit camera', () => {
  const cam: OrbitCamera = { target: [1, 2, 0.5], yaw: 37, pitch: 22, distance: 6, roll: 0, fov: 40, width: 393, height: 852 };
  it('the target falls at the centre of the screen', () => {
    const p = projectPoint(cam, cameraBasis(cam), cam.target)!;
    expect(p.x).toBeCloseTo(196.5, 6);
    expect(p.y).toBeCloseTo(426, 6);
    expect(p.depth).toBeCloseTo(6, 6);
  });
  it('a screen point turned into a ray and back lands on itself, at any roll', () => {
    for (const roll of [0, 30, -110]) {
      const c = { ...cam, roll }, b = cameraBasis(c);
      for (const [x, y] of [[10, 20], [196, 426], [380, 800], [50, 700]]) {
        const d = pixelRay(c, b, x, y);
        const q = projectPoint(c, b, [b.eye[0] + d[0] * 3, b.eye[1] + d[1] * 3, b.eye[2] + d[2] * 3])!;
        expect(q.x).toBeCloseTo(x, 6);
        expect(q.y).toBeCloseTo(y, 6);
      }
    }
  });
  it('a sphere at the target is hit at the centre and missed beside it', () => {
    const b = cameraBasis(cam);
    const hit = raySphere(b.eye, pixelRay(cam, b, 196.5, 426), cam.target, 1)!;
    expect(Math.hypot(hit[0] - cam.target[0], hit[1] - cam.target[1], hit[2] - cam.target[2])).toBeCloseTo(1, 6);
    expect(raySphere(b.eye, pixelRay(cam, b, 5, 5), cam.target, 0.2)).toBeNull();
  });
  it('the screen edge of a sphere is where projection predicts', () => {
    const c = { ...cam, fov: 30, target: [0, 0, 0] as Vec3 }, b = cameraBasis(c);
    const edgePx = b.focal * Math.tan(Math.asin(1 / c.distance));
    expect(raySphere(b.eye, pixelRay(c, b, c.width / 2 + edgePx - 1, c.height / 2), c.target, 1)).not.toBeNull();
    expect(raySphere(b.eye, pixelRay(c, b, c.width / 2 + edgePx + 1, c.height / 2), c.target, 1)).toBeNull();
  });
  it('something behind the camera does not project', () => {
    const b = cameraBasis(cam);
    expect(projectPoint(cam, b, [b.eye[0] - b.forward[0], b.eye[1] - b.forward[1], b.eye[2] - b.forward[2]])).toBeNull();
    expect(projectDirection(cam, b, [-b.forward[0], -b.forward[1], -b.forward[2]])).toBeNull();
  });
  it('dragging cannot flip over a pole', () => {
    expect(orbitBy(cam, 0, 1e5, 0.3).pitch).toBeLessThanOrEqual(89.5);
    expect(orbitBy(cam, 0, -1e5, 0.3).pitch).toBeGreaterThanOrEqual(-89.5);
    expect(clampPitch(120)).toBe(89.5);
  });
  it('a flight ends exactly on its target and takes the short way round', () => {
    const to = { ...cam, yaw: 350, pitch: -10, distance: 0.5, target: [0, 0, 0] as Vec3 };
    const end = blendCameras({ ...cam, yaw: 10 }, to, 1);
    expect(((end.yaw % 360) + 360) % 360).toBeCloseTo(350, 6);
    expect(end.distance).toBeCloseTo(0.5, 6);
    const mid = blendCameras({ ...cam, yaw: 10 }, to, 0.5);
    expect(Math.abs(mid.yaw)).toBeLessThan(11);
  });
});

describe('display scale', () => {
  it('true scale leaves positions and sizes exactly true', () => {
    const v: Vec3 = [3, 4, 0.5];
    expect(displayPosition(v, 'true')).toEqual(v);
    expect(displayRadius('earth', 'true')).toBeCloseTo(6378.137 / AU_KM, 12);
    expect(displayDistance(30, 'true')).toBe(30);
  });
  it('illustrative scale moves distance only: every direction stays true', () => {
    for (const id of PLANET_IDS) {
      const v = heliocentricEcliptic(id, new Date('2027-01-17T20:25:00Z'));
      expect(angleBetween(v, displayPosition(v, 'illustrative')), id).toBeLessThan(1e-6);
    }
  });
  it('illustrative scale keeps the order of the planets', () => {
    const d = [0.39, 0.72, 1, 1.52, 5.2, 9.5, 19.2, 30].map((a) => displayDistance(a, 'illustrative'));
    expect(d).toEqual([...d].sort((a, b) => a - b));
    expect(displayRadius('jupiter', 'illustrative')).toBeGreaterThan(displayRadius('earth', 'illustrative'));
    expect(displayRadius('sun', 'illustrative')).toBeGreaterThan(displayRadius('jupiter', 'illustrative'));
  });
});

describe('the lunar feature catalog', () => {
  const features = parseFeatures(Buffer.from(moonFile('moon-features-v1.db')).toString('latin1'));
  const index = new FeatureIndex(features);
  const named = (n: string) => features.find((x) => x.name === n)!;

  it('holds all 9,087 IAU-adopted features, with unique IDs', () => {
    expect(features.length).toBe(9087);
    expect(new Set(features.map((x) => x.id)).size).toBe(9087);
    for (const x of features) {
      expect(x.lat).toBeGreaterThanOrEqual(-90);
      expect(x.lat).toBeLessThanOrEqual(90);
      expect(x.lon).toBeGreaterThanOrEqual(-180);
      expect(x.lon).toBeLessThanOrEqual(180);
    }
  });
  it('known landmarks are where published coordinates put them', () => {
    const at = (n: string, lat: number, lon: number) => { const x = named(n); expect(Math.abs(x.lat - lat), n).toBeLessThan(1); expect(Math.abs(normalize180(x.lon - lon)), n).toBeLessThan(1); };
    at('Tycho', -43.3, -11.2);
    at('Copernicus', 9.6, -20.1);
    at('Plato', 51.6, -9.3);
    at('Mare Crisium', 16.2, 59.1);
    at('Mare Imbrium', 34.7, -14.9);
    at('Mare Tranquillitatis', 8.4, 30.8);
    at('Oceanus Procellarum', 20.7, -56.7);
    at('Tsiolkovskiy', -20.4, 129);
  });
  it('sizes and origins are real', () => {
    expect(named('Tycho').diameter).toBeCloseTo(85.3, 0);
    expect(named('Copernicus').origin).toContain('Polish astronomer');
    expect(named('Oceanus Procellarum').code).toBe('OC');
  });
  it('searches by name, part of a name and a typo', () => {
    expect(index.search('Tycho')[0].name).toBe('Tycho');
    expect(index.search('tranquill')[0].name).toBe('Mare Tranquillitatis');
    expect(index.search('Imbrium').map((x) => x.name)).toContain('Mare Imbrium');
    expect(index.search('copernikus')[0].name).toBe('Copernicus');
    expect(index.search('xyzzy')).toEqual([]);
    expect(index.search('')).toEqual([]);
  });
});

describe('lunar elevation', () => {
  const elevation = new Elevation(moonFile('moon-dem-v1.db'));
  it('its range matches LOLA: about -9 km to +10.8 km, smoothed at this resolution', () => {
    let low = Infinity, high = -Infinity;
    for (let lat = -89; lat <= 89; lat += 0.5) for (let lon = -180; lon < 180; lon += 0.5) { const h = elevation.at(lat, lon); low = Math.min(low, h); high = Math.max(high, h); }
    console.log(`elevation ${low.toFixed(0)} to ${high.toFixed(0)} m`);
    expect(low).toBeLessThan(-7500);
    expect(low).toBeGreaterThan(-9500);
    expect(high).toBeGreaterThan(9000);
    expect(high).toBeLessThan(11000);
  });
  it('the geography is right: maria sit low, the far-side highlands high, and basins deep', () => {
    expect(elevation.at(32.8, -15.6)).toBeLessThan(-1500); // Mare Imbrium
    expect(elevation.at(8.4, 30.8)).toBeLessThan(-500); // Mare Tranquillitatis
    expect(elevation.at(5, -158)).toBeGreaterThan(5000); // Dirichlet-Jackson highlands
    expect(elevation.at(-53, -169)).toBeLessThan(-3000); // South Pole-Aitken basin
  });
  it('a crater floor sits below its rim', () => {
    expect(elevation.at(-43.3, -11.2)).toBeLessThan(elevation.at(-41.5, -11.2));
  });
  it('wraps cleanly across the date line', () => {
    expect(Math.abs(elevation.at(0, 179.99) - elevation.at(0, -179.99))).toBeLessThan(500);
  });
});

describe('the maps show the right Moon the right way round', () => {
  const brightness = async (lat: number, lon: number) => {
    const { data, info } = await sharp(path.join(ASSETS, 'moon/moon-base.jpg')).greyscale().raw().toBuffer({ resolveWithObject: true });
    const x0 = Math.round(((lon + 180) / 360) * info.width), y0 = Math.round(((90 - lat) / 180) * info.height);
    let sum = 0, n = 0;
    for (let y = y0 - 6; y <= y0 + 6; y++) for (let x = x0 - 6; x < x0 + 6; x++) { sum += data[y * info.width + ((x + info.width) % info.width)]; n++; }
    return sum / n;
  };
  it('seas are dark where they should be and highlands bright, so nothing is mirrored', async () => {
    const crisium = await brightness(17, 59), imbrium = await brightness(34, -15), highland = await brightness(-30, 10);
    expect(crisium).toBeLessThan(highland * 0.75);
    expect(imbrium).toBeLessThan(highland * 0.75);
    // Mare Humorum lies west of centre, with bright highlands at its mirror point.
    const humorum = await brightness(-24, -38), mirrored = await brightness(-24, 38);
    expect(humorum).toBeLessThan(mirrored * 0.75);
    // And the map isn't upside down: Mare Imbrium is north, the bright highlands south.
    expect(imbrium).toBeLessThan(await brightness(-34, -15) * 0.75);
  });
  it('colour map and elevation agree on where the maria are', async () => {
    const elevation = new Elevation(moonFile('moon-dem-v1.db'));
    const low = await brightness(8.4, 30.8), high = await brightness(-20, 20);
    expect(low).toBeLessThan(high);
    expect(elevation.at(8.4, 30.8)).toBeLessThan(elevation.at(-20, 20));
  });
  it('Earth is the right way round: Africa is land, the mid Pacific is sea', async () => {
    const { data, info } = await sharp(path.join(ASSETS, 'solar/earth.jpg')).raw().toBuffer({ resolveWithObject: true });
    const pixel = (lat: number, lon: number) => { const i = (Math.round(((90 - lat) / 180) * info.height) * info.width + Math.round(((lon + 180) / 360) * info.width)) * info.channels; return [data[i], data[i + 1], data[i + 2]]; };
    const sahara = pixel(23, 10), pacific = pixel(0, -150);
    expect(sahara[0]).toBeGreaterThan(sahara[2]);
    expect(pacific[2]).toBeGreaterThan(pacific[0]);
  });
});

describe('map tiles', () => {
  const pack = moonFile('moon-tiles-v1.db');
  const dir = readTileDirectory(pack);
  it('holds 160 tiles, each a real image', () => {
    expect(dir.count).toBe(160);
    expect(dir.size).toBe(516);
    for (let i = 0; i < dir.count; i++) expect(pack[dir.offsets[i]], `tile ${i}`).toBe(0xff);
  });
  it('picks the finest level the zoom can show, and no finer', () => {
    expect(levelFor(2)).toBe(0);
    expect(levelFor(9)).toBe(1);
    expect(levelFor(30)).toBe(2);
    expect(surfacePixelsPerDegree(1.5, 1000)).toBeGreaterThan(surfacePixelsPerDegree(4, 1000));
  });
  it('a point falls inside the tile chosen for it, even at the edges of the map', () => {
    for (const [lat, lon] of [[0, 0], [89.9, 179.9], [-89.9, -179.9], [33, -16], [-43, -11]]) {
      for (const level of [1, 2] as const) {
        const t = tileAt(level, lat, lon), [u0, v0, u1, v1] = tileBounds(t);
        const u = (lon + 180) / 360, v = (90 - lat) / 180;
        expect(u).toBeGreaterThanOrEqual(u0);
        expect(u).toBeLessThanOrEqual(u1);
        expect(v).toBeGreaterThanOrEqual(v0);
        expect(v).toBeLessThanOrEqual(v1);
      }
    }
  });
  it('tile indices are unique, and the four around a point include the one under it', () => {
    const seen = new Set<number>();
    for (let r = 0; r < 8; r++) for (let c = 0; c < 16; c++) seen.add(tileIndex({ level: 2, col: c, row: r }));
    for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) seen.add(tileIndex({ level: 1, col: c, row: r }));
    expect(seen.size).toBe(160);
    const near = tilesAround(2, 33, -16);
    expect(near.map(tileIndex)).toContain(tileIndex(tileAt(2, 33, -16)));
    expect(tilesAround(2, 0, 179.9).every((t) => t.col >= 0 && t.col < 16)).toBe(true);
    expect(tilesAround(2, 89.9, 0).every((t) => t.row >= 0 && t.row < 8)).toBe(true);
  });
});

describe('every shipped asset is accounted for', () => {
  const records = JSON.parse(fs.readFileSync(path.join(ASSETS, 'solar/provenance.json'), 'utf8')).files as Record<string, string | number>[];
  it('each file has a source, a checksum, a licence and a credit, and matches its checksum', () => {
    const onDisk = [...fs.readdirSync(path.join(ASSETS, 'solar')).filter((n) => n !== 'provenance.json').map((n) => `assets/solar/${n}`), ...fs.readdirSync(path.join(ASSETS, 'moon')).map((n) => `assets/moon/${n}`)].sort();
    expect(records.map((r) => r.file).sort()).toEqual(onDisk);
    for (const r of records) {
      for (const k of ['sourceUrl', 'sourceSha256', 'retrievedUtc', 'license', 'licenseUrl', 'credit', 'edits']) expect(r[k], `${r.file} ${k}`).toBeTruthy();
      const bytes = fs.readFileSync(path.join(ASSETS, '..', String(r.file)));
      expect(crypto.createHash('sha256').update(bytes).digest('hex'), String(r.file)).toBe(r.sha256);
    }
  });
  it('nothing came from the curated LROC website or an unresolved source', () => {
    for (const r of records) {
      expect(String(r.sourceUrl), String(r.file)).not.toMatch(/lroc\.(im-ldi|sese)/);
      expect(String(r.license)).not.toMatch(/unresolved|unknown/i);
    }
  });
});
