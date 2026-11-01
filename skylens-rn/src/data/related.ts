// Objects worth seeing next to another one. Membership comes from the IAU boundaries in the
// astronomy engine, and nearness from real separations. No relation here is hand-entered.
import { angleBetween, constellationOf, equatorialVector, Equatorial, Vec3 } from '../astronomy/core';
import { bodyIdOf, constellation, constellationObject, deepSky, namedStars, SkyObject, starObject, TYPE_NAMES } from './catalog';

export interface Related { object: SkyObject; reason: string }

interface Placed { object: SkyObject; vec: Vec3; con: string | null }

let placed: Placed[] | null = null;

/** Named stars and deep-sky objects with a known place. Built once. */
function catalogPlaces(): Placed[] {
  if (placed) return placed;
  const stars = namedStars().map(starObject).filter((s): s is SkyObject => s !== null);
  placed = [...stars, ...deepSky].filter((o) => o.position).map((o) => ({
    object: o, vec: equatorialVector(o.position!.raHours, o.position!.decDeg), con: constellationOf(o.position!),
  }));
  return placed;
}

const prominent = (a: Placed, b: Placed) => (a.object.magnitude ?? 99) - (b.object.magnitude ?? 99);

/** The brightest named things inside a constellation's IAU boundary. */
export function insideConstellation(id: string, limit = 8): Related[] {
  return catalogPlaces().filter((p) => p.con === id).sort(prominent).slice(0, limit).map((p) => ({ object: p.object, reason: TYPE_NAMES[p.object.type] }));
}

/**
 * For a planet the J2000 place comes from the caller, because it changes with the date.
 * Fixed objects use their catalog place, so the result is the same on any night.
 */
export function relatedObjects(o: SkyObject, j2000: Equatorial | null, limit = 6): Related[] {
  if (o.type === 'constellation') return insideConstellation(o.id.slice(4), limit);
  const at = j2000 ?? o.position;
  if (!at) return [];
  const out: Related[] = [];
  const con = constellationOf(at);
  const c = con ? constellation(con) : null;
  if (c) out.push({ object: constellationObject(c), reason: bodyIdOf(o.id) ? 'Constellation it is in now' : 'Its constellation' });
  const here = equatorialVector(at.raHours, at.decDeg);
  const near = catalogPlaces().filter((p) => p.object.id !== o.id)
    .map((p) => ({ p, away: angleBetween(here, p.vec) }))
    .filter((x) => x.away < 15 && (x.p.object.magnitude ?? 99) < 7)
    .sort((a, b) => a.away - b.away || prominent(a.p, b.p))
    .slice(0, limit - out.length);
  for (const { p, away } of near) out.push({ object: p.object, reason: `${away.toFixed(1)}° away · ${TYPE_NAMES[p.object.type]}` });
  return out;
}
