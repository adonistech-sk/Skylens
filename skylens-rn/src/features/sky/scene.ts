// Everything the renderer needs for one instant, free of any drawing API so that it
// can be tested in Node. Planets are the expensive part, so they are recomputed only
// when simulated time moves enough to matter on screen.
import { ALL_BODIES, altitude, appearance, BodyId, bodyName, equatorialVector, horizontalVector, j2000ToHorizon, Mat3, moonPhase, mul, Observer, position, Vec3 } from '../../astronomy/core';
import { Camera, cameraScale, project } from '../../astronomy/camera';
import { constellations, deepSky, namedStars, properName, SkyObject, starDirection, stars, StarTable } from '../../data/catalog';

export interface BodyState {
  id: BodyId;
  name: string;
  /** Horizon-frame direction. */
  dir: Vec3;
  magnitude: number;
  angularDiameter: number;
  illuminated: number;
  /** Radians, direction of the Sun on the disc for phase shading. */
  altitude: number;
}

export interface SkyMoment {
  time: number;
  observerKey: string;
  matrix: Mat3;
  sunAltitude: number;
  sunDir: Vec3;
  moonDir: Vec3;
  moonFraction: number;
  bodies: BodyState[];
}

export function computeMoment(time: number, observer: Observer): SkyMoment {
  const date = new Date(time);
  const bodies: BodyState[] = ALL_BODIES.map((id) => {
    const p = position(id, date, observer);
    const a = appearance(id, date);
    return {
      id, name: bodyName(id), dir: horizontalVector(p.apparent), magnitude: a.magnitude, angularDiameter: a.angularDiameter,
      illuminated: a.illuminatedFraction, altitude: p.apparent.altitude,
    };
  });
  const sun = bodies[0], moon = bodies[1];
  return {
    time, observerKey: `${observer.latitude},${observer.longitude}`, matrix: j2000ToHorizon(date, observer),
    sunAltitude: altitude('sun', date, observer), sunDir: sun.dir, moonDir: moon.dir, moonFraction: moonPhase(date).illuminatedFraction, bodies,
  };
}

/** J2000 unit vectors at an epoch, rebuilt only when proper motion would be visible. */
export interface StarField { years: number; xyz: Float32Array }

export function buildStarField(table: StarTable, years: number): StarField {
  const xyz = new Float32Array(table.count * 3);
  for (let i = 0; i < table.count; i++) {
    const v = starDirection(table, i, years);
    xyz[i * 3] = v[0]; xyz[i * 3 + 1] = v[1]; xyz[i * 3 + 2] = v[2];
  }
  return { years, xyz };
}

export const yearsSinceJ2000 = (time: number) => (time - 946_728_000_000) / (365.25 * 86_400_000);

/** 0 full night, 1 full daylight. From the conventional twilight stages. */
export function skyBrightness(sunAltitude: number): number {
  const t = Math.min(1, Math.max(0, (sunAltitude + 18) / 24));
  return t * t * (3 - 2 * t);
}

/** Faintest magnitude drawn. Zooming reveals more, and a bright sky hides them. */
export function limitingMagnitude(fov: number, brightness: number, base = 5.6): number {
  return base + Math.max(0, 2.2 * Math.log10(60 / Math.max(fov, 0.5))) - 7 * brightness;
}

export const starRadius = (mag: number, limit: number) => Math.max(0.42, 0.42 * Math.pow(Math.max(0, limit - mag) + 0.5, 0.82));

// ---- Hit testing ----

export interface Hit { id: string; x: number; y: number; distance: number }

/** The object under a tap, favouring what is bright or named over mere proximity. */
export function hitTest(x: number, y: number, camera: Camera, moment: SkyMoment, field: StarField, showDeepSky: boolean, radius = 30): Hit | null {
  const table = stars();
  const cam = mulMatFast(camera.orientation, moment.matrix);
  const scale = cameraScale(camera);
  let best: Hit | null = null, bestScore = Infinity;
  const consider = (id: string, px: number, py: number, weight: number) => {
    const d = Math.hypot(px - x, py - y);
    if (d > radius) return;
    const s = d + weight;
    if (s < bestScore) { bestScore = s; best = { id, x: px, y: py, distance: d }; }
  };
  for (const b of moment.bodies) {
    const p = project(camera, b.dir);
    if (p) consider(`body:${b.id}`, p.x, p.y, -18);
  }
  const limit = limitingMagnitude(camera.fov, 0) ;
  const n = Math.min(table.count, 6000);
  for (let i = 0; i < n; i++) {
    const m = table.mag[i];
    if (m > limit) break;
    const ix = i * 3;
    const vx = cam[0] * field.xyz[ix] + cam[1] * field.xyz[ix + 1] + cam[2] * field.xyz[ix + 2];
    const vy = cam[3] * field.xyz[ix] + cam[4] * field.xyz[ix + 1] + cam[5] * field.xyz[ix + 2];
    const vz = cam[6] * field.xyz[ix] + cam[7] * field.xyz[ix + 1] + cam[8] * field.xyz[ix + 2];
    const k = camera.projection === 'stereographic' ? 1 - vz : -vz;
    if (k <= 1e-6) continue;
    const s = scale / k;
    consider(`star:${table.hip[i]}`, camera.width / 2 + vx * s, camera.height / 2 - vy * s, m * 2.4 - (properName(table.hip[i]) ? 6 : 0));
  }
  if (showDeepSky) {
    for (const d of deepSkyMarkers()) {
      const p = project(camera, mul(moment.matrix, d.vec));
      if (p) consider(d.object.id, p.x, p.y, 2);
    }
  }
  return best;
}

export function mulMatFast(a: Mat3, b: Mat3): Mat3 {
  return [
    a[0] * b[0] + a[1] * b[3] + a[2] * b[6], a[0] * b[1] + a[1] * b[4] + a[2] * b[7], a[0] * b[2] + a[1] * b[5] + a[2] * b[8],
    a[3] * b[0] + a[4] * b[3] + a[5] * b[6], a[3] * b[1] + a[4] * b[4] + a[5] * b[7], a[3] * b[2] + a[4] * b[5] + a[5] * b[8],
    a[6] * b[0] + a[7] * b[3] + a[8] * b[6], a[6] * b[1] + a[7] * b[4] + a[8] * b[7], a[6] * b[2] + a[7] * b[5] + a[8] * b[8],
  ];
}

let markers: { object: SkyObject; vec: Vec3 }[] | null = null;
/** Messier objects plus the curated showpieces. */
export function deepSkyMarkers() {
  if (!markers) {
    markers = deepSky.filter((d) => d.deepSky?.messier || d.designations.length > 0)
      .map((object) => ({ object, vec: equatorialVector(object.position!.raHours, object.position!.decDeg) }));
  }
  return markers;
}

let namedList: { hip: number; index: number; name: string; mag: number }[] | null = null;
export function namedStarList() {
  if (!namedList) {
    const t = stars();
    namedList = namedStars(120).map((hip) => {
      const index = t.indexByHip.get(hip)!;
      return { hip, index, name: properName(hip)!, mag: t.mag[index] };
    });
  }
  return namedList;
}

export interface ConstellationGeometry { id: string; name: string; segments: [number, number][]; center: Vec3 }

let geometry: ConstellationGeometry[] | null = null;
/** Figure segments as star-table indices, and a label anchor from the figure's mean. */
export function constellationGeometry(): ConstellationGeometry[] {
  if (geometry) return geometry;
  const t = stars();
  geometry = constellations.map((c) => {
    const segments: [number, number][] = [];
    for (const line of c.lines) {
      for (let i = 1; i < line.length; i++) segments.push([t.indexByHip.get(line[i - 1])!, t.indexByHip.get(line[i])!]);
    }
    return { id: c.id, name: c.name, segments, center: equatorialVector(c.center[0] / 15, c.center[1]) };
  });
  return geometry;
}

