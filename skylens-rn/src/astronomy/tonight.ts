// Ported from ObservingKit/Tonight.swift. Why an object was listed is shown in words,
// and there is no published score: a heuristic doesn't have that kind of precision.
import { deepSky, isDeepSkyType, namedStars, objectNote, SkyObject, bodyObject, starObject } from '../data/catalog';
import { angleBetween, appearance, BodyId, compassName, DEG, equatorialVector, j2000ToHorizon, moonPhase, MoonPhase, mul, Observer, PLANETS, position, Vec3, vectorHorizontal } from './core';
import { darkInterval, nightContaining, NightWindow, riseTransitSet } from './night';

export interface Recommendation {
  object: SkyObject;
  bestTime: Date;
  maxAltitude: number;
  azimuthAtBest: number;
  /** Hours above 20° during the dark window. */
  hoursUp: number;
  isUpAllNight: boolean;
  magnitude: number;
  reasons: string[];
  cautions: string[];
  /** Short line for list rows. Internal rank is never displayed. */
  summary: string;
  rank: number;
}

export interface TonightPlan {
  night: NightWindow;
  moon: MoonPhase;
  moonRise: Date | null;
  moonSet: Date | null;
  recommendations: Recommendation[];
}

const NAKED_EYE_LIMIT = 5.5;

interface Candidate { object: SkyObject; body: BodyId | null; direction: Vec3 | null }

function candidates(): Candidate[] {
  const out: Candidate[] = [...PLANETS, 'moon' as BodyId].map((b) => ({ object: bodyObject(b), body: b, direction: null }));
  for (const hip of namedStars(30)) {
    const s = starObject(hip);
    if (s?.position) out.push({ object: s, body: null, direction: equatorialVector(s.position.raHours, s.position.decDeg) });
  }
  for (const d of deepSky) {
    const m = d.magnitude;
    if ((m !== null && m <= 9 && d.deepSky?.messier) || objectNote(d)) {
      out.push({ object: d, body: null, direction: equatorialVector(d.position!.raHours, d.position!.decDeg) });
    }
  }
  return out;
}

export const signedMagnitude = (m: number) => `${m < 0 ? '−' : ''}${Math.abs(m).toFixed(1)}`;

/** Plans the night containing `date`. */
export function planTonight(date: Date, observer: Observer, timeZone: string, limit = 12): TonightPlan {
  const night = nightContaining(date, observer, timeZone);
  const dark = darkInterval(night);
  const reference = dark?.start ?? date;
  const moon = moonPhase(reference);
  const moonEvents = riseTransitSet({ body: 'moon' }, night.sunset ?? reference, observer);
  if (!dark) return { night, moon, moonRise: moonEvents.rise, moonSet: moonEvents.set, recommendations: [] };

  // Half-hour samples: one rotation matrix each makes fixed objects cheap.
  const stepHours = 0.5;
  const durationH = (dark.end.getTime() - dark.start.getTime()) / 3_600_000;
  const count = Math.max(2, Math.floor(durationH / stepHours) + 1);
  const times = Array.from({ length: count }, (_, i) => new Date(dark.start.getTime() + i * stepHours * 3_600_000));
  const frames = times.map((t) => j2000ToHorizon(t, observer));
  const moonPositions = times.map((t) => position('moon', t, observer));

  const ranked: Recommendation[] = [];
  for (const c of candidates()) {
    const altitudes = new Array<number>(count), azimuths = new Array<number>(count);
    for (let i = 0; i < count; i++) {
      const h = c.body ? position(c.body, times[i], observer).apparent : vectorHorizontal(mul(frames[i], c.direction!));
      altitudes[i] = h.altitude;
      azimuths[i] = h.azimuth;
    }
    const m = c.body ? appearance(c.body, times[count >> 1]).magnitude : c.object.magnitude;
    if (m === null) continue;
    let best = 0;
    for (let i = 1; i < count; i++) if (altitudes[i] > altitudes[best]) best = i;
    const maxAltitude = altitudes[best];
    if (maxAltitude < 15) continue; // Too low to recommend honestly.

    // Extended objects spread their light out, so the stated magnitude flatters them.
    const extent = c.object.deepSky?.majorAxis ?? 0;
    const effective = m + (extent > 10 ? 1.5 * Math.log10(extent / 10) : 0);
    if (effective > NAKED_EYE_LIMIT + 3.5) continue;

    const above = altitudes.filter((a) => a >= 20).length;
    const hoursUp = above * stepHours;
    const reasons: string[] = [`Reaches ${Math.round(maxAltitude)}° high around its best`];
    const cautions: string[] = [];
    const altitudeScore = Math.sin(Math.min(maxAltitude, 70) * DEG) / Math.sin(70 * DEG);
    const windowScore = Math.min(1, hoursUp / 4);
    if (hoursUp >= 3) reasons.push(`Well placed for ${Math.floor(hoursUp)} hours tonight`);
    const brightness = Math.min(1, Math.max(0, (9 - effective) / 9));
    if (m < 1) reasons.push('Bright and easy to find');

    let moonPenalty = 1;
    if (isDeepSkyType(c.object.type)) {
      const moonAtBest = moonPositions[best];
      if (moonAtBest.geometric.altitude > 0 && c.object.position) {
        const separation = angleBetween(equatorialVector(c.object.position.raHours, c.object.position.decDeg), equatorialVector(moonAtBest.j2000.raHours, moonAtBest.j2000.decDeg));
        moonPenalty = 1 - 0.75 * moon.illuminatedFraction * (separation < 30 ? 1 : 0.6);
        if (moon.illuminatedFraction > 0.5) cautions.push('Moonlight will wash out faint detail');
      } else {
        reasons.push('Dark sky, with the Moon out of the way');
      }
    }

    let bonus = 0.05;
    if (c.object.type === 'planet' || c.object.type === 'moon') bonus = 0.25;
    else if (c.object.type !== 'star' && objectNote(c.object)) bonus = 0.12;
    const rank = (0.4 * altitudeScore + 0.2 * windowScore + 0.4 * brightness) * moonPenalty + bonus;

    const isUpAllNight = altitudes.every((a) => a >= 10);
    const place = isUpAllNight ? 'Visible all night' : maxAltitude >= 45 ? `High in the ${compassName(azimuths[best])}` : `Low in the ${compassName(azimuths[best])}`;
    ranked.push({
      object: c.object, bestTime: times[best], maxAltitude, azimuthAtBest: azimuths[best], hoursUp, isUpAllNight, magnitude: m,
      reasons, cautions, rank, summary: `${place} · Mag ${signedMagnitude(m)}`,
    });
  }
  ranked.sort((a, b) => b.rank - a.rank);
  return { night, moon, moonRise: moonEvents.rise, moonSet: moonEvents.set, recommendations: ranked.slice(0, limit) };
}

