// How an object behaves over a night, and where it is in each coordinate frame. Everything
// here comes from the same engine as the sky, so a chart can't disagree with the map.
import { bodyIdOf, SkyObject } from '../data/catalog';
import { altitude, Astronomy, BodyId, Equatorial, Horizontal, normalize180, normalize360, Observer, position, RAD, vectorEquatorial, vectorHorizontal } from './core';
import { directionOf } from './locator';
import { timeZoneOffset } from './night';

const HOUR = 3_600_000;

/** The refracted horizon position of any object. */
export function horizontalOf(o: SkyObject, date: Date, observer: Observer): Horizontal | null {
  const b = bodyIdOf(o.id);
  if (b) return position(b, date, observer).apparent;
  const dir = directionOf(o, date, observer);
  return dir ? vectorHorizontal(dir) : null;
}

export interface TimelinePoint { time: number; altitude: number; sun: number }

export interface Visibility {
  points: TimelinePoint[];
  start: number;
  end: number;
  peak: TimelinePoint;
  /** Hours above `MIN_ALTITUDE` with the Sun below nautical twilight. */
  darkHours: number;
  /** First and last moment of that window, or null if there is none. */
  windowStart: number | null;
  windowEnd: number | null;
}

export const MIN_ALTITUDE = 15;
export const DARK_SUN = -12;

/** The local noon that opens the observing night containing `date`. */
export function nightStart(date: Date, timeZone: string): number {
  const offset = timeZoneOffset(date, timeZone);
  const local = date.getTime() + offset;
  const dayStart = Math.floor(local / (24 * HOUR)) * (24 * HOUR);
  const noon = dayStart + 12 * HOUR;
  return (local >= noon ? noon : noon - 24 * HOUR) - offset;
}

/** 24 hours from noon to noon, sampled every 20 minutes. */
export function visibilityTimeline(o: SkyObject, date: Date, observer: Observer, timeZone: string): Visibility | null {
  const start = nightStart(date, timeZone), step = HOUR / 3;
  const points: TimelinePoint[] = [];
  for (let t = start; t <= start + 24 * HOUR; t += step) {
    const d = new Date(t);
    const h = horizontalOf(o, d, observer);
    if (!h) return null;
    points.push({ time: t, altitude: h.altitude, sun: altitude('sun', d, observer) });
  }
  let peak = points[0], darkSamples = 0, windowStart: number | null = null, windowEnd: number | null = null;
  for (const p of points) {
    if (p.altitude > peak.altitude) peak = p;
    if (p.altitude >= MIN_ALTITUDE && p.sun <= DARK_SUN) {
      darkSamples++;
      windowStart ??= p.time;
      windowEnd = p.time;
    }
  }
  return { points, start, end: start + 24 * HOUR, peak, darkHours: darkSamples / 3, windowStart, windowEnd };
}

// ---- Coordinates ----

export interface Coordinates {
  j2000: Equatorial;
  ofDate: Equatorial;
  /** Refracted. */
  horizontal: Horizontal | null;
  eclipticLongitude: number;
  eclipticLatitude: number;
  galacticLongitude: number;
  galacticLatitude: number;
}

const apply = (r: Astronomy.RotationMatrix, v: Astronomy.Vector) => Astronomy.RotateVector(r, v);

/** One direction in every frame the app names. */
export function coordinatesOf(j2000: Equatorial, date: Date, horizontal: Horizontal | null): Coordinates {
  const t = new Astronomy.AstroTime(date);
  const d = (j2000.decDeg * Math.PI) / 180, a = (j2000.raHours * 15 * Math.PI) / 180, c = Math.cos(d);
  const v = new Astronomy.Vector(c * Math.cos(a), c * Math.sin(a), Math.sin(d), t);
  const of = apply(Astronomy.Rotation_EQJ_EQD(t), v);
  const ecl = apply(Astronomy.Rotation_EQJ_ECL(), v);
  const gal = apply(Astronomy.Rotation_EQJ_GAL(), v);
  const polar = (x: Astronomy.Vector) => [normalize360(Math.atan2(x.y, x.x) * RAD), Math.asin(Math.max(-1, Math.min(1, x.z))) * RAD];
  const [eLon, eLat] = polar(ecl), [gLon, gLat] = polar(gal);
  return { j2000, ofDate: vectorEquatorial([of.x, of.y, of.z]), horizontal, eclipticLongitude: eLon, eclipticLatitude: eLat, galacticLongitude: gLon, galacticLatitude: gLat };
}

// ---- Facts that need the ephemeris ----

/** Angle between a body and the Sun as seen from Earth, positive east of the Sun. */
export function elongation(body: BodyId, date: Date): number | null {
  if (body === 'sun') return null;
  const t = new Astronomy.AstroTime(date);
  const lon = (b: Astronomy.Body) => Astronomy.Ecliptic(Astronomy.GeoVector(b, t, true));
  const sun = lon(Astronomy.Body.Sun);
  const target = lon(body === 'moon' ? Astronomy.Body.Moon : (body[0].toUpperCase() + body.slice(1)) as Astronomy.Body);
  const s = Math.PI / 180;
  const cosine = Math.sin(sun.elat * s) * Math.sin(target.elat * s) + Math.cos(sun.elat * s) * Math.cos(target.elat * s) * Math.cos((target.elon - sun.elon) * s);
  const angle = Math.acos(Math.max(-1, Math.min(1, cosine))) * RAD;
  return normalize180(target.elon - sun.elon) >= 0 ? angle : -angle;
}

export interface MoonFacts { ageDays: number; nextNew: Date | null; nextFull: Date | null }

export function moonFacts(date: Date): MoonFacts {
  const t = new Astronomy.AstroTime(date);
  const last = Astronomy.SearchMoonPhase(0, t.AddDays(-30), 31);
  let previous = last;
  // The search returns the first new Moon in the span, so walk forward to the latest one.
  while (previous) {
    const next = Astronomy.SearchMoonPhase(0, previous.AddDays(1), 31);
    if (!next || next.ut > t.ut) break;
    previous = next;
  }
  const nextNew = Astronomy.SearchMoonPhase(0, t, 31);
  const nextFull = Astronomy.SearchMoonPhase(180, t, 31);
  return { ageDays: previous ? t.ut - previous.ut : 0, nextNew: nextNew?.date ?? null, nextFull: nextFull?.date ?? null };
}

// ---- Guidance ----

export interface Guidance { turn: number; tilt: number; text: string }

/** Plain directions from where the device points to a target, for following by hand. */
export function guidance(from: Horizontal, to: Horizontal): Guidance {
  const turn = normalize180(to.azimuth - from.azimuth), tilt = to.altitude - from.altitude;
  const parts: string[] = [];
  if (Math.abs(turn) >= 1) parts.push(`Turn ${turn > 0 ? 'right' : 'left'} ${Math.round(Math.abs(turn))}°`);
  if (Math.abs(tilt) >= 1) parts.push(`${parts.length ? 'tilt' : 'Tilt'} ${tilt > 0 ? 'up' : 'down'} ${Math.round(Math.abs(tilt))}°`);
  return { turn, tilt, text: parts.length ? parts.join(', ') : 'Straight ahead' };
}
