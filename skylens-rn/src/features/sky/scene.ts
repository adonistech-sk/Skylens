// Everything the renderer needs for one instant, free of any drawing API so that it
// can be tested in Node. Planets are the expensive part, so they are recomputed only
// when simulated time moves enough to matter on screen.
import { ALL_BODIES, altitude, angleBetween, appearance, BodyId, bodyName, equatorialVector, horizontalVector, j2000ToHorizon, Mat3, moonPhase, mul, Observer, position, transpose, Vec3 } from '../../astronomy/core';
import { Camera, cameraScale, pointsPerDegree, project, unproject } from '../../astronomy/camera';
import { constellations, deepSky, namedStars, ObjectType, properName, rememberDeepStar, SkyObject, starDirection, starMetaEntries, stars, StarTable, yearsSinceJ2000 } from '../../data/catalog';
import { starIndex, visibleCells } from '../../data/catalogs';
import { rowOfTile, StarTile } from '../../data/catalogs/deepPack';
import { CELL_COUNT } from '../../data/catalogs/grid';
import { artRecord } from '../../data/constellationArt';
import { Layers, SkyMode } from '../../state/skyModes';
import { artFrame, skyToPlane } from './artGeometry';
import { labelAt, PlacedLabel } from './labels';

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
      // Airless, like the stars and the selection ring. Drawing the refracted position put a
      // body up to 36 arcminutes from its own marker near the horizon. Rise, set and altitude
      // text still use the refracted value.
      id, name: bodyName(id), dir: horizontalVector(p.geometric), magnitude: a.magnitude, angularDiameter: a.angularDiameter,
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

export { yearsSinceJ2000 };

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

// ---- What a frame can see ----

export interface SkyQuery { cells: Uint16Array; count: number; tiles: StarTile[] }

/** Largest angle from the centre of the view to a screen corner, with a few points to spare. */
export function viewHalfAngle(c: Camera): number {
  const center = unproject(c, c.width / 2, c.height / 2);
  let widest = 0;
  for (const [x, y] of [[0, 0], [c.width, 0], [0, c.height], [c.width, c.height]]) {
    widest = Math.max(widest, angleBetween(center, unproject(c, x, y)));
  }
  return widest + 8 / pointsPerDegree(c);
}

export const newCellBuffer = () => new Uint16Array(CELL_COUNT);

/** The sky cells this camera can see at an epoch. The buffer belongs to the caller. */
export function querySky(camera: Camera, moment: SkyMoment, years: number, deepFastest: ((cell: number) => number) | null, cells: Uint16Array): SkyQuery {
  const forward = mul(transpose(moment.matrix), unproject(camera, camera.width / 2, camera.height / 2));
  const count = visibleCells(forward, viewHalfAngle(camera), years, starIndex().fastest, deepFastest, cells);
  return { cells, count, tiles: [] };
}

/** Calls back for every bundled star a query covers down to a limit, brightest first in each cell. */
export function eachStar(query: SkyQuery | null, limit: number, visit: (row: number) => void): number {
  const table = stars();
  let scanned = 0;
  if (!query) {
    for (let i = 0; i < table.count; i++) {
      if (table.mag[i] > limit) break;
      visit(i);
      scanned++;
    }
    return scanned;
  }
  const { starts, rows } = starIndex();
  for (let c = 0; c < query.count; c++) {
    const cell = query.cells[c];
    for (let k = starts[cell], end = starts[cell + 1]; k < end; k++) {
      const row = rows[k];
      if (table.mag[row] > limit) break;
      visit(row);
      scanned++;
    }
  }
  return scanned;
}

// ---- Deep sky visibility ----

export type DeepGroup = 'galaxies' | 'clusters' | 'nebulae';

const GROUPS: Partial<Record<ObjectType, DeepGroup>> = {
  galaxy: 'galaxies', openCluster: 'clusters', globularCluster: 'clusters', starCloud: 'clusters', asterism: 'clusters', doubleStar: 'clusters',
  nebula: 'nebulae', planetaryNebula: 'nebulae', supernovaRemnant: 'nebulae', clusterNebula: 'nebulae',
};
export const deepGroup = (t: ObjectType): DeepGroup => GROUPS[t] ?? 'clusters';

export type Marker = { object: SkyObject; vec: Vec3 };

let allMarkers: Marker[] | null = null;
/** The whole bundled deep-sky catalog, which Deep Atlas shows. */
export function atlasMarkers(): Marker[] {
  allMarkers ??= deepSky.map((object) => ({ object, vec: equatorialVector(object.position!.raHours, object.position!.decDeg) }));
  return allMarkers;
}

/** One rule for what is drawn and what can be tapped, so neither can drift from the other. */
export function visibleDeepSky(mode: SkyMode, layers: Layers, fov: number, brightness: number, overlayOnly: boolean): Marker[] {
  if (!layers.deepSky || overlayOnly || brightness > 0.4) return [];
  const on = (m: Marker) => layers[deepGroup(m.object.type)];
  if (mode === 'atlas') {
    if (fov > 100) return [];
    const limit = 5 + 2.6 * Math.log2(100 / fov);
    return atlasMarkers().filter((m) => on(m) && (m.object.magnitude ?? 11) <= limit);
  }
  if (mode === 'observe') return fov > 46 ? [] : deepSkyMarkers().filter((m) => on(m) && (m.object.magnitude ?? 9) <= 5.5);
  if (fov > 22) return [];
  const limit = fov > 14 ? 6 : 9;
  return deepSkyMarkers().filter((m) => on(m) && (m.object.magnitude ?? 9) <= limit);
}

// ---- Hit testing ----

export interface Hit { id: string; x: number; y: number; distance: number }

export interface HitContext {
  camera: Camera;
  moment: SkyMoment;
  field: StarField;
  layers: Layers;
  mode: SkyMode;
  /** The faintest star drawn in the last frame. */
  limit: number;
  brightness: number;
  overlayOnly: boolean;
  query: SkyQuery | null;
  /** Taps below this line land on the compass, not the sky. */
  bottomEdge: number;
  labels: PlacedLabel[];
  /** Figures the last frame drew. */
  artwork?: string[];
}

/**
 * The object under a tap, favouring what is bright or named over mere proximity. Only what
 * the last frame drew can be chosen, so a tap never lands on something the sky isn't showing.
 */
export function hitTest(x: number, y: number, h: HitContext, radius = 30): Hit | null {
  return hitCandidates(x, y, h, radius, 1)[0] ?? null;
}

/** Everything near a point, best first, for a long press that lands between objects. */
export function hitCandidates(x: number, y: number, h: HitContext, radius = 30, limit = 4): Hit[] {
  const { camera, moment, field, layers } = h;
  if (y > h.bottomEdge) return [];
  if (layers.ground && unproject(camera, x, y)[2] < -0.01) return [];
  const label = labelAt(h.labels, x, y);
  const table = stars();
  const cam = mulMatFast(camera.orientation, moment.matrix);
  const scale = cameraScale(camera);
  const found: { hit: Hit; score: number }[] = [];
  if (label) found.push({ hit: { id: label.candidate.id!, x, y, distance: 0 }, score: -Infinity });
  const consider = (id: string, px: number, py: number, weight: number) => {
    const d = Math.hypot(px - x, py - y);
    if (d > radius) return false;
    if (found.some((f) => f.hit.id === id)) return false;
    found.push({ hit: { id, x: px, y: py, distance: d }, score: d + weight });
    return true;
  };
  if (layers.planets) {
    for (const b of moment.bodies) {
      const p = project(camera, b.dir);
      if (p) consider(`body:${b.id}`, p.x, p.y, -18);
    }
  }
  const stereo = camera.projection === 'stereographic';
  const place = (px: number, py: number, pz: number, then: (sx: number, sy: number) => void) => {
    const vz = cam[6] * px + cam[7] * py + cam[8] * pz;
    const k = stereo ? 1 - vz : -vz;
    if (k <= 1e-6) return;
    const s = scale / k;
    then(camera.width / 2 + (cam[0] * px + cam[1] * py + cam[2] * pz) * s, camera.height / 2 - (cam[3] * px + cam[4] * py + cam[5] * pz) * s);
  };
  if (layers.stars) {
    eachStar(h.query, h.limit, (i) => {
      const ix = i * 3;
      place(field.xyz[ix], field.xyz[ix + 1], field.xyz[ix + 2], (sx, sy) => { consider(`star:${table.hip[i]}`, sx, sy, table.mag[i] * 2.4 - (properName(table.hip[i]) ? 6 : 0)); });
    });
    for (const t of h.query?.tiles ?? []) {
      for (let i = 0; i < t.count; i++) {
        if (t.mag[i] > h.limit) break;
        // A pack star needs its record kept, because the bundled table doesn't hold it.
        place(t.xyz[i * 3], t.xyz[i * 3 + 1], t.xyz[i * 3 + 2], (sx, sy) => { if (consider(`star:${t.hip[i]}`, sx, sy, t.mag[i] * 2.4)) rememberDeepStar(rowOfTile(t, i)); });
      }
    }
  }
  for (const d of visibleDeepSky(h.mode, layers, camera.fov, h.brightness, h.overlayOnly)) {
    const p = project(camera, mul(moment.matrix, d.vec));
    if (p) consider(d.object.id, p.x, p.y, 2);
  }
  // A figure line or the illustration is itself something to tap. A dense field puts a faint
  // star near almost any point, so outside the chart the figure comes ahead of those, while a
  // star that is bright, named, or right under the finger still wins. The chart is for stars.
  if (radius <= 34 && (!found.length || h.mode !== 'atlas')) {
    const figure = found.some((f) => f.score === -Infinity) ? null : figureAt(x, y, h);
    if (figure) found.push({ hit: { id: `con:${figure}`, x, y, distance: 0 }, score: found.length ? FIGURE_SCORE : 0 });
  }
  return found.sort((a, b) => a.score - b.score).slice(0, limit).map((f) => f.hit);
}

/** Against a star's distance plus 2.4 per magnitude, less 6 if it has a name. */
const FIGURE_SCORE = 13;

const inLoop = (loop: number[], x: number, y: number) => {
  let inside = false;
  for (let i = 0, j = loop.length - 2; i < loop.length; j = i, i += 2) {
    if ((loop[i + 1] > y) !== (loop[j + 1] > y) && x < ((loop[j] - loop[i]) * (y - loop[i + 1])) / (loop[j + 1] - loop[i + 1]) + loop[i]) inside = !inside;
  }
  return inside;
};

/** The constellation under a point: within a finger of a drawn line, or on a drawn figure. */
export function figureAt(x: number, y: number, h: HitContext, reach = 11): string | null {
  const { camera, moment, field, layers } = h;
  if (layers.constellations) {
    const cam = mulMatFast(camera.orientation, moment.matrix);
    const scale = cameraScale(camera), stereo = camera.projection === 'stereographic';
    const toScreen = (row: number): [number, number] | null => {
      const a = row * 3, px = field.xyz[a], py = field.xyz[a + 1], pz = field.xyz[a + 2];
      const vz = cam[6] * px + cam[7] * py + cam[8] * pz;
      const k = stereo ? 1 - vz : -vz;
      if (k <= 1e-3) return null;
      const s = scale / k;
      return [camera.width / 2 + (cam[0] * px + cam[1] * py + cam[2] * pz) * s, camera.height / 2 - (cam[3] * px + cam[4] * py + cam[5] * pz) * s];
    };
    for (const c of constellationGeometry()) {
      for (const [a, b] of c.segments) {
        const p = toScreen(a), q = toScreen(b);
        if (!p || !q) continue;
        const dx = q[0] - p[0], dy = q[1] - p[1], len = dx * dx + dy * dy;
        if (len > 490000 || len === 0) continue;
        const t = Math.min(1, Math.max(0, ((x - p[0]) * dx + (y - p[1]) * dy) / len));
        if (Math.hypot(p[0] + dx * t - x, p[1] + dy * t - y) <= reach) return c.id;
      }
    }
  }
  if (!h.artwork?.length) return null;
  const sky = mul(transpose(moment.matrix), unproject(camera, x, y));
  for (const id of h.artwork) {
    const art = artRecord(id);
    if (!art) continue;
    const [px, py] = skyToPlane(artFrame(art), sky);
    if (Math.hypot(px, py) > art.radius) continue;
    if (art.contour.some((l) => inLoop(l, px, py))) return id;
  }
  return null;
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

let chartList: { hip: number; index: number; name: string; mag: number }[] | null = null;
/** Deep Atlas also labels stars by Bayer letter, down to what its zoom limits allow. */
export function chartStarList() {
  if (!chartList) {
    const t = stars();
    const list: { hip: number; index: number; name: string; mag: number }[] = [];
    for (const [hip, m] of starMetaEntries()) {
      const index = t.indexByHip.get(hip);
      const name = m.name ?? m.bayer;
      if (index !== undefined && name) list.push({ hip, index, name, mag: t.mag[index] });
    }
    chartList = list.sort((a, b) => a.mag - b.mag);
  }
  return chartList;
}

/** Degrees from a constellation's centre to the farthest star of its figure. */
export function constellationSpan(id: string, field: StarField): number {
  const g = constellationGeometry().find((c) => c.id === id);
  if (!g) return 20;
  let widest = 0;
  for (const seg of g.segments) {
    for (const i of seg) {
      const a = i * 3;
      widest = Math.max(widest, angleBetween(g.center, [field.xyz[a], field.xyz[a + 1], field.xyz[a + 2]]));
    }
  }
  return widest;
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

