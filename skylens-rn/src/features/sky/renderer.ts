// Draws one sky frame into a Skia picture. Fixed layer order: background, artwork,
// lines, stars, planets, markers, labels, overlay. Runs on the JS thread and records a
// picture, so background, stars and labels can never tear apart from each other.
import {
  BlendMode, ClipOp, createPicture, FilterMode, MipmapMode, PaintStyle, PointMode, Skia, SkCanvas, SkFont, SkImage, SkPaint, SkPicture, SkPoint, SkRuntimeEffect, StrokeCap, TileMode, vec,
} from '@shopify/react-native-skia';
import { Camera, cameraScale, pointsPerDegree, project, unproject } from '../../astronomy/camera';
import { angleBetween, DEG, Mat3, mul, normalize360, transpose, vectorHorizontal, Vec3 } from '../../astronomy/core';
import { ObjectType, starColor, stars } from '../../data/catalog';
import { labelBudget, labelLimit, Layers, SkyMode, SkySettings } from '../../state/skyModes';
import { artworkFade, drawArtwork, ORION_BODY_HIP, OrionArtwork } from './artwork';
import { azAlt, boundaryPolygons, gridLabel, gridLines, gridStep, GridKind, gridToJ2000, lonLat } from './grids';
import { LabelBox, LabelCandidate, LabelStyle, placeLabels, PlacedLabel, PRIORITY } from './labels';
import { BodyState, chartStarList, constellationGeometry, eachStar, mulMatFast, namedStarList, SkyMoment, skyBrightness, SkyQuery, StarField, starRadius, viewHalfAngle, visibleDeepSky } from './scene';
import { SKY_SHADER } from './skyShader';

export interface SkyResources {
  effect: SkRuntimeEffect;
  skyMap: SkImage;
  horizon: SkImage;
  sprite: SkImage;
  labelFont: SkFont;
  smallFont: SkFont;
  trackedFont: SkFont;
  headingFont: SkFont;
  artwork: OrionArtwork | null;
}

/** What the mode asks of this frame. */
export interface FrameChart {
  mode: SkyMode;
  settings: SkySettings;
  /** The faintest star drawn. */
  limit: number;
  /** Cells in view, or null for the original full scan. */
  query: SkyQuery | null;
  /** The field of view and scale readout. */
  readout: boolean;
}

/** Filled in while a frame is drawn. */
export interface FrameResult { scanned: number; drawn: number; labels: PlacedLabel[] }

export const emptyResult = (): FrameResult => ({ scanned: 0, drawn: 0, labels: [] });

export interface SkyFrame {
  camera: Camera;
  chart: FrameChart;
  result: FrameResult;
  /** The selected object's name, kept on the sky however busy the view is. */
  selectionName: string | null;
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
  /** Seconds since the selection changed, for the target's settling ring. */
  selectionAge: number;
  /** Draws the labelled night preview in daylight. The clock and positions are untouched. */
  nightPreview: boolean;
  /** The framing landscape, a screen-anchored composition layer. Never the true horizon. */
  framing: boolean;
}

// Skia only exists once its runtime has loaded, so nothing is created at import time.
function makePaints() {
  const line = Skia.Paint();
  line.setStyle(PaintStyle.Stroke);
  line.setStrokeWidth(0.7);
  line.setAntiAlias(true);
  line.setColor(Skia.Color('rgba(186,204,244,0.17)'));
  const lineFocus = Skia.Paint();
  lineFocus.setStyle(PaintStyle.Stroke);
  lineFocus.setStrokeWidth(1.05);
  lineFocus.setAntiAlias(true);
  lineFocus.setColor(Skia.Color('rgba(232,238,255,0.88)'));
  const fill = Skia.Paint();
  fill.setAntiAlias(true);
  const text = Skia.Paint();
  text.setAntiAlias(true);
  const stroke = Skia.Paint();
  stroke.setStyle(PaintStyle.Stroke);
  stroke.setAntiAlias(true);
  const grid = Skia.Paint();
  grid.setStyle(PaintStyle.Stroke);
  grid.setStrokeWidth(0.6);
  grid.setAntiAlias(true);
  const dashed = Skia.Paint();
  dashed.setStyle(PaintStyle.Stroke);
  dashed.setStrokeWidth(0.7);
  dashed.setAntiAlias(true);
  dashed.setPathEffect(Skia.PathEffect.MakeDash([3, 3], 0));
  return { line, lineFocus, fill, text, stroke, grid, dashed, points: new Map<string, SkPaint>() };
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

/** Where the framing landscape's skyline sits: it drops away as the view tilts up. */
function framingLine(f: SkyFrame) {
  const { camera } = f;
  const heading = vectorHorizontal(unproject(camera, camera.width / 2, camera.height / 2));
  const y = camera.height - f.bottomInset + 18 + Math.max(0, heading.altitude - 52) * 9;
  return { y, azimuth: heading.azimuth, scale: 13.5, on: f.framing && y < camera.height + 90 };
}

/**
 * The all-sky map is far coarser than a tight view, and at that scale the traces of bright
 * stars left in it swell into soft blobs that look like nebulae. The chart lets it go before
 * that happens. Explore keeps it, so that sky stays exactly as it was.
 */
const mapFade = (f: SkyFrame) => (f.chart.mode === 'atlas' ? Math.min(1, Math.max(0, (f.camera.fov - 6) / 14)) : 1);

function drawSkyPass(canvas: SkCanvas, f: SkyFrame, r: SkyResources, brightness: number, pass: 'sky' | 'ground') {
  const { camera, moment } = f;
  const line = framingLine(f);
  const orientationT = transpose(camera.orientation);
  const toJ2000 = mulMatFast(transpose(moment.matrix), orientationT);
  const uniforms = [
    camera.width, camera.height, cameraScale(camera), camera.projection === 'rectilinear' ? 1 : 0,
    ...columns(toJ2000), ...columns(orientationT),
    ...moment.sunDir, ...moment.moonDir,
    brightness, moment.moonFraction * Math.max(0, Math.min(1, (moment.moonDir[2] + 0.02) * 3)),
    (f.layers.milkyWay ? 1.0 : 0.22) * mapFade(f), pass === 'ground' ? 1 : 0, f.overlayOnly ? 1 : 0, pass === 'ground' ? 1 : 0,
    r.skyMap.width(), r.skyMap.height(), r.horizon.width(), r.horizon.height(),
    line.on ? 1 : 0, line.y, line.scale, line.azimuth, f.layers.atmosphere || f.overlayOnly ? 1 : 0,
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
  paint.setColorFilter(Skia.ColorFilter.MakeBlend(Float32Array.of(cr, cg, cb, alpha), BlendMode.SrcIn));
  canvas.drawImageRect(sprite, Skia.XYWHRect(0, 0, 64, 64), Skia.XYWHRect(x - radius, y - radius, radius * 2, radius * 2), paint);
}

function drawStars(canvas: SkCanvas, f: SkyFrame, r: SkyResources, brightness: number, cam: Mat3) {
  const table = stars();
  const { camera, field, result } = f;
  const limit = f.chart.limit;
  const scale = cameraScale(camera);
  const stereo = camera.projection === 'stereographic';
  const w = camera.width, h = camera.height, margin = 8;
  // Buckets by size and colour, so thousands of stars are a handful of draw calls.
  const buckets = new Map<string, { paint: SkPaint; pts: SkPoint[] }>();
  const xyz = field.xyz;
  const [m0, m1, m2, m3, m4, m5, m6, m7, m8] = cam;
  const hazeFade = 1 - brightness;
  let drawn = 0;
  const point = (x: number, y: number, mag: number, bv: number) => {
    const radius = starRadius(mag, limit);
    const tone = Number.isNaN(bv) ? 1 : bv < 0.1 ? 0 : bv < 0.8 ? 1 : 2;
    const size = Math.round(Math.min(2.5, radius * 1.7) * 3) / 3;
    const alpha = Math.round(Math.min(1, Math.max(0.05, (limit - mag + 0.25) / 1.3)) * 5) / 5;
    const key = `${size}|${tone}|${alpha}`;
    let b = buckets.get(key);
    if (!b) {
      const [cr, cg, cb] = tone === 0 ? [0.68, 0.79, 1] : tone === 1 ? [0.93, 0.94, 1] : [1, 0.82, 0.66];
      b = { paint: pointPaint(size, cr, cg, cb, alpha), pts: [] };
      buckets.set(key, b);
    }
    b.pts.push(vec(x, y));
  };
  const visit = (i: number) => {
    const a = i * 3;
    const px = xyz[a], py = xyz[a + 1], pz = xyz[a + 2];
    const cz = m6 * px + m7 * py + m8 * pz;
    const k = stereo ? 1 - cz : -cz;
    if (k <= 1e-4) return;
    const s = scale / k;
    const x = w / 2 + (m0 * px + m1 * py + m2 * pz) * s;
    const y = h / 2 - (m3 * px + m4 * py + m5 * pz) * s;
    if (x < -margin || y < -margin || x > w + margin || y > h + margin) return;
    drawn++;
    const mag = table.mag[i];
    if (mag < 2.6) {
      const [pr, pg, pb] = starColor(table.bv[i]);
      // Catalog colour, richer for the eye: B-V tints are pale when drawn literally.
      const grey = (pr + pg + pb) / 3;
      const cr = Math.min(1, grey + (pr - grey) * 1.9), cg = Math.min(1, grey + (pg - grey) * 1.9), cb = Math.min(1, grey + (pb - grey) * 1.9);
      const bright = Math.min(1, (2.6 - mag) / 2.6);
      // The chart keeps bright stars crisp at any zoom. A wide glow on an empty field reads
      // as a nebula, and there is no nebula there.
      const chart = f.chart.mode === 'atlas';
      const core = Math.max(1.5, starRadius(mag, chart ? Math.min(limit, 7.5) : limit) * 1.15);
      // Additive layers: their peaks must sum near 1, or every bright star clips to white.
      if (!chart) drawSprite(canvas, r.sprite, x, y, core * (10 + bright * 10), cr, cg, cb, (0.2 + bright * 0.2) * hazeFade + 0.03);
      drawSprite(canvas, r.sprite, x, y, core * (chart ? 3 : 4 + bright * 3), cr, cg, cb, 0.2 * hazeFade + 0.06);
      // An opaque core, so the star keeps its catalog colour over the blue figure.
      paints.fill.setColor(Float32Array.of(cr, cg, cb, 1));
      canvas.drawCircle(x, y, core * 0.66, paints.fill);
      paints.fill.setColor(Float32Array.of(Math.min(1, cr + 0.42), Math.min(1, cg + 0.42), Math.min(1, cb + 0.42), 0.9));
      canvas.drawCircle(x, y, core * 0.34, paints.fill);
      return;
    }
    point(x, y, mag, table.bv[i]);
  };
  result.scanned = eachStar(f.chart.query, limit, visit);
  // Tiles from the deep pack: all fainter than the bundled stars, and sorted within a tile.
  for (const t of f.chart.query?.tiles ?? []) {
    const p = t.xyz;
    for (let i = 0; i < t.count; i++) {
      const mag = t.mag[i];
      if (mag > limit) break;
      result.scanned++;
      const a = i * 3;
      const cz = m6 * p[a] + m7 * p[a + 1] + m8 * p[a + 2];
      const k = stereo ? 1 - cz : -cz;
      if (k <= 1e-4) continue;
      const s = scale / k;
      const x = w / 2 + (m0 * p[a] + m1 * p[a + 1] + m2 * p[a + 2]) * s;
      const y = h / 2 - (m3 * p[a] + m4 * p[a + 1] + m5 * p[a + 2]) * s;
      if (x < -margin || y < -margin || x > w + margin || y > h + margin) continue;
      drawn++;
      point(x, y, mag, t.bv[i]);
    }
  }
  result.drawn = drawn;
  buckets.forEach((b) => canvas.drawPoints(PointMode.Points, b.pts, b.paint));
}

const GRID_TINT: Record<GridKind, [number, number, number]> = {
  equatorial: [0.56, 0.68, 0.96], horizontal: [0.96, 0.72, 0.58], ecliptic: [0.98, 0.86, 0.56], galactic: [0.88, 0.62, 0.84],
};

/** Draws one grid and offers a label for each line that crosses the view. */
function drawGrid(canvas: SkCanvas, f: SkyFrame, kind: GridKind, labels: LabelCandidate[]) {
  const { camera, moment } = f;
  const w = camera.width, h = camera.height;
  const horizontal = kind === 'horizontal';
  const toHorizon: Mat3 = horizontal ? [1, 0, 0, 0, 1, 0, 0, 0, 1] : mulMatFast(moment.matrix, gridToJ2000(kind));
  const center = mul(transpose(toHorizon), unproject(camera, w / 2, h / 2));
  const lon = horizontal ? vectorHorizontal(center).azimuth : Math.atan2(center[1], center[0]) / DEG;
  const lat = Math.asin(Math.min(1, Math.max(-1, center[2]))) / DEG;
  const half = viewHalfAngle(camera);
  const minor = Skia.PathBuilder.Make(), major = Skia.PathBuilder.Make();
  const bottom = h - f.bottomInset - 26, top = f.topInset + 4;
  for (const line of gridLines(lon, lat, half, gridStep(camera.fov))) {
    const path = line.major ? major : minor;
    let prev: { x: number; y: number } | null = null;
    let anchor: { x: number; y: number } | null = null;
    for (let i = 0; i < line.points.length; i += 2) {
      const dir = horizontal ? azAlt(line.points[i], line.points[i + 1]) : lonLat(line.points[i], line.points[i + 1]);
      const p = project(camera, mul(toHorizon, dir));
      if (!p) { prev = null; continue; }
      if (prev && Math.hypot(p.x - prev.x, p.y - prev.y) < Math.max(w, h) * 0.7) { path.moveTo(prev.x, prev.y); path.lineTo(p.x, p.y); }
      prev = p;
      // Meridians are named near the bottom of the view, parallels near its left edge.
      if (p.x > 8 && p.x < w - 40 && p.y > top && p.y < bottom) {
        if (!anchor || (line.axis === 'lon' ? p.y > anchor.y : p.x < anchor.x)) anchor = p;
      }
    }
    if (anchor) labels.push({ text: gridLabel(kind, line), style: 'grid', priority: PRIORITY.grid, boxes: [{ x: anchor.x + 3, y: anchor.y - 12, w: 34, h: 12 }] });
  }
  const [cr, cg, cb] = GRID_TINT[kind];
  paints.grid.setColor(Float32Array.of(cr, cg, cb, 0.26));
  canvas.drawPath(minor.build(), paints.grid);
  paints.grid.setColor(Float32Array.of(cr, cg, cb, 0.6));
  canvas.drawPath(major.build(), paints.grid);
}

function drawHorizonLine(canvas: SkCanvas, f: SkyFrame) {
  const path = Skia.PathBuilder.Make();
  let prev: { x: number; y: number } | null = null;
  for (let az = 0; az <= 360; az += 2) {
    const p = project(f.camera, azAlt(az, 0));
    if (p && prev && Math.hypot(p.x - prev.x, p.y - prev.y) < Math.max(f.camera.width, f.camera.height) * 0.7) { path.moveTo(prev.x, prev.y); path.lineTo(p.x, p.y); }
    prev = p;
  }
  paints.grid.setColor(Float32Array.of(0.96, 0.7, 0.58, 0.62));
  canvas.drawPath(path.build(), paints.grid);
}

function drawBoundaries(canvas: SkCanvas, f: SkyFrame) {
  const { camera, moment } = f;
  const forward = mul(transpose(moment.matrix), unproject(camera, camera.width / 2, camera.height / 2));
  const half = viewHalfAngle(camera);
  const path = Skia.PathBuilder.Make();
  const limit = Math.max(camera.width, camera.height) * 0.7;
  for (const poly of boundaryPolygons()) {
    if (angleBetween(forward, poly.center) > half + poly.radius) continue;
    let prev: { x: number; y: number } | null = null;
    for (let i = 0; i < poly.xyz.length; i += 3) {
      const p = project(camera, mul(moment.matrix, [poly.xyz[i], poly.xyz[i + 1], poly.xyz[i + 2]]));
      if (p && prev && Math.hypot(p.x - prev.x, p.y - prev.y) < limit) { path.moveTo(prev.x, prev.y); path.lineTo(p.x, p.y); }
      prev = p;
    }
  }
  paints.dashed.setColor(Float32Array.of(0.62, 0.72, 0.92, 0.34));
  canvas.drawPath(path.build(), paints.dashed);
}

let orionBody: Set<number> | null = null;

type ConstellationName = { id: string; name: string; x: number; y: number; focus: number; span: number };

function drawConstellations(canvas: SkCanvas, f: SkyFrame, cam: Mat3, artOn: boolean): ConstellationName[] {
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
  orionBody ??= new Set([...ORION_BODY_HIP].map((hip) => table.indexByHip.get(hip)!));
  const names: ConstellationName[] = [];
  const pathNormal = Skia.PathBuilder.Make();
  const pathFocus = Skia.PathBuilder.Make();
  for (const c of constellationGeometry()) {
    let sumX = 0, sumY = 0, n = 0;
    const segs: [number, number, number, number][] = [];
    for (const [a, b] of c.segments) {
      if (artOn && c.id === 'Ori' && !(orionBody.has(a) && orionBody.has(b))) continue;
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
    const focus = inside && dist < Math.min(w, h) * (f.overlayOnly ? 0.4 : 0.3);
    const path = focus ? pathFocus : pathNormal;
    for (const s of segs) { path.moveTo(s[0], s[1]); path.lineTo(s[2], s[3]); }
    const span = Math.max(...segs.map((s) => Math.max(s[0], s[2]))) - Math.min(...segs.map((s) => Math.min(s[0], s[2])));
    if (inside) names.push({ id: c.id, name: c.name, x: cx, y: cy, focus: focus ? 1 : 0, span });
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

const STYLE_TINT: Record<LabelStyle, [number, number, number, number]> = {
  selection: [1, 0.86, 0.74, 1], body: [1, 0.9, 0.8, 0.95], constellation: [0.88, 0.91, 1, 0.84], chartConstellation: [0.72, 0.8, 1, 0.68], star: [1, 1, 1, 0.96],
  chartStar: [0.9, 0.92, 1, 0.8], deep: [0.96, 0.8, 0.68, 0.85], grid: [0.72, 0.78, 0.9, 0.6],
};

function drawText(canvas: SkCanvas, text: string, x: number, y: number, font: SkFont, r: number, g: number, b: number, a: number) {
  // A soft dark halo keeps labels legible over the Milky Way without a visible plate.
  paints.stroke.setStrokeWidth(2.4);
  paints.stroke.setColor(Float32Array.of(0.02, 0.03, 0.08, 0.45 * a));
  canvas.drawText(text, x, y, paints.stroke, font);
  paints.text.setColor(Float32Array.of(r, g, b, a));
  canvas.drawText(text, x, y, paints.text, font);
}

const spaced = (s: string) => s.toUpperCase().split('').join('  ');

/** Three places around a point, for labels free to move out of each other's way. */
function around(x: number, y: number, w: number, h: number, gap: number): LabelBox[] {
  return [{ x: x + gap, y: y - h / 2, w, h }, { x: x - gap - w, y: y - h / 2, w, h }, { x: x - w / 2, y: y - gap - h, w, h }, { x: x - w / 2, y: y + gap, w, h }];
}

function collectLabels(f: SkyFrame, r: SkyResources, names: ConstellationName[], brightness: number, out: LabelCandidate[], cam: Mat3) {
  const { camera, moment, field } = f;
  const chart = f.chart.mode === 'atlas';
  const aboveGround = (x: number, y: number) => !f.layers.ground || unproject(camera, x, y)[2] > 0.03;
  const inView = (x: number, y: number) => x >= 0 && y >= 0 && x <= camera.width && y <= camera.height;

  if (f.selection && f.selectionName && f.selectionDir) {
    const p = project(camera, f.selectionDir);
    if (p && inView(p.x, p.y)) out.push({ text: f.selectionName, style: 'selection', priority: PRIORITY.selection, id: f.selection, boxes: around(p.x, p.y, r.labelFont.getTextWidth(f.selectionName), 16, 28) });
  }
  if (!f.layers.labels) return;
  // Solar system first, then the constellation, then named stars by brightness.
  for (const b of moment.bodies) {
    if (b.id === 'sun' || !f.layers.planets || `body:${b.id}` === f.selection) continue;
    const p = project(camera, b.dir);
    if (!p || (f.layers.ground && b.dir[2] < 0.02)) continue;
    const w = r.labelFont.getTextWidth(b.name);
    out.push({ text: b.name, style: 'body', priority: PRIORITY.body, id: `body:${b.id}`, boxes: [{ x: p.x + 10, y: p.y - 7, w, h: 16 }] });
  }
  if (f.layers.constellations) {
    const fade = 1 - brightness;
    if (fade > 0.02) {
      for (const n of chart ? names : names.filter((x) => x.focus > 0).slice(0, 2)) {
        const id = `con:${n.id}`;
        if (chart) {
          const text = n.name.toUpperCase();
          const w = r.smallFont.getTextWidth(text);
          if (aboveGround(n.x, n.y)) out.push({ text, style: 'chartConstellation', priority: PRIORITY.constellation, id, boxes: [{ x: n.x - w / 2, y: n.y - 7, w, h: 14 }] });
          continue;
        }
        const text = spaced(n.name);
        const w = r.trackedFont.getTextWidth(text);
        // Tucked against the left of the figure, so the name doesn't cross its lines.
        const left = Math.max(14, n.x - w - n.span * 0.2);
        const top = n.y + n.span * 0.22;
        if (aboveGround(n.x, top)) out.push({ text, style: 'constellation', priority: PRIORITY.constellation, id, boxes: [{ x: left, y: top, w, h: 14 }] });
      }
    }
  }
  if (!f.layers.stars) return;
  const cutoff = labelLimit(f.chart.mode, f.chart.settings.labelDensity, camera.fov);
  const scale = cameraScale(camera);
  const stereo = camera.projection === 'stereographic';
  const xyz = field.xyz;
  let rank = 0;
  for (const s of chart ? chartStarList() : namedStarList()) {
    if (s.mag > cutoff) break;
    if (s.mag > f.chart.limit || `star:${s.hip}` === f.selection) continue;
    const a = s.index * 3;
    const px = xyz[a], py = xyz[a + 1], pz = xyz[a + 2];
    const cz = cam[6] * px + cam[7] * py + cam[8] * pz;
    const k = stereo ? 1 - cz : -cz;
    if (k <= 1e-4) continue;
    const q = scale / k;
    const x = camera.width / 2 + (cam[0] * px + cam[1] * py + cam[2] * pz) * q;
    const y = camera.height / 2 - (cam[3] * px + cam[4] * py + cam[5] * pz) * q;
    if (!inView(x, y) || !aboveGround(x, y)) continue;
    const w = r.labelFont.getTextWidth(s.name);
    const left = x < camera.width / 2;
    // A name that would run off the screen goes to the star's other side.
    const flip = left ? x - w - 11 < 8 : x + 11 + w > camera.width - 8;
    const bx = left !== flip ? x - w - 11 : x + 11;
    // The brightest names ride a little above their star, as the design sets them.
    const by = s.mag < 0.6 && left ? y - 22 : y - 8;
    const first = { x: bx, y: by, w, h: 16 };
    out.push({ text: s.name, style: chart && !s.name.match(/^[A-Z]/) ? 'chartStar' : 'star', priority: PRIORITY.star - rank++ * 0.01, id: `star:${s.hip}`, boxes: chart ? [first, ...around(x, y, w, 16, 11)] : [first] });
  }
}

function drawPlacedLabels(canvas: SkCanvas, placed: PlacedLabel[], r: SkyResources, brightness: number) {
  for (const { candidate: c, box } of placed) {
    const [cr, cg, cb, ca] = STYLE_TINT[c.style];
    if (c.style === 'constellation') { drawText(canvas, c.text, box.x, box.y + 11, r.trackedFont, cr, cg, cb, ca * (1 - brightness)); continue; }
    if (c.style === 'chartConstellation' || c.style === 'grid' || c.style === 'deep') { drawText(canvas, c.text, box.x, box.y + 10.5, r.smallFont, cr, cg, cb, ca); continue; }
    const fade = c.style === 'star' || c.style === 'chartStar' ? 1 - brightness * 0.8 : 1;
    drawText(canvas, c.text, box.x, box.y + (c.style === 'body' ? 12 : 12.5), r.labelFont, cr, cg, cb, ca * fade);
  }
}

/** A catalog symbol for each kind of object. Nothing here pretends to be a photograph. */
function drawSymbol(canvas: SkCanvas, type: ObjectType, x: number, y: number) {
  const stroke = paints.stroke;
  stroke.setStrokeWidth(0.8);
  stroke.setColor(Float32Array.of(0.96, 0.75, 0.62, 0.72));
  paints.dashed.setColor(Float32Array.of(0.96, 0.75, 0.62, 0.72));
  if (type === 'galaxy') canvas.drawOval(Skia.XYWHRect(x - 6, y - 3, 12, 6), stroke);
  else if (type === 'openCluster' || type === 'starCloud' || type === 'asterism') canvas.drawCircle(x, y, 5, paints.dashed);
  else if (type === 'globularCluster') { canvas.drawCircle(x, y, 4.5, stroke); canvas.drawLine(x - 4.5, y, x + 4.5, y, stroke); canvas.drawLine(x, y - 4.5, x, y + 4.5, stroke); }
  else if (type === 'planetaryNebula') {
    canvas.drawCircle(x, y, 3, stroke);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) canvas.drawLine(x + dx * 3, y + dy * 3, x + dx * 6, y + dy * 6, stroke);
  } else if (type === 'clusterNebula') { canvas.drawRect(Skia.XYWHRect(x - 4, y - 4, 8, 8), stroke); canvas.drawCircle(x, y, 6.5, paints.dashed); }
  else if (type === 'nebula' || type === 'supernovaRemnant') canvas.drawRect(Skia.XYWHRect(x - 4, y - 4, 8, 8), stroke);
  else canvas.drawCircle(x, y, 3.5, stroke);
}

function drawDeepSky(canvas: SkCanvas, f: SkyFrame, r: SkyResources, brightness: number, labels: LabelCandidate[]) {
  const { camera, moment } = f;
  const chart = f.chart.mode === 'atlas';
  paints.stroke.setStrokeWidth(0.7);
  paints.stroke.setColor(Float32Array.of(0.96, 0.75, 0.62, 0.55));
  const ppd = pointsPerDegree(camera);
  const named = chart || camera.fov < 16;
  for (const d of visibleDeepSky(f.chart.mode, f.layers, camera.fov, brightness, f.overlayOnly)) {
    const p = project(camera, mul(moment.matrix, d.vec));
    if (!p || p.x < 0 || p.y < 0 || p.x > camera.width || p.y > camera.height) continue;
    if (chart) {
      drawSymbol(canvas, d.object.type, p.x, p.y);
      // The catalog's true size, once it is large enough to be more than the symbol. It has
      // no position angle, so this stays a circle rather than a guessed ellipse.
      const major = d.object.deepSky?.majorAxis ?? 0;
      const radius = ((major / 60) * ppd) / 2;
      if (radius > 9) { paints.stroke.setStrokeWidth(0.6); paints.stroke.setColor(Float32Array.of(0.96, 0.75, 0.62, 0.3)); canvas.drawCircle(p.x, p.y, radius, paints.stroke); }
    } else {
      paints.stroke.setStrokeWidth(0.7);
      paints.stroke.setColor(Float32Array.of(0.96, 0.75, 0.62, 0.55));
      canvas.drawCircle(p.x, p.y, 3.5, paints.stroke);
    }
    if (!named || !f.layers.labels || d.object.id === f.selection) continue;
    const text = d.object.deepSky?.messier ? `M${d.object.deepSky.messier}` : d.object.name;
    const label = chart ? text : d.object.name;
    const w = r.smallFont.getTextWidth(label);
    labels.push({ text: label, style: 'deep', priority: PRIORITY.deep - (d.object.magnitude ?? 12), id: d.object.id, boxes: chart ? around(p.x, p.y, w, 13, 9) : [{ x: p.x + 7, y: p.y - 8, w, h: 13 }] });
  }
}

export const SELECTION_SETTLE = 0.34;

/** Points from the middle of the view toward a target that has left the screen. */
function drawGuide(canvas: SkCanvas, f: SkyFrame, r: SkyResources, dir: Vec3) {
  const { camera } = f;
  const inCamera = mul(camera.orientation, dir);
  const angle = Math.atan2(inCamera[1], inCamera[0]);
  const cx = camera.width / 2, top = f.topInset + 12, bottom = camera.height - f.bottomInset - 12;
  const cy = (top + bottom) / 2;
  const dx = Math.cos(angle), dy = -Math.sin(angle);
  const reach = Math.min(dx ? (cx - 26) / Math.abs(dx) : Infinity, dy ? (bottom - top) / 2 / Math.abs(dy) - 6 : Infinity);
  const x = cx + dx * reach, y = cy + dy * reach;
  const arrow = Skia.PathBuilder.Make();
  const tip = 11, wing = 7;
  arrow.moveTo(x + dx * tip, y + dy * tip);
  arrow.lineTo(x - dy * wing, y + dx * wing);
  arrow.lineTo(x + dy * wing, y - dx * wing);
  arrow.close();
  paints.fill.setColor(Float32Array.of(0.98, 0.68, 0.44, 0.95));
  canvas.drawPath(arrow.build(), paints.fill);
  const away = `${Math.round(angleBetween(dir, unproject(camera, cx, camera.height / 2)))}°`;
  const w = r.smallFont.getTextWidth(away);
  drawText(canvas, away, Math.min(camera.width - w - 8, Math.max(8, x - dx * 24 - w / 2)), y - dy * 24 + 4, r.smallFont, 1, 0.86, 0.74, 1);
}

function drawSelection(canvas: SkCanvas, f: SkyFrame, r: SkyResources) {
  if (!f.selectionDir) return;
  const p = project(f.camera, f.selectionDir);
  const onScreen = p && p.x >= 0 && p.x <= f.camera.width && p.y >= f.topInset && p.y <= f.camera.height - f.bottomInset;
  if (!onScreen) { if (f.showCompass) drawGuide(canvas, f, r, f.selectionDir); return; }
  // A ring settles onto the target, then four copper ticks hold it. The star stays clear.
  const t = Math.min(1, f.selectionAge / SELECTION_SETTLE);
  const e = 1 - (1 - t) * (1 - t) * (1 - t);
  const R = 15 + (1 - e) * 20;
  drawSprite(canvas, r.sprite, p.x, p.y, 46, 0.97, 0.62, 0.38, 0.32 * e);
  paints.stroke.setStrokeWidth(1.25);
  if (t < 1) {
    paints.stroke.setColor(Float32Array.of(0.98, 0.68, 0.44, 0.7 * (1 - t)));
    canvas.drawCircle(p.x, p.y, R, paints.stroke);
  }
  paints.stroke.setColor(Float32Array.of(0.98, 0.68, 0.44, 0.95 * e + 0.05));
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    canvas.drawLine(p.x + Math.cos(a) * R, p.y + Math.sin(a) * R, p.x + Math.cos(a) * (R + 7), p.y + Math.sin(a) * (R + 7), paints.stroke);
  }
}

const CARDINALS: Record<number, string> = { 0: 'N', 45: 'NE', 90: 'E', 135: 'SE', 180: 'S', 225: 'SW', 270: 'W', 315: 'NW' };

/**
 * The dome the five controls sit under: a copper arc whose azimuth marks are read from
 * the real view, closed below by the dark panel. Azimuth runs along the arc at a fixed
 * pitch, so it reads like an instrument at any zoom.
 */
function drawCompass(canvas: SkCanvas, f: SkyFrame, r: SkyResources) {
  const { camera } = f;
  const w = camera.width, h = camera.height;
  const baseY = h - f.bottomInset + 6;
  const radius = w * 1.02;
  const cx = w / 2, cy = baseY + radius;
  const center = vectorHorizontal(unproject(camera, camera.width / 2, camera.height / 2)).azimuth;
  const halfArc = Math.asin(Math.min(0.98, (w / 2 + 6) / radius));
  const startAngle = -90 - (halfArc * 180) / Math.PI, sweep = (2 * halfArc * 180) / Math.PI;
  const box = Skia.XYWHRect(cx - radius, cy - radius, radius * 2, radius * 2);

  const dome = Skia.PathBuilder.Make();
  dome.addArc(box, startAngle, sweep);
  dome.lineTo(w + 8, h + 8);
  dome.lineTo(-8, h + 8);
  dome.close();
  const domePaint = Skia.Paint();
  domePaint.setShader(Skia.Shader.MakeLinearGradient(vec(0, baseY), vec(0, baseY + 92), [Skia.Color('rgba(9,11,20,0.95)'), Skia.Color('rgba(5,7,14,0.99)')], null, TileMode.Clamp));
  canvas.drawPath(dome.build(), domePaint);

  const arc = Skia.PathBuilder.Make();
  arc.addArc(box, startAngle, sweep);
  const arcPaint = Skia.Paint();
  arcPaint.setStyle(PaintStyle.Stroke);
  arcPaint.setStrokeWidth(1.1);
  arcPaint.setAntiAlias(true);
  arcPaint.setShader(Skia.Shader.MakeLinearGradient(vec(0, 0), vec(w, 0),
    [Skia.Color('rgba(226,153,125,0.34)'), Skia.Color('rgba(248,190,150,0.92)'), Skia.Color('rgba(226,153,125,0.34)')], [0, 0.5, 1], TileMode.Clamp));
  canvas.drawPath(arc.build(), arcPaint);

  const radPerDeg = 0.0122;
  const startDeg = Math.ceil((center - 60) / 3) * 3;
  for (let az = startDeg; az <= center + 60; az += 3) {
    const a = (az - center) * radPerDeg;
    if (Math.abs(a) > halfArc) continue;
    const major = ((az % 15) + 15) % 15 === 0;
    const len = major ? 9 : 4.5;
    const sx = cx + Math.sin(a) * radius, sy = cy - Math.cos(a) * radius;
    const ex = cx + Math.sin(a) * (radius - len), ey = cy - Math.cos(a) * (radius - len);
    paints.stroke.setStrokeWidth(0.8);
    paints.stroke.setColor(Float32Array.of(1, 0.93, 0.87, major ? 0.72 : 0.36));
    canvas.drawLine(sx, sy, ex, ey, paints.stroke);
    if (major && Math.abs(az - center) > 7) {
      const n = normalize360(az);
      const text = CARDINALS[n] ?? String(n);
      const tw = r.smallFont.getTextWidth(text);
      canvas.save();
      canvas.translate(cx + Math.sin(a) * (radius - 23), cy - Math.cos(a) * (radius - 23));
      canvas.rotate((a * 180) / Math.PI, 0, 0);
      paints.text.setColor(Float32Array.of(1, 0.96, 0.92, 0.76));
      canvas.drawText(text, -tw / 2, 4, paints.text, r.smallFont);
      canvas.restore();
    }
  }
  // The pointer and the heading under it.
  drawSprite(canvas, r.sprite, cx, baseY - 5, 30, 1, 0.56, 0.26, 0.55);
  const pointer = Skia.PathBuilder.Make();
  pointer.moveTo(cx, baseY - 15); pointer.lineTo(cx + 8.5, baseY + 1); pointer.lineTo(cx - 8.5, baseY + 1); pointer.close();
  paints.fill.setColor(Float32Array.of(0.98, 0.66, 0.38, 1));
  canvas.drawPath(pointer.build(), paints.fill);
  const names = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const heading = names[Math.round(center / 45) % 8];
  const hw = r.headingFont.getTextWidth(heading);
  paints.text.setColor(Float32Array.of(1, 1, 1, 1));
  canvas.drawText(heading, cx - hw / 2, baseY + 31, paints.text, r.headingFont);
}

/** Field of view, star limit and an angular scale, for the technical chart. */
function drawReadout(canvas: SkCanvas, f: SkyFrame, r: SkyResources) {
  const { camera } = f;
  const y = camera.height - f.bottomInset - 12;
  const fov = camera.fov < 10 ? camera.fov.toFixed(1) : String(Math.round(camera.fov));
  drawText(canvas, `FOV ${fov}°   V ≤ ${f.chart.limit.toFixed(1)}   J2000`, 18, y, r.smallFont, 0.82, 0.86, 0.96, 0.82);
  const ppd = pointsPerDegree(camera);
  const degrees = [30, 20, 10, 5, 2, 1, 0.5, 0.25].find((d) => d * ppd <= 84 && d * ppd >= 28) ?? 1 / 6;
  const length = degrees * ppd;
  const right = camera.width - 18;
  paints.stroke.setStrokeWidth(0.9);
  paints.stroke.setColor(Float32Array.of(0.82, 0.86, 0.96, 0.82));
  canvas.drawLine(right - length, y - 3, right, y - 3, paints.stroke);
  canvas.drawLine(right - length, y - 6, right - length, y, paints.stroke);
  canvas.drawLine(right, y - 6, right, y, paints.stroke);
  const text = degrees >= 1 ? `${degrees}°` : `${Math.round(degrees * 60)}′`;
  drawText(canvas, text, right - length / 2 - r.smallFont.getTextWidth(text) / 2, y - 9, r.smallFont, 0.82, 0.86, 0.96, 0.82);
}

/** 0 full night, 1 full daylight, as this frame shows it. */
export const frameBrightness = (sunAltitude: number, layers: Layers, nightPreview: boolean, overlayOnly: boolean) =>
  nightPreview || (!layers.atmosphere && !overlayOnly) ? 0 : skyBrightness(sunAltitude);

export function renderFrame(f: SkyFrame, r: SkyResources): SkPicture {
  const { camera, moment } = f;
  paints ??= makePaints();
  return createPicture((canvas) => {
    const brightness = frameBrightness(moment.sunAltitude, f.layers, f.nightPreview, f.overlayOnly);
    const cam = mulMatFast(camera.orientation, moment.matrix);
    const candidates: LabelCandidate[] = [];

    canvas.save();
    canvas.clipRect(Skia.XYWHRect(0, 0, camera.width, camera.height), ClipOp.Intersect, false);
    drawSkyPass(canvas, f, r, brightness, 'sky');
    const artStrength = f.layers.artwork && r.artwork && f.layers.constellations && !f.overlayOnly && brightness < 0.5 ? artworkFade(camera.fov) : 0;
    if (artStrength > 0) drawArtwork(canvas, r.artwork!, camera, cam, f.field, artStrength);
    let names: ConstellationName[] = [];
    // The figures stay available by day, but recede: the stars they join are not visible.
    paints.lineFocus.setAlphaf(0.88 * (1 - 0.72 * brightness));
    paints.line.setAlphaf(0.17 * (1 - 0.5 * brightness));
    if (!f.overlayOnly) {
      if (f.layers.gridEquatorial) drawGrid(canvas, f, 'equatorial', candidates);
      if (f.layers.gridHorizontal) drawGrid(canvas, f, 'horizontal', candidates);
      if (f.layers.gridEcliptic) drawGrid(canvas, f, 'ecliptic', candidates);
      if (f.layers.gridGalactic) drawGrid(canvas, f, 'galactic', candidates);
      if (f.layers.boundaries) drawBoundaries(canvas, f);
      if (!f.layers.ground && f.showCompass) drawHorizonLine(canvas, f);
    }
    if (f.layers.constellations) names = drawConstellations(canvas, f, cam, artStrength > 0);
    if (f.layers.stars) drawStars(canvas, f, r, brightness, cam);
    if (f.layers.deepSky) drawDeepSky(canvas, f, r, brightness, candidates);
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
    collectLabels(f, r, names, brightness, candidates, cam);
    const bounds = { w: camera.width, top: f.topInset, bottom: camera.height - f.bottomInset - (f.chart.readout ? 30 : 0) };
    f.result.labels = placeLabels(candidates, bounds, labelBudget(f.chart.settings.labelDensity));
    drawPlacedLabels(canvas, f.result.labels, r, brightness);
    drawSelection(canvas, f, r);
    if (f.showCompass) drawCompass(canvas, f, r);
    if (f.chart.readout) drawReadout(canvas, f, r);
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

