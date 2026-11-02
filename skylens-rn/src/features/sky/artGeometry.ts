// Where a constellation's illustration sits on the sky, free of any drawing API so that it can
// be tested in Node. An illustration is a flat plate. It is carried onto the sphere through the
// same plane it was drawn in, then through the same camera as the stars, so nothing about its
// placement is approximated by a fitted transform. Proper motion drags the plate with its stars,
// using the star field the frame already holds, so the stars stay on the figure across centuries.
// Nothing here can change where a star is: stars are read, never written.
import { Camera, cameraScale, pointsPerDegree } from '../../astronomy/camera';
import { angleBetween, DEG, Mat3, Vec3 } from '../../astronomy/core';
import { starDirection, stars } from '../../data/catalog';
import { ArtRecord, artRecords } from '../../data/constellationArt';
import { artworkFade } from './artFade';

export interface PlaneFrame { c: Vec3; east: Vec3; north: Vec3 }

const unit = (ra: number, dec: number): Vec3 => {
  const a = ra * DEG, d = dec * DEG;
  return [Math.cos(d) * Math.cos(a), Math.cos(d) * Math.sin(a), Math.sin(d)];
};

/** The tangent directions at a figure's centre: east along rising RA, north toward the pole. */
export function planeFrame(ra: number, dec: number): PlaneFrame {
  const c = unit(ra, dec);
  const l = Math.hypot(c[0], c[1]) || 1;
  const east: Vec3 = [-c[1] / l, c[0] / l, 0];
  const north: Vec3 = [c[1] * east[2] - c[2] * east[1], c[2] * east[0] - c[0] * east[2], c[0] * east[1] - c[1] * east[0]];
  return { c, east, north };
}

/** Plane degrees to a J2000 direction, stereographically. +x is west, as the sky looks from below. */
export function planeToSky(f: PlaneFrame, x: number, y: number): Vec3 {
  const X = x * DEG, Y = y * DEG;
  const q = (X * X + Y * Y) / 4, s = 1 / (1 + q), k = (1 - q) * s;
  return [
    f.c[0] * k + (-f.east[0] * X + f.north[0] * Y) * s,
    f.c[1] * k + (-f.east[1] * X + f.north[1] * Y) * s,
    f.c[2] * k + (-f.east[2] * X + f.north[2] * Y) * s,
  ];
}

/** The inverse, used to find what a finger is on. */
export function skyToPlane(f: PlaneFrame, v: Vec3): [number, number] {
  const k = 2 / (1 + v[0] * f.c[0] + v[1] * f.c[1] + v[2] * f.c[2]);
  return [-(v[0] * f.east[0] + v[1] * f.east[1] + v[2] * f.east[2]) * k / DEG, (v[0] * f.north[0] + v[1] * f.north[1] + v[2] * f.north[2]) * k / DEG];
}

/** A plate's mesh. Cells are small enough that a straight edge follows the projection. */
export const MESH_CELL = 3;
const MESH_LIMIT = 44;

export interface ArtMesh {
  id: string;
  years: number;
  cols: number;
  rows: number;
  /** Vertices, J2000 unit vectors. */
  xyz: Float32Array;
  /** Vertices in plate pixels. */
  uv: { x: number; y: number }[];
  indices: number[];
  /** Outline vertices, and where each loop starts. */
  outline: Float32Array;
  loops: { start: number; count: number }[];
}

const buildBase = (art: ArtRecord) => {
  const [left, bottom, right, top] = art.extent;
  const cols = Math.min(MESH_LIMIT, Math.max(4, Math.ceil((right - left) / MESH_CELL)));
  const rows = Math.min(MESH_LIMIT, Math.max(4, Math.ceil((top - bottom) / MESH_CELL)));
  const frame = planeFrame(art.centre[0], art.centre[1]);
  const count = (cols + 1) * (rows + 1);
  const xyz = new Float32Array(count * 3);
  const uv: { x: number; y: number }[] = [];
  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c <= cols; c++) {
      const i = r * (cols + 1) + c, u = c / cols, v = r / rows;
      const p = planeToSky(frame, left + (right - left) * u, top - (top - bottom) * v);
      xyz[i * 3] = p[0]; xyz[i * 3 + 1] = p[1]; xyz[i * 3 + 2] = p[2];
      uv.push({ x: u * art.width, y: v * art.height });
    }
  }
  const indices: number[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const a = r * (cols + 1) + c, b = a + 1, d = a + cols + 1, e = d + 1;
      indices.push(a, b, d, b, e, d);
    }
  }
  const loops: { start: number; count: number }[] = [];
  const total = art.contour.reduce((n, l) => n + l.length / 2, 0);
  const outline = new Float32Array(total * 3);
  let at = 0;
  for (const loop of art.contour) {
    loops.push({ start: at, count: loop.length / 2 });
    for (let i = 0; i < loop.length; i += 2) {
      const p = planeToSky(frame, loop[i], loop[i + 1]);
      outline[at * 3] = p[0]; outline[at * 3 + 1] = p[1]; outline[at * 3 + 2] = p[2];
      at++;
    }
  }
  return { frame, cols, rows, xyz, uv, indices, outline, loops };
};

type Base = ReturnType<typeof buildBase>;
const bases = new Map<string, Base>();
const baseOf = (art: ArtRecord) => {
  let b = bases.get(art.id);
  if (!b) { b = buildBase(art); bases.set(art.id, b); }
  return b;
};

export const artFrame = (art: ArtRecord) => baseOf(art).frame;

/**
 * Moves points with the stars around them. Each point follows its neighbours' drift, weighted
 * steeply by nearness, so a point on a star moves exactly as that star does.
 */
export function dragWithStars(base: Float32Array, out: Float32Array, pinsThen: Float32Array, pinsMoved: Float32Array) {
  const pins = pinsThen.length / 3;
  for (let i = 0; i < base.length; i += 3) {
    const x = base[i], y = base[i + 1], z = base[i + 2];
    let sw = 0, dx = 0, dy = 0, dz = 0;
    for (let p = 0; p < pins; p++) {
      const a = p * 3;
      const ex = x - pinsThen[a], ey = y - pinsThen[a + 1], ez = z - pinsThen[a + 2];
      const d2 = ex * ex + ey * ey + ez * ez;
      const w = 1 / (d2 * d2 + 1e-14);
      sw += w;
      dx += w * pinsMoved[a]; dy += w * pinsMoved[a + 1]; dz += w * pinsMoved[a + 2];
    }
    const nx = x + dx / sw, ny = y + dy / sw, nz = z + dz / sw;
    const l = Math.sqrt(nx * nx + ny * ny + nz * nz);
    out[i] = nx / l; out[i + 1] = ny / l; out[i + 2] = nz / l;
  }
}

const meshes = new Map<string, ArtMesh>();

/** Meshes kept. Rebuilding one is a few milliseconds, and only when the star epoch moves. */
export const MESH_CACHE = 12;

/** A plate's mesh for a star field's epoch. Cached until the field moves on. */
export function meshFor(art: ArtRecord, field: { years: number; xyz: Float32Array }): ArtMesh {
  const hit = meshes.get(art.id);
  if (hit && hit.years === field.years) {
    meshes.delete(art.id); meshes.set(art.id, hit);
    return hit;
  }
  const base = baseOf(art);
  const table = stars();
  const rows = art.pins.map((h) => table.indexByHip.get(h)).filter((r): r is number => r !== undefined);
  const then = new Float32Array(rows.length * 3), moved = new Float32Array(rows.length * 3);
  rows.forEach((row, i) => {
    const v = starDirection(table, row, 0);
    for (let k = 0; k < 3; k++) { then[i * 3 + k] = v[k]; moved[i * 3 + k] = field.xyz[row * 3 + k] - v[k]; }
  });
  const xyz = new Float32Array(base.xyz.length), outline = new Float32Array(base.outline.length);
  dragWithStars(base.xyz, xyz, then, moved);
  dragWithStars(base.outline, outline, then, moved);
  const mesh: ArtMesh = { id: art.id, years: field.years, cols: base.cols, rows: base.rows, xyz, uv: base.uv, indices: base.indices, outline, loops: base.loops };
  meshes.delete(art.id);
  meshes.set(art.id, mesh);
  if (meshes.size > MESH_CACHE) meshes.delete(meshes.keys().next().value!);
  return mesh;
}

export const meshCacheSize = () => meshes.size;

/** Through the frame's camera. Returns false if a point falls too near the projection's pole. */
export function projectAll(xyz: Float32Array, camera: Camera, cam: Mat3, out: Float32Array): boolean {
  const scale = cameraScale(camera), stereo = camera.projection === 'stereographic';
  const w = camera.width / 2, h = camera.height / 2;
  const [m0, m1, m2, m3, m4, m5, m6, m7, m8] = cam;
  let clean = true;
  for (let i = 0, j = 0; i < xyz.length; i += 3, j += 2) {
    const x = xyz[i], y = xyz[i + 1], z = xyz[i + 2];
    const cz = m6 * x + m7 * y + m8 * z;
    const k = stereo ? 1 - cz : -cz;
    if (k <= 0.03) { clean = false; out[j] = out[j + 1] = NaN; continue; }
    const s = scale / k;
    out[j] = w + (m0 * x + m1 * y + m2 * z) * s;
    out[j + 1] = h - (m3 * x + m4 * y + m5 * z) * s;
  }
  return clean;
}

/**
 * How far, in points, the drawn plate is from its anchor stars in this exact frame. The plate's
 * mesh is read the way the GPU reads it, one triangle at a time, against the star's own place.
 */
export function anchorError(art: ArtRecord, mesh: ArtMesh, field: { xyz: Float32Array }, camera: Camera, cam: Mat3): number {
  const [left, bottom, right, top] = art.extent;
  const { cols, rows } = mesh;
  const screen = new Float32Array((mesh.xyz.length / 3) * 2);
  if (!projectAll(mesh.xyz, camera, cam, screen)) return NaN;
  const table = stars();
  const one = new Float32Array(2);
  let worst = 0;
  for (const anchor of art.anchors) {
    const row = table.indexByHip.get(anchor.hip);
    if (row === undefined) continue;
    if (!projectAll(field.xyz.subarray(row * 3, row * 3 + 3), camera, cam, one)) continue;
    const u = ((anchor.x - left) / (right - left)) * cols, v = ((top - anchor.y) / (top - bottom)) * rows;
    const c = Math.min(cols - 1, Math.floor(u)), r = Math.min(rows - 1, Math.floor(v));
    const fu = u - c, fv = v - r;
    const at = (rr: number, cc: number) => { const i = (rr * (cols + 1) + cc) * 2; return [screen[i], screen[i + 1]]; };
    const a = at(r, c), b = at(r, c + 1), d = at(r + 1, c), e = at(r + 1, c + 1);
    const x = fu + fv <= 1 ? a[0] + (b[0] - a[0]) * fu + (d[0] - a[0]) * fv : e[0] + (d[0] - e[0]) * (1 - fu) + (b[0] - e[0]) * (1 - fv);
    const y = fu + fv <= 1 ? a[1] + (b[1] - a[1]) * fu + (d[1] - a[1]) * fv : e[1] + (d[1] - e[1]) * (1 - fu) + (b[1] - e[1]) * (1 - fv);
    worst = Math.max(worst, Math.hypot(x - one[0], y - one[1]));
  }
  return worst;
}

// ---- Which figures a frame draws ----

/** Plates drawn at once. The cap holds the sky's cost steady however wide the view. */
export const MAX_ARTWORKS = 6;

export interface ArtView {
  /** J2000 direction of the middle of the view. */
  forward: Vec3;
  /** Degrees to the corner of the view. */
  half: number;
  camera: Camera;
  /** The constellation being looked at, if any. */
  chosen: string | null;
}

export interface ArtChoice {
  art: ArtRecord;
  /** How much the zoom allows, 0 to 1. */
  zoom: number;
  /** How much attention this figure gets: full near the middle, or when chosen. */
  emphasis: number;
}

const smooth = (a: number, b: number, v: number) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

const centres = new Map<string, Vec3>();
const centreOf = (a: ArtRecord) => {
  let c = centres.get(a.id);
  if (!c) { c = unit(a.centre[0], a.centre[1]); centres.set(a.id, c); }
  return c;
};

/**
 * Culling and level of detail. A figure outside the view isn't touched. A figure too small to
 * read, or too large to recognise, fades away. Choosing a constellation quietens the others.
 */
export function chooseArtworks(view: ArtView, records: ArtRecord[] = artRecords, limit = MAX_ARTWORKS): ArtChoice[] {
  const { camera, forward, half, chosen } = view;
  const base = artworkFade(camera.fov);
  if (base <= 0) return [];
  const ppd = pointsPerDegree(camera), long = Math.max(camera.width, camera.height);
  const found: (ArtChoice & { away: number })[] = [];
  for (const art of records) {
    const away = angleBetween(forward, centreOf(art));
    if (away > half + art.radius) continue;
    const span = art.radius * 2 * ppd;
    const zoom = base * smooth(70, 150, span) * (1 - smooth(long * 2.6, long * 4.6, span));
    const isChosen = art.id === chosen;
    if (zoom <= 0.01 && !isChosen) continue;
    const near = 1 - smooth(half * 0.25, half * 0.95, away);
    const emphasis = isChosen ? 1 : (0.52 + 0.48 * near) * (chosen ? 0.42 : 1);
    found.push({ art, zoom: isChosen ? Math.max(zoom, base) : zoom, emphasis, away });
  }
  found.sort((a, b) => Number(b.art.id === chosen) - Number(a.art.id === chosen) || a.away - b.away);
  return found.slice(0, limit);
}

/** Eases each figure toward what the frame wants, and stops asking for frames once settled. */
export class Presence {
  private levels = new Map<string, number>();
  constructor(private rate: number) {}
  /** True while anything is still moving. */
  step(targets: Map<string, number>, dt: number, instant: boolean): boolean {
    let busy = false;
    const reach = instant ? Infinity : Math.min(1, dt) * this.rate;
    for (const id of new Set([...this.levels.keys(), ...targets.keys()])) {
      const to = targets.get(id) ?? 0, at = this.levels.get(id) ?? 0;
      const next = at + Math.max(-reach, Math.min(reach, to - at));
      if (next <= 0.001 && to === 0) { this.levels.delete(id); continue; }
      this.levels.set(id, next);
      if (Math.abs(next - to) > 0.002) busy = true;
    }
    return busy;
  }
  level(id: string) { return this.levels.get(id) ?? 0; }
  /** Figures still on their way out, which must keep drawing until they are gone. */
  ids() { return [...this.levels.keys()]; }
}

/**
 * The haze behind a figure shifts a little against the figure as it crosses the view, so the
 * figure seems to stand in front of it. Only the haze moves, and by a few points at most: the
 * plate and its stars never do.
 */
export function parallaxOffset(x: number, y: number, width: number, height: number): [number, number] {
  const limit = 6;
  const dx = ((x - width / 2) / width) * limit * 2, dy = ((y - height / 2) / height) * limit * 2;
  return [Math.max(-limit, Math.min(limit, -dx)), Math.max(-limit, Math.min(limit, -dy))];
}
