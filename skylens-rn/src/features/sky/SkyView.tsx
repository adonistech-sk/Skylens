import { Canvas, createPicture, Picture, SkPicture, Skia, useFont, useImage } from '@shopify/react-native-skia';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, LayoutChangeEvent, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { angleBetween, Mat3, vectorHorizontal, Vec3 } from '../../astronomy/core';
import { Camera, dragView, flight, flightDuration, FOV_RANGE, orientationFor, pointsPerDegree, Projection, ViewState } from '../../astronomy/camera';
import { directionOf } from '../../astronomy/locator';
import { object, stars } from '../../data/catalog';
import { DEMO_MODE } from '../../state/demo';
import { getState, select, skyTime, useObserver, useStore } from '../../state/store';
import { makeEffect, renderFrame, SkyResources } from './renderer';
import { buildStarField, computeMoment, hitTest, SkyMoment, StarField, yearsSinceJ2000 } from './scene';

export interface SkyHandle {
  /** The object nearest the centre of the view. */
  identifyCentre: () => string | null;
  view: () => ViewState;
}

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
  handleRef?: { current: SkyHandle | null };
  /** Draw no horizon, as on a detail page or over a camera. */
  hideGround?: boolean;
  /** Centre this object and keep it there. */
  focusId?: string;
  onViewChange?: (v: ViewState) => void;
}

/** The loaded textures, reused to composite AR photos off-screen. */
export const sharedResources: { current: SkyResources | null } = { current: null };

export function SkyView({
  orientationRef, projection = 'stereographic', fixedFov, overlayOnly = false, showCompass = true, bottomInset = 0, topInset = 0,
  initial, interactive = true, onTapObject, handleRef, onViewChange, hideGround = false, focusId,
}: Props) {
  const skyMap = useImage(require('../../../assets/sky/allsky.jpg'));
  const horizon = useImage(require('../../../assets/sky/horizon.png'));
  const sprite = useImage(require('../../../assets/sky/star-sprite.png'));
  const orionArt = useImage(require('../../../assets/sky/orion-art.jpg'));
  const labelFont = useFont(require('../../../assets/sky/Inter-Medium.ttf'), 13.5);
  const smallFont = useFont(require('../../../assets/sky/Inter-Medium.ttf'), 11);
  const trackedFont = useFont(require('../../../assets/sky/Inter-Medium.ttf'), 13);
  const resources = useMemo<SkyResources | null>(() => {
    if (!skyMap || !horizon || !sprite || !labelFont || !smallFont || !trackedFont) return null;
    return {
      effect: makeEffect(), skyMap, horizon, sprite, labelFont, smallFont, trackedFont,
      artwork: orionArt ? { image: orionArt, anchors: ORION_ANCHORS, opacity: 0.62 } : null,
    };
  }, [skyMap, horizon, sprite, labelFont, smallFont, trackedFont, orionArt]);
  useEffect(() => { if (resources) sharedResources.current = resources; }, [resources]);

  const picture = useSharedValue<SkPicture>(emptyPicture());
  const size = useRef({ width: 0, height: 0 });
  const [layoutTick, setLayoutTick] = useState(0);
  const view = useRef<ViewState>({ azimuth: 180, altitude: 36, fov: 46, ...initial });
  const moving = useRef(false);
  const flightState = useRef<{ from: ViewState; to: ViewState; duration: number; start: number } | null>(null);
  const reduceMotion = useRef(false);
  const fieldRef = useRef<StarField | null>(null);
  const momentRef = useRef<SkyMoment | null>(null);
  const selectionDir = useRef<Vec3 | null>(null);
    const pending = useRef<number | null>(null);

  const observer = useObserver();
  const layers = useStore((s) => s.layers);
  const selection = useStore((s) => s.selection);
  const focus = useStore((s) => s.focus);
  const nightVision = useStore((s) => s.nightVision);

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

  const draw = () => {
    pending.current = null;
    if (!resources || !size.current.width) return;
    const f = flightState.current;
    if (f) {
      const elapsed = (Date.now() - f.start) / 1000;
      view.current = flight(f.from, f.to, f.duration, elapsed);
      if (elapsed >= f.duration) flightState.current = null;
    }
    const moment = currentMoment();
    const sel = getState().selection;
    const obj = sel ? object(sel) : null;
    selectionDir.current = obj ? directionOf(obj, new Date(moment.time), observer) : null;
    picture.value = renderFrame({
      camera: camera(), moment, field: fieldRef.current!, layers: hideGround ? { ...getState().layers, ground: false } : getState().layers, selection: focusId ? null : sel, selectionDir: focusId ? null : selectionDir.current,
      moving: moving.current, overlayOnly, bottomInset, topInset, showCompass, nightVision: getState().nightVision,
    }, resources);
    onViewChange?.(view.current);
    if (flightState.current || orientationRef) schedule();
  };

  const schedule = () => { if (pending.current === null) pending.current = requestAnimationFrame(draw); };
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
  useEffect(() => { schedule(); }, [resources, layers, selection, nightVision, observer, layoutTick]);

  // Fly to whatever was requested, from search, detail or Tonight.
  useEffect(() => {
    if (!focus || !resources) return;
    const obj = object(focus.id);
    if (!obj) return;
    const dir = directionOf(obj, new Date(skyTime()), observer);
    if (!dir) return;
    const h = vectorHorizontal(dir);
    const from = view.current;
    const to: ViewState = { azimuth: h.azimuth, altitude: Math.min(82, Math.max(-5, h.altitude)), fov: Math.min(from.fov, 60) };
    const angle = angleBetween(dir, orientationCentre(from));
    flightState.current = { from, to, duration: flightDuration(angle, reduceMotion.current || DEMO_MODE), start: Date.now() };
    schedule();
  }, [focus?.nonce, resources]);

  const identify = (x: number, y: number, radius = 34) => {
    if (!fieldRef.current || !momentRef.current) return null;
    return hitTest(x, y, camera(), momentRef.current, fieldRef.current, getState().layers.deepSky, radius);
  };

  if (handleRef) {
    handleRef.current = {
      identifyCentre: () => identify(size.current.width / 2, (size.current.height - bottomInset + topInset) / 2, 90)?.id ?? null,
      view: () => view.current,
    };
  }

  const start = useRef<ViewState>(view.current);
  const pan = Gesture.Pan().runOnJS(true).maxPointers(1).minDistance(3)
    .onStart(() => { flightState.current = null; moving.current = true; start.current = view.current; })
    .onUpdate((e) => {
      const ppd = pointsPerDegree(camera());
      view.current = dragView(start.current, e.translationX, e.translationY, ppd);
      schedule();
    })
    .onFinalize(() => { moving.current = false; schedule(); });
  const pinch = Gesture.Pinch().runOnJS(true)
    .onStart(() => { flightState.current = null; moving.current = true; start.current = view.current; })
    .onUpdate((e) => {
      view.current = { ...view.current, fov: Math.min(FOV_RANGE[1], Math.max(FOV_RANGE[0], start.current.fov / e.scale)) };
      schedule();
    })
    .onFinalize(() => { moving.current = false; schedule(); });
  const tap = Gesture.Tap().runOnJS(true).maxDistance(10).onEnd((e) => {
    const hit = identify(e.x, e.y);
    select(hit?.id ?? null);
    onTapObject?.(hit?.id ?? null);
  });
  const doubleTap = Gesture.Tap().runOnJS(true).numberOfTaps(2).onEnd(() => {
    const from = view.current;
    flightState.current = { from, to: { ...from, fov: Math.max(FOV_RANGE[0], from.fov * 0.5) }, duration: reduceMotion.current ? 0 : 0.35, start: Date.now() };
    schedule();
  });
  const gestures = Gesture.Exclusive(Gesture.Simultaneous(pan, pinch), doubleTap, tap);

  const onLayout = (e: LayoutChangeEvent) => {
    size.current = { width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height };
    setLayoutTick((n) => n + 1);
  };

  const canvas = (
    <Canvas style={{ flex: 1 }} testID="sky-canvas">
      <Picture picture={picture} />
    </Canvas>
  );
  return (
    <View style={{ flex: 1, backgroundColor: overlayOnly ? 'transparent' : '#050810' }} onLayout={onLayout}
      accessible accessibilityRole="image" accessibilityLabel="Star map. Drag to look around, pinch to zoom, tap a star to select it.">
      {interactive ? <GestureDetector gesture={gestures}>{canvas}</GestureDetector> : canvas}
    </View>
  );
}

const orientationCentre = (v: ViewState): Vec3 => {
  const a = (v.azimuth * Math.PI) / 180, h = (v.altitude * Math.PI) / 180;
  return [Math.cos(h) * Math.cos(a), -Math.cos(h) * Math.sin(a), Math.sin(h)];
};

/** Pixels in assets/sky/orion-art.jpg pinned to the shoulders and leading knee. */
const ORION_ANCHORS = { betelgeuse: [284, 375] as [number, number], bellatrix: [660, 387] as [number, number], rigel: [683, 978] as [number, number] };

let blank: SkPicture | null = null;
/** A picture that draws nothing, for the frames before the sky is ready. */
function emptyPicture(): SkPicture {
  if (!blank) blank = createPicture(() => {}, Skia.XYWHRect(0, 0, 1, 1));
  return blank;
}
