// What the 3D scene contains at one instant, free of any drawing API. There are two scales.
// The system view holds the Sun and planets, in a chosen scale mode. The local view holds one
// planet and its moons at their true relative sizes and distances, in units of whichever
// body is in focus. Both are in the ecliptic frame, so the camera angle carries across.
import { DEG, Mat3, mul, normalized, transpose, Vec3 } from '../../astronomy/core';
import { CameraBasis, cameraBasis, OrbitCamera, projectPoint } from '../../astronomy/orbitCamera';
import { bodyFixedFrame, displayPosition, displayRadius, EQJ_TO_ECL, GlobeId, heliocentric, heliocentricEcliptic, isSatellite, lockedFrame, orbitPoints, parentOf, PHYSICAL, PLANET_IDS, PlanetId, ScaleMode, satellitesOf, SatelliteId, SolarId } from '../../astronomy/solar';

export interface Globe {
  id: GlobeId;
  name: string;
  position: Vec3;
  radius: number;
  polar: number;
  /** Scene frame to body-fixed. */
  toBody: Mat3;
  /** Unit vector toward the Sun, scene frame. */
  sun: Vec3;
}

const ECL_TO_EQJ = transpose(EQJ_TO_ECL);

function sceneToBody(toFixed: Mat3): Mat3 {
  const r = new Array(9).fill(0) as Mat3;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) r[i * 3 + j] += toFixed[i * 3 + k] * ECL_TO_EQJ[k * 3 + j];
  return r;
}

const towardSun = (position: Vec3): Vec3 => normalized([-position[0], -position[1], -position[2]]);

/** The Sun and eight planets at their positions for this date and scale. */
export function systemScene(date: Date, mode: ScaleMode): Globe[] {
  const out: Globe[] = [{ id: 'sun', name: 'Sun', position: [0, 0, 0], radius: displayRadius('sun', mode), polar: 1, toBody: sceneToBody(bodyFixedFrame('sun', date)), sun: [0, 0, 1] }];
  for (const id of PLANET_IDS) {
    const real = heliocentricEcliptic(id, date);
    out.push({ id, name: PHYSICAL[id].name, position: displayPosition(real, mode), radius: displayRadius(id, mode), polar: PHYSICAL[id].polar, toBody: sceneToBody(bodyFixedFrame(id, date)), sun: towardSun(real) });
  }
  return out;
}

/** The planet a local view belongs to. */
export const systemOf = (focus: GlobeId): PlanetId | 'sun' => (focus === 'sun' ? 'sun' : isSatellite(focus) ? parentOf(focus) : focus);

/** A planet and its moons, true to scale, centred on `focus` with its radius as the unit. */
export function localScene(focus: GlobeId, date: Date): Globe[] {
  const home = systemOf(focus);
  if (home === 'sun') return [{ id: 'sun', name: 'Sun', position: [0, 0, 0], radius: 1, polar: 1, toBody: sceneToBody(bodyFixedFrame('sun', date)), sun: [0, 0, 1] }];
  const unit = PHYSICAL[focus].radius;
  const sun = towardSun(heliocentricEcliptic(home, date));
  const moons = satellitesOf(home, date);
  const pole: Vec3 = (() => { const m = bodyFixedFrame(home, date); return [m[6], m[7], m[8]]; })();
  const centre = isSatellite(focus) ? moons.find((m) => m.id === focus)!.km : ([0, 0, 0] as Vec3);
  const place = (km: Vec3): Vec3 => { const v = mul(EQJ_TO_ECL, [km[0] - centre[0], km[1] - centre[1], km[2] - centre[2]]); return [v[0] / unit, v[1] / unit, v[2] / unit]; };
  const out: Globe[] = [{ id: home, name: PHYSICAL[home].name, position: place([0, 0, 0]), radius: PHYSICAL[home].radius / unit, polar: PHYSICAL[home].polar, toBody: sceneToBody(bodyFixedFrame(home, date)), sun }];
  for (const m of moons) {
    const frame = m.id === 'moon' ? bodyFixedFrame('moon', date) : lockedFrame([-m.km[0], -m.km[1], -m.km[2]], pole);
    out.push({ id: m.id, name: PHYSICAL[m.id].name, position: place(m.km), radius: PHYSICAL[m.id].radius / unit, polar: 1, toBody: sceneToBody(frame), sun });
  }
  return out;
}

/** How far a local view can pull back: past the outermost moon, then it hands to the system. */
export function localReach(focus: GlobeId, date: Date): number {
  const widest = localScene(focus, date).reduce((m, g) => Math.max(m, Math.hypot(g.position[0], g.position[1], g.position[2]) + g.radius), 1);
  return Math.max(12, widest * 2.6);
}

// ---- Cameras ----

/** Far enough that Neptune's orbit fits the width of a phone in portrait. */
export const overviewDistance = (mode: ScaleMode) => (mode === 'true' ? 150 : 22);

export const overviewCamera = (mode: ScaleMode, width: number, height: number): OrbitCamera => ({ target: [0, 0, 0], yaw: -70, pitch: 38, distance: overviewDistance(mode), roll: 0, fov: 50, width, height });

/** From this far, in its own radii, a body fills about three quarters of a phone's width. */
export const FOCUS_DISTANCE = 6;

/** Arriving at a body on its sunlit side, a little off the noon point, so it has shape. */
export function sunlitView(sun: Vec3, yaw: number, pitch: number): { yaw: number; pitch: number } {
  if (Math.abs(sun[2]) > 0.99) return { yaw, pitch };
  return { yaw: Math.atan2(sun[1], sun[0]) / DEG + 40, pitch: 16 };
}

// ---- Orbits ----

const orbitCache = new Map<string, Float32Array>();

/** One orbit in scene units for this scale. Rebuilt yearly, because orbits barely change. */
export function orbitPath(id: PlanetId, date: Date, mode: ScaleMode): Float32Array {
  const key = `${id}|${mode}|${date.getUTCFullYear()}`;
  const hit = orbitCache.get(key);
  if (hit) return hit;
  const real = orbitPoints(id, new Date(Date.UTC(date.getUTCFullYear(), 0, 1)));
  const out = new Float32Array(real.length);
  for (let i = 0; i < real.length; i += 3) out.set(displayPosition([real[i], real[i + 1], real[i + 2]], mode), i);
  if (orbitCache.size > 64) orbitCache.clear();
  orbitCache.set(key, out);
  return out;
}

/** Sidereal periods in days, used only to choose how far along to sample each moon's path. */
const MOON_PERIOD: Record<SatelliteId, number> = { moon: 27.32, io: 1.769, europa: 3.551, ganymede: 7.155, callisto: 16.69 };
const moonOrbits = new Map<string, Float32Array>();

/** A moon's real path over one period from its own model, in km from its planet, J2000. */
function moonOrbitKm(id: SatelliteId, date: Date): Float32Array {
  const key = `${id}|${Math.floor(date.getTime() / 86_400_000 / 5)}`;
  const hit = moonOrbits.get(key);
  if (hit) return hit;
  const samples = 96, days = MOON_PERIOD[id], out = new Float32Array((samples + 1) * 3), home = parentOf(id);
  for (let i = 0; i <= samples; i++) {
    const at = new Date(date.getTime() + (i / samples) * days * 86_400_000);
    out.set(satellitesOf(home, at).find((s) => s.id === id)!.km, i * 3);
  }
  if (moonOrbits.size > 32) moonOrbits.clear();
  moonOrbits.set(key, out);
  return out;
}

/** Each moon's path in a local view's own units. Paths around the focus body only. */
export function localOrbits(focus: GlobeId, date: Date): { id: SatelliteId; points: Float32Array }[] {
  const home = systemOf(focus);
  if (home === 'sun') return [];
  const unit = PHYSICAL[focus].radius, moons = satellitesOf(home, date);
  const centre = isSatellite(focus) ? moons.find((m) => m.id === focus)!.km : ([0, 0, 0] as Vec3);
  return moons.map((m) => {
    const km = moonOrbitKm(m.id, date), points = new Float32Array(km.length);
    for (let i = 0; i < km.length; i += 3) {
      const v = mul(EQJ_TO_ECL, [km[i] - centre[0], km[i + 1] - centre[1], km[i + 2] - centre[2]]);
      points[i] = v[0] / unit; points[i + 1] = v[1] / unit; points[i + 2] = v[2] / unit;
    }
    return { id: m.id, points };
  });
}

// ---- Picking ----

/**
 * The body under a tap. A disc the finger is really on wins, nearest the camera first.
 * Otherwise a tiny body within a finger's reach, the closest to the finger.
 */
export function pickGlobe(globes: Globe[], c: OrbitCamera, b: CameraBasis, x: number, y: number, slop = 26): GlobeId | null {
  let on: GlobeId | null = null, onDepth = Infinity, near: GlobeId | null = null, nearest = slop;
  for (const g of globes) {
    const p = projectPoint(c, b, g.position);
    if (!p) continue;
    const gap = Math.hypot(p.x - x, p.y - y), disc = g.radius * p.scale * (g.id === 'saturn' ? 1.2 : 1);
    if (gap <= disc && p.depth < onDepth) { on = g.id; onDepth = p.depth; }
    if (gap <= nearest) { near = g.id; nearest = gap; }
  }
  return on ?? near;
}

export const projectGlobe = (globes: Globe[], c: OrbitCamera, id: GlobeId) => {
  const g = globes.find((x) => x.id === id);
  return g ? projectPoint(c, cameraBasis(c), g.position) : null;
};

/** A moon's distance from its planet, from the same model that places it. */
export function moonDistanceKm(id: GlobeId, date: Date): number | null {
  if (!isSatellite(id)) return null;
  const m = satellitesOf(parentOf(id), date).find((s) => s.id === id);
  return m ? Math.hypot(...m.km) : null;
}

/** Facts for the card, in AU, from true positions. */
export function distancesFor(id: GlobeId, date: Date): { fromSunAU: number | null; fromEarthAU: number | null } {
  const home = systemOf(id);
  if (home === 'sun') return { fromSunAU: null, fromEarthAU: Math.hypot(...heliocentric('earth', date)) };
  const v = heliocentric(home, date), e = heliocentric('earth', date);
  return { fromSunAU: Math.hypot(...v), fromEarthAU: home === 'earth' ? null : Math.hypot(v[0] - e[0], v[1] - e[1], v[2] - e[2]) };
}

export const SYSTEM_BODIES: SolarId[] = ['sun', ...PLANET_IDS];
export const moonsOf = (id: GlobeId): SatelliteId[] => { const home = systemOf(id); return home === 'sun' ? [] : satellitesOf(home, new Date()).map((s) => s.id); };
