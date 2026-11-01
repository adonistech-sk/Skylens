// Coordinate grids and constellation boundaries as geometry, free of any drawing API. Each
// grid has its own frame, supplied by the astronomy engine, so its poles sit where they
// really are. Lines are generated around the view, because a fine grid over the whole
// sphere would be thousands of points that are off screen.
import { Astronomy, DEG, equatorialVector, Mat3, normalize360, RAD, Vec3 } from '../../astronomy/core';
import boundaries from '../../data/generated/boundaries.json';

export type GridKind = 'equatorial' | 'horizontal' | 'ecliptic' | 'galactic';

// The engine stores rot[column][row]. Reading it the other way mirrors the sky.
const rowMajor = (r: number[][]): Mat3 => [r[0][0], r[1][0], r[2][0], r[0][1], r[1][1], r[2][1], r[0][2], r[1][2], r[2][2]];

let ecliptic: Mat3 | null = null, galactic: Mat3 | null = null;

/** Rotation from a grid's frame into J2000. Horizontal is handled by the caller. */
export function gridToJ2000(kind: GridKind): Mat3 {
  if (kind === 'ecliptic') return (ecliptic ??= rowMajor(Astronomy.Rotation_ECL_EQJ().rot));
  if (kind === 'galactic') return (galactic ??= rowMajor(Astronomy.Rotation_GAL_EQJ().rot));
  return [1, 0, 0, 0, 1, 0, 0, 0, 1];
}

/** A direction from longitude and latitude in degrees, in any right-handed frame. */
export const lonLat = (lon: number, lat: number): Vec3 => {
  const a = lon * DEG, d = lat * DEG, c = Math.cos(d);
  return [c * Math.cos(a), c * Math.sin(a), Math.sin(d)];
};

/** Azimuth runs clockwise from north, so the horizon frame's y points west. */
export const azAlt = (az: number, alt: number): Vec3 => {
  const a = az * DEG, h = alt * DEG, c = Math.cos(h);
  return [c * Math.cos(a), -c * Math.sin(a), Math.sin(h)];
};

/** Spacing between grid lines in degrees, about four to six lines across the view. */
export function gridStep(fov: number): number {
  if (fov > 90) return 30;
  if (fov > 40) return 15;
  if (fov > 18) return 10;
  if (fov > 8) return 5;
  if (fov > 3) return 2;
  return 1;
}

export interface GridLine {
  axis: 'lon' | 'lat';
  value: number;
  /** The equator of the frame. */
  major: boolean;
  /** Pairs of longitude and latitude. */
  points: number[];
}

/** Lines crossing a view centred on a longitude and latitude in the grid's own frame. */
export function gridLines(centerLon: number, centerLat: number, halfAngle: number, step: number): GridLine[] {
  const reach = Math.min(180, halfAngle * 1.25 + step);
  const lines: GridLine[] = [];
  const sample = Math.max(0.25, Math.min(3, reach / 18));
  const latLow = Math.max(-90, centerLat - reach), latHigh = Math.min(90, centerLat + reach);

  // A view near a pole crosses every meridian.
  const nearPole = Math.abs(centerLat) + reach >= 89;
  const lonReach = nearPole ? 180 : Math.min(180, reach / Math.max(0.1, Math.cos((Math.abs(centerLat) + reach) * DEG)));
  const lonFrom = nearPole ? 0 : centerLon - lonReach, lonTo = nearPole ? 360 : centerLon + lonReach;

  // Meridians stop short of the poles, where they would all crowd together.
  const poleGap = step >= 10 ? 10 : step;
  for (let lon = Math.ceil(lonFrom / step) * step; lon < lonTo; lon += step) {
    const points: number[] = [];
    for (let lat = Math.max(latLow, -90 + poleGap); lat <= Math.min(latHigh, 90 - poleGap); lat += sample) points.push(lon, lat);
    if (points.length >= 4) lines.push({ axis: 'lon', value: normalize360(lon), major: false, points });
  }
  const lonSample = nearPole ? 3 : Math.max(0.25, lonReach / 18);
  for (let lat = Math.ceil(latLow / step) * step; lat <= latHigh; lat += step) {
    if (Math.abs(lat) >= 90) continue;
    const points: number[] = [];
    for (let lon = lonFrom; lon <= lonTo; lon += lonSample) points.push(lon, lat);
    if (points.length >= 4) lines.push({ axis: 'lat', value: lat, major: lat === 0, points });
  }
  return lines;
}

const two = (n: number) => String(n).padStart(2, '0');

export function gridLabel(kind: GridKind, line: GridLine): string {
  if (line.axis === 'lat') return `${line.value > 0 ? '+' : line.value < 0 ? '−' : ''}${Math.abs(line.value)}°`;
  if (kind !== 'equatorial') return `${line.value}°`;
  const minutes = Math.round((line.value / 15) * 60);
  return `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${two(minutes % 60)}m` : ''}`;
}

// ---- Constellation boundaries ----

export interface BoundaryPolygon {
  id: string;
  /** Three numbers per vertex. Closed: the last vertex repeats the first. */
  xyz: Float32Array;
  center: Vec3;
  /** Degrees. */
  radius: number;
}

const SEGMENT_DEGREES = 2;

/** Boundaries run along lines of right ascension and declination, so they are curves in the */
/** view. Each edge is cut into short pieces in those coordinates so it stays one. */
function densify(ring: number[][]): number[] {
  const out: number[] = [];
  for (let i = 0; i < ring.length; i++) {
    const [ra0, dec0] = ring[i], [ra1, dec1] = ring[(i + 1) % ring.length];
    let dra = ra1 - ra0;
    if (dra > 180) dra -= 360; else if (dra < -180) dra += 360;
    const pieces = Math.max(1, Math.ceil(Math.max(Math.abs(dra), Math.abs(dec1 - dec0)) / SEGMENT_DEGREES));
    for (let k = 0; k < pieces; k++) {
      const t = k / pieces;
      out.push(...equatorialVector((ra0 + dra * t) / 15, dec0 + (dec1 - dec0) * t));
    }
  }
  out.push(out[0], out[1], out[2]);
  return out;
}

let polygons: BoundaryPolygon[] | null = null;

export function boundaryPolygons(): BoundaryPolygon[] {
  if (polygons) return polygons;
  polygons = [];
  for (const c of boundaries as { id: string; bounds: number[][][] }[]) {
    for (const ring of c.bounds) {
      const v = densify(ring);
      let x = 0, y = 0, z = 0;
      for (let i = 0; i < v.length; i += 3) { x += v[i]; y += v[i + 1]; z += v[i + 2]; }
      const l = Math.hypot(x, y, z) || 1;
      const center: Vec3 = [x / l, y / l, z / l];
      let widest = 0;
      for (let i = 0; i < v.length; i += 3) widest = Math.max(widest, Math.acos(Math.min(1, center[0] * v[i] + center[1] * v[i + 1] + center[2] * v[i + 2])));
      polygons.push({ id: c.id, xyz: Float32Array.from(v), center, radius: widest * RAD });
    }
  }
  return polygons;
}

/** Whether a direction lies inside a boundary: the edges wind once around anything enclosed. */
export function polygonContains(p: BoundaryPolygon, v: Vec3): boolean {
  // Bearings can't tell a point from its antipode, so the far side of the sky is ruled out first.
  if (Math.acos(Math.max(-1, Math.min(1, p.center[0] * v[0] + p.center[1] * v[1] + p.center[2] * v[2]))) * RAD > p.radius) return false;
  const n = p.xyz.length / 3 - 1;
  const up: Vec3 = Math.abs(v[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  const e1: Vec3 = [up[1] * v[2] - up[2] * v[1], up[2] * v[0] - up[0] * v[2], up[0] * v[1] - up[1] * v[0]];
  const l = Math.hypot(e1[0], e1[1], e1[2]);
  e1[0] /= l; e1[1] /= l; e1[2] /= l;
  const e2: Vec3 = [v[1] * e1[2] - v[2] * e1[1], v[2] * e1[0] - v[0] * e1[2], v[0] * e1[1] - v[1] * e1[0]];
  const bearing = (i: number) => {
    const x = p.xyz[i * 3], y = p.xyz[i * 3 + 1], z = p.xyz[i * 3 + 2];
    return Math.atan2(x * e2[0] + y * e2[1] + z * e2[2], x * e1[0] + y * e1[1] + z * e1[2]);
  };
  let total = 0, prev = bearing(0);
  for (let i = 1; i <= n; i++) {
    const b = bearing(i);
    let d = b - prev;
    if (d > Math.PI) d -= 2 * Math.PI; else if (d < -Math.PI) d += 2 * Math.PI;
    total += d;
    prev = b;
  }
  return Math.abs(total) > Math.PI;
}
