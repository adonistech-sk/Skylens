// The Solar System in space, from the same engine as the sky. Positions, orientations and
// satellite places all come from Astronomy Engine, checked against JPL Horizons in
// tests/solar-v1.test.ts. Nothing here is a screen concern: scaling for display is separate.
import { AU_KM, Astronomy, cross, DEG, Mat3, mul, normalize360, normalized, RAD, Vec3 } from './core';

export type PlanetId = 'mercury' | 'venus' | 'earth' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune';
export type SolarId = 'sun' | PlanetId;
export const PLANET_IDS: PlanetId[] = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
/** Only satellites with a verified model. See V1_STAGE3_REPORT.md for why others are absent. */
export type SatelliteId = 'moon' | 'io' | 'europa' | 'ganymede' | 'callisto';
export type GlobeId = SolarId | SatelliteId;

const ENGINE: Record<SolarId, Astronomy.Body> = {
  sun: Astronomy.Body.Sun, mercury: Astronomy.Body.Mercury, venus: Astronomy.Body.Venus, earth: Astronomy.Body.Earth, mars: Astronomy.Body.Mars,
  jupiter: Astronomy.Body.Jupiter, saturn: Astronomy.Body.Saturn, uranus: Astronomy.Body.Uranus, neptune: Astronomy.Body.Neptune,
};

export interface Physical {
  name: string;
  /** Equatorial radius, km. */
  radius: number;
  /** Polar over equatorial radius. */
  polar: number;
}

/** IAU 2015 radii for the planets, and mean radii for the satellites. */
export const PHYSICAL: Record<GlobeId, Physical> = {
  sun: { name: 'Sun', radius: 695_700, polar: 1 },
  mercury: { name: 'Mercury', radius: 2_440.53, polar: 0.9991 },
  venus: { name: 'Venus', radius: 6_051.8, polar: 1 },
  earth: { name: 'Earth', radius: 6_378.137, polar: 0.99665 },
  mars: { name: 'Mars', radius: 3_396.19, polar: 0.99411 },
  jupiter: { name: 'Jupiter', radius: 71_492, polar: 0.93513 },
  saturn: { name: 'Saturn', radius: 60_268, polar: 0.90204 },
  uranus: { name: 'Uranus', radius: 25_559, polar: 0.97707 },
  neptune: { name: 'Neptune', radius: 24_764, polar: 0.98292 },
  moon: { name: 'Moon', radius: 1_737.4, polar: 1 },
  io: { name: 'Io', radius: 1_821.6, polar: 1 },
  europa: { name: 'Europa', radius: 1_560.8, polar: 1 },
  ganymede: { name: 'Ganymede', radius: 2_634.1, polar: 1 },
  callisto: { name: 'Callisto', radius: 2_410.3, polar: 1 },
};

/** Row-major, from the engine's rot[column][row]. */
const rowMajor = (r: number[][]): Mat3 => [r[0][0], r[1][0], r[2][0], r[0][1], r[1][1], r[2][1], r[0][2], r[1][2], r[2][2]];

/** Equatorial J2000 to the ecliptic of J2000, the frame the 3D scene is built in. */
export const EQJ_TO_ECL: Mat3 = rowMajor(Astronomy.Rotation_EQJ_ECL().rot);

const asVec = (v: Astronomy.Vector): Vec3 => [v.x, v.y, v.z];

/** Heliocentric position in AU, equatorial J2000, geometric. */
export const heliocentric = (id: SolarId, date: Date): Vec3 => (id === 'sun' ? [0, 0, 0] : asVec(Astronomy.HelioVector(ENGINE[id], new Astronomy.AstroTime(date))));

/** The same, in the ecliptic frame of the scene. */
export const heliocentricEcliptic = (id: SolarId, date: Date): Vec3 => mul(EQJ_TO_ECL, heliocentric(id, date));

/** The Moon from the Earth's centre, in AU, equatorial J2000. */
export const geocentricMoon = (date: Date): Vec3 => asVec(Astronomy.GeoMoon(new Astronomy.AstroTime(date)));

// ---- Which way a body faces ----

const rotZ = (a: number): Mat3 => { const c = Math.cos(a), s = Math.sin(a); return [c, s, 0, -s, c, 0, 0, 0, 1]; };
const rotX = (a: number): Mat3 => { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, s, 0, -s, c]; };
const product = (a: Mat3, b: Mat3): Mat3 => {
  const r = new Array(9).fill(0) as Mat3;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) r[i * 3 + j] += a[i * 3 + k] * b[k * 3 + j];
  return r;
};

/**
 * Equatorial J2000 to body-fixed: +z the north pole, +x the prime meridian, +y 90 degrees east.
 * The pole and prime meridian are the IAU values from the engine.
 */
export function bodyFixedFrame(id: SolarId | 'moon', date: Date): Mat3 {
  const axis = Astronomy.RotationAxis(id === 'moon' ? Astronomy.Body.Moon : ENGINE[id], new Astronomy.AstroTime(date));
  return product(rotZ(axis.spin * DEG), product(rotX((90 - axis.dec) * DEG), rotZ((90 + axis.ra * 15) * DEG)));
}

export interface SubPoint { lon: number; lat: number }

/** East longitude from 0 to 360, and latitude, of a body-fixed direction. */
export const subPoint = (v: Vec3): SubPoint => ({ lon: normalize360(Math.atan2(v[1], v[0]) * RAD), lat: Math.asin(Math.max(-1, Math.min(1, v[2] / Math.hypot(v[0], v[1], v[2])))) * RAD });

// ---- Satellites ----

export interface SatellitePosition {
  id: SatelliteId;
  /** Kilometres from the planet, equatorial J2000. */
  km: Vec3;
}

const KM = AU_KM;

/** The satellites with a verified place: the Moon and the four Galilean moons. */
export function satellitesOf(planet: PlanetId, date: Date): SatellitePosition[] {
  if (planet === 'earth') {
    const v = geocentricMoon(date);
    return [{ id: 'moon', km: [v[0] * KM, v[1] * KM, v[2] * KM] }];
  }
  if (planet === 'jupiter') {
    const j = Astronomy.JupiterMoons(new Astronomy.AstroTime(date));
    const at = (id: SatelliteId, s: Astronomy.StateVector): SatellitePosition => ({ id, km: [s.x * KM, s.y * KM, s.z * KM] });
    return [at('io', j.io), at('europa', j.europa), at('ganymede', j.ganymede), at('callisto', j.callisto)];
  }
  return [];
}

export const parentOf = (id: SatelliteId): PlanetId => (id === 'moon' ? 'earth' : 'jupiter');
export const isSatellite = (id: GlobeId): id is SatelliteId => id === 'moon' || id === 'io' || id === 'europa' || id === 'ganymede' || id === 'callisto';

/** A tidally locked satellite: +x faces its planet, +z along the planet's pole. */
export function lockedFrame(toPlanet: Vec3, planetPoleDir: Vec3): Mat3 {
  const x = normalized(toPlanet);
  const y = normalized(cross(planetPoleDir, x));
  const z = cross(x, y);
  return [x[0], x[1], x[2], y[0], y[1], y[2], z[0], z[1], z[2]];
}

/** Sidereal periods in Julian years, for tracing one full orbit. */
const ORBIT_YEARS: Record<PlanetId, number> = { mercury: 0.2408467, venus: 0.61519726, earth: 1.0000174, mars: 1.8808476, jupiter: 11.862615, saturn: 29.447498, uranus: 84.016846, neptune: 164.79132 };

/** One real orbit, centred on `date`, in the scene's ecliptic frame. */
export function orbitPoints(id: PlanetId, date: Date, samples = 96): Float32Array {
  const out = new Float32Array((samples + 1) * 3);
  const span = ORBIT_YEARS[id] * 365.25 * 86_400_000;
  for (let i = 0; i <= samples; i++) {
    const v = heliocentricEcliptic(id, new Date(date.getTime() + ((i / samples) - 0.5) * span));
    out.set(v, i * 3);
  }
  return out;
}

export const orbitalPeriodYears = (id: PlanetId) => ORBIT_YEARS[id];

// ---- Display scale ----

export type ScaleMode = 'illustrative' | 'true';

/** Spacing that keeps every planet findable. Direction is untouched, only distance shrinks. */
export const displayDistance = (au: number, mode: ScaleMode) => (mode === 'true' ? au : 1.1 * Math.pow(au, 0.4));

export const displayPosition = (v: Vec3, mode: ScaleMode): Vec3 => {
  const r = Math.hypot(v[0], v[1], v[2]);
  if (r === 0 || mode === 'true') return v;
  const k = displayDistance(r, mode) / r;
  return [v[0] * k, v[1] * k, v[2] * k];
};

/** Radius drawn in scene units. True scale uses the real size, however small that looks. */
export function displayRadius(id: SolarId, mode: ScaleMode): number {
  const km = PHYSICAL[id].radius;
  if (mode === 'true') return km / KM;
  return id === 'sun' ? 0.34 : 0.1 * Math.pow(km / 6378, 0.42);
}

export const sunDirection = (position: Vec3): Vec3 => normalized([-position[0], -position[1], -position[2]]);

