import { cross, DEG, Horizontal, horizontalVector, Mat3, mul, normalize180, normalize360, normalized, transpose, Vec3 } from './core';

export type Projection = 'stereographic' | 'rectilinear';

export interface Camera {
  /** Horizon frame → camera frame: +x screen right, +y screen up, looks along -z. */
  orientation: Mat3;
  /** Across the screen's shorter side, degrees. */
  fov: number;
  width: number;
  height: number;
  projection: Projection;
}

export const FOV_RANGE: [number, number] = [2, 150];

export const cameraScale = (c: Camera) =>
  Math.min(c.width, c.height) / 2 / Math.tan((c.fov * DEG) / (c.projection === 'stereographic' ? 4 : 2));

/** A level camera aimed at an azimuth and altitude, zenith toward the top of the screen. */
export function orientationFor(azimuth: number, alt: number, roll = 0): Mat3 {
  const forward = horizontalVector({ azimuth, altitude: alt });
  let right = cross(forward, [0, 0, 1]);
  if (Math.hypot(right[0], right[1], right[2]) < 1e-6) {
    const h = horizontalVector({ azimuth, altitude: 0 });
    const s = alt > 0 ? -1 : 1;
    right = cross(forward, [h[0] * s, h[1] * s, h[2] * s]);
  }
  right = normalized(right);
  const up = normalized(cross(right, forward));
  const base: Mat3 = [right[0], right[1], right[2], up[0], up[1], up[2], -forward[0], -forward[1], -forward[2]];
  if (!roll) return base;
  const c = Math.cos(roll * DEG), s = Math.sin(roll * DEG);
  return [
    c * base[0] - s * base[3], c * base[1] - s * base[4], c * base[2] - s * base[5],
    s * base[0] + c * base[3], s * base[1] + c * base[4], s * base[2] + c * base[5],
    base[6], base[7], base[8],
  ];
}

export function project(c: Camera, horizon: Vec3): { x: number; y: number } | null {
  const v = mul(c.orientation, horizon);
  const k = c.projection === 'stereographic' ? 1 - v[2] : -v[2];
  if (k <= 1e-9) return null;
  const s = cameraScale(c) / k;
  return { x: c.width / 2 + v[0] * s, y: c.height / 2 - v[1] * s };
}

export function unproject(c: Camera, x: number, y: number): Vec3 {
  const scale = cameraScale(c);
  const px = (x - c.width / 2) / scale, py = (c.height / 2 - y) / scale;
  let v: Vec3;
  if (c.projection === 'stereographic') {
    const r2 = px * px + py * py, k = 2 / (1 + r2);
    v = [px * k, py * k, (r2 - 1) / (r2 + 1)];
  } else {
    v = normalized([px, py, -1]);
  }
  return mul(transpose(c.orientation), v);
}

export const pointsPerDegree = (c: Camera) => (cameraScale(c) / 2) * DEG;

export interface ViewState extends Horizontal { fov: number }

/** The sky follows the finger. Only altitude clamps: past the zenith the view would flip. */
export function dragView(v: ViewState, dx: number, dy: number, perDegree: number): ViewState {
  const cosine = Math.max(Math.cos(v.altitude * DEG), 0.05);
  return {
    ...v,
    azimuth: normalize360(v.azimuth - dx / perDegree / cosine),
    altitude: Math.min(89.9, Math.max(-20, v.altitude + dy / perDegree)),
  };
}

/** Longer flights take longer, within limits that keep the sky feeling direct. */
export const flightDuration = (angle: number, reduceMotion: boolean) => (reduceMotion ? 0 : Math.min(1.4, 0.45 + angle / 180));

/** Smootherstep, with zoom interpolated logarithmically. */
export function flight(from: ViewState, to: ViewState, duration: number, elapsed: number): ViewState {
  const t = duration <= 0 ? 1 : Math.min(1, Math.max(0, elapsed / duration));
  const e = t * t * t * (t * (t * 6 - 15) + 10);
  return {
    azimuth: normalize360(from.azimuth + normalize180(to.azimuth - from.azimuth) * e),
    altitude: from.altitude + (to.altitude - from.altitude) * e,
    fov: Math.exp(Math.log(from.fov) + (Math.log(to.fov) - Math.log(from.fov)) * e),
  };
}
