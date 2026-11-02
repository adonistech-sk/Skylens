// A perspective camera that orbits a point, for the Solar System and the Moon. Pure maths,
// so its projection can be proved without a screen. The scene's +z is "up" unless a roll
// says otherwise.
import { cross, DEG, dot, normalized, Vec3 } from './core';

export interface OrbitCamera {
  target: Vec3;
  /** Degrees around +z from +x. */
  yaw: number;
  /** Degrees above the xy plane. */
  pitch: number;
  distance: number;
  /** Degrees about the view axis. */
  roll: number;
  /** Vertical field of view, degrees. */
  fov: number;
  width: number;
  height: number;
  /** Points the scene's centre sits above the screen's centre, to clear a card below it. */
  shiftY?: number;
}

const centreY = (c: OrbitCamera) => c.height / 2 - (c.shiftY ?? 0);

export interface CameraBasis { eye: Vec3; right: Vec3; up: Vec3; forward: Vec3; focal: number }

export const PITCH_LIMIT = 89.5;
export const clampPitch = (p: number) => Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, p));

export function cameraBasis(c: OrbitCamera): CameraBasis {
  const y = c.yaw * DEG, p = c.pitch * DEG, cp = Math.cos(p);
  const out: Vec3 = [cp * Math.cos(y), cp * Math.sin(y), Math.sin(p)];
  const eye: Vec3 = [c.target[0] + out[0] * c.distance, c.target[1] + out[1] * c.distance, c.target[2] + out[2] * c.distance];
  const forward: Vec3 = [-out[0], -out[1], -out[2]];
  let right = normalized(cross(forward, [0, 0, 1]));
  let up = cross(right, forward);
  if (c.roll) {
    const r = c.roll * DEG, cr = Math.cos(r), sr = Math.sin(r);
    const a = right, b = up;
    right = [a[0] * cr + b[0] * sr, a[1] * cr + b[1] * sr, a[2] * cr + b[2] * sr];
    up = [b[0] * cr - a[0] * sr, b[1] * cr - a[1] * sr, b[2] * cr - a[2] * sr];
  }
  return { eye, right, up, forward, focal: c.height / 2 / Math.tan((c.fov * DEG) / 2) };
}

export interface ScreenPoint { x: number; y: number; depth: number; scale: number }

/** A world point on screen, or null if it is behind the camera. `scale` is points per unit. */
export function projectPoint(c: OrbitCamera, b: CameraBasis, p: Vec3): ScreenPoint | null {
  const v: Vec3 = [p[0] - b.eye[0], p[1] - b.eye[1], p[2] - b.eye[2]];
  const depth = dot(v, b.forward);
  if (depth <= 1e-9) return null;
  const scale = b.focal / depth;
  return { x: c.width / 2 + dot(v, b.right) * scale, y: centreY(c) - dot(v, b.up) * scale, depth, scale };
}

/** A direction at infinity on screen, for stars. */
export function projectDirection(c: OrbitCamera, b: CameraBasis, d: Vec3): { x: number; y: number } | null {
  const depth = dot(d, b.forward);
  if (depth <= 1e-6) return null;
  const s = b.focal / depth;
  return { x: c.width / 2 + dot(d, b.right) * s, y: centreY(c) - dot(d, b.up) * s };
}

/** The ray through a screen point, as a unit direction from the eye. */
export function pixelRay(c: OrbitCamera, b: CameraBasis, x: number, y: number): Vec3 {
  const px = (x - c.width / 2) / b.focal, py = (centreY(c) - y) / b.focal;
  return normalized([b.forward[0] + b.right[0] * px + b.up[0] * py, b.forward[1] + b.right[1] * px + b.up[1] * py, b.forward[2] + b.right[2] * px + b.up[2] * py]);
}

/** Where a ray from `origin` first meets a sphere of radius `r` at `center`, or null. */
export function raySphere(origin: Vec3, dir: Vec3, center: Vec3, r: number): Vec3 | null {
  const o: Vec3 = [origin[0] - center[0], origin[1] - center[1], origin[2] - center[2]];
  const b = dot(o, dir), disc = b * b - (dot(o, o) - r * r);
  if (disc < 0) return null;
  const t = -b - Math.sqrt(disc);
  if (t <= 0) return null;
  return [origin[0] + dir[0] * t, origin[1] + dir[1] * t, origin[2] + dir[2] * t];
}

/** Dragging turns the camera as if the scene were held by the finger. */
export function orbitBy(c: OrbitCamera, dx: number, dy: number, degreesPerPoint: number): OrbitCamera {
  return { ...c, yaw: c.yaw - dx * degreesPerPoint, pitch: clampPitch(c.pitch + dy * degreesPerPoint) };
}

/** Eases one camera into another, with distance on a log scale so a zoom feels even. */
export function blendCameras(a: OrbitCamera, b: OrbitCamera, t: number): OrbitCamera {
  const e = t * t * t * (t * (t * 6 - 15) + 10);
  const shortest = ((((b.yaw - a.yaw) % 360) + 540) % 360) - 180;
  return {
    ...b,
    target: [a.target[0] + (b.target[0] - a.target[0]) * e, a.target[1] + (b.target[1] - a.target[1]) * e, a.target[2] + (b.target[2] - a.target[2]) * e],
    yaw: a.yaw + shortest * e, pitch: a.pitch + (b.pitch - a.pitch) * e, roll: a.roll + (b.roll - a.roll) * e,
    distance: Math.exp(Math.log(a.distance) + (Math.log(b.distance) - Math.log(a.distance)) * e),
  };
}
