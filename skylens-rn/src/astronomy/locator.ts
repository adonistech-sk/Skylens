// Ported from SkySession/Locator.swift: "where is this right now, and can I see it?".
import { bodyIdOf, SkyObject } from '../data/catalog';
import { altitude, appearance, compassName, constellationOf, Equatorial, equatorialVector, horizontalVector, Horizontal, j2000ToHorizon, mul, Observer, position, Vec3, vectorHorizontal } from './core';
import { altitudeRange, nextRise, riseTransitSet, RiseTransitSet, Target } from './night';

export type LocationStatus = 'visible' | 'aboveHorizonInDaylight' | 'belowHorizon' | 'neverRises' | 'unavailable';

export interface ObjectLocation {
  horizontal: Horizontal | null;
  status: LocationStatus;
  explanation: string;
  nextRise: Date | null;
}

export interface ObjectObservation {
  location: ObjectLocation;
  j2000: Equatorial | null;
  ofDate: Equatorial | null;
  riseTransitSet: RiseTransitSet | null;
  magnitude: number | null;
  distanceAU: number | null;
  angularDiameter: number | null;
  illuminatedFraction: number | null;
  constellation: string | null;
}

const targetOf = (o: SkyObject): Target | null => {
  const b = bodyIdOf(o.id);
  if (b) return { body: b };
  return o.position ? { fixed: o.position } : null;
};

/** Horizon-frame direction at an instant, for placing the camera or a marker. */
export function directionOf(o: SkyObject, date: Date, observer: Observer): Vec3 | null {
  const b = bodyIdOf(o.id);
  if (b) return horizontalVector(position(b, date, observer).geometric);
  if (o.position) return mul(j2000ToHorizon(date, observer), equatorialVector(o.position.raHours, o.position.decDeg));
  return null;
}

const capitalized = (s: string) => s[0].toUpperCase() + s.slice(1);

export function locate(o: SkyObject, date: Date, observer: Observer): ObjectLocation {
  const b = bodyIdOf(o.id);
  let h: Horizontal;
  if (b) h = position(b, date, observer).apparent;
  else if (o.position) h = vectorHorizontal(directionOf(o, date, observer)!);
  else return { horizontal: null, status: 'unavailable', explanation: 'No position is available.', nextRise: null };

  const sun = altitude('sun', date, observer);
  if (h.altitude > 0) {
    const name = compassName(h.azimuth);
    const place = `${Math.round(h.altitude)}° above the ${name.includes('th') && name.length > 5 ? name : `${name}ern`} horizon`;
    if (b === 'sun') return { horizontal: h, status: 'visible', explanation: `${capitalized(place)}. Never look at it without certified protection.`, nextRise: null };
    if (sun > -6 && b !== 'moon' && b !== 'venus') {
      return { horizontal: h, status: 'aboveHorizonInDaylight', explanation: `${capitalized(place)}, but the sky is too bright. It will be easier to see after dark.`, nextRise: null };
    }
    return { horizontal: h, status: 'visible', explanation: `${capitalized(place)}.`, nextRise: null };
  }
  if (o.position && altitudeRange(o.position.decDeg, observer.latitude)[1] < -1) {
    const hemisphere = o.position.decDeg < 0 ? 'south' : 'north';
    return { horizontal: h, status: 'neverRises', explanation: `It never rises from your latitude. You would need to travel further ${hemisphere} to see it.`, nextRise: null };
  }
  const target = targetOf(o);
  const rise = target ? nextRise(target, date, observer) : null;
  const degrees = Math.round(Math.abs(h.altitude));
  return {
    horizontal: h, status: 'belowHorizon', nextRise: rise,
    explanation: rise ? `It is ${degrees}° below the horizon right now, and rises again soon.` : `It is ${degrees}° below the horizon right now.`,
  };
}

/** Everything the detail page needs for an object at a simulated instant. */
export function observe(o: SkyObject, date: Date, observer: Observer): ObjectObservation {
  const location = locate(o, date, observer);
  const b = bodyIdOf(o.id);
  let j2000 = o.position, ofDate: Equatorial | null = null;
  let magnitude = o.magnitude, distanceAU: number | null = null, angularDiameter: number | null = null, illuminatedFraction: number | null = null;
  if (b) {
    const p = position(b, date, observer);
    const a = appearance(b, date);
    j2000 = p.j2000;
    ofDate = p.ofDate;
    magnitude = a.magnitude;
    distanceAU = p.distanceAU;
    angularDiameter = a.angularDiameter;
    if (b !== 'sun') illuminatedFraction = a.illuminatedFraction;
  }
  const target = targetOf(o);
  return {
    location, j2000, ofDate, magnitude, distanceAU, angularDiameter, illuminatedFraction,
    riseTransitSet: target ? riseTransitSet(target, date, observer) : null,
    constellation: j2000 ? constellationOf(j2000) : null,
  };
}
