import { Canvas, createPicture, Group, Picture, SkPicture, Skia, useFont, useImage } from '@shopify/react-native-skia';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, LayoutChangeEvent, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import { angleBetween, Horizontal, Mat3, vectorHorizontal, Vec3 } from '../../astronomy/core';
import { anchorView, Camera, dragView, flight, flightDuration, focusView, FOV_RANGE, framingFov, lowestView, orientationFor, pointsPerDegree, project, Projection, unproject, ViewState } from '../../astronomy/camera';
import { directionOf } from '../../astronomy/locator';
import { directionAt, object, stars } from '../../data/catalog';
import { placeTile, StarTile } from '../../data/catalogs/deepPack';
import { deepPack, onDeepPackChange } from '../../data/catalogs/runtime';
import { DEEP_PACK } from '../../data/generated/deepPack';
import { DEMO_MODE } from '../../state/demo';
import { BUNDLED_LIMIT, Layers, MODE_DEFAULTS, SkyMode, starLimit } from '../../state/skyModes';
import { getState, select, skyTime, useObserver, useStore } from '../../state/store';
import { now, recordFrame } from './perf';
import { emptyResult, frameBrightness, makeEffect, renderFrame, SELECTION_SETTLE, SkyResources } from './renderer';
import { buildStarField, computeMoment, constellationSpan, hitCandidates, HitContext, hitTest, newCellBuffer, querySky, SkyMoment, StarField, yearsSinceJ2000 } from './scene';

export interface SkyHandle {
  /** The object nearest the centre of the view. */
  identifyCentre: () => string | null;
  view: () => ViewState;
  /** Where the screen's centre points, which under the compass is not the stored view. */
  centre: () => Horizontal | null;
  /** The last drawn frame, for anything that must agree with what is on screen. */
  frame: () => HitContext | null;
  /** Centres the view on a screen point. */
  centreOn: (x: number, y: number) => void;
}

export interface SkyPoint {
  x: number;
  y: number;
  /** Objects near the finger, best first. */
  hits: string[];
  direction: Vec3;
}

/** The map's view survives leaving the screen, so coming back returns to the same sky. */
let rememberedView: ViewState | null = null;

interface Props {
  /** When set, the sky follows this rotation instead of touch. Horizon → camera. */
  orientationRef?: { current: Mat3 | null };
  projection?: Projection;
  /** Fixed field of view for AR, from the camera lens. */
  fixedFov?: number;
  overlayOnly?: boolean;
  showCompass?: boolean;
  bottomInset?: number;
  topInset?: number;
  initial?: Partial<ViewState>;
  interactive?: boolean;
  onTapObject?: (id: string | null) => void;
  onLongPress?: (point: SkyPoint) => void;
  /** Keep this view across visits. Only the main map does. */
  rememberView?: boolean;
  handleRef?: { current: SkyHandle | null };
  /** Draw no horizon, as on a detail page or over a camera. */
  hideGround?: boolean;
  /** Centre this object and keep it there. */
  focusId?: string;
  onViewChange?: (v: ViewState) => void;
}

/** Milliseconds a finger rests before a press becomes a long press. */
const LONG_PRESS = 450;

/** The loaded textures, reused to composite AR photos off-screen. */
export const sharedResources: { current: SkyResources | null } = { current: null };

export function SkyView({
  orientationRef, projection = 'stereographic', fixedFov, overlayOnly = false, showCompass = true, bottomInset = 0, topInset = 0,
  initial, interactive = true, onTapObject, onLongPress, rememberView = false, handleRef, onViewChange, hideGround = false, focusId,
}: Props) {
  const skyMap = useImage(require('../../../assets/sky/milkyway.jpg'));
  const horizon = useImage(require('../../../assets/sky/horizon.png'));
  const sprite = useImage(require('../../../assets/sky/star-sprite.png'));
  const orionArt = useImage(require('../../../assets/sky/orion-art.jpg'));
  const labelFont = useFont(require('../../../assets/sky/Inter-Medium.ttf'), 13.5);
  const smallFont = useFont(require('../../../assets/sky/Inter-Medium.ttf'), 11);
  const trackedFont = useFont(require('../../../assets/sky/Inter-Medium.ttf'), 14);
  const headingFont = useFont(require('../../../assets/sky/Inter-Medium.ttf'), 21);
  const resources = useMemo<SkyResources | null>(() => {
    if (!skyMap || !horizon || !sprite || !labelFont || !smallFont || !trackedFont || !headingFont) return null;
    return {
      effect: makeEffect(), skyMap, horizon, sprite, labelFont, smallFont, trackedFont, headingFont,
      artwork: orionArt ? { image: orionArt, anchors: ORION_ANCHORS, opacity: 0.74 } : null,
    };
  }, [skyMap, horizon, sprite, labelFont, smallFont, trackedFont, headingFont, orionArt]);
  useEffect(() => { if (resources) sharedResources.current = resources; }, [resources]);

  const picture = useSharedValue<SkPicture>(emptyPicture());
  // The last frame of the previous mode, fading out over the new one.
  const previous = useSharedValue<SkPicture>(emptyPicture());
  const previousOpacity = useSharedValue(0);
  const size = useRef({ width: 0, height: 0 });
  const [layoutTick, setLayoutTick] = useState(0);
  const view = useRef<ViewState>((rememberView && rememberedView) || { azimuth: 180, altitude: 36, fov: 46, ...initial });
  const moving = useRef(false);
  const flightState = useRef<{ from: ViewState; to: ViewState; duration: number; start: number; target?: string } | null>(null);
  const reduceMotion = useRef(false);
  const fieldRef = useRef<StarField | null>(null);
  const momentRef = useRef<SkyMoment | null>(null);
  const selectionDir = useRef<Vec3 | null>(null);
  const pending = useRef<number | null>(null);
  const glide = useRef<{ vx: number; vy: number; last: number } | null>(null);
  const selectedAt = useRef(0);
  const selectedId = useRef<string | null>(null);
  const cells = useRef(newCellBuffer());
  const lastFrame = useRef<HitContext | null>(null);
  const pinchAnchor = useRef<Vec3 | null>(null);

  const observer = useObserver();
  const layers = useStore((s) => s.layers);
  const selection = useStore((s) => s.selection);
  const focus = useStore((s) => s.focus);
  const nightVision = useStore((s) => s.nightVision);
  const nightPreview = useStore((s) => s.nightPreview);
  const skyMode = useStore((s) => s.skyMode);
  const modes = useStore((s) => s.modes);
  const flags = useStore((s) => s.flags);

  useEffect(() => { AccessibilityInfo.isReduceMotionEnabled().then((v) => { reduceMotion.current = v; }).catch(() => {}); }, []);

  const camera = (): Camera => {
    if (focusId) {
      const obj = object(focusId);
      const dir = obj ? directionOf(obj, new Date(skyTime()), observer) : null;
      if (dir) { const h = vectorHorizontal(dir); view.current = { ...view.current, azimuth: h.azimuth, altitude: Math.min(88, Math.max(-88, h.altitude)) }; }
    }
    const v = view.current;
    const o = orientationRef?.current ?? orientationFor(v.azimuth, v.altitude);
    return { orientation: o, fov: fixedFov ?? v.fov, width: size.current.width, height: size.current.height, projection };
  };

  const currentMoment = () => {
    const time = skyTime();
    const prev = momentRef.current;
    const key = `${observer.latitude},${observer.longitude}`;
    // A simulated minute is well under a pixel at any zoom this app offers for stars,
    // and it spares a full ephemeris pass on every frame.
    if (!prev || prev.observerKey !== key || Math.abs(prev.time - time) > 45_000) {
      momentRef.current = computeMoment(time, observer);
    }
    const years = yearsSinceJ2000(time);
    if (!fieldRef.current || Math.abs(fieldRef.current.years - years) > 2) fieldRef.current = buildStarField(stars(), years);
    return momentRef.current!;
  };

  /** AR and the detail page keep today's sky whatever mode the map is in. */
  const embedded = overlayOnly || !!focusId;

  const frameLayers = (): Layers => {
    const s = getState();
    if (!embedded) return hideGround ? { ...s.layers, ground: false } : s.layers;
    const base = s.modes.explore.layers;
    return { ...base, ground: base.ground && !hideGround, constellations: overlayOnly ? s.layers.constellations : base.constellations };
  };

  /** Brings the pack tiles this view can see into a query, and asks for the rest. */
  const gatherTiles = (cellList: Uint16Array, count: number, field: StarField): StarTile[] => {
    const pack = deepPack();
    pack.want(cellList, count, field.years);
    const tiles: StarTile[] = [];
    let moved = 0;
    for (let i = 0; i < count; i++) {
      const t = pack.tile(cellList[i]);
      if (!t || !t.count) continue;
      // Only a few tiles move per frame, so a long jump in time can't stall a frame.
      if (Math.abs(t.years - field.years) > 2 && moved < 4) { placeTile(t, field.years, directionAt); moved++; }
      tiles.push(t);
    }
    if (moved === 4) schedule();
    return tiles;
  };

  const draw = () => {
    pending.current = null;
    if (!resources || !size.current.width) return;
    const started = now();
    const f = flightState.current;
    if (f) {
      // A moving clock moves the target too, so the flight lands where it is now.
      const clock = getState().clock;
      if (f.target && (clock.anchorSky === null || clock.rate !== 0)) {
        const obj = object(f.target);
        const dir = obj ? directionOf(obj, new Date(skyTime()), observer) : null;
        if (dir) f.to = focusView(vectorHorizontal(dir), f.from, frameLayers().ground, f.to.fov);
      }
      const elapsed = (Date.now() - f.start) / 1000;
      view.current = flight(f.from, f.to, f.duration, elapsed);
      if (elapsed >= f.duration) flightState.current = null;
    }
    // Glide after a flick: the sky coasts to rest instead of stopping dead.
    const g = glide.current;
    if (g) {
      const now = Date.now(), dt = Math.min(0.05, (now - g.last) / 1000);
      g.last = now;
      view.current = dragView(view.current, g.vx * dt, g.vy * dt, pointsPerDegree(camera()), lowestView(frameLayers().ground));
      const decay = Math.exp(-dt * 5.2);
      g.vx *= decay; g.vy *= decay;
      if (Math.hypot(g.vx, g.vy) < 14) glide.current = null;
    }
    const moment = currentMoment();
    const sel = getState().selection;
    if (sel !== selectedId.current) { selectedId.current = sel; selectedAt.current = Date.now(); }
    const selectionAge = (Date.now() - selectedAt.current) / 1000;
    const obj = sel ? object(sel) : null;
    selectionDir.current = obj ? directionOf(obj, new Date(moment.time), observer) : null;
    const state = getState();
    const cam = camera();
    const layers = frameLayers();
    const field = fieldRef.current!;
    const mode: SkyMode = embedded || !state.flags.skyModes ? 'explore' : state.skyMode;
    const settings = embedded ? MODE_DEFAULTS.explore : state.modes[mode];
    const isMoving = moving.current || !!glide.current;
    const brightness = frameBrightness(moment.sunAltitude, layers, state.nightPreview, overlayOnly);
    const limit = starLimit(mode, settings, cam.fov, brightness, isMoving);
    const useIndex = state.flags.catalogsV1;
    const wantDeep = useIndex && state.flags.deepPack && mode === 'atlas' && layers.stars && limit > BUNDLED_LIMIT;
    const pack = wantDeep ? deepPack() : null;
    const query = useIndex ? querySky(cam, moment, field.years, pack?.status === 'ready' ? (c) => pack.fastest(c) : null, cells.current) : null;
    if (query && pack) query.tiles = gatherTiles(query.cells, query.count, field);
    const result = emptyResult();
    const focused = focusId ? object(focusId) : null;
    const markFaint = focused?.type === 'star' && (focused.magnitude ?? 0) > limit;
    picture.value = renderFrame({
      camera: cam, moment, field, layers, selection: focusId ? (markFaint ? focusId : null) : sel, selectionDir: focusId ? (markFaint ? directionOf(focused, new Date(moment.time), observer) : null) : selectionDir.current,
      chart: { mode, settings, limit, query, readout: mode === 'atlas' && showCompass }, result, selectionName: focusId ? null : obj?.name ?? null,
      moving: isMoving, overlayOnly, bottomInset, topInset, showCompass, nightVision: state.nightVision,
      selectionAge: reduceMotion.current ? SELECTION_SETTLE : selectionAge, nightPreview: state.nightPreview,
      framing: !hideGround && !overlayOnly && showCompass && layers.ground && layers.framing,
    }, resources);
    lastFrame.current = { camera: cam, moment, field, layers, mode, limit, brightness, overlayOnly, query, bottomEdge: size.current.height - bottomInset, labels: result.labels };
    if (!embedded) {
      const base = stars().count;
      recordFrame(now() - started, { indexed: base + (state.flags.deepPack ? DEEP_PACK.stars : 0), loaded: base + (pack?.loadedStars ?? 0), scanned: result.scanned, drawn: result.drawn, limit });
    }
    if (rememberView) rememberedView = view.current;
    onViewChange?.(view.current);
    const settling = !!sel && !reduceMotion.current && selectionAge < SELECTION_SETTLE;
    if (flightState.current || orientationRef || glide.current || settling) schedule();
  };

  const latestDraw = useRef(draw);
  latestDraw.current = draw;
  // Runs the newest closure, so a frame queued before the textures loaded still draws.
  const schedule = () => { if (pending.current === null) pending.current = requestAnimationFrame(() => latestDraw.current()); };
  const drawRef = useRef(schedule);
  drawRef.current = schedule;

  // Redraw on any change of inputs, and tick as the sky moves on its own.
  useEffect(() => { schedule(); });
  useEffect(() => {
    const id = setInterval(() => {
      const c = getState().clock;
      if (c.anchorSky === null || c.rate !== 0) drawRef.current();
    }, 250);
    return () => { clearInterval(id); if (pending.current !== null) cancelAnimationFrame(pending.current); pending.current = null; };
  }, []);
  useEffect(() => { schedule(); }, [resources, layers, selection, nightVision, nightPreview, observer, layoutTick, skyMode, modes, flags]);
  useEffect(() => onDeepPackChange(() => drawRef.current()), []);

  // The old sky fades out over the new one. Objects stay put, so only the extras change.
  const firstMode = useRef(true);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (firstMode.current) { firstMode.current = false; return; }
    if (embedded || reduceMotion.current || DEMO_MODE) return;
    previous.value = picture.value;
    previousOpacity.value = 1;
    previousOpacity.value = withTiming(0, { duration: 260 });
    if (fadeTimer.current) clearTimeout(fadeTimer.current);
    fadeTimer.current = setTimeout(() => { previous.value = emptyPicture(); }, 320);
  }, [skyMode]);

  // Fly to whatever was requested, from search, detail or Tonight.
  useEffect(() => {
    if (!focus || !resources) return;
    fieldRef.current ??= buildStarField(stars(), yearsSinceJ2000(skyTime()));
    const obj = object(focus.id);
    if (!obj) return;
    const dir = directionOf(obj, new Date(skyTime()), observer);
    if (!dir) return;
    const h = vectorHorizontal(dir);
    const from = view.current;
    const span = obj.type === 'constellation' && fieldRef.current ? constellationSpan(focus.id.slice(4), fieldRef.current) : null;
    const to = focusView(h, from, frameLayers().ground, focus.fov ?? (span !== null ? framingFov(span) : undefined));
    const angle = angleBetween(dir, orientationCentre(from));
    flightState.current = { from, to, duration: flightDuration(angle, reduceMotion.current || DEMO_MODE), start: Date.now(), target: focus.id };
    schedule();
  }, [focus?.nonce, resources]);

  const identify = (x: number, y: number, radius = 34) => {
    const last = lastFrame.current;
    if (!last) return null;
    return hitTest(x, y, { ...last, camera: camera() }, radius);
  };

  // Screenshot mode only: lets the browser flows ask where the app really put something.
  if (DEMO_MODE && !embedded) {
    (globalThis as { __skyProbe?: unknown }).__skyProbe = {
      view: () => view.current,
      point: (id: string) => {
        const obj = object(id), last = lastFrame.current;
        const dir = obj && last ? directionOf(obj, new Date(last.moment.time), observer) : null;
        return dir ? project(camera(), dir) : null;
      },
      limit: () => lastFrame.current?.limit ?? null,
    };
  }

  if (handleRef) {
    handleRef.current = {
      identifyCentre: () => identify(size.current.width / 2, (size.current.height - bottomInset + topInset) / 2, 90)?.id ?? null,
      view: () => view.current,
      centre: () => (size.current.width ? vectorHorizontal(unproject(camera(), size.current.width / 2, size.current.height / 2)) : null),
      frame: () => lastFrame.current,
      centreOn: (x, y) => {
        const h = vectorHorizontal(unproject(camera(), x, y));
        const from = view.current;
        flightState.current = { from, to: focusView(h, from, frameLayers().ground), duration: reduceMotion.current || DEMO_MODE ? 0 : 0.45, start: Date.now() };
        schedule();
      },
    };
  }

  const start = useRef<ViewState>(view.current);
  const pan = Gesture.Pan().runOnJS(true).maxPointers(1).minDistance(3)
    .onStart(() => { flightState.current = null; glide.current = null; moving.current = true; start.current = view.current; })
    .onUpdate((e) => {
      const ppd = pointsPerDegree(camera());
      view.current = dragView(start.current, e.translationX, e.translationY, ppd, lowestView(frameLayers().ground));
      schedule();
    })
    .onEnd((e) => {
      if (!reduceMotion.current && Math.hypot(e.velocityX, e.velocityY) > 120) glide.current = { vx: e.velocityX, vy: e.velocityY, last: Date.now() };
    })
    .onFinalize(() => { moving.current = false; schedule(); });
  const pinch = Gesture.Pinch().runOnJS(true)
    .onStart((e) => {
      flightState.current = null; glide.current = null; moving.current = true; start.current = view.current;
      // While the compass aims the view, a pinch only changes the zoom.
      pinchAnchor.current = orientationRef?.current ? null : unproject(camera(), e.focalX, e.focalY);
    })
    .onUpdate((e) => {
      const fov = Math.min(FOV_RANGE[1], Math.max(FOV_RANGE[0], start.current.fov / e.scale));
      const zoomed = { ...view.current, fov };
      view.current = pinchAnchor.current ? anchorView(zoomed, pinchAnchor.current, e.focalX, e.focalY, size.current.width, size.current.height, projection, lowestView(frameLayers().ground)) : zoomed;
      schedule();
    })
    .onFinalize(() => { moving.current = false; pinchAnchor.current = null; schedule(); });
  const tap = Gesture.Tap().runOnJS(true).maxDistance(10).maxDuration(LONG_PRESS - 10).onEnd((e, success) => {
    if (!success) return;
    const hit = identify(e.x, e.y);
    select(hit?.id ?? null);
    onTapObject?.(hit?.id ?? null);
  });
  const longPress = Gesture.LongPress().runOnJS(true).minDuration(LONG_PRESS).maxDistance(10).onStart((e) => {
    const last = lastFrame.current;
    if (!last || !onLongPress) return;
    glide.current = null;
    const hits = hitCandidates(e.x, e.y, { ...last, camera: camera() }, 34, 4).map((h) => h.id);
    onLongPress({ x: e.x, y: e.y, hits, direction: unproject(camera(), e.x, e.y) });
  });
  const doubleTap = Gesture.Tap().runOnJS(true).numberOfTaps(2).onEnd((e, success) => {
    if (!success) return;
    const from = view.current;
    const zoomed = { ...from, fov: Math.max(FOV_RANGE[0], from.fov * 0.5) };
    const to = orientationRef?.current ? zoomed : anchorView(zoomed, unproject(camera(), e.x, e.y), e.x, e.y, size.current.width, size.current.height, projection, lowestView(frameLayers().ground));
    flightState.current = { from, to, duration: reduceMotion.current ? 0 : 0.35, start: Date.now() };
    schedule();
  });
  // Taps run alongside the pan: a tap fails by itself once the finger moves 10pt, whereas
  // an Exclusive with the pan first would leave the tap waiting on it.
  const gestures = Gesture.Simultaneous(pan, pinch, longPress, Gesture.Exclusive(doubleTap, tap));

  const onLayout = (e: LayoutChangeEvent) => {
    size.current = { width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height };
    setLayoutTick((n) => n + 1);
  };

  const canvas = (
    <Canvas style={{ flex: 1 }}>
      <Picture picture={picture} />
      <Group opacity={previousOpacity}><Picture picture={previous} /></Group>
    </Canvas>
  );
  return (
    <View testID="sky-canvas" style={{ flex: 1, backgroundColor: overlayOnly ? 'transparent' : '#050810' }} onLayout={onLayout}
      accessible accessibilityRole="image" accessibilityLabel="Star map. Drag to look around, pinch to zoom, tap a star to select it.">
      {interactive ? <GestureDetector gesture={gestures}>{canvas}</GestureDetector> : canvas}
    </View>
  );
}

const orientationCentre = (v: ViewState): Vec3 => {
  const a = (v.azimuth * Math.PI) / 180, h = (v.altitude * Math.PI) / 180;
  return [Math.cos(h) * Math.cos(a), -Math.cos(h) * Math.sin(a), Math.sin(h)];
};

/** Pixels in assets/sky/orion-art.jpg pinned to the raised shoulder, far shoulder and knee. */
const ORION_ANCHORS = { betelgeuse: [194, 522] as [number, number], bellatrix: [622, 656] as [number, number], rigel: [804, 1344] as [number, number] };

let blank: SkPicture | null = null;
/** A picture that draws nothing, for the frames before the sky is ready. */
function emptyPicture(): SkPicture {
  if (!blank) blank = createPicture(() => {}, Skia.XYWHRect(0, 0, 1, 1));
  return blank;
}
