// Which lunar features belong on screen and which one a tap meant, free of any drawing API.
// The camera works in the Moon's own frame with its radius as the unit, so a feature's
// position is simply its latitude and longitude on a unit sphere.
import { dot, normalized, RAD, Vec3 } from '../../astronomy/core';
import { CameraBasis, OrbitCamera, pixelRay, projectPoint, raySphere } from '../../astronomy/orbitCamera';
import { moonGeometry, surfacePoint } from '../../astronomy/moonGeometry';
import { LunarFeature } from './moonData';

export const MOON_KM = 1737.4;

/** The whole disc fits a phone's width from here. */
export const WHOLE = 7.2;

/** From the sub-Earth point, turned so the Moon's north lies as it does in the night sky. */
export function earthViewCamera(date: Date, c: OrbitCamera): OrbitCamera {
  const g = moonGeometry(date);
  return { ...c, target: [0, 0, 0], yaw: g.subEarth.lon, pitch: g.subEarth.lat, roll: -g.poleAngle, distance: WHOLE };
}

export interface VisibleFeature { feature: LunarFeature; x: number; y: number; pixelDiameter: number }

/** On screen a feature must be at least this wide, in points, to earn a name. */
const MIN_POINTS = 46;
/** Lettered satellite craters only name themselves when they're plainly the subject. */
const MIN_POINTS_SATELLITE = 120;

/** The catalog gives these their length, so they read as narrower than that number. */
const LINEAR = new Set(['RI', 'DO', 'CA', 'RU', 'VA']);

const isFacing = (n: Vec3, eye: Vec3, margin: number) => dot(eye, n) > 1 + margin;

/** Features worth naming from this camera, biggest first. `features` must be biggest first. */
export function visibleFeatures(features: LunarFeature[], c: OrbitCamera, b: CameraBasis, limit = 60): VisibleFeature[] {
  const out: VisibleFeature[] = [];
  const best = b.focal / Math.max(1e-3, Math.hypot(...b.eye) - 1);
  for (const f of features) {
    const widest = (f.diameter / MOON_KM) * best;
    if (widest < MIN_POINTS) break;
    if (f.code === 'SF' && widest < MIN_POINTS_SATELLITE) continue;
    const n = surfacePoint(f.lat, f.lon);
    if (!isFacing(n, b.eye, 0.02)) continue;
    const p = projectPoint(c, b, n);
    if (!p || p.x < 0 || p.y < 0 || p.x > c.width || p.y > c.height) continue;
    const pixelDiameter = (f.diameter / MOON_KM) * p.scale * (LINEAR.has(f.code) ? 0.33 : 1);
    if (pixelDiameter < MIN_POINTS) continue;
    out.push({ feature: f, x: p.x, y: p.y, pixelDiameter });
    if (out.length >= limit) break;
  }
  return out;
}

/** The surface point under a screen position, or null if that misses the Moon. */
export function surfaceAt(c: OrbitCamera, b: CameraBasis, x: number, y: number): { lat: number; lon: number } | null {
  const hit = raySphere(b.eye, pixelRay(c, b, x, y), [0, 0, 0], 1);
  if (!hit) return null;
  return { lat: Math.asin(Math.max(-1, Math.min(1, hit[2]))) * RAD, lon: Math.atan2(hit[1], hit[0]) * RAD };
}

/**
 * What a tap on the surface meant: the smallest named feature that contains it, or failing
 * that the nearest within a finger's reach, in kilometres. Features too small to see are
 * skipped, so a tap at whole-globe zoom selects a basin and not a pit no one can see.
 */
export function featureAt(features: LunarFeature[], lat: number, lon: number, reachKm: number, smallestKm: number): LunarFeature | null {
  const tap = surfacePoint(lat, lon);
  let inside: LunarFeature | null = null, near: LunarFeature | null = null, nearest = reachKm;
  for (const f of features) {
    if (f.diameter < smallestKm || f.code === 'LF') continue;
    const km = Math.acos(Math.max(-1, Math.min(1, dot(tap, surfacePoint(f.lat, f.lon))))) * MOON_KM;
    if (km <= f.diameter / 2 && (!inside || f.diameter < inside.diameter)) inside = f;
    if (km < nearest) { near = f; nearest = km; }
  }
  return inside ?? near;
}

/** Points around a feature's true outline, as a circle of its diameter on the sphere. */
export function featureRing(f: { lat: number; lon: number; diameter: number }, samples = 64): Vec3[] {
  const centre = surfacePoint(f.lat, f.lon);
  const east = normalized(Math.abs(centre[2]) > 0.999 ? [1, 0, 0] : [-centre[1], centre[0], 0]);
  const north: Vec3 = [centre[1] * east[2] - centre[2] * east[1], centre[2] * east[0] - centre[0] * east[2], centre[0] * east[1] - centre[1] * east[0]];
  const r = Math.min(Math.PI / 2, f.diameter / 2 / MOON_KM), cr = Math.cos(r), sr = Math.sin(r);
  const out: Vec3[] = [];
  for (let i = 0; i <= samples; i++) {
    const a = (i / samples) * 2 * Math.PI, ca = Math.cos(a) * sr, sa = Math.sin(a) * sr;
    out.push([centre[0] * cr + east[0] * ca + north[0] * sa, centre[1] * cr + east[1] * ca + north[1] * sa, centre[2] * cr + east[2] * ca + north[2] * sa]);
  }
  return out;
}

const hemi = (v: number, plus: string, minus: string) => `${Math.abs(v).toFixed(1)}° ${v >= 0 ? plus : minus}`;
export const formatLunarPosition = (lat: number, lon: number) => `${hemi(lat, 'N', 'S')}, ${hemi(lon, 'E', 'W')}`;

/** Elevation with its sign, against the 1737.4 km reference sphere. */
export const formatElevation = (metres: number) => `${metres < 0 ? '−' : '+'}${Math.abs(metres / 1000).toFixed(1)} km`;

/** The Sun as someone standing there would have it. */
export function sunLine(altitude: number): string {
  if (altitude < -0.5) return 'In lunar night';
  if (altitude < 0.5) return 'Sun on the horizon';
  return `Sun ${Math.round(altitude)}° up`;
}
