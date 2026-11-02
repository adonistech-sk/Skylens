import { Canvas, createPicture, Picture, SkPicture, Skia, useFont } from '@shopify/react-native-skia';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, LayoutChangeEvent, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { Vec3 } from '../../astronomy/core';
import { blendCameras, cameraBasis, clampPitch, orbitBy, OrbitCamera, projectPoint } from '../../astronomy/orbitCamera';
import { GlobeId, ScaleMode } from '../../astronomy/solar';
import { DEMO_MODE } from '../../state/demo';
import { getState, skyTime } from '../../state/store';
import { labelAt } from '../sky/labels';
import { makeEffects, renderSolar, SolarResources, SolarResult } from './renderer';
import { FOCUS_DISTANCE, Globe, localOrbits, localReach, localScene, overviewCamera, pickGlobe, sunlitView, systemOf, systemScene } from './scene';
import { onTexture, texture } from './textures';

export interface SolarHandle {
  focus: (id: GlobeId) => void;
  overview: () => void;
}

interface Props {
  mode: ScaleMode;
  orbits: boolean;
  labels: boolean;
  /** Opens on this body rather than the whole system. */
  initialFocus?: GlobeId;
  handleRef: { current: SolarHandle | null };
  onFocus: (id: GlobeId | null) => void;
  onSelect: (id: GlobeId | null) => void;
  selected: GlobeId | null;
  topInset: number;
  bottomInset: number;
}

type Scene = { kind: 'system' } | { kind: 'local'; focus: GlobeId };

/** `track` follows a body that keeps moving while the clock runs during the flight. */
interface Flight { from: OrbitCamera; to: OrbitCamera; start: number; duration: number; track?: GlobeId; then?: () => void }

const blank = () => createPicture(() => {}, Skia.XYWHRect(0, 0, 1, 1));

export function SolarView({ mode, orbits, labels, initialFocus, handleRef, onFocus, onSelect, selected, topInset, bottomInset }: Props) {
  const font = useFont(require('../../../assets/sky/Inter-Medium.ttf'), 13.5);
  const smallFont = useFont(require('../../../assets/sky/Inter-Medium.ttf'), 11);
  const resources = useMemo<SolarResources | null>(() => (font && smallFont ? { ...makeEffects(), label: font, small: smallFont } : null), [font, smallFont]);
  const picture = useSharedValue<SkPicture>(blank());
  const size = useRef({ width: 0, height: 0 });
  const [, setLayout] = useState(0);
  const scene = useRef<Scene>({ kind: 'system' });
  const cam = useRef<OrbitCamera | null>(null);
  const flight = useRef<Flight | null>(null);
  const glide = useRef<{ vx: number; vy: number; last: number } | null>(null);
  const pending = useRef<number | null>(null);
  const reduceMotion = useRef(false);
  const globes = useRef<Globe[]>([]);
  const result = useRef<SolarResult>({ drawn: 0, labels: [] });
  const latest = useRef({ mode, orbits, labels, selected });
  latest.current = { mode, orbits, labels, selected };

  useEffect(() => { AccessibilityInfo.isReduceMotionEnabled().then((v) => { reduceMotion.current = v; }).catch(() => {}); }, []);

  const build = (date: Date) => {
    const s = scene.current;
    return s.kind === 'system' ? systemScene(date, latest.current.mode) : localScene(s.focus, date);
  };

  const fly = (to: OrbitCamera, then?: () => void, track?: GlobeId, seconds = 0.9) => {
    if (reduceMotion.current || DEMO_MODE || !cam.current) { cam.current = to; then?.(); schedule(); return; }
    flight.current = { from: cam.current, to, start: Date.now(), duration: seconds, track, then };
    schedule();
  };

  const enterLocal = (id: GlobeId) => {
    scene.current = { kind: 'local', focus: id };
    if (cam.current) cam.current = { ...cam.current, target: [0, 0, 0], distance: FOCUS_DISTANCE };
    onFocus(id);
    schedule();
  };

  const focus = (id: GlobeId) => {
    const c = cam.current;
    if (!c) return;
    glide.current = null;
    const date = new Date(skyTime());
    const s = scene.current;
    if (s.kind === 'local' && systemOf(s.focus) === systemOf(id)) {
      if (s.focus === id) { fly({ ...c, target: [0, 0, 0], distance: FOCUS_DISTANCE }); return; }
      const g = localScene(s.focus, date).find((x) => x.id === id);
      if (!g) return;
      fly({ ...c, ...sunlitView(g.sun, c.yaw, c.pitch), target: g.position, distance: g.radius * FOCUS_DISTANCE }, () => enterLocal(id));
      return;
    }
    const home = systemOf(id);
    if (s.kind === 'local') scene.current = { kind: 'system' };
    if (s.kind === 'local' && cam.current) cam.current = overviewCamera(latest.current.mode, c.width, c.height);
    const g = systemScene(date, latest.current.mode).find((x) => x.id === home)!;
    fly({ ...cam.current!, ...sunlitView(g.sun, c.yaw, c.pitch), target: g.position, distance: g.radius * FOCUS_DISTANCE }, () => {
      enterLocal(home);
      if (id !== home) focus(id);
    }, home);
  };

  const overview = () => {
    const c = cam.current;
    if (!c) return;
    const s = scene.current;
    const home = overviewCamera(latest.current.mode, c.width, c.height);
    if (s.kind === 'local') {
      const g = systemScene(new Date(skyTime()), latest.current.mode).find((x) => x.id === systemOf(s.focus))!;
      scene.current = { kind: 'system' };
      cam.current = { ...c, target: g.position, distance: g.radius * Math.min(c.distance, 40) };
      onFocus(null);
    }
    fly(home);
  };

  handleRef.current = { focus, overview };

  const draw = () => {
    pending.current = null;
    if (!resources || !size.current.width) return;
    if (!cam.current) {
      cam.current = overviewCamera(latest.current.mode, size.current.width, size.current.height);
      if (initialFocus) {
        const home = systemOf(initialFocus);
        scene.current = { kind: 'local', focus: home };
        const body = localScene(home, new Date(skyTime())).find((x) => x.id === home)!;
        cam.current = { ...cam.current, ...sunlitView(body.sun, cam.current.yaw, cam.current.pitch), distance: FOCUS_DISTANCE };
        onFocus(home);
        if (initialFocus !== home) enterLocal(initialFocus);
      }
    }
    const f = flight.current;
    if (f) {
      const t = Math.min(1, (Date.now() - f.start) / 1000 / f.duration);
      if (f.track) { const g = build(new Date(skyTime())).find((x) => x.id === f.track); if (g) f.to = { ...f.to, target: g.position }; }
      cam.current = blendCameras(f.from, f.to, t);
      if (t >= 1) { flight.current = null; cam.current = f.to; f.then?.(); }
    }
    const g = glide.current;
    if (g && cam.current) {
      const now = Date.now(), dt = Math.min(0.05, (now - g.last) / 1000);
      g.last = now;
      cam.current = orbitBy(cam.current, g.vx * dt, g.vy * dt, DEGREES_PER_POINT);
      const decay = Math.exp(-dt * 4.5);
      g.vx *= decay; g.vy *= decay;
      if (Math.hypot(g.vx, g.vy) < 12) glide.current = null;
    }
    const date = new Date(skyTime());
    // The picture slides up to clear whatever card sits below it.
    const shiftTo = scene.current.kind === 'local' ? Math.max(0, (bottomInset - topInset) / 2) : 0;
    const shift = cam.current!.shiftY ?? 0;
    const shiftNext = Math.abs(shiftTo - shift) < 0.5 || reduceMotion.current || DEMO_MODE ? shiftTo : shift + (shiftTo - shift) * 0.22;
    const c = { ...cam.current!, width: size.current.width, height: size.current.height, shiftY: shiftNext };
    cam.current = c;
    const list = build(date);
    globes.current = list;
    const res: SolarResult = { drawn: 0, labels: [] };
    const started = performance.now();
    picture.value = renderSolar({ camera: c, globes: list, date, mode: latest.current.mode, scene: scene.current.kind, selected: latest.current.selected, orbits: latest.current.orbits, moonOrbits: scene.current.kind === 'local' ? localOrbits(scene.current.focus, date).filter((o) => o.id !== (scene.current as { focus: GlobeId }).focus) : [], labels: latest.current.labels, topEdge: topInset, bottomEdge: size.current.height - bottomInset }, resources, res);
    result.current = res;
    if (DEMO_MODE) {
      (globalThis as { __solarProbe?: unknown }).__solarProbe = {
        camera: () => cam.current, scene: () => scene.current, clock: () => getState().clock, lastTap: () => lastTap.current, frameMs: performance.now() - started, drawn: res.drawn, labels: res.labels.length,
        point: (id: GlobeId) => { const b = globes.current.find((x) => x.id === id); return b && cam.current ? projectPoint(cam.current, cameraBasis(cam.current), b.position) : null; },
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
    // The live clock moves too slowly to need more than this.
    const id = setInterval(() => schedule(), 1000);
    return () => { clearInterval(id); if (pending.current !== null) cancelAnimationFrame(pending.current); pending.current = null; };
  }, []);
  // Ask early, so the backdrop and small maps are ready when the first frame draws.
  useEffect(() => { texture('milkyway'); }, []);

  // A new scale needs a new overview. A local view is true to scale in either mode.
  const firstMode = useRef(true);
  useEffect(() => {
    if (firstMode.current) { firstMode.current = false; return; }
    if (scene.current.kind === 'system' && cam.current) fly({ ...overviewCamera(mode, cam.current.width, cam.current.height), yaw: cam.current.yaw, pitch: cam.current.pitch });
  }, [mode]);

  const start = useRef<OrbitCamera | null>(null);
  const lastTap = useRef<[number, number] | null>(null);
  const orbit = Gesture.Pan().runOnJS(true).maxPointers(1).minDistance(3)
    .onStart(() => { flight.current = null; glide.current = null; start.current = cam.current; })
    .onUpdate((e) => { if (start.current) { cam.current = orbitBy(start.current, e.translationX, e.translationY, DEGREES_PER_POINT); schedule(); } })
    .onEnd((e) => { if (!reduceMotion.current && Math.hypot(e.velocityX, e.velocityY) > 140) glide.current = { vx: e.velocityX, vy: e.velocityY, last: Date.now() }; });
  const shift = Gesture.Pan().runOnJS(true).minPointers(2).maxPointers(2)
    .onStart(() => { flight.current = null; start.current = cam.current; })
    .onUpdate((e) => {
      const c = start.current;
      if (!c) return;
      const b = cameraBasis(c), perPoint = c.distance / b.focal;
      const move = (axis: Vec3, by: number) => [axis[0] * by, axis[1] * by, axis[2] * by];
      const r = move(b.right, -e.translationX * perPoint), u = move(b.up, e.translationY * perPoint);
      cam.current = { ...c, target: [c.target[0] + r[0] + u[0], c.target[1] + r[1] + u[1], c.target[2] + r[2] + u[2]] };
      schedule();
    });
  const zoom = Gesture.Pinch().runOnJS(true)
    .onStart(() => { flight.current = null; glide.current = null; start.current = cam.current; })
    .onUpdate((e) => {
      const c = start.current;
      if (!c) return;
      const s = scene.current;
      const near = s.kind === 'local' ? 1.25 : 0.3, far = s.kind === 'local' ? localReach(s.focus, new Date(skyTime())) * 1.4 : latest.current.mode === 'true' ? 260 : 44;
      cam.current = { ...cam.current!, distance: Math.max(near, Math.min(far, c.distance / e.scale)) };
      schedule();
    })
    .onEnd(() => {
      // Pulling all the way out of a planet's own system returns to the whole Solar System.
      const s = scene.current;
      if (s.kind === 'local' && cam.current && cam.current.distance >= localReach(s.focus, new Date(skyTime())) * 1.35) overview();
    });
  const pickAt = (x: number, y: number) => {
    const c = cam.current;
    if (!c) return null;
    // A disc the finger is really on beats a neighbour's label lying across it.
    const b = cameraBasis(c);
    const label = labelAt(result.current.labels, x, y, 8);
    return pickGlobe(globes.current, c, b, x, y, 0) ?? (label?.candidate.id as GlobeId | undefined) ?? pickGlobe(globes.current, c, b, x, y);
  };
  const tap = Gesture.Tap().runOnJS(true).maxDistance(10).onEnd((e, ok) => { if (!ok) return; lastTap.current = [e.x, e.y]; onSelect(pickAt(e.x, e.y)); });
  const doubleTap = Gesture.Tap().runOnJS(true).numberOfTaps(2).onEnd((e, ok) => {
    if (!ok) return;
    const id = pickAt(e.x, e.y);
    if (id) focus(id);
  });
  const gestures = Gesture.Simultaneous(orbit, shift, zoom, Gesture.Exclusive(doubleTap, tap));

  const onLayout = (e: LayoutChangeEvent) => {
    size.current = { width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height };
    setLayout((n) => n + 1);
  };

  return (
    <View testID="solar-canvas" style={{ flex: 1, backgroundColor: '#03040A' }} onLayout={onLayout} accessible accessibilityRole="image" accessibilityLabel="The Solar System. Drag to turn the view, pinch to zoom, tap a planet to select it.">
      <GestureDetector gesture={gestures}>
        <Canvas style={{ flex: 1 }}><Picture picture={picture} /></Canvas>
      </GestureDetector>
    </View>
  );
}

const DEGREES_PER_POINT = 0.32;

export const cameraPitchForTest = clampPitch;
