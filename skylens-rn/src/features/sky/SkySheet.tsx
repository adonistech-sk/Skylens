// The contextual panel over the sky. Collapsed it is one quiet row above the compass, or the
// selection card when something is selected. Half open, the sky stays live above it and the
// list follows the view. Fully open it holds everything else. The map underneath never
// changes state, so closing the panel returns to exactly the same sky.
import { router } from 'expo-router';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { planTonight, TonightPlan } from '../../astronomy/tonight';
import { ensureObject } from '../../data/catalogs/runtime';
import { Category } from '../../data/search';
import { Notice, press, Row } from '../../design/components';
import { Icon, IconName } from '../../design/Icon';
import { motion } from '../../design/motion';
import { ObjectThumb } from '../../design/Screen';
import { color, font, type } from '../../design/tokens';
import { formatShortDate, formatTime } from '../../state/format';
import { rememberRecent, requestFocus, resetToNow, skyTime, useObserver, useStore } from '../../state/store';
import { useEvents } from '../events/useEvents';
import { CategoryChips, deepNote, RecentRows, ResultRow, useUniversalSearch } from '../search/SearchResults';
import { clampTop, Detent, panelStops, restingDetent } from './detents';
import { discover, Suggestion } from './discovery';
import { frameBrightness } from './renderer';
import { SkyHandle } from './SkyView';

const HANDLE_HEIGHT = 46;
/** A browser draws its own focus box, which an iPhone doesn't. */
const webInput = (Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) as object;

function Quick({ testID, icon, label, onPress }: { testID: string; icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable testID={testID} onPress={onPress} style={({ pressed }) => [styles.quick, press(pressed)]} accessibilityRole="button" accessibilityLabel={label}>
      <View style={styles.quickIcon}><Icon name={icon} size={21} tint={color.peach} weight={1.4} /></View>
      <Text style={styles.quickText} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

/** Follows the view while the panel is open. Only re-renders when the answer changes. */
function useDiscovery(handle: { current: SkyHandle | null }, active: boolean) {
  const [items, setItems] = useState<Suggestion[]>([]);
  const last = useRef('');
  useEffect(() => {
    if (!active) return;
    const look = () => {
      const f = handle.current?.frame();
      if (!f) return;
      const list = discover({ camera: f.camera, moment: f.moment, layers: f.layers, mode: f.mode, brightness: f.brightness, topEdge: 60, bottomEdge: f.bottomEdge }, 5, false);
      const key = list.map((s) => s.object.id + s.reason).join('|');
      if (key !== last.current) { last.current = key; setItems(list); }
    };
    look();
    const id = setInterval(look, 1200);
    return () => clearInterval(id);
  }, [active]);
  return items;
}

function TonightSection({ onPick }: { onPick: (id: string) => void }) {
  const observer = useObserver();
  const use24h = useStore((s) => s.use24h);
  const [plan, setPlan] = useState<TonightPlan | null>(null);
  const day = Math.floor(skyTime() / 3_600_000);
  useEffect(() => {
    let live = true;
    // A real ephemeris search, so the panel paints first.
    const id = setTimeout(() => { const p = planTonight(new Date(skyTime()), observer, observer.timeZone); if (live) setPlan(p); }, 60);
    return () => { live = false; clearTimeout(id); };
  }, [observer, day]);
  if (!plan) return <Text style={styles.waiting}>Working out tonight…</Text>;
  const list = plan.recommendations.slice(0, 3);
  if (!list.length) return <Notice text="There is no dark window tonight from this location." />;
  return (
    <>
      {list.map((r, i) => <Row key={r.object.id} leading={<ObjectThumb object={r.object} size={46} />} title={r.object.name} subtitle={`Best ${formatTime(r.bestTime, observer.timeZone, use24h)} · ${r.summary}`} last={i === list.length - 1} onPress={() => onPick(r.object.id)} />)}
    </>
  );
}

function EventsSection() {
  const observer = useObserver();
  const { events, failed } = useEvents(skyTime(), 45);
  const use24h = useStore((s) => s.use24h);
  if (failed) return <Notice text="Upcoming events couldn't be calculated." tone="warn" />;
  if (!events) return <Text style={styles.waiting}>Finding events…</Text>;
  const next = events.filter((e) => e.date.getTime() >= skyTime() && e.isSignificant && e.visibility.kind !== 'notVisible').slice(0, 3);
  if (!next.length) return <Notice text="No major events in the next 45 days." />;
  return (
    <>
      {next.map((e, i) => <Row key={e.id} testID={`sheet-event-${i}`} title={e.title} subtitle={`${formatShortDate(e.date, observer.timeZone)}, ${formatTime(e.date, observer.timeZone, use24h)} · ${e.subtitle}`} last={i === next.length - 1} onPress={() => router.push({ pathname: '/event/[id]', params: { id: e.id } })} />)}
    </>
  );
}

function SearchPane({ query, onPick }: { query: string; onPick: (id: string) => void }) {
  const [category, setCategory] = useState<Category | 'All'>('All');
  const { results, deep } = useUniversalSearch(query, category, 20);
  const note = deepNote(deep);
  return (
    <>
      <CategoryChips value={category} onChange={setCategory} />
      {note ? <Notice text={note} tone="warn" /> : null}
      {results.map((r, i) => <ResultRow key={r.id} item={r} last={i === results.length - 1} onPress={() => onPick(r.id)} />)}
      {!results.length ? <Text style={[type.body, { paddingVertical: 20 }]}>Nothing matches “{query}”.</Text> : null}
    </>
  );
}

interface Props {
  handleRef: { current: SkyHandle | null };
  detent: Detent;
  onDetent: (d: Detent) => void;
  /** The top of the compass dome, measured from the screen's bottom. */
  dockBottom: number;
  topInset: number;
  /** The selection card, for both the docked and the open panel. */
  card: (inline: boolean) => ReactNode | null;
  onLayers: () => void;
}

export function SkySheet({ handleRef, detent, onDetent, dockBottom, topInset, card, onLayers }: Props) {
  const { height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const observer = useObserver();
  const clock = useStore((s) => s.clock);
  const use24h = useStore((s) => s.use24h);
  const live = clock.anchorSky === null;
  const [query, setQuery] = useState('');
  const [opened, setOpened] = useState(false);
  const handleTop = height - dockBottom - HANDLE_HEIGHT;
  const stops = useMemo(() => panelStops(height, topInset, handleTop), [height, topInset, handleTop]);
  const top = useSharedValue(stops.collapsed);
  const dragStart = useRef(0);

  // The clock line ticks while the panel can be seen.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, [live]);

  useEffect(() => {
    const to = stops[detent];
    top.value = reduced ? to : withTiming(to, { duration: motion.base + 60, easing: motion.ease });
    if (detent !== 'collapsed') setOpened(true);
    if (detent === 'collapsed') { Keyboard.dismiss(); setQuery(''); }
  }, [detent, stops, reduced]);

  // A gesture belongs to one detector, so each draggable area gets its own.
  const makeDrag = (slop: number) => Gesture.Pan().runOnJS(true).activeOffsetY([-slop, slop]).failOffsetX([-24, 24])
    .onStart(() => { dragStart.current = top.value; })
    .onUpdate((e) => { top.value = clampTop(dragStart.current + e.translationY, stops); })
    .onEnd((e) => {
      const rest = restingDetent(top.value, e.velocityY, stops);
      top.value = reduced ? stops[rest] : withTiming(stops[rest], { duration: motion.base + 60, easing: motion.ease });
      if (rest !== detent) onDetent(rest);
    });
  const dockDrag = makeDrag(6);
  const headDrag = makeDrag(6);
  const bodyDrag = makeDrag(8).enabled(detent !== 'full');

  const panel = useAnimatedStyle(() => {
    const span = stops.collapsed - stops.half;
    const shown = Math.min(1, Math.max(0, (stops.collapsed - top.value) / (span * 0.3)));
    return { transform: [{ translateY: top.value }], opacity: shown };
  });
  const dock = useAnimatedStyle(() => ({ opacity: Math.max(0, 1 - (stops.collapsed - top.value) / 60) }));

  const open = detent !== 'collapsed';
  const suggestions = useDiscovery(handleRef, open);
  // One selection card at a time: docked over the sky, or inside the open panel.
  const docked = open ? null : card(false);

  const pick = (id: string) => {
    rememberRecent(id);
    ensureObject(id).then((o) => { if (o) { requestFocus(id); onDetent('collapsed'); } }).catch(() => {});
  };

  const date = new Date(skyTime());
  const timeLine = `${formatShortDate(date, observer.timeZone)} · ${formatTime(date, observer.timeZone, use24h)}`;
  const searching = query.trim() !== '';
  const frame = handleRef.current?.frame();
  const brightDay = frame ? frameBrightness(frame.moment.sunAltitude, frame.layers, false, frame.overlayOnly) > 0.42 : false;

  return (
    <>
      <Animated.View style={[styles.dock, { bottom: dockBottom }, dock]} pointerEvents={open ? 'none' : 'box-none'}>
        <GestureDetector gesture={dockDrag}>
          <View>
            {docked ?? (
              <Pressable testID="sheet-handle" onPress={() => onDetent('half')} style={({ pressed }) => [styles.handle, press(pressed)]} accessibilityRole="button" accessibilityLabel={`Open the sky panel. ${observer.name}, ${timeLine}.`}>
                <Icon name="search" size={17} tint={color.textSecondary} />
                <Text style={styles.handleText} numberOfLines={1}>Discover · {observer.name}</Text>
                <Text style={styles.handleTime}>{formatTime(date, observer.timeZone, use24h)}</Text>
                <View style={styles.handleChevron}><Icon name="chevron" size={15} tint={color.textSecondary} /></View>
              </Pressable>
            )}
          </View>
        </GestureDetector>
      </Animated.View>

      <Animated.View testID="sky-sheet" style={[styles.sheet, { height: height - stops.full }, panel]} pointerEvents={open ? 'auto' : 'none'} accessibilityElementsHidden={!open} importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}>
        <GestureDetector gesture={headDrag}>
          <View style={styles.sheetHead}>
            <Pressable testID="sheet-grabber" onPress={() => onDetent(detent === 'half' ? 'full' : 'half')} style={styles.grabberHit} accessibilityRole="adjustable"
              accessibilityLabel={`Sky panel, ${detent === 'full' ? 'fully open' : 'half open'}`} accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
              onAccessibilityAction={(e) => onDetent(e.nativeEvent.actionName === 'increment' ? 'full' : detent === 'full' ? 'half' : 'collapsed')}>
              <View style={styles.grabber} />
            </Pressable>
            <View style={styles.searchRow}>
              <View style={styles.field}>
                <Icon name="search" size={18} tint={color.textSecondary} />
                <TextInput testID="sheet-search" style={styles.input} value={query} onChangeText={setQuery} onFocus={() => onDetent('full')} placeholder="Stars, planets, HIP 87937, M31…" placeholderTextColor={color.textTertiary} autoCorrect={false} returnKeyType="search" accessibilityLabel="Search the sky" />
              </View>
              <Pressable testID="sheet-close" onPress={() => onDetent('collapsed')} hitSlop={8} style={styles.closeHit} accessibilityRole="button" accessibilityLabel="Close the sky panel"><Icon name="close" size={21} /></Pressable>
            </View>
          </View>
        </GestureDetector>

        <GestureDetector gesture={bodyDrag}>
          <ScrollView scrollEnabled={detent === 'full'} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}
            onScrollEndDrag={(e) => { if (e.nativeEvent.contentOffset.y < -56) onDetent('half'); }}>
            {opened && searching ? <SearchPane query={query} onPick={pick} /> : opened ? (
              <>
                <View style={styles.context}>
                  <Pressable testID="sheet-location" onPress={() => router.push('/location')} style={({ pressed }) => [styles.contextRow, press(pressed)]} accessibilityRole="button" accessibilityLabel={`Location, ${observer.name}. Change.`}>
                    <Icon name="pin" size={17} tint={color.peach} /><Text style={styles.contextText} numberOfLines={1}>{observer.name}</Text>
                  </Pressable>
                  <Pressable testID="sheet-time" onPress={() => router.push('/time-travel')} style={({ pressed }) => [styles.contextRow, press(pressed)]} accessibilityRole="button" accessibilityLabel={`${live ? 'Live time' : 'Simulated time'}, ${timeLine}. Open Time Travel.`}>
                    <Icon name="calendar" size={17} tint={color.peach} /><Text style={styles.contextText} numberOfLines={1}>{timeLine}{live ? '' : ' · simulated'}</Text>
                  </Pressable>
                  {!live ? <Pressable testID="sheet-now" onPress={resetToNow} hitSlop={8} accessibilityRole="button" accessibilityLabel="Return to the current time"><Text style={styles.now}>Now</Text></Pressable> : null}
                </View>
                {open ? card(true) : null}
                <Text style={styles.section}>Around this view</Text>
                <View testID="sheet-discovery">
                  {suggestions.length ? suggestions.map((s, i) => (
                    <Row key={s.object.id} testID={`sheet-suggest-${i}`} leading={<ObjectThumb object={s.object} size={46} />} title={s.object.name} subtitle={s.reason} last={i === suggestions.length - 1} onPress={() => pick(s.object.id)} />
                  )) : <Notice text={brightDay ? 'The sky is too bright for anything but the Sun, and the Moon or Venus when they are up.' : 'Nothing bright is up in this direction. Try turning the view.'} />}
                </View>
                <Text style={styles.section}>Go to</Text>
                <View style={styles.quicks}>
                  <Quick testID="sheet-layers" icon="layers" label="Layers" onPress={onLayers} />
                  <Quick testID="sheet-tonight" icon="moonRing" label="Tonight" onPress={() => router.push('/tonight')} />
                  <Quick testID="sheet-events" icon="calendar" label="Events" onPress={() => router.push('/events')} />
                  <Quick testID="sheet-lists" icon="star" label="Lists" onPress={() => router.push('/favorites')} />
                </View>
                {detent === 'full' ? (
                  <>
                    <RecentRowsSection onPick={pick} />
                    <Text style={styles.section}>Best tonight</Text>
                    <TonightSection onPick={pick} />
                    <Text style={styles.section}>Coming up</Text>
                    <EventsSection />
                    <Text style={styles.section}>Browse</Text>
                    <Row testID="sheet-browse-explore" title="Planets and the Moon" subtitle="Where each one is now" onPress={() => router.push('/explore')} />
                    <Row title="All 88 constellations" onPress={() => router.push({ pathname: '/category/[key]', params: { key: 'constellations' } })} />
                    <Row title="Messier objects" subtitle="The classic deep-sky list" last onPress={() => router.push({ pathname: '/category/[key]', params: { key: 'deepsky' } })} />
                  </>
                ) : null}
              </>
            ) : null}
          </ScrollView>
        </GestureDetector>
      </Animated.View>
    </>
  );
}

function RecentRowsSection({ onPick }: { onPick: (id: string) => void }) {
  return <View style={{ marginTop: 18 }}><RecentRows onPick={onPick} /></View>;
}

const styles = StyleSheet.create({
  dock: { position: 'absolute', left: 18, right: 18 },
  handle: { height: HANDLE_HEIGHT, flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 16, paddingRight: 12, borderRadius: 23, backgroundColor: 'rgba(11,15,27,0.78)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.16)' },
  handleText: { flex: 1, fontFamily: font.medium, fontSize: 14, color: color.text },
  handleTime: { fontFamily: font.regular, fontSize: 13, color: color.textSecondary, fontVariant: ['tabular-nums'] },
  handleChevron: { transform: [{ rotate: '-90deg' }] },
  sheet: { position: 'absolute', left: 0, right: 0, top: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: '#090D18', borderWidth: StyleSheet.hairlineWidth, borderColor: color.hairlineStrong, overflow: 'hidden' },
  sheetHead: { paddingHorizontal: 18, paddingBottom: 8 },
  grabberHit: { alignSelf: 'center', paddingVertical: 9, paddingHorizontal: 40 },
  grabber: { width: 38, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.28)' },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  field: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.07)' },
  input: { flex: 1, fontFamily: font.regular, fontSize: 15, color: color.text, height: 42, ...webInput },
  closeHit: { width: 38, height: 44, alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: 18, paddingBottom: 60 },
  context: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 36, marginBottom: 8 },
  contextRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1, minHeight: 36 },
  contextText: { fontFamily: font.regular, fontSize: 13, color: color.textSecondary, flexShrink: 1 },
  now: { fontFamily: font.semibold, fontSize: 13, color: color.peach },
  section: { fontFamily: font.serif, fontSize: 21, lineHeight: 27, color: color.text, marginTop: 18, marginBottom: 2 },
  waiting: { ...type.caption, paddingVertical: 14 },
  quicks: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  quick: { alignItems: 'center', gap: 6, width: 72 },
  quickIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: color.hairlineStrong },
  quickText: { fontFamily: font.medium, fontSize: 12, color: color.textSecondary },
});
