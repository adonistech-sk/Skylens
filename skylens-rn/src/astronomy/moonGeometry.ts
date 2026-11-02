// How the Moon stands at one instant: which way it faces us, where the Sun is over its
// surface, and so where the terminator falls. Longitudes are planetocentric and east
// positive, the convention of both the SVS maps and the USGS gazetteer.
import { Astronomy, DEG, dot, Mat3, mul, normalized, RAD, Vec3 } from './core';
import { bodyFixedFrame, geocentricMoon, subPoint, SubPoint } from './solar';

export interface MoonGeometry {
  /** Equatorial J2000 to the Moon's body-fixed frame. */
  frame: Mat3;
  /** Unit vectors in the body-fixed frame. */
  sun: Vec3;
  earth: Vec3;
  subSolar: SubPoint;
  /** The point facing Earth. Its wander from 0,0 is libration. */
  subEarth: SubPoint;
  /** 0 to 1, from the same Sun-Moon-Earth geometry that lights the surface. */
  illuminated: number;
  /** Position angle of the lunar north pole on the sky, degrees east of celestial north. */
  poleAngle: number;
}

export function moonGeometry(date: Date): MoonGeometry {
  const t = new Astronomy.AstroTime(date);
  const frame = bodyFixedFrame('moon', date);
  const moon = geocentricMoon(date);
  const sunGeo = Astronomy.GeoVector(Astronomy.Body.Sun, t, true);
  const toSun: Vec3 = [sunGeo.x - moon[0], sunGeo.y - moon[1], sunGeo.z - moon[2]];
  const toEarth: Vec3 = [-moon[0], -moon[1], -moon[2]];
  const sun = normalized(mul(frame, toSun)), earth = normalized(mul(frame, toEarth));
  const cosPhase = dot(normalized(toSun), normalized(toEarth));

  // The pole against true north of date, because that is the north of the night sky.
  const axis = Astronomy.RotationAxis(Astronomy.Body.Moon, t).north;
  const toDate = Astronomy.Rotation_EQJ_EQD(t);
  const look = Astronomy.RotateVector(toDate, new Astronomy.Vector(moon[0], moon[1], moon[2], t));
  const pole = Astronomy.RotateVector(toDate, axis);
  const l = normalized([look.x, look.y, look.z]);
  const north = normalized([-l[0] * l[2], -l[1] * l[2], 1 - l[2] * l[2]]);
  const east: Vec3 = [-l[1] * 1 + 0, l[0], 0];
  const eastUnit = normalized(east);
  const poleAngle = (Math.atan2(pole.x * eastUnit[0] + pole.y * eastUnit[1] + pole.z * eastUnit[2], pole.x * north[0] + pole.y * north[1] + pole.z * north[2]) * RAD + 360) % 360;

  return { frame, sun, earth, subSolar: subPoint(sun), subEarth: subPoint(earth), illuminated: (1 + cosPhase) / 2, poleAngle };
}

/** A body-fixed unit vector from latitude and east longitude. */
export function surfacePoint(lat: number, lon: number): Vec3 {
  const a = lon * DEG, d = lat * DEG, c = Math.cos(d);
  return [c * Math.cos(a), c * Math.sin(a), Math.sin(d)];
}

/** Height of the Sun above a flat horizon at a surface point, in degrees. */
export const sunAltitudeAt = (lat: number, lon: number, sun: Vec3) => Math.asin(Math.max(-1, Math.min(1, dot(surfacePoint(lat, lon), sun)))) * RAD;

/** Whether the Moon's face toward Earth can show a point at all, with today's libration. */
export const facesEarth = (lat: number, lon: number, earth: Vec3) => dot(surfacePoint(lat, lon), earth) > 0;

export const distanceAlongSurface = (a: { lat: number; lon: number }, b: { lat: number; lon: number }) => Math.acos(Math.max(-1, Math.min(1, dot(surfacePoint(a.lat, a.lon), surfacePoint(b.lat, b.lon))))) * RAD;
