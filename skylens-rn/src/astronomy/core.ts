// The astronomy layer of SkyLens. Astronomy Engine is the same library, same version
// (2.1.19) as the vendored C code in Packages/SkyLensKit; this is its official
// TypeScript distribution. tests/reference.test.ts holds it to the same JPL Horizons
// and USNO fixtures, so nothing here is checked against itself.
import * as Astronomy from 'astronomy-engine';

// Same choice as AstroTime in Swift: the engine's default delta-T misplaced the Moon
// by 202 arcseconds by 2199.
Astronomy.SetDeltaTFunction(Astronomy.DeltaT_JplHorizons);

export { Astronomy };

export type Vec3 = [number, number, number];
/** Row-major 3x3. */
export type Mat3 = [number, number, number, number, number, number, number, number, number];

export const DEG = Math.PI / 180;
export const RAD = 180 / Math.PI;
export const AU_KM = 149_597_870.7;

export type BodyId = 'sun' | 'moon' | 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune';
export const PLANETS: BodyId[] = ['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
export const ALL_BODIES: BodyId[] = ['sun', 'moon', ...PLANETS];

const BODY_MAP: Record<BodyId, Astronomy.Body> = {
  sun: Astronomy.Body.Sun,
  moon: Astronomy.Body.Moon,
  mercury: Astronomy.Body.Mercury,
  venus: Astronomy.Body.Venus,
  mars: Astronomy.Body.Mars,
  jupiter: Astronomy.Body.Jupiter,
  saturn: Astronomy.Body.Saturn,
  uranus: Astronomy.Body.Uranus,
  neptune: Astronomy.Body.Neptune,
};
export const engineBody = (b: BodyId) => BODY_MAP[b];
export const bodyName = (b: BodyId) => b[0].toUpperCase() + b.slice(1);

const RADIUS_KM: Record<BodyId, number> = {
  sun: 695_700, moon: 1_737.4, mercury: 2_440.5, venus: 6_051.8, mars: 3_396.2,
  jupiter: 71_492, saturn: 60_268, uranus: 25_559, neptune: 24_764,
};

export interface Observer {
  latitude: number;
  longitude: number;
  /** Metres. */
  elevation: number;
}
export const engineObserver = (o: Observer) => new Astronomy.Observer(o.latitude, o.longitude, o.elevation);

export interface Horizontal { azimuth: number; altitude: number }
export interface Equatorial { raHours: number; decDeg: number }

export const normalize360 = (d: number) => ((d % 360) + 360) % 360;
export const normalize180 = (d: number) => { const n = normalize360(d); return n > 180 ? n - 360 : n; };

export const equatorialVector = (raHours: number, decDeg: number): Vec3 => {
  const a = raHours * 15 * DEG, d = decDeg * DEG, c = Math.cos(d);
  return [c * Math.cos(a), c * Math.sin(a), Math.sin(d)];
};
export const vectorEquatorial = (v: Vec3): Equatorial => {
  const l = Math.hypot(v[0], v[1], v[2]);
  return { raHours: normalize360(Math.atan2(v[1], v[0]) * RAD) / 15, decDeg: Math.asin(v[2] / l) * RAD };
};

/** Horizon frame: +x north, +y west, +z zenith. */
export const horizontalVector = (h: Horizontal): Vec3 => {
  const a = h.azimuth * DEG, alt = h.altitude * DEG, c = Math.cos(alt);
  return [c * Math.cos(a), -c * Math.sin(a), Math.sin(alt)];
};
export const vectorHorizontal = (v: Vec3): Horizontal => {
  const l = Math.hypot(v[0], v[1], v[2]);
  return { azimuth: normalize360(Math.atan2(-v[1], v[0]) * RAD), altitude: Math.asin(Math.min(1, Math.max(-1, v[2] / l))) * RAD };
};

export const mul = (m: Mat3, v: Vec3): Vec3 => [
  m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
  m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
  m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
];
export const mulMat = (a: Mat3, b: Mat3): Mat3 => {
  const r = new Array(9).fill(0) as Mat3;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    r[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j];
  }
  return r;
};
export const transpose = (m: Mat3): Mat3 => [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]];
export const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const normalized = (a: Vec3): Vec3 => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
/** Degrees, stable at small angles. */
export const angleBetween = (a: Vec3, b: Vec3) => {
  const c = cross(a, b);
  return Math.atan2(Math.hypot(c[0], c[1], c[2]), dot(a, b)) * RAD;
};

/** J2000 → local horizon at one instant. Includes precession, nutation, Earth rotation. */
export function j2000ToHorizon(date: Date, observer: Observer): Mat3 {
  const r = Astronomy.Rotation_EQJ_HOR(new Astronomy.AstroTime(date), engineObserver(observer)).rot;
  // The engine stores rot[column][row]. Reading it the other way mirrors the sky.
  return [r[0][0], r[1][0], r[2][0], r[0][1], r[1][1], r[2][1], r[0][2], r[1][2], r[2][2]];
}

export interface TopocentricPosition {
  /** Topocentric, corrected for light time and aberration, for placing among catalog stars. */
  j2000: Equatorial;
  ofDate: Equatorial;
  /** Airless. */
  geometric: Horizontal;
  /** Including standard refraction. */
  apparent: Horizontal;
  distanceAU: number;
}

export function position(body: BodyId, date: Date, observer: Observer): TopocentricPosition {
  const t = new Astronomy.AstroTime(date);
  const o = engineObserver(observer);
  const b = engineBody(body);
  const j = Astronomy.Equator(b, t, o, false, true);
  const d = Astronomy.Equator(b, t, o, true, true);
  const g = Astronomy.Horizon(t, o, d.ra, d.dec);
  const a = Astronomy.Horizon(t, o, d.ra, d.dec, 'normal');
  return {
    j2000: { raHours: j.ra, decDeg: j.dec },
    ofDate: { raHours: d.ra, decDeg: d.dec },
    geometric: { azimuth: g.azimuth, altitude: g.altitude },
    apparent: { azimuth: a.azimuth, altitude: a.altitude },
    distanceAU: j.dist,
  };
}

export function altitude(body: BodyId, date: Date, observer: Observer): number {
  const t = new Astronomy.AstroTime(date);
  const o = engineObserver(observer);
  const d = Astronomy.Equator(engineBody(body), t, o, true, true);
  return Astronomy.Horizon(t, o, d.ra, d.dec, 'normal').altitude;
}

export function geocentricDirection(body: BodyId, date: Date): Vec3 {
  const v = Astronomy.GeoVector(engineBody(body), new Astronomy.AstroTime(date), true);
  return normalized([v.x, v.y, v.z]);
}

export interface BodyAppearance {
  magnitude: number;
  phaseAngle: number;
  illuminatedFraction: number;
  heliocentricDistanceAU: number;
  ringTilt: number;
  /** Degrees. */
  angularDiameter: number;
}

export function appearance(body: BodyId, date: Date): BodyAppearance {
  const t = new Astronomy.AstroTime(date);
  const i = Astronomy.Illumination(engineBody(body), t);
  const g = Astronomy.GeoVector(engineBody(body), t, true);
  const km = Math.hypot(g.x, g.y, g.z) * AU_KM;
  return {
    magnitude: i.mag,
    phaseAngle: i.phase_angle,
    illuminatedFraction: i.phase_fraction,
    heliocentricDistanceAU: i.helio_dist,
    ringTilt: i.ring_tilt ?? 0,
    angularDiameter: 2 * Math.asin(Math.min(1, RADIUS_KM[body] / km)) * RAD,
  };
}

export const constellationOf = (e: Equatorial): string | null => {
  try { return Astronomy.Constellation(e.raHours, e.decDeg).symbol; } catch { return null; }
};

export type MoonPhaseName =
  | 'New Moon' | 'Waxing Crescent' | 'First Quarter' | 'Waxing Gibbous'
  | 'Full Moon' | 'Waning Gibbous' | 'Last Quarter' | 'Waning Crescent';

export interface MoonPhase {
  /** 0 new, 90 first quarter, 180 full, 270 last quarter. */
  phaseAngle: number;
  illuminatedFraction: number;
  name: MoonPhaseName;
  isWaxing: boolean;
}

export function moonPhase(date: Date): MoonPhase {
  const t = new Astronomy.AstroTime(date);
  const a = Astronomy.MoonPhase(t);
  const illuminatedFraction = Astronomy.Illumination(Astronomy.Body.Moon, t).phase_fraction;
  // The principal phases are instants, so they cover a band of about half a day.
  const name: MoonPhaseName = a < 6 || a >= 354 ? 'New Moon' : a < 84 ? 'Waxing Crescent' : a < 96 ? 'First Quarter'
    : a < 174 ? 'Waxing Gibbous' : a < 186 ? 'Full Moon' : a < 264 ? 'Waning Gibbous' : a < 276 ? 'Last Quarter' : 'Waning Crescent';
  return { phaseAngle: a, illuminatedFraction, name, isWaxing: a < 180 };
}

const COMPASS16 = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
const COMPASS8 = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
export const compass16 = (az: number) => COMPASS16[Math.round(normalize360(az) / 22.5) % 16];
export const compassName = (az: number) => COMPASS8[Math.round(normalize360(az) / 45) % 8];

/** The window JPL validation covers. Time Travel refuses dates outside it. */
export const SUPPORTED_YEARS: [number, number] = [1800, 2199];
export const isSupportedDate = (d: Date) => {
  const y = d.getUTCFullYear();
  return y >= SUPPORTED_YEARS[0] && y <= SUPPORTED_YEARS[1];
};
