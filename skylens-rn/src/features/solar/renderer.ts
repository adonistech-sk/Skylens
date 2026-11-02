// Draws the Solar System and the Moon into a Skia picture, in the same way the sky is drawn:
// background, orbits, then bodies far to near, each as a shader over just its own rectangle,
// then labels. Skia isn't touched at import, because it may not have loaded yet.
import { createPicture, FilterMode, MipmapMode, PaintStyle, PointMode, SkCanvas, SkFont, SkImage, Skia, SkPicture, SkRuntimeEffect, SkShader, StrokeCap, TileMode, vec } from '@shopify/react-native-skia';
import { dot, Mat3, mul, transpose, Vec3 } from '../../astronomy/core';
import { CameraBasis, cameraBasis, OrbitCamera, projectDirection, projectPoint } from '../../astronomy/orbitCamera';
import { EQJ_TO_ECL, GlobeId, PlanetId, ScaleMode } from '../../astronomy/solar';
import { stars } from '../../data/catalog';
import { LabelCandidate, placeLabels, PlacedLabel, PRIORITY } from '../sky/labels';
import { Globe, orbitPath } from './scene';
import { GLOBE_SHADER, MOON_SHADER, SPACE_SHADER } from './shaders';
import { texture } from './textures';

export interface SolarResources { space: SkRuntimeEffect; globe: SkRuntimeEffect; moon: SkRuntimeEffect; label: SkFont; small: SkFont }

export const makeEffects = () => {
  const make = (source: string, name: string) => { const e = Skia.RuntimeEffect.Make(source); if (!e) throw new Error(`${name} shader failed to compile`); return e; };
  return { space: make(SPACE_SHADER, 'space'), globe: make(GLOBE_SHADER, 'globe'), moon: make(MOON_SHADER, 'moon') };
};

const columns = (a: Vec3, b: Vec3, c: Vec3) => [a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]];

const imageShader = (image: SkImage, wrap = TileMode.Repeat) => image.makeShaderOptions(wrap, TileMode.Clamp, FilterMode.Linear, MipmapMode.None);
const flat = (r: number, g: number, b: number): SkShader => Skia.Shader.MakeColor(Float32Array.of(r, g, b, 1));

// ---- Stars and the Milky Way, at infinity ----

interface StarSet { xyz: Float32Array; groups: [number, number][] }
let starCache: StarSet | null = null;

function brightStars(): StarSet {
  if (starCache) return starCache;
  const t = stars();
  const limits = [2.5, 4, 5.5], groups: [number, number][] = [];
  let n = 0;
  while (n < t.count && t.mag[n] <= limits[2]) n++;
  const xyz = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const a = (t.ra[i] * Math.PI) / 180, d = (t.dec[i] * Math.PI) / 180, c = Math.cos(d);
    xyz[i * 3] = c * Math.cos(a); xyz[i * 3 + 1] = c * Math.sin(a); xyz[i * 3 + 2] = Math.sin(d);
  }
  let from = 0;
  for (const l of limits) {
    let to = from;
    while (to < n && t.mag[to] <= l) to++;
    groups.push([from, to]);
    from = to;
  }
  starCache = { xyz, groups };
  return starCache;
}

/** `toEquatorial` takes the scene frame to J2000, so the backdrop is the real sky in any view. */
function drawBackdrop(canvas: SkCanvas, c: OrbitCamera, b: CameraBasis, toEquatorial: Mat3, r: SolarResources) {
  const map = texture('milkyway');
  const rayM = columns(mul(toEquatorial, b.right), mul(toEquatorial, b.up), mul(toEquatorial, b.forward));
  const paint = Skia.Paint();
  if (map) {
    const shader = r.space.makeShaderWithChildren([map.width(), map.height(), c.width, c.height - 2 * (c.shiftY ?? 0), b.focal, ...rayM], [imageShader(map)]);
    paint.setShader(shader);
  } else paint.setColor(Float32Array.of(0.012, 0.016, 0.046, 1));
  canvas.drawRect(Skia.XYWHRect(0, 0, c.width, c.height), paint);

  const s = brightStars();
  const fromEquatorial = transpose(toEquatorial);
  const sizes = [2.1, 1.5, 1], alphas = [0.95, 0.7, 0.45];
  s.groups.forEach(([from, to], g) => {
    const pts = [];
    for (let i = from; i < to; i++) {
      const p = projectDirection(c, b, mul(fromEquatorial, [s.xyz[i * 3], s.xyz[i * 3 + 1], s.xyz[i * 3 + 2]]));
      if (p && p.x >= 0 && p.y >= 0 && p.x <= c.width && p.y <= c.height) pts.push(vec(p.x, p.y));
    }
    // A close view can leave a group with no stars, and native Skia throws on an empty array.
    if (!pts.length) return;
    const ink = Skia.Paint();
    ink.setStyle(PaintStyle.Stroke);
    ink.setStrokeWidth(sizes[g]);
    ink.setStrokeCap(StrokeCap.Round);
    ink.setAntiAlias(true);
    ink.setColor(Float32Array.of(0.88, 0.91, 1, alphas[g]));
    canvas.drawPoints(PointMode.Points, pts, ink);
  });
}

// ---- Globes ----

const TINT: Record<GlobeId, [number, number, number]> = {
  sun: [1, 0.86, 0.6], mercury: [0.55, 0.53, 0.5], venus: [0.86, 0.72, 0.5], earth: [0.3, 0.45, 0.72], mars: [0.72, 0.42, 0.28], jupiter: [0.8, 0.7, 0.56], saturn: [0.86, 0.76, 0.56],
  uranus: [0.66, 0.82, 0.84], neptune: [0.34, 0.54, 0.78], moon: [0.6, 0.59, 0.57], io: [0.8, 0.72, 0.4], europa: [0.75, 0.7, 0.62], ganymede: [0.55, 0.5, 0.45], callisto: [0.4, 0.36, 0.33],
};
const AIR: Partial<Record<GlobeId, [number, number, number]>> = { earth: [0.26, 0.44, 0.9], venus: [0.5, 0.4, 0.2], mars: [0.4, 0.22, 0.12], jupiter: [0.14, 0.12, 0.1], saturn: [0.14, 0.12, 0.08], uranus: [0.2, 0.32, 0.34], neptune: [0.14, 0.24, 0.5] };
/** OPAL maps start at longitude 0. The rest are centred on it. */
const STARTS_AT_ZERO = new Set<GlobeId>(['jupiter', 'saturn', 'uranus', 'neptune']);
const SATURN_RING_OUTER = 2.269;

/** The map to use: a small one is plenty, and sharper, for a small disc. */
function surfaceFor(id: GlobeId, pixelRadius: number) {
  const full = id, small = `${id}-s`;
  if (id === 'sun') return null;
  if (id === 'uranus' || id === 'neptune' || id === 'io' || id === 'europa' || id === 'ganymede' || id === 'callisto') return texture(full);
  if (pixelRadius > 60) return texture(full) ?? texture(small);
  return texture(small) ?? texture(full);
}

export function drawGlobe(canvas: SkCanvas, g: Globe, c: OrbitCamera, b: CameraBasis, r: SolarResources, drawn: { count: number }, ambient: number) {
  const p = projectPoint(c, b, g.position);
  if (!p) return;
  const pixelRadius = g.radius * p.scale;
  const [tr, tg, tb] = TINT[g.id];
  // Too small to shade: a real position still gets a mark.
  if (pixelRadius < 1.6) {
    const dot_ = Skia.Paint();
    dot_.setAntiAlias(true);
    dot_.setColor(Float32Array.of(tr, tg, tb, 1));
    canvas.drawCircle(p.x, p.y, 2, dot_);
    return;
  }
  const hasRing = g.id === 'saturn';
  const reach = pixelRadius * (hasRing ? SATURN_RING_OUTER * 1.12 : 1.1) + 3;
  const nearby = p.depth < g.radius * 3;
  const x0 = nearby ? 0 : Math.max(0, p.x - reach), y0 = nearby ? 0 : Math.max(0, p.y - reach);
  const x1 = nearby ? c.width : Math.min(c.width, p.x + reach), y1 = nearby ? c.height : Math.min(c.height, p.y + reach);
  if (x1 <= x0 || y1 <= y0) return;

  const toLocal = (v: Vec3) => mul(g.toBody, v);
  const eye: Vec3 = [b.eye[0] - g.position[0], b.eye[1] - g.position[1], b.eye[2] - g.position[2]];
  const eyeBody = toLocal([eye[0] / g.radius, eye[1] / g.radius, eye[2] / g.radius]);
  const map = surfaceFor(g.id, pixelRadius);
  const night = g.id === 'earth' ? texture('earth-night') : null;
  const air = AIR[g.id] ?? [0, 0, 0];
  const offset = STARTS_AT_ZERO.has(g.id) ? 0 : 0.5;
  const uniforms = [
    map?.width() ?? 1, map?.height() ?? 1, night?.width() ?? 1, night?.height() ?? 1, c.width, c.height - 2 * (c.shiftY ?? 0), b.focal,
    ...columns(toLocal(b.right), toLocal(b.up), toLocal(b.forward)), ...eyeBody, ...toLocal(g.sun),
    g.polar, offset, g.id === 'sun' ? 1 : 0, night ? 1 : 0, hasRing ? SATURN_RING_OUTER : 0, ...air, 1 / Math.max(pixelRadius, 1), ambient,
  ];
  const paint = Skia.Paint();
  paint.setShader(r.globe.makeShaderWithChildren(uniforms, [map ? imageShader(map) : flat(tr, tg, tb), night ? imageShader(night) : flat(0, 0, 0)]));
  canvas.drawRect(Skia.XYWHRect(x0, y0, x1 - x0, y1 - y0), paint);
  drawn.count++;
}

function drawSunGlow(canvas: SkCanvas, x: number, y: number, radius: number) {
  const paint = Skia.Paint();
  const reach = Math.max(radius * 5, 40);
  paint.setShader(Skia.Shader.MakeRadialGradient(vec(x, y), reach, [Skia.Color('rgba(255,214,150,0.5)'), Skia.Color('rgba(255,170,90,0.12)'), Skia.Color('rgba(255,150,80,0)')], [0, 0.35, 1], TileMode.Clamp));
  canvas.drawRect(Skia.XYWHRect(x - reach, y - reach, reach * 2, reach * 2), paint);
}

function drawOrbit(canvas: SkCanvas, o: Float32Array, c: OrbitCamera, b: CameraBasis, chosen: boolean) {
  const path = Skia.PathBuilder.Make();
  let prev: { x: number; y: number } | null = null;
  for (let i = 0; i < o.length; i += 3) {
    const p = projectPoint(c, b, [o[i], o[i + 1], o[i + 2]]);
    if (p && prev && Math.hypot(p.x - prev.x, p.y - prev.y) < Math.max(c.width, c.height)) { path.moveTo(prev.x, prev.y); path.lineTo(p.x, p.y); }
    prev = p;
  }
  const ink = Skia.Paint();
  ink.setStyle(PaintStyle.Stroke);
  ink.setStrokeWidth(chosen ? 1.1 : 0.7);
  ink.setAntiAlias(true);
  ink.setColor(chosen ? Float32Array.of(0.96, 0.7, 0.58, 0.8) : Float32Array.of(0.62, 0.72, 0.96, 0.26));
  canvas.drawPath(path.build(), ink);
}

function drawLabelText(canvas: SkCanvas, text: string, x: number, y: number, font: SkFont, r: number, g: number, b: number, a: number) {
  const halo = Skia.Paint();
  halo.setStyle(PaintStyle.Stroke);
  halo.setStrokeWidth(2.4);
  halo.setAntiAlias(true);
  halo.setColor(Float32Array.of(0.02, 0.03, 0.08, 0.55 * a));
  canvas.drawText(text, x, y, halo, font);
  const ink = Skia.Paint();
  ink.setAntiAlias(true);
  ink.setColor(Float32Array.of(r, g, b, a));
  canvas.drawText(text, x, y, ink, font);
}

export interface SolarFrame {
  camera: OrbitCamera;
  globes: Globe[];
  date: Date;
  mode: ScaleMode;
  /** Local views show no orbits and no Sun. */
  scene: 'system' | 'local';
  selected: GlobeId | null;
  orbits: boolean;
  moonOrbits: { id: GlobeId; points: Float32Array }[];
  labels: boolean;
  topEdge: number;
  bottomEdge: number;
}

export interface SolarResult { drawn: number; labels: PlacedLabel[] }

export function renderSolar(f: SolarFrame, r: SolarResources, result: SolarResult): SkPicture {
  const c = f.camera, b = cameraBasis(c);
  return createPicture((canvas) => {
    drawBackdrop(canvas, c, b, transpose(EQJ_TO_ECL), r);
    if (f.scene === 'system' && f.orbits) {
      for (const g of f.globes) if (g.id !== 'sun') drawOrbit(canvas, orbitPath(g.id as PlanetId, f.date, f.mode), c, b, g.id === f.selected);
    }
    if (f.scene === 'local' && f.orbits) for (const o of f.moonOrbits) drawOrbit(canvas, o.points, c, b, o.id === f.selected);
    const order = [...f.globes].sort((a, z) => dot(sub(z.position, b.eye), b.forward) - dot(sub(a.position, b.eye), b.forward));
    const drawn = { count: 0 };
    for (const g of order) {
      if (g.id === 'sun') { const p = projectPoint(c, b, g.position); if (p) drawSunGlow(canvas, p.x, p.y, g.radius * p.scale); }
      // From outside the system half of every planet faces away: keep them readable.
      drawGlobe(canvas, g, c, b, r, drawn, f.scene === 'system' ? 0.3 : 0.012);
    }
    const candidates: LabelCandidate[] = [];
    if (f.labels) {
      for (const g of f.globes) {
        const p = projectPoint(c, b, g.position);
        if (!p) continue;
        const pixelRadius = g.radius * p.scale, w = r.label.getTextWidth(g.name);
        // The body in focus is named by the title.
        if (f.scene === 'local' && g.position[0] === 0 && g.position[1] === 0 && g.position[2] === 0) continue;
        const y = p.y + Math.max(pixelRadius, 3) + 6;
        candidates.push({ text: g.name, style: g.id === f.selected ? 'selection' : 'star', priority: g.id === f.selected ? PRIORITY.selection : PRIORITY.body - (g.id === 'sun' ? 0 : g.id === 'earth' ? 1 : 2), id: g.id, boxes: [{ x: p.x - w / 2, y, w, h: 16 }, { x: p.x + Math.max(pixelRadius, 3) + 6, y: p.y - 8, w, h: 16 }, { x: p.x - w / 2, y: p.y - Math.max(pixelRadius, 3) - 22, w, h: 16 }, { x: p.x - Math.max(pixelRadius, 3) - 6 - w, y: p.y - 8, w, h: 16 }] });
      }
    }
    const placed = placeLabels(candidates, { w: c.width, top: f.topEdge, bottom: f.bottomEdge }, 16);
    for (const { candidate: l, box } of placed) {
      const chosen = l.style === 'selection';
      drawLabelText(canvas, l.text, box.x, box.y + 12, r.label, chosen ? 1 : 0.94, chosen ? 0.84 : 0.95, chosen ? 0.72 : 1, 0.95);
    }
    result.drawn = drawn.count;
    result.labels = placed;
  }, Skia.XYWHRect(0, 0, c.width, c.height));
}

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

// ---- The Moon ----

export interface MoonSlot { image: SkImage; bounds: [number, number, number, number] }

export interface MoonFrame {
  camera: OrbitCamera;
  /** Body-fixed Sun direction. */
  sun: Vec3;
  /** Moon body-fixed to J2000, for the backdrop. */
  toEquatorial: Mat3;
  slots: MoonSlot[];
  tileSize: number;
  tileGutter: number;
  fullLight: boolean;
  relief: boolean;
  elevation: boolean;
}

export function renderMoon(f: MoonFrame, r: SolarResources, overlay: (canvas: SkCanvas, b: CameraBasis) => void): SkPicture {
  const c = f.camera, b = cameraBasis(c);
  return createPicture((canvas) => {
    drawBackdrop(canvas, c, b, f.toEquatorial, r);
    const base = texture('moon') ?? texture('moon-s');
    const reliefMap = texture('moon-relief');
    const blank = flat(0, 0, 0);
    const slot = (i: number) => f.slots[i];
    const bounds = (i: number) => slot(i)?.bounds ?? [0, 0, 0, 0];
    const pixelRadius = b.focal / Math.max(Math.hypot(b.eye[0], b.eye[1], b.eye[2]) * Math.cos(Math.asin(Math.min(0.999, 1 / Math.hypot(b.eye[0], b.eye[1], b.eye[2])))), 1e-3);
    const uniforms = [
      base?.width() ?? 1, base?.height() ?? 1, reliefMap?.width() ?? 1, reliefMap?.height() ?? 1, f.tileSize, f.tileGutter,
      ...bounds(0), ...bounds(1), ...bounds(2), ...bounds(3), c.width, c.height - 2 * (c.shiftY ?? 0), b.focal,
      ...columns(b.right, b.up, b.forward), ...b.eye, ...f.sun, 1 / pixelRadius, f.fullLight ? 1 : 0, f.relief && reliefMap ? 1 : 0, f.elevation && reliefMap ? 1 : 0,
    ];
    const paint = Skia.Paint();
    const children = [base ? imageShader(base) : flat(0.6, 0.59, 0.57), reliefMap ? imageShader(reliefMap) : blank];
    for (let i = 0; i < 4; i++) { const s = slot(i); children.push(s ? imageShader(s.image, TileMode.Clamp) : blank); }
    paint.setShader(r.moon.makeShaderWithChildren(uniforms, children));
    canvas.drawRect(Skia.XYWHRect(0, 0, c.width, c.height), paint);
    overlay(canvas, b);
  }, Skia.XYWHRect(0, 0, c.width, c.height));
}

export { drawLabelText };
