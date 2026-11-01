// Draws one sky frame into a Skia picture. Fixed layer order: background, artwork,
// lines, stars, planets, markers, labels, overlay. Runs on the JS thread and records a
// picture, so background, stars and labels can never tear apart from each other.
import {
  BlendMode, ClipOp, createPicture, FilterMode, MipmapMode, PaintStyle, PointMode, Skia, SkCanvas, SkFont, SkImage, SkPaint, SkPicture, SkPoint, SkRuntimeEffect, StrokeCap, TileMode, vec,
} from '@shopify/react-native-skia';
import { Camera, cameraScale, pointsPerDegree, project, unproject } from '../../astronomy/camera';
import { Mat3, mul, normalize360, transpose, vectorHorizontal, Vec3 } from '../../astronomy/core';
import { starColor, stars } from '../../data/catalog';
import { Layers } from '../../state/store';
import { computeArtworkAnchors, OrionArtwork } from './artwork';
import { BodyState, constellationGeometry, deepSkyMarkers, limitingMagnitude, mulMatFast, namedStarList, SkyMoment, skyBrightness, StarField, starRadius } from './scene';
import { SKY_SHADER } from './skyShader';

export interface SkyResources {
  effect: SkRuntimeEffect;
  skyMap: SkImage;
  horizon: SkImage;
  sprite: SkImage;
  labelFont: SkFont;
  smallFont: SkFont;
  trackedFont: SkFont;
  artwork: OrionArtwork | null;
}

export interface SkyFrame {
  camera: Camera;
  moment: SkyMoment;
  field: StarField;
  layers: Layers;
  selection: string | null;
  /** Direction of the selected object, horizon frame. */
  selectionDir: Vec3 | null;
  /** Fewer stars while a finger is on the screen. */
  moving: boolean;
  /** AR draws over the camera, so the background is transparent. */
  overlayOnly: boolean;
  /** Reserved bottom band in points, kept clear of labels by the compass and controls. */
  bottomInset: number;
  topInset: number;
  showCompass: boolean;
  nightVision: boolean;
}

// Skia only exists once its runtime has loaded, so nothing is created at import time.
function makePaints() {
  const line = Skia.Paint();
  line.setStyle(PaintStyle.Stroke);
  line.setStrokeWidth(0.7);
  line.setAntiAlias(true);
  line.setColor(Skia.Color('rgba(186,204,244,0.2)'));
  const lineFocus = Skia.Paint();
  lineFocus.setStyle(PaintStyle.Stroke);
  lineFocus.setStrokeWidth(0.9);
  lineFocus.setAntiAlias(true);
  lineFocus.setColor(Skia.Color('rgba(224,232,255,0.82)'));
  const fill = Skia.Paint();
  fill.setAntiAlias(true);
  const text = Skia.Paint();
  text.setAntiAlias(true);
  const stroke = Skia.Paint();
  stroke.setStyle(PaintStyle.Stroke);
  stroke.setAntiAlias(true);
  return { line, lineFocus, fill, text, stroke, points: new Map<string, SkPaint>() };
}
let paints: ReturnType<typeof makePaints>;

function pointPaint(width: number, r: number, g: number, b: number, a: number): SkPaint {
  const key = `${width}|${r}|${g}|${b}|${a}`;
  let p = paints.points.get(key);
  if (!p) {
    p = Skia.Paint();
    p.setStyle(PaintStyle.Stroke);
    p.setStrokeWidth(width);
    p.setStrokeCap(StrokeCap.Round);
    p.setAntiAlias(true);
    p.setColor(Float32Array.of(r, g, b, a));
    paints.points.set(key, p);
  }
  return p;
}

// Column-major, as SkSL float3x3 uniforms expect.
const columns = (m: Mat3) => [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]];

function drawSkyPass(canvas: SkCanvas, f: SkyFrame, r: SkyResources, brightness: number, pass: 'sky' | 'ground') {
  const { camera, moment } = f;
  const orientationT = transpose(camera.orientation);
  const toJ2000 = mulMatFast(transpose(moment.matrix), orientationT);
  const uniforms = [
    camera.width, camera.height, cameraScale(camera), camera.projection === 'rectilinear' ? 1 : 0,
    ...columns(toJ2000), ...columns(orientationT),
    ...moment.sunDir, ...moment.moonDir,
    brightness, moment.moonFraction * Math.max(0, Math.min(1, (moment.moonDir[2] + 0.02) * 3)),
    f.layers.milkyWay ? 1.0 : 0.22, pass === 'ground' ? 1 : 0, f.overlayOnly ? 1 : 0, pass === 'ground' ? 1 : 0,
    r.skyMap.width(), r.skyMap.height(), r.horizon.width(), r.horizon.height(),
  ];
  const skyMap = r.skyMap.makeShaderOptions(TileMode.Repeat, TileMode.Clamp, FilterMode.Linear, MipmapMode.None);
  const horizon = r.horizon.makeShaderOptions(TileMode.Repeat, TileMode.Clamp, FilterMode.Linear, MipmapMode.None);
  const shader = r.effect.makeShaderWithChildren(uniforms, [skyMap, horizon]);
  const paint = Skia.Paint();
  paint.setShader(shader);
  canvas.drawRect(Skia.XYWHRect(0, 0, camera.width, camera.height), paint);
}

function drawSprite(canvas: SkCanvas, sprite: SkImage, x: number, y: number, radius: number, cr: number, cg: number, cb: number, alpha: number) {
  const paint = Skia.Paint();
  paint.setBlendMode(BlendMode.Plus);
  paint.setColorFilter(Skia.ColorFilter.MakeMatrix([cr, 0, 0, 0, 0, 0, cg, 0, 0, 0, 0, 0, cb, 0, 0, 0, 0, 0, alpha, 0]));
  canvas.drawImageRect(sprite, Skia.XYWHRect(0, 0, 64, 64), Skia.XYWHRect(x - radius, y - radius, radius * 2, radius * 2), paint);
}

function drawStars(canvas: SkCanvas, f: SkyFrame, r: SkyResources, brightness: number, projected: Float32Array, cam: Mat3) {
  const table = stars();
  const { camera, field } = f;
  const limit = limitingMagnitude(camera.fov, brightness) - (f.moving ? 0.5 : 0);
  const scale = cameraScale(camera);
  const stereo = camera.projection === 'stereographic';
  const w = camera.width, h = camera.height, margin = 8;
  // Buckets by size and colour, so thousands of stars are a handful of draw calls.
  const buckets = new Map<string, { paint: SkPaint; pts: SkPoint[] }>();
  const xyz = field.xyz;
  const [m0, m1, m2, m3, m4, m5, m6, m7, m8] = cam;
  const hazeFade = 1 - brightness;
  for (let i = 0; i < table.count; i++) {
    const mag = table.mag[i];
    if (mag > limit) break;
    const a = i * 3;
    const px = xyz[a], py = xyz[a + 1], pz = xyz[a + 2];
    const cz = m6 * px + m7 * py + m8 * pz;
    const k = stereo ? 1 - cz : -cz;
    if (k <= 1e-4) { projected[i * 2] = NaN; continue; }
    const s = scale / k;
    const x = w / 2 + (m0 * px + m1 * py + m2 * pz) * s;
    const y = h / 2 - (m3 * px + m4 * py + m5 * pz) * s;
    projected[i * 2] = x; projected[i * 2 + 1] = y;
    if (x < -margin || y < -margin || x > w + margin || y > h + margin) continue;

    const radius = starRadius(mag, limit);
    if (mag < 2.6) {
      const [cr, cg, cb] = starColor(table.bv[i]);
      const core = Math.max(1.3, radius * 1.1);
      drawSprite(canvas, r.sprite, x, y, core * 9, cr, cg, cb, 0.34 * hazeFade + 0.05);
      drawSprite(canvas, r.sprite, x, y, core * 2.8, Math.min(1, cr + 0.3), Math.min(1, cg + 0.3), Math.min(1, cb + 0.3), 1);
      continue;
    }
    const bv = table.bv[i];
    const tone = Number.isNaN(bv) ? 1 : bv < 0.1 ? 0 : bv < 0.8 ? 1 : 2;
    const size = Math.round(Math.min(3.2, radius * 2) * 3) / 3;
    const alpha = Math.round(Math.min(1, Math.max(0.05, (limit - mag + 0.25) / 1.3)) * 5) / 5;
    const key = `${size}|${tone}|${alpha}`;
    let b = buckets.get(key);
    if (!b) {
      const [cr, cg, cb] = tone === 0 ? [0.78, 0.86, 1] : tone === 1 ? [0.97, 0.96, 0.98] : [1, 0.86, 0.72];
      b = { paint: pointPaint(size, cr, cg, cb, alpha), pts: [] };
      buckets.set(key, b);
    }
    b.pts.push(vec(x, y));
  }
  buckets.forEach((b) => canvas.drawPoints(PointMode.Points, b.pts, b.paint));
}

function drawConstellations(canvas: SkCanvas, f: SkyFrame, cam: Mat3): { name: string; x: number; y: number; focus: number }[] {
  const { camera, field } = f;
  const table = stars();
  const scale = cameraScale(camera);
  const stereo = camera.projection === 'stereographic';
  const w = camera.width, h = camera.height;
  const xyz = field.xyz;
  const center = { x: w / 2, y: (h - f.bottomInset + f.topInset) / 2 };
  const toScreen = (i: number): [number, number] | null => {
    const a = i * 3;
    const v = mul(cam, [xyz[a], xyz[a + 1], xyz[a + 2]]);
    const k = stereo ? 1 - v[2] : -v[2];
    if (k <= 1e-3) return null;
    const s = scale / k;
    return [w / 2 + v[0] * s, h / 2 - v[1] * s];
  };
  const names: { name: string; x: number; y: number; focus: number }[] = [];
  const pathNormal = Skia.PathBuilder.Make();
  const pathFocus = Skia.PathBuilder.Make();
  for (const c of constellationGeometry()) {
    let sumX = 0, sumY = 0, n = 0;
    const segs: [number, number, number, number][] = [];
    for (const [a, b] of c.segments) {
      const p = toScreen(a), q = toScreen(b);
      if (!p || !q) continue;
      const out = (p[0] < -40 && q[0] < -40) || (p[0] > w + 40 && q[0] > w + 40) || (p[1] < -40 && q[1] < -40) || (p[1] > h + 40 && q[1] > h + 40);
      if (out || Math.hypot(p[0] - q[0], p[1] - q[1]) > 700) continue;
      segs.push([p[0], p[1], q[0], q[1]]);
      sumX += p[0] + q[0]; sumY += p[1] + q[1]; n += 2;
    }
    if (!segs.length) continue;
    const cx = sumX / n, cy = sumY / n;
    const inside = cx > 0 && cx < w && cy > 0 && cy < h;
    const dist = Math.hypot(cx - center.x, cy - center.y);
    const focus = inside && dist < Math.min(w, h) * 0.3;
    const path = focus ? pathFocus : pathNormal;
    for (const s of segs) { path.moveTo(s[0], s[1]); path.lineTo(s[2], s[3]); }
    if (inside) names.push({ name: c.name, x: cx, y: cy, focus: focus ? 1 : 0 });
  }
  canvas.drawPath(pathNormal.build(), paints.line);
  canvas.drawPath(pathFocus.build(), paints.lineFocus);
  return names.sort((a, b) => b.focus - a.focus);
}

function drawBody(canvas: SkCanvas, b: BodyState, x: number, y: number, r: SkyResources, ppd: number, brightness: number, towardSun: number) {
  const px = Math.max(b.id === 'moon' || b.id === 'sun' ? 7 : 2.4, (b.angularDiameter * ppd) / 2);
  const tint: Record<string, [number, number, number]> = {
    sun: [1, 0.86, 0.62], moon: [0.93, 0.92, 0.9], mercury: [0.85, 0.8, 0.74], venus: [1, 0.96, 0.84], mars: [1, 0.62, 0.42],
    jupiter: [0.98, 0.88, 0.72], saturn: [0.96, 0.85, 0.62], uranus: [0.7, 0.9, 0.92], neptune: [0.6, 0.72, 1],
  };
  const [cr, cg, cb] = tint[b.id];
  drawSprite(canvas, r.sprite, x, y, px * (b.id === 'sun' ? 7 : 5), cr, cg, cb, b.id === 'sun' ? 0.7 : 0.4 * (1 - brightness * 0.7));
  paints.fill.setColor(Float32Array.of(cr, cg, cb, 1));
  canvas.drawCircle(x, y, px, paints.fill);
  if (b.id === 'moon' && b.illuminated < 0.97) {
    // The unlit limb, turned so the lit side faces the real Sun: half a circle on the
    // far side, closed by half an ellipse through the poles of the terminator.
    const k = 2 * b.illuminated - 1;
    const dark = Skia.PathBuilder.Make();
    dark.moveTo(0, -px);
    for (let i = 1; i <= 24; i++) {
      const t = (i / 24) * Math.PI;
      dark.lineTo(-Math.sin(t) * px, -Math.cos(t) * px);
    }
    for (let i = 23; i >= 0; i--) {
      const t = (i / 24) * Math.PI;
      dark.lineTo(-Math.sin(t) * px * k, -Math.cos(t) * px);
    }
    dark.close();
    paints.fill.setColor(Float32Array.of(0.05, 0.06, 0.1, 0.9));
    canvas.save();
    canvas.translate(x, y);
    canvas.rotate(towardSun, 0, 0);
    canvas.drawPath(dark.build(), paints.fill);
    canvas.restore();
  }
}

interface Box { x: number; y: number; w: number; h: number }
const collides = (a: Box, list: Box[]) => list.some((b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y);

function place(placed: Box[], box: Box, bounds: { w: number; top: number; bottom: number }) {
  if (box.x < 6 || box.x + box.w > bounds.w - 6 || box.y < bounds.top || box.y + box.h > bounds.bottom) return false;
  if (collides(box, placed)) return false;
  placed.push(box);
  return true;
}

function drawText(canvas: SkCanvas, text: string, x: number, y: number, font: SkFont, r: number, g: number, b: number, a: number) {
  // A soft dark halo keeps labels legible over the Milky Way without a visible plate.
  paints.stroke.setStrokeWidth(2.4);
  paints.stroke.setColor(Float32Array.of(0.02, 0.03, 0.08, 0.45 * a));
  canvas.drawText(text, x, y, paints.stroke, font);
  paints.text.setColor(Float32Array.of(r, g, b, a));
  canvas.drawText(text, x, y, paints.text, font);
}

const spaced = (s: string) => s.toUpperCase().split('').join(' ');

function drawLabels(canvas: SkCanvas, f: SkyFrame, r: SkyResources, projected: Float32Array, names: { name: string; x: number; y: number; focus: number }[], brightness: number, _cam: Mat3) {
  const { camera, moment } = f;
  const aboveGround = (x: number, y: number) => !f.layers.ground || unproject(camera, x, y)[2] > 0.03;
  const bounds = { w: camera.width, top: f.topInset, bottom: camera.height - f.bottomInset };
  const placed: Box[] = [];
  // Solar system first, then the constellation, then named stars by brightness.
  for (const b of moment.bodies) {
    if (b.id === 'sun' || !f.layers.planets) continue;
    const p = project(camera, b.dir);
    if (!p || (f.layers.ground && b.dir[2] < 0.02)) continue;
    const w = r.labelFont.getTextWidth(b.name);
    const box = { x: p.x + 10, y: p.y - 7, w, h: 16 };
    if (place(placed, box, bounds)) drawText(canvas, b.name, box.x, p.y + 5, r.labelFont, 1, 0.9, 0.8, 0.95);
  }
  if (f.layers.constellations) {
    const fade = 1 - brightness;
    for (const n of names.filter((x) => x.focus > 0).slice(0, 2)) {
      const label = spaced(n.name);
      const w = r.trackedFont.getTextWidth(label);
      const box = { x: n.x - w / 2, y: n.y - 7, w, h: 14 };
      if (aboveGround(n.x, n.y) && place(placed, box, bounds)) drawText(canvas, label, box.x, n.y + 4, r.trackedFont, 0.86, 0.9, 1, 0.82 * fade);
    }
  }
  const limit = camera.fov > 30 ? 1.0 : camera.fov > 15 ? 2.6 : 4.2;
  for (const s of namedStarList()) {
    if (s.mag > limit) break;
    const x = projected[s.index * 2], y = projected[s.index * 2 + 1];
    if (Number.isNaN(x) || !aboveGround(x, y)) continue;
    const w = r.labelFont.getTextWidth(s.name);
    const left = x < camera.width / 2;
    const box = { x: left ? x - w - 11 : x + 11, y: y - 8, w, h: 16 };
    if (place(placed, box, bounds)) drawText(canvas, s.name, box.x, y + 4.5, r.labelFont, 1, 1, 1, 0.94 * (1 - brightness * 0.8));
  }
}

function drawDeepSky(canvas: SkCanvas, f: SkyFrame, r: SkyResources, brightness: number) {
  const { camera, moment } = f;
  if (camera.fov > 44 || brightness > 0.4 || f.overlayOnly) return;
  paints.stroke.setStrokeWidth(0.7);
  paints.stroke.setColor(Float32Array.of(0.96, 0.75, 0.62, 0.55));
  for (const d of deepSkyMarkers()) {
    if ((d.object.magnitude ?? 9) > (camera.fov > 30 ? 6 : 9)) continue;
    const p = project(camera, mul(moment.matrix, d.vec));
    if (!p || p.x < 0 || p.y < 0 || p.x > camera.width || p.y > camera.height) continue;
    canvas.drawCircle(p.x, p.y, 3.5, paints.stroke);
    if (camera.fov < 30) drawText(canvas, d.object.name, p.x + 7, p.y + 3.5, r.smallFont, 0.96, 0.8, 0.68, 0.85);
  }
}

function drawSelection(canvas: SkCanvas, f: SkyFrame) {
  if (!f.selectionDir) return;
  const p = project(f.camera, f.selectionDir);
  if (!p) return;
  paints.stroke.setStrokeWidth(1.1);
  paints.stroke.setColor(Float32Array.of(0.96, 0.7, 0.58, 0.95));
  const R = 15;
  // Four short ticks, not a closed ring, so the star itself stays clear.
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    canvas.drawLine(p.x + Math.cos(a) * R, p.y + Math.sin(a) * R, p.x + Math.cos(a) * (R + 6), p.y + Math.sin(a) * (R + 6), paints.stroke);
  }
}

/** Azimuth under each screen x along the fixed compass arc. */
function drawCompass(canvas: SkCanvas, f: SkyFrame, r: SkyResources) {
  const { camera } = f;
  const w = camera.width;
  const baseY = camera.height - f.bottomInset + 6;
  const radius = w * 1.42;
  const cx = w / 2, cy = baseY + radius;
  const center = vectorHorizontal(unproject(camera, camera.width / 2, camera.height / 2)).azimuth;
  paints.stroke.setStrokeWidth(0.8);
  paints.stroke.setColor(Float32Array.of(1, 1, 1, 0.42));
  const halfArc = 0.36;
  const arc = Skia.PathBuilder.Make();
  arc.addArc(Skia.XYWHRect(cx - radius, cy - radius, radius * 2, radius * 2), -90 - (halfArc * 180) / Math.PI, (2 * halfArc * 180) / Math.PI);
  canvas.drawPath(arc.build(), paints.stroke);
  const radPerDeg = 0.0086;
  const startDeg = Math.ceil((center - 45) / 3) * 3;
  for (let az = startDeg; az <= center + 45; az += 3) {
    const a = (az - center) * radPerDeg;
    if (Math.abs(a) > halfArc) continue;
    const major = az % 15 === 0;
    const len = major ? 9 : 4.5;
    const sx = cx + Math.sin(a) * radius, sy = cy - Math.cos(a) * radius;
    const ex = cx + Math.sin(a) * (radius - len), ey = cy - Math.cos(a) * (radius - len);
    paints.stroke.setStrokeWidth(0.8);
    paints.stroke.setColor(Float32Array.of(1, 1, 1, major ? 0.8 : 0.45));
    canvas.drawLine(sx, sy, ex, ey, paints.stroke);
    if (az % 15 === 0 && Math.abs(az - center) > 5) {
      const n = normalize360(az);
      const cardinal: Record<number, string> = { 0: 'N', 45: 'NE', 90: 'E', 135: 'SE', 180: 'S', 225: 'SW', 270: 'W', 315: 'NW' };
      const text = cardinal[n] ?? String(n);
      const tw = r.smallFont.getTextWidth(text);
      canvas.save();
      canvas.translate(cx + Math.sin(a) * (radius - 21), cy - Math.cos(a) * (radius - 21));
      canvas.rotate((a * 180) / Math.PI, 0, 0);
      paints.text.setColor(Float32Array.of(1, 1, 1, 0.74));
      canvas.drawText(text, -tw / 2, 4, paints.text, r.smallFont);
      canvas.restore();
    }
  }
  // The pointer and the heading under it.
  const pointer = Skia.PathBuilder.Make();
  pointer.moveTo(cx, baseY - 12); pointer.lineTo(cx + 7, baseY + 1); pointer.lineTo(cx - 7, baseY + 1); pointer.close();
  paints.fill.setColor(Float32Array.of(0.97, 0.66, 0.42, 1));
  canvas.drawPath(pointer.build(), paints.fill);
  const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const heading = cardinals[Math.round(center / 45) % 8];
  const hw = r.labelFont.getTextWidth(heading);
  paints.text.setColor(Float32Array.of(1, 1, 1, 1));
  canvas.drawText(heading, cx - hw / 2, baseY + 24, paints.text, r.labelFont);
}

export function renderFrame(f: SkyFrame, r: SkyResources): SkPicture {
  const { camera, moment } = f;
  paints ??= makePaints();
  return createPicture((canvas) => {
    const brightness = skyBrightness(moment.sunAltitude);
    const table = stars();
    const cam = mulMatFast(camera.orientation, moment.matrix);
    const projected = new Float32Array(table.count * 2).fill(NaN);

    canvas.save();
    canvas.clipRect(Skia.XYWHRect(0, 0, camera.width, camera.height), ClipOp.Intersect, false);
    drawSkyPass(canvas, f, r, brightness, 'sky');
    if (f.layers.artwork && r.artwork && f.layers.constellations && !f.overlayOnly && camera.fov > 25 && brightness < 0.5) {
      computeArtworkAnchors(canvas, r.artwork, camera, cam, f.field);
    }
    let names: { name: string; x: number; y: number; focus: number }[] = [];
    if (f.layers.constellations) names = drawConstellations(canvas, f, cam);
    drawStars(canvas, f, r, brightness, projected, cam);
    if (f.layers.deepSky) drawDeepSky(canvas, f, r, brightness);
    if (f.layers.planets) {
      for (const b of moment.bodies) {
        const p = project(camera, b.dir);
        if (!p || p.x < -40 || p.y < -40 || p.x > camera.width + 40 || p.y > camera.height + 40) continue;
        const sun = project(camera, moment.sunDir);
        const towardSun = sun ? (Math.atan2(sun.y - p.y, sun.x - p.x) * 180) / Math.PI : 0;
        drawBody(canvas, b, p.x, p.y, r, pointsPerDegree(camera), brightness, towardSun);
      }
    }
    if (f.layers.ground) drawSkyPass(canvas, f, r, brightness, 'ground');
    if (f.layers.labels) drawLabels(canvas, f, r, projected, names, brightness, cam);
    drawSelection(canvas, f);
    if (f.showCompass) drawCompass(canvas, f, r);
    if (f.nightVision) {
      const red = Skia.Paint();
      red.setBlendMode(BlendMode.Multiply);
      red.setColor(Skia.Color('rgb(255,28,18)'));
      canvas.drawRect(Skia.XYWHRect(0, 0, camera.width, camera.height), red);
    }
    canvas.restore();
  }, Skia.XYWHRect(0, 0, camera.width, camera.height));
}

export const makeEffect = () => {
  const effect = Skia.RuntimeEffect.Make(SKY_SHADER);
  if (!effect) throw new Error('Sky shader failed to compile');
  return effect;
};

