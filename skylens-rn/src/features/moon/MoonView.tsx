import { Canvas, createPicture, PaintStyle, Picture, SkCanvas, SkImage, SkPicture, Skia, useFont } from '@shopify/react-native-skia';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, LayoutChangeEvent, PixelRatio, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { dot, transpose, Vec3 } from '../../astronomy/core';
import { moonGeometry, surfacePoint } from '../../astronomy/moonGeometry';
import { blendCameras, CameraBasis, cameraBasis, orbitBy, OrbitCamera, projectPoint } from '../../astronomy/orbitCamera';
import { DEMO_MODE } from '../../state/demo';
import { getState, skyTime } from '../../state/store';
import { LabelCandidate, labelAt, placeLabels, PlacedLabel, PRIORITY } from '../sky/labels';
import { drawLabelText, makeEffects, MoonSlot, renderMoon, SolarResources } from '../solar/renderer';
import { onTexture, texture } from '../solar/textures';
import { earthViewCamera, featureAt, featureRing, MOON_KM, surfaceAt, visibleFeatures, WHOLE } from './atlas';
import { FeatureIndex, levelFor, LunarFeature, surfacePixelsPerDegree, TILE_GUTTER, TILE_SIZE, tileBounds, TileRef, tilesAround } from './moonData';
import { openTileStorage } from './moonStore';
import { TileCache } from './tileCache';

export interface MoonHandle {
  goTo: (lat: number, lon: number, diameterKm?: number) => void;
  earthView: () => void;
  zoomBy: (factor: number) => void;
}

interface Props {
  index: FeatureIndex | null;
  selected: LunarFeature | null;
  labels: boolean;
  fullLight: boolean;
  relief: boolean;
  elevation: boolean;
  handleRef: { current: MoonHandle | null };
  onSelect: (f: LunarFeature | null) => void;
  onView: (level: number) => void;
  topInset: number;
  bottomInset: number;
}

const blank = () => createPicture(() => {}, Skia.XYWHRect(0, 0, 1, 1));
const NEAR = 1.1, FAR = 12;

export function MoonView({ index, selected, labels, fullLight, relief, elevation, handleRef, onSelect, onView, topInset, bottomInset }: Props) {
  const font = useFont(require('../../../assets/sky/Inter-Medium.ttf'), 12.5);
  const smallFont = useFont(require('../../../assets/sky/Inter-Medium.ttf'), 11);
  const resources = useMemo<SolarResources | null>(() => (font && smallFont ? { ...makeEffects(), label: font, small: smallFont } : null), [font, smallFont]);
  const picture = useSharedValue<SkPicture>(blank());
  const size = useRef({ width: 0, height: 0 });
  const [, setLayout] = useState(0);
  const cam = useRef<OrbitCamera | null>(null);
  const flight = useRef<{ from: OrbitCamera; to: OrbitCamera; start: number } | null>(null);
  const glide = useRef<{ vx: number; vy: number; last: number } | null>(null);
  const pending = useRef<number | null>(null);
  const reduceMotion = useRef(false);
  const placed = useRef<PlacedLabel[]>([]);
  const level = useRef(0);
  const tiles = useRef<TileCache<SkImage> | null>(null);
  const latest = useRef({ index, selected, labels, fullLight, relief, elevation });
  latest.current = { index, selected, labels, fullLight, relief, elevation };

  useEffect(() => { AccessibilityInfo.isReduceMotionEnabled().then((v) => { reduceMotion.current = v; }).catch(() => {}); }, []);

  const pointsPerDegree = (c: OrbitCamera) => surfacePixelsPerDegree(c.distance, cameraBasis(c).focal);

  const fly = (to: OrbitCamera) => {
    glide.current = null;
    if (reduceMotion.current || DEMO_MODE || !cam.current) { cam.current = to; schedule(); return; }
    flight.current = { from: cam.current, to, start: Date.now() };
    schedule();
  };

  handleRef.current = {
    goTo: (lat, lon, diameterKm) => {
      const c = cam.current;
      if (!c) return;
      // Fit the feature, leaving room around it, and never closer than the map's detail allows.
      const span = diameterKm ? (diameterKm * 1.9) / MOON_KM : 1;
      const distance = Math.max(NEAR, Math.min(WHOLE, 1 + span / Math.tan((c.fov * Math.PI) / 360) / Math.min(1, c.width / c.height + 0.2)));
      fly({ ...c, target: [0, 0, 0], yaw: lon, pitch: lat, roll: 0, distance });
    },
    earthView: () => { if (cam.current) fly(earthViewCamera(new Date(skyTime()), cam.current)); },
    zoomBy: (factor) => { const c = cam.current; if (c) fly({ ...c, distance: limit(1 + (c.distance - 1) / factor) }); },
  };

  const overlay = (canvas: SkCanvas, b: CameraBasis, c: OrbitCamera, r: SolarResources) => {
    const { index: idx, selected: chosen, labels: named } = latest.current;
    const candidates: LabelCandidate[] = [];
    if (named && idx) {
      for (const v of visibleFeatures(idx.features, c, b)) {
        if (v.feature.id === chosen?.id) continue;
        const w = r.small.getTextWidth(v.feature.name), box = (x: number, y: number) => ({ x, y, w, h: 14 });
        candidates.push({ text: v.feature.name, style: 'deep', priority: PRIORITY.deep + Math.min(200, v.pixelDiameter / 4), id: v.feature.id, boxes: [box(v.x - w / 2, v.y - 7), box(v.x + 6, v.y - 7), box(v.x - w - 6, v.y - 7), box(v.x - w / 2, v.y + 6)] });
      }
    }
    if (chosen) {
      const ink = Skia.Paint();
      ink.setStyle(PaintStyle.Stroke);
      ink.setStrokeWidth(1.4);
      ink.setAntiAlias(true);
      ink.setColor(Float32Array.of(0.96, 0.7, 0.58, 0.95));
      const path = Skia.PathBuilder.Make();
      let drawing = false;
      for (const n of featureRing(chosen)) {
        const p = dot(b.eye, n) > 1 ? projectPoint(c, b, n) : null;
        if (!p) { drawing = false; continue; }
        if (drawing) path.lineTo(p.x, p.y); else path.moveTo(p.x, p.y);
        drawing = true;
      }
      canvas.drawPath(path.build(), ink);
      const n = surfacePoint(chosen.lat, chosen.lon);
      const p = dot(b.eye, n) > 1 ? projectPoint(c, b, n) : null;
      if (p) {
        const w = r.label.getTextWidth(chosen.name), reach = Math.max(10, ((chosen.diameter / MOON_KM) * p.scale) / 2);
        candidates.push({ text: chosen.name, style: 'selection', priority: PRIORITY.selection, id: chosen.id, boxes: [{ x: p.x - w / 2, y: p.y - reach - 20, w, h: 16 }, { x: p.x - w / 2, y: p.y + reach + 4, w, h: 16 }, { x: p.x - w / 2, y: p.y - 8, w, h: 16 }] });
      }
    }
    const result = placeLabels(candidates, { w: c.width, top: topInset, bottom: c.height - bottomInset }, 26);
    for (const { candidate: l, box } of result) {
      const on = l.style === 'selection';
      drawLabelText(canvas, l.text, box.x, box.y + (on ? 12 : 11), on ? r.label : r.small, on ? 1 : 0.9, on ? 0.84 : 0.92, on ? 0.72 : 0.97, on ? 1 : 0.88);
    }
    placed.current = result;
  };

  const slotsFor = (c: OrbitCamera): MoonSlot[] => {
    const cache = tiles.current;
    const wanted = levelFor(pointsPerDegree(c) * PixelRatio.get());
    level.current = wanted;
    if (!cache || wanted === 0) return [];
    const ready = (l: 1 | 2) => tilesAround(l, c.pitch, ((c.yaw + 540) % 360) - 180).map((t: TileRef) => ({ t, image: cache.get(t) })).filter((x) => x.image);
    // Coarse first, because later slots draw over earlier ones.
    const found = wanted === 2 ? [...ready(1), ...ready(2)] : ready(1);
    return found.slice(-4).map(({ t, image }) => ({ image: image!, bounds: tileBounds(t) }));
  };

  const draw = () => {
    pending.current = null;
    if (!resources || !size.current.width) return;
    if (!cam.current) cam.current = earthViewCamera(new Date(skyTime()), { target: [0, 0, 0], yaw: 0, pitch: 0, distance: WHOLE, roll: 0, fov: 40, width: size.current.width, height: size.current.height });
    const f = flight.current;
    if (f) {
      const t = Math.min(1, (Date.now() - f.start) / 1000 / 0.9);
      cam.current = blendCameras(f.from, f.to, t);
      if (t >= 1) { flight.current = null; cam.current = f.to; }
    }
    const g = glide.current;
    if (g && cam.current) {
      const now = Date.now(), dt = Math.min(0.05, (now - g.last) / 1000);
      g.last = now;
      cam.current = orbitBy(cam.current, g.vx * dt, g.vy * dt, 1 / pointsPerDegree(cam.current));
      const decay = Math.exp(-dt * 4.5);
      g.vx *= decay; g.vy *= decay;
      if (Math.hypot(g.vx, g.vy) < 12) glide.current = null;
    }
    const shiftTo = latest.current.selected ? Math.max(0, (bottomInset - topInset) / 2) : 0;
    const shift = cam.current!.shiftY ?? 0;
    const shiftNext = Math.abs(shiftTo - shift) < 0.5 || reduceMotion.current || DEMO_MODE ? shiftTo : shift + (shiftTo - shift) * 0.22;
    const c = { ...cam.current!, width: size.current.width, height: size.current.height, shiftY: shiftNext };
    cam.current = c;
    const date = new Date(skyTime());
    const moon = moonGeometry(date);
    const { fullLight: full, relief: shaded, elevation: heights } = latest.current;
    const slots = slotsFor(c);
    const before = level.current;
    const started = performance.now();
    picture.value = renderMoon({ camera: c, sun: moon.sun, toEquatorial: transpose(moon.frame), slots, tileSize: TILE_SIZE, tileGutter: TILE_GUTTER, fullLight: full, relief: shaded, elevation: heights }, resources, (canvas, b) => overlay(canvas, b, c, resources));
    onView(before);
    if (DEMO_MODE) {
      (globalThis as { __moonProbe?: unknown }).__moonProbe = {
        camera: () => cam.current, level: level.current, slots: slots.length, tilesLoaded: tiles.current?.loaded ?? 0, frameMs: performance.now() - started,
        labels: placed.current.map((p) => ({ id: p.candidate.id, text: p.candidate.text, x: p.box.x + p.box.w / 2, y: p.box.y + p.box.h / 2 })),
        point: (lat: number, lon: number) => { const c2 = cam.current!; const b = cameraBasis(c2); return projectPoint(c2, b, surfacePoint(lat, lon) as Vec3); },
      };
    }
    const clock = getState().clock;
    if (flight.current || glide.current || shiftNext !== shiftTo || (clock.anchorSky !== null && clock.rate !== 0)) schedule();
  };

  const latestDraw = useRef(draw);
  latestDraw.current = draw;
  const schedule = () => { if (pending.current === null) pending.current = requestAnimationFrame(() => latestDraw.current()); };

  useEffect(() => { schedule(); });
  useEffect(() => onTexture(() => schedule()), []);
  useEffect(() => {
    texture('moon'); texture('moon-relief'); texture('milkyway');
    let live = true;
    openTileStorage().then((storage) => {
      if (!live) { storage.close?.(); return; }
      const cache = new TileCache<SkImage>({
        read: storage.read,
        decode: (bytes) => Skia.Image.MakeImageFromEncoded(Skia.Data.fromBytes(bytes)),
        dispose: (image) => image.dispose?.(),
        onReady: () => schedule(),
      });
      tiles.current = cache;
      void cache.open().then(() => schedule());
    }).catch(() => {});
    const id = setInterval(() => schedule(), 60_000);
    return () => { live = false; clearInterval(id); tiles.current?.clear(); tiles.current = null; if (pending.current !== null) cancelAnimationFrame(pending.current); pending.current = null; };
  }, []);

  const start = useRef<OrbitCamera | null>(null);
  const limit = (d: number) => Math.max(NEAR, Math.min(FAR, d));
  const drag = Gesture.Pan().runOnJS(true).maxPointers(1).minDistance(3)
    .onStart(() => { flight.current = null; glide.current = null; start.current = cam.current; })
    .onUpdate((e) => { const c = start.current; if (c) { cam.current = { ...orbitBy(c, e.translationX, e.translationY, 1 / pointsPerDegree(c)), shiftY: cam.current?.shiftY }; schedule(); } })
    .onEnd((e) => { if (!reduceMotion.current && Math.hypot(e.velocityX, e.velocityY) > 140) glide.current = { vx: e.velocityX, vy: e.velocityY, last: Date.now() }; });
  const zoom = Gesture.Pinch().runOnJS(true)
    .onStart(() => { flight.current = null; glide.current = null; start.current = cam.current; })
    .onUpdate((e) => {
      const c = start.current;
      if (!c) return;
      // Height above the surface, so a pinch feels the same near the ground as far from it.
      cam.current = { ...cam.current!, distance: limit(1 + (c.distance - 1) / e.scale) };
      schedule();
    });
  const pickAt = (x: number, y: number) => {
    const c = cam.current, idx = latest.current.index;
    if (!c || !idx) return null;
    const label = labelAt(placed.current, x, y, 8);
    if (label?.candidate.id) return idx.byId.get(label.candidate.id) ?? null;
    const b = cameraBasis(c), at = surfaceAt(c, b, x, y);
    if (!at) return null;
    const kmPerPoint = ((Math.PI / 180) * MOON_KM) / pointsPerDegree(c);
    return featureAt(idx.features, at.lat, at.lon, kmPerPoint * 24, kmPerPoint * 18);
  };
  const tap = Gesture.Tap().runOnJS(true).maxDistance(10).onEnd((e, ok) => { if (ok) onSelect(pickAt(e.x, e.y)); });
  const doubleTap = Gesture.Tap().runOnJS(true).numberOfTaps(2).onEnd((e, ok) => {
    const c = cam.current;
    if (!ok || !c) return;
    const at = surfaceAt(c, cameraBasis(c), e.x, e.y);
    fly({ ...c, ...(at ? { yaw: at.lon, pitch: at.lat } : {}), roll: 0, distance: limit(1 + (c.distance - 1) / 2) });
  });
  const gestures = Gesture.Simultaneous(drag, zoom, Gesture.Exclusive(doubleTap, tap));

  const onLayout = (e: LayoutChangeEvent) => {
    size.current = { width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height };
    setLayout((n) => n + 1);
  };

  return (
    <View testID="moon-canvas" style={{ flex: 1, backgroundColor: '#03040A' }} onLayout={onLayout} accessible accessibilityRole="image" accessibilityLabel="The Moon. Drag to turn it, pinch to zoom, tap a feature to select it.">
      <GestureDetector gesture={gestures}>
        <Canvas style={{ flex: 1 }}><Picture picture={picture} /></Canvas>
      </GestureDetector>
    </View>
  );
}
