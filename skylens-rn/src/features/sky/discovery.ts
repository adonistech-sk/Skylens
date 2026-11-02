// What is worth looking at from here, now, in this view. Candidates are exactly what the
// frame can show, and every line of text is calculated. Nothing is suggested that the
// sky isn't really offering: on a bright day that can be a very short list.
import { Camera, project } from '../../astronomy/camera';
import { compass16, equatorialVector, mul, Vec3, vectorHorizontal } from '../../astronomy/core';
import { washedOut } from '../../astronomy/locator';
import { bodyIdOf, constellationObject, constellations, namedStars, object, SkyObject, starObject, TYPE_NAMES } from '../../data/catalog';
import { Layers, SkyMode } from '../../state/skyModes';
import { SkyMoment, visibleDeepSky } from './scene';

export interface Suggestion {
  object: SkyObject;
  altitude: number;
  azimuth: number;
  magnitude: number | null;
  inView: boolean;
  /** Calculated, shown as the row's subtitle. */
  reason: string;
  rank: number;
}

export interface DiscoveryContext {
  camera: Camera;
  moment: SkyMoment;
  layers: Layers;
  mode: SkyMode;
  brightness: number;
  /** Bottom of the unobstructed sky, in points. */
  bottomEdge: number;
  topEdge: number;
}

const magnitudeText = (m: number) => `Mag ${m < 0 ? '−' : ''}${Math.abs(m).toFixed(1)}`;

const NAKED_EYE = 5.5;

/** Best first. `inViewOnly` limits it to what is on screen right now. */
export function discover(c: DiscoveryContext, max = 6, inViewOnly = false): Suggestion[] {
  const { camera, moment, layers, mode, brightness } = c;
  const found: Suggestion[] = [];

  const consider = (o: SkyObject, dir: Vec3, magnitude: number | null, weight: number) => {
    const h = vectorHorizontal(dir);
    if (h.altitude < 5) return;
    // The Sun's brightness is no reason to look at it, and the app never suggests doing so.
    if (o.type === 'sun') return;
    if (mode === 'observe' && (magnitude ?? 0) > NAKED_EYE) return;
    if (washedOut(bodyIdOf(o.id), moment.sunAltitude)) return;
    const p = project(camera, dir);
    const inView = !!p && p.x >= 0 && p.x <= camera.width && p.y >= c.topEdge && p.y <= c.bottomEdge;
    if (inViewOnly && !inView) return;
    const parts = [inView ? 'In view' : `${compass16(h.azimuth)}`, `${Math.round(h.altitude)}° high`];
    if (magnitude !== null) parts.push(magnitudeText(magnitude));
    const centre = p ? Math.hypot(p.x - camera.width / 2, p.y - camera.height / 2) / Math.max(camera.width, camera.height) : 2;
    // Brightness only ranks an object among its peers: the Moon's magnitude shouldn't drown out
    // everything else, and what is on screen always comes before what isn't.
    const rank = (inView ? 100 - centre * 2 : 0) + weight - Math.max(-2, magnitude ?? 6) * 0.6 + h.altitude / 90;
    const kind = TYPE_NAMES[o.type];
    found.push({ object: o, altitude: h.altitude, azimuth: h.azimuth, magnitude, inView, reason: (kind === o.name ? parts : [kind, ...parts]).join(' · '), rank });
  };

  if (layers.planets) {
    for (const b of moment.bodies) {
      const o = object(`body:${b.id}`);
      if (o) consider(o, b.dir, b.magnitude, b.id === 'moon' ? 4 : 3);
    }
  }
  if (layers.stars) {
    for (const hip of namedStars(mode === 'observe' ? 24 : 60)) {
      const s = starObject(hip);
      if (s?.position) consider(s, mul(moment.matrix, equatorialVector(s.position.raHours, s.position.decDeg)), s.magnitude, 0.5);
    }
  }
  // The same rule that draws deep sky, so a suggestion can always be found on the map. Wide
  // views draw none, so the rule is asked about the view a suggestion would fly to.
  const reach = mode === 'atlas' ? Math.min(camera.fov, 60) : Math.min(camera.fov, 14);
  for (const d of visibleDeepSky(mode, layers, reach, brightness, false)) {
    if (mode !== 'atlas' && !d.object.deepSky?.messier && !d.object.designations.length) continue;
    consider(d.object, mul(moment.matrix, d.vec), d.object.magnitude, d.object.deepSky?.messier ? 1.5 : 0.5);
  }
  const list = found.sort((a, b) => b.rank - a.rank).slice(0, max);
  // The constellation nearest the middle of the view leads the panel, where it can tell its
  // story. It stays out of the step arrows, which walk from point to point.
  if (!inViewOnly && brightness < 0.42 && (layers.constellations || layers.artwork)) {
    const figure = figureInView(c);
    if (figure) return [figure, ...list].slice(0, max);
  }
  return list;
}

function figureInView(c: DiscoveryContext): Suggestion | null {
  const { camera, moment } = c;
  let best: { object: SkyObject; dir: Vec3; dist: number } | null = null;
  for (const con of constellations) {
    const o = constellationObject(con);
    const dir = mul(moment.matrix, equatorialVector(o.position!.raHours, o.position!.decDeg));
    const h = vectorHorizontal(dir);
    if (h.altitude < 8) continue;
    const p = project(camera, dir);
    if (!p || p.x < 0 || p.x > camera.width || p.y < c.topEdge || p.y > c.bottomEdge) continue;
    const dist = Math.hypot(p.x - camera.width / 2, p.y - camera.height / 2);
    if (!best || dist < best.dist) best = { object: o, dir, dist };
  }
  if (!best) return null;
  const h = vectorHorizontal(best.dir);
  return { object: best.object, altitude: h.altitude, azimuth: h.azimuth, magnitude: null, inView: true, reason: `Constellation · In view · ${Math.round(h.altitude)}° high`, rank: 1000 };
}
