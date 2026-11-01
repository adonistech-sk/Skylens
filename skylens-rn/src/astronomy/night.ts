import { Astronomy, altitude, BodyId, engineBody, engineObserver, Equatorial, Observer } from './core';

export type Target = { body: BodyId } | { fixed: Equatorial };

export interface RiseTransitSet {
  rise: Date | null;
  transit: Date | null;
  set: Date | null;
  transitAltitude: number | null;
  circumstance: 'normal' | 'alwaysUp' | 'alwaysDown';
}

function engineTarget(target: Target): Astronomy.Body {
  if ('body' in target) return engineBody(target.body);
  // One global table of user stars, used immediately on this single thread. The
  // distance only feeds aberration and parallax, negligible at 1000 ly.
  Astronomy.DefineStar(Astronomy.Body.Star1, target.fixed.raHours, target.fixed.decDeg, 1000);
  return Astronomy.Body.Star1;
}

function attempt<T>(f: () => T): T | null {
  try { return f(); } catch { return null; }
}

/** Rise, transit and set in the 24 hours from `start`, with 34' refraction and upper limb. */
export function riseTransitSet(target: Target, start: Date, observer: Observer): RiseTransitSet {
  const body = engineTarget(target);
  const o = engineObserver(observer);
  const t = new Astronomy.AstroTime(start);
  const rise = attempt(() => Astronomy.SearchRiseSet(body, o, +1, t, 1));
  const set = attempt(() => Astronomy.SearchRiseSet(body, o, -1, t, 1));
  const transit = attempt(() => Astronomy.SearchHourAngle(body, o, 0, t));
  const anti = attempt(() => Astronomy.SearchHourAngle(body, o, 12, t));
  let circumstance: RiseTransitSet['circumstance'] = 'normal';
  if (!rise && !set) {
    const lowest = anti ? anti.hor.altitude : -90;
    const highest = transit ? transit.hor.altitude : 90;
    circumstance = lowest > 0 || highest > 0 ? 'alwaysUp' : 'alwaysDown';
  }
  const inWindow = !!transit && transit.time.ut - t.ut <= 1;
  return {
    rise: rise ? rise.date : null,
    transit: inWindow ? transit!.time.date : null,
    set: set ? set.date : null,
    transitAltitude: inWindow ? transit!.hor.altitude : null,
    circumstance,
  };
}

export function nextRise(target: Target, start: Date, observer: Observer, limitDays = 366): Date | null {
  const body = engineTarget(target);
  const r = attempt(() => Astronomy.SearchRiseSet(body, engineObserver(observer), +1, new Astronomy.AstroTime(start), limitDays));
  return r ? r.date : null;
}

export function twilightCrossing(limit: -6 | -12 | -18, rising: boolean, start: Date, observer: Observer, limitDays = 1): Date | null {
  const r = attempt(() => Astronomy.SearchAltitude(Astronomy.Body.Sun, engineObserver(observer), rising ? +1 : -1, new Astronomy.AstroTime(start), limitDays, limit));
  return r ? r.date : null;
}

export const altitudeRange = (decDeg: number, latitude: number): [number, number] => {
  const upper = 90 - Math.abs(latitude - decDeg);
  const lower = -(90 - Math.abs(latitude + decDeg));
  return [Math.min(lower, upper), Math.max(lower, upper)];
};

export interface NightWindow {
  sunset: Date | null;
  civilDusk: Date | null;
  nauticalDusk: Date | null;
  astronomicalDusk: Date | null;
  astronomicalDawn: Date | null;
  nauticalDawn: Date | null;
  civilDawn: Date | null;
  sunrise: Date | null;
  condition: 'normal' | 'noAstronomicalDarkness' | 'polarDay' | 'polarNight';
}

/** The offset of a time zone at an instant, in milliseconds east of UTC. */
export function timeZoneOffset(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric',
  }).formatToParts(date);
  const v = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return Date.UTC(v('year'), v('month') - 1, v('day'), v('hour'), v('minute'), v('second')) - Math.floor(date.getTime() / 1000) * 1000;
}

/** Midnight at the start of the local day containing `date`. */
export function startOfLocalDay(date: Date, timeZone: string): Date {
  const offset = timeZoneOffset(date, timeZone);
  const localMs = date.getTime() + offset;
  const midnightLocal = Math.floor(localMs / 86_400_000) * 86_400_000;
  // The offset at midnight can differ from now on a daylight-saving day.
  return new Date(midnightLocal - timeZoneOffset(new Date(midnightLocal - offset), timeZone));
}

/** Searches forward from a local noon for a window of just over a day. */
export function nightFromNoon(noon: Date, observer: Observer): NightWindow {
  const o = engineObserver(observer);
  const start = new Astronomy.AstroTime(noon);
  const riseSet = (direction: number, from: Astronomy.AstroTime) => {
    const r = attempt(() => Astronomy.SearchRiseSet(Astronomy.Body.Sun, o, direction, from, 1.1));
    return r ? r.date : null;
  };
  const sunset = riseSet(-1, start);
  const dusk = (limit: -6 | -12 | -18) => twilightCrossing(limit, false, noon, observer, 1.1);
  // A dawn only counts if it follows this evening's darkening, otherwise a polar
  // twilight could pair a dawn with a dusk from the following day.
  const dawnStart = sunset ?? noon;
  const dawn = (limit: -6 | -12 | -18) => twilightCrossing(limit, true, dawnStart, observer, 1.1);
  const sunrise = riseSet(+1, new Astronomy.AstroTime(dawnStart));
  const astronomicalDusk = dusk(-18);
  const astronomicalDawn = dawn(-18);
  let condition: NightWindow['condition'] = 'normal';
  if (!sunset && !sunrise) condition = altitude('sun', noon, observer) > 0 ? 'polarDay' : 'polarNight';
  else if (!astronomicalDusk || !astronomicalDawn) condition = 'noAstronomicalDarkness';
  return {
    sunset, civilDusk: dusk(-6), nauticalDusk: dusk(-12), astronomicalDusk, astronomicalDawn,
    nauticalDawn: dawn(-12), civilDawn: dawn(-6), sunrise, condition,
  };
}

/** The night following local noon of the day containing `date`. */
export function nightContaining(date: Date, observer: Observer, timeZone: string): NightWindow {
  const midnight = startOfLocalDay(date, timeZone);
  const fourAM = midnight.getTime() + 4 * 3_600_000;
  // Before 04:00 local the user still means the night that began yesterday.
  const anchor = date.getTime() < fourAM ? midnight.getTime() - 12 * 3_600_000 : midnight.getTime() + 12 * 3_600_000;
  return nightFromNoon(new Date(anchor), observer);
}

/** The longest continuous dark interval, preferring true darkness. */
export function darkInterval(n: NightWindow): { start: Date; end: Date } | null {
  const pairs: [Date | null, Date | null][] = [
    [n.astronomicalDusk, n.astronomicalDawn], [n.nauticalDusk, n.nauticalDawn], [n.civilDusk, n.civilDawn], [n.sunset, n.sunrise],
  ];
  for (const [s, e] of pairs) if (s && e && s < e) return { start: s, end: e };
  return null;
}
