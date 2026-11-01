import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { project, ViewState } from '../astronomy/camera';
import * as Haptics from 'expo-haptics';
import { altitude, vectorHorizontal } from '../astronomy/core';
import { directionOf, locate } from '../astronomy/locator';
import { guidance, horizontalOf } from '../astronomy/observing';
import { object } from '../data/catalog';
import { deepPack, ensureObject, onDeepPackChange } from '../data/catalogs/runtime';
import { IconButton, SegmentedControl, TabBar } from '../design/components';
import { Tap } from '../design/motion';
import { Icon } from '../design/Icon';
import { color, font } from '../design/tokens';
import { AddToList } from '../features/lists/AddToList';
import { CompassSession } from '../features/sky/CompassSession';
import { Detent } from '../features/sky/detents';
import { discover } from '../features/sky/discovery';
import { LayersPanel } from '../features/sky/LayersPanel';
import { skyBrightness } from '../features/sky/scene';
import { SelectionCard } from '../features/sky/SelectionCard';
import { SkyContextMenu } from '../features/sky/SkyContextMenu';
import { SkySheet } from '../features/sky/SkySheet';
import { SkyHandle, SkyPoint, SkyView } from '../features/sky/SkyView';
import { DEMO_MODE } from '../state/demo';
import { MODE_LABELS, SkyMode } from '../state/skyModes';
import { getState, requestFocus, select, setNightPreview, setSkyMode, skyTime, useObserver, useStore } from '../state/store';

const MODES: { value: SkyMode; label: string }[] = (['observe', 'explore', 'atlas'] as SkyMode[]).map((value) => ({ value, label: MODE_LABELS[value] }));

/** Alnilam, the middle of the belt: the anchor of the design's opening composition. */
const ORION_CENTRE = 'star:26311';

/**
 * Opens on Orion at the design's scale when Orion is genuinely up in a dark sky. Any other
 * time the view opens on the real southern sky, because the sky is never adjusted to suit
 * the composition.
 */
function openingView(time: number, observer: ReturnType<typeof useObserver>): Partial<ViewState> | undefined {
  const date = new Date(time);
  const dark = altitude('sun', date, observer) < -8 || getState().nightPreview;
  const star = object(ORION_CENTRE);
  const dir = star ? directionOf(star, date, observer) : null;
  if (!dark || !dir) return undefined;
  const h = vectorHorizontal(dir);
  return h.altitude > 14 ? { azimuth: h.azimuth, altitude: h.altitude - 2.2, fov: 26 } : undefined;
}

export default function SkyScreen() {
  const insets = useSafeAreaInsets();
  const handle = useRef<SkyHandle | null>(null);
  const [panel, setPanel] = useState<'none' | 'layers' | 'nav'>('none');
  const [compass, setCompass] = useState(false);
  const [compassNote, setCompassNote] = useState<string | null>(null);
  const orientation = useRef(null);
  const nightPreview = useStore((s) => s.nightPreview);
  const selection = useStore((s) => s.selection);
  const airless = useStore((s) => !s.layers.atmosphere);
  const skyMode = useStore((s) => s.skyMode);
  const modesOn = useStore((s) => s.flags.skyModes);
  useStore((s) => s.catalogRevision);
  const { width, height } = useWindowDimensions();
  const [detent, setDetent] = useState<Detent>('collapsed');
  const [menu, setMenu] = useState<SkyPoint | null>(null);
  const [adding, setAdding] = useState(false);
  const [guide, setGuide] = useState<string | null>(null);
  const [tooFaint, setTooFaint] = useState(false);
  const [canStep, setCanStep] = useState(false);
  const live = useStore((s) => s.clock.anchorSky === null);
  const observer = useObserver();

  const selected = selection ? object(selection) : null;
  const location = selected ? locate(selected, new Date(skyTime()), observer) : null;
  const controlsBottom = Math.max(insets.bottom, 14) + 2;
  const opening = useMemo(() => openingView(skyTime(), observer), []);

  // Whether the real sky is bright right now, rechecked as time passes or is simulated.
  const [daylight, setDaylight] = useState(false);
  const [sunUp, setSunUp] = useState(false);
  useEffect(() => {
    const check = () => {
      const sun = altitude('sun', new Date(skyTime()), observer);
      setDaylight(skyBrightness(sun) > 0.42);
      setSunUp(sun > 0);
    };
    check();
    const id = setInterval(check, 5000);
    return () => clearInterval(id);
  }, [observer, live]);

  /** What is on screen now, for stepping between objects and the card's hints. */
  const inView = () => {
    const f = handle.current?.frame();
    if (!f) return [];
    return discover({ camera: f.camera, moment: f.moment, layers: f.layers, mode: f.mode, brightness: f.brightness, topEdge: insets.top + 56, bottomEdge: f.bottomEdge }, 12, true).map((s) => s.object.id);
  };

  // Directions and hints follow the view, a few times a second at most.
  useEffect(() => {
    if (!selected) { setGuide(null); setTooFaint(false); setCanStep(false); return; }
    let tick = 0;
    const look = () => {
      const f = handle.current?.frame();
      const centre = handle.current?.centre();
      const target = horizontalOf(selected, new Date(skyTime()), observer);
      if (!f || !centre || !target) return;
      const dir = directionOf(selected, new Date(skyTime()), observer);
      const p = dir ? project(f.camera, dir) : null;
      const onScreen = !!p && p.x >= 0 && p.x <= f.camera.width && p.y >= insets.top + 56 && p.y <= f.bottomEdge;
      setGuide(onScreen ? null : guidance(centre, target).text);
      setTooFaint(selected.type === 'star' && selected.magnitude !== null && selected.magnitude > f.limit);
      // Heavier than the rest, and it rarely changes.
      if (tick++ % 5 === 0) setCanStep(inView().filter((id) => id !== selected.id).length > 0);
    };
    look();
    const id = setInterval(look, 400);
    return () => clearInterval(id);
  }, [selected?.id, observer]);

  // Each step recentres the view, which would reorder a fresh list. So a run of steps keeps
  // the list it started with, and back always returns to where it came from.
  const stepping = useRef<string[]>([]);
  const step = (offset: number) => {
    if (!selection || !stepping.current.includes(selection)) stepping.current = [...new Set([...(selection ? [selection] : []), ...inView()])];
    const list = stepping.current;
    if (list.length < 2) return;
    const at = selection ? list.indexOf(selection) : 0;
    requestFocus(list[(at + offset + list.length) % list.length]);
  };

  const longPress = (p: SkyPoint) => {
    Haptics.selectionAsync().catch(() => {});
    setPanel('none');
    if (detent !== 'collapsed') setDetent('collapsed');
    setMenu(p);
  };

  const card = (inline: boolean) => (selected && location ? (
    <SelectionCard object={selected} location={location} guide={guide} tooFaint={tooFaint} inline={inline} onStep={canStep ? step : undefined} onAddToList={() => setAdding(true)} />
  ) : null);

  // Reported only in Deep Atlas, the one place the pack is used.
  const [packNote, setPackNote] = useState<string | null>(null);
  useEffect(() => {
    const check = () => {
      const pack = deepPack();
      setPackNote(skyMode !== 'atlas' ? null : pack.status === 'failed' ? 'Deep stars unavailable · showing bundled stars' : pack.status === 'opening' ? 'Loading deep stars…' : pack.badTiles ? 'Some deep stars could not be read' : null);
    };
    check();
    return onDeepPackChange(check);
  }, [skyMode]);

  return (
    <View style={styles.root}>
      <SkyView handleRef={handle} rememberView orientationRef={compass ? orientation : undefined} bottomInset={controlsBottom + 132} topInset={insets.top + 56} initial={opening}
        onTapObject={() => { setPanel('none'); setDetent('collapsed'); }} onLongPress={longPress} />
      {compass ? <CompassSession orientationRef={orientation} onMessage={setCompassNote} onUnavailable={() => { setCompass(false); setCompassNote('Motion sensors aren’t available on this device. Drag to explore.'); }} /> : null}
      {compassNote ? <Pressable onPress={() => setCompassNote(null)} style={[styles.note, { top: insets.top + 58 }]} accessibilityRole="button"><Text style={styles.noteText}>{compassNote}</Text></Pressable> : null}

      <View style={[styles.top, { top: insets.top + 6 }]} pointerEvents="box-none">
        <IconButton testID="sky-search" name="search" label="Search the sky" onPress={() => router.push('/search')} />
        {modesOn ? <SegmentedControl compact value={skyMode} onChange={setSkyMode} options={MODES} style={styles.modes} /> : <View style={{ flex: 1 }} pointerEvents="none" />}
        <IconButton testID="sky-layers" name="layers" label="Sky layers" onPress={() => setPanel(panel === 'layers' ? 'none' : 'layers')} active={panel === 'layers'} />
      </View>

      <View style={[styles.status, { top: insets.top + (modesOn ? 58 : 14) }]} pointerEvents="box-none">
        {!live && !DEMO_MODE ? (
          <Pressable onPress={() => router.push('/time-travel')} style={styles.simulated} accessibilityRole="button" accessibilityLabel="Simulated time. Open Time Travel.">
            <Text style={styles.simulatedText}>Simulated time</Text>
          </Pressable>
        ) : null}
        {packNote ? <View testID="sky-pack-note" style={styles.simulated}><Text style={styles.simulatedText}>{packNote}</Text></View> : null}
        {daylight && airless ? (
          <View testID="sky-airless" style={styles.simulated} accessibilityLabel="Atmosphere is off. This is a simulated dark sky, and the clock is unchanged."><Text style={styles.simulatedText}>{`${sunUp ? 'Daytime' : 'Twilight'} · airless sky, simulated`}</Text></View>
        ) : null}
        {daylight && !airless ? (
          <Pressable testID="sky-night-preview" onPress={() => setNightPreview(!nightPreview)} style={styles.simulated} accessibilityRole="button"
            accessibilityLabel={nightPreview ? 'Night preview is on. Return to the real sky.' : `It is ${sunUp ? 'daytime' : 'twilight'}. Show a night preview of the stars.`}>
            <Text style={styles.simulatedText}>{nightPreview ? 'Night preview · Show real sky' : `${sunUp ? 'Daytime' : 'Twilight'} sky · Preview at night`}</Text>
          </Pressable>
        ) : null}
      </View>

      {panel === 'layers' ? <LayersPanel top={insets.top + 58} maxHeight={height * 0.58} /> : null}

      <View style={[styles.controls, { bottom: controlsBottom }]}>
        <IconButton testID="sky-compass" name="navigate" label={compass ? 'Turn off compass mode' : 'Follow the compass'} onPress={() => setCompass(!compass)} active={compass} size={50} iconSize={23} />
        <IconButton testID="sky-time" name="calendar" label="Time Travel" onPress={() => router.push('/time-travel')} size={50} iconSize={23} />
        <Tap testID="sky-identify" depth={0.93} accessibilityRole="button" accessibilityLabel="Identify what is in the centre of the view"
          onPress={() => {
            const id = handle.current?.identifyCentre() ?? null;
            if (id) { select(id); requestFocus(id); }
          }} style={styles.identify}>
          <Icon name="scan" size={29} tint={color.peach} weight={1.6} />
        </Tap>
        <Tap testID="sky-ar" depth={0.92} accessibilityRole="button" accessibilityLabel="AR Sky" onPress={() => router.push('/ar')} style={styles.ar}>
          <Text style={styles.arText}>AR</Text>
        </Tap>
        <IconButton testID="sky-more" name="dots" label="Open navigation" onPress={() => setPanel(panel === 'nav' ? 'none' : 'nav')} active={panel === 'nav'} size={50} iconSize={23} />
      </View>

      <SkySheet handleRef={handle} detent={detent} onDetent={(d) => { setDetent(d); if (d !== 'collapsed') setPanel('none'); }} dockBottom={controlsBottom + 138} topInset={insets.top} card={card}
        onLayers={() => { setDetent('collapsed'); setPanel('layers'); }} />

      {panel === 'nav' ? <TabBar floating /> : null}
      {menu && handle.current?.frame() ? (
        <SkyContextMenu point={menu} frame={handle.current.frame()!} screen={{ width, height }} onClose={() => setMenu(null)}
          onPick={(id) => { setMenu(null); ensureObject(id).then((o) => { if (o) select(id); }).catch(() => {}); }}
          onCentre={() => { handle.current?.centreOn(menu.x, menu.y); setMenu(null); }} />
      ) : null}
      {adding && selected ? <AddToList id={selected.id} name={selected.name} onClose={() => setAdding(false)} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050810' },
  top: { position: 'absolute', left: 18, right: 18, flexDirection: 'row', alignItems: 'center' },
  status: { position: 'absolute', left: 74, right: 74, alignItems: 'center', gap: 8 },
  simulated: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 15, borderWidth: 1, borderColor: color.peachLine, backgroundColor: 'rgba(14,19,32,0.7)' },
  simulatedText: { fontFamily: font.medium, fontSize: 12, color: color.peach },
  note: { position: 'absolute', left: 74, right: 74, padding: 10, borderRadius: 14, backgroundColor: 'rgba(11,15,27,0.88)' },
  noteText: { fontFamily: font.medium, fontSize: 12.5, lineHeight: 17, color: color.text, textAlign: 'center' },
  modes: { flex: 1, marginHorizontal: 10 },
  controls: { position: 'absolute', left: 18, right: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  identify: { width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center', borderWidth: 1.6, borderColor: '#F0A070', backgroundColor: 'rgba(44,24,16,0.62)', shadowColor: '#F59A5C', shadowOpacity: 0.62, shadowRadius: 15, shadowOffset: { width: 0, height: 0 } },
  ar: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(14,19,32,0.62)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.18)' },
  arText: { fontFamily: font.semibold, fontSize: 15, color: color.text },
});
