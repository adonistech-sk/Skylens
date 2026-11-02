import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlobeId, isSatellite, PHYSICAL, PlanetId, ScaleMode } from '../astronomy/solar';
import { IconButton, press, SegmentedControl } from '../design/components';
import { Icon } from '../design/Icon';
import { color, font, type } from '../design/tokens';
import { distancesFor, moonDistanceKm, moonsOf, SYSTEM_BODIES } from '../features/solar/scene';
import { SolarHandle, SolarView } from '../features/solar/SolarView';
import { formatShortDate, formatTime } from '../state/format';
import { getState, requestFocus, resetToNow, select, setRate, skyTime, useObserver, useStore } from '../state/store';

/** Simulated seconds per real second, shown as what a person would feel. */
const SPEEDS = [{ rate: 86_400, label: '1 day/s' }, { rate: 604_800, label: '1 week/s' }, { rate: 2_592_000, label: '1 month/s' }, { rate: 31_557_600, label: '1 year/s' }];

const SCALE_NOTE: Record<ScaleMode, string> = {
  illustrative: 'Illustrative scale. Sizes and distances are compressed. Directions are true.',
  true: 'True scale. Distances and sizes are real, so planets are marked where they are too small to see.',
};
const LOCAL_NOTE = 'True scale within this system.';

/** What a surface map really shows, stated where it's seen. */
const MAP_NOTE: Partial<Record<GlobeId, string>> = {
  venus: 'Radar map of the surface from Magellan. To the eye Venus shows only bright cloud.',
  jupiter: 'Hubble map from 2020. The bands are real, but storms drift, so today’s details differ.',
  saturn: 'Hubble map from 2025. Ring depths are representative, their edges true.',
  uranus: 'Bands from a 2019 Hubble map. Colour approximate. The hemisphere unseen that year repeats the nearest seen.',
  neptune: 'Bands from a 2020 Hubble map. Colour approximate. No storms shown. Unseen latitudes repeat the nearest seen.',
  mars: 'Viking colour mosaic. Dust and ice change with the seasons.',
  earth: 'Blue Marble and Black Marble composites, without clouds.',
  mercury: 'MESSENGER mosaic, shown in monochrome.',
  sun: 'A limb-darkened disc. No solar surface map is used.',
};

const objectId = (id: GlobeId): string | null => (id === 'earth' || id === 'io' || id === 'europa' || id === 'ganymede' || id === 'callisto' ? null : `body:${id}`);
const toGlobe = (raw?: string | null): GlobeId | null => {
  const id = raw?.replace('body:', '') as GlobeId | undefined;
  return id && PHYSICAL[id] ? id : null;
};

export default function SolarSystem() {
  const params = useLocalSearchParams<{ focus?: string }>();
  const insets = useSafeAreaInsets();
  const observer = useObserver();
  const use24h = useStore((s) => s.use24h);
  const clock = useStore((s) => s.clock);
  const handle = useRef<SolarHandle | null>(null);
  const [mode, setMode] = useState<ScaleMode>('illustrative');
  const [focused, setFocused] = useState<GlobeId | null>(null);
  const [selected, setSelected] = useState<GlobeId | null>(toGlobe(params.focus));
  const [orbits, setOrbits] = useState(true);
  const [labels, setLabels] = useState(true);
  const [panel, setPanel] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [, setTick] = useState(0);
  const playing = clock.rate !== 0 && clock.anchorSky !== null;
  const live = clock.anchorSky === null;

  // The date line follows the clock without redrawing the 3D view through React.
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), playing ? 250 : 15000);
    return () => clearInterval(id);
  }, [playing]);

  // Leaving with the clock running would leave the sky racing.
  useEffect(() => () => { const c = getState().clock; if (c.anchorSky !== null && c.rate !== 0) setRate(0); }, []);

  const date = new Date(skyTime());
  const tz = observer.timeZone;
  const choose = (id: GlobeId | null) => {
    setSelected(id);
    const o = id ? objectId(id) : null;
    if (o) select(o);
  };
  const close = () => (router.canGoBack() ? router.back() : router.replace('/explore'));
  const current = selected ?? focused;
  const info = current ? distancesFor(current, date) : null;
  const physical = current ? PHYSICAL[current] : null;
  const object = current ? objectId(current) : null;
  const moons = focused ? moonsOf(focused) : [];
  const home = focused && isSatellite(focused) ? null : focused;
  const fromPlanet = current ? moonDistanceKm(current, date) : null;

  return (
    <View style={styles.root}>
      <SolarView mode={mode} orbits={orbits} labels={labels} initialFocus={toGlobe(params.focus) ?? undefined} handleRef={handle} onFocus={setFocused} onSelect={choose} selected={selected} topInset={insets.top + 96} bottomInset={current ? 300 : 190} />

      <View style={[styles.top, { top: insets.top + 6 }]} pointerEvents="box-none">
        <IconButton testID="solar-close" name="close" label="Close the Solar System" onPress={close} />
        <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>{focused ? PHYSICAL[focused].name : 'Solar System'}</Text>
        <IconButton testID="solar-options" name="layers" label="Orbits and labels" active={panel} onPress={() => setPanel(!panel)} />
      </View>

      {focused ? (
        <Pressable testID="solar-overview" onPress={() => { setSelected(null); handle.current?.overview(); }} style={[styles.back, { top: insets.top + 58 }]} accessibilityRole="button" accessibilityLabel="Back to the whole Solar System">
          <Icon name="back" size={15} tint={color.peach} /><Text style={styles.backText}>Solar System</Text>
        </Pressable>
      ) : (
        <SegmentedControl compact value={mode} onChange={setMode} options={[{ value: 'illustrative', label: 'Illustrative' }, { value: 'true', label: 'True scale' }]} style={[styles.scale, { top: insets.top + 58 }]} />
      )}
      <Text testID="solar-scale-note" style={[styles.note, { top: insets.top + 100 }]}>{focused ? LOCAL_NOTE : SCALE_NOTE[mode]}</Text>

      {panel ? (
        <View testID="solar-options-panel" style={[styles.panel, { top: insets.top + 58 }]}>
          <View style={styles.option}><Text style={styles.optionText}>Orbits</Text><Switch value={orbits} onValueChange={setOrbits} accessibilityLabel="Orbits" trackColor={{ true: color.peachDeep, false: 'rgba(255,255,255,0.14)' }} thumbColor="#fff" {...webThumb} /></View>
          <View style={styles.option}><Text style={styles.optionText}>Labels</Text><Switch value={labels} onValueChange={setLabels} accessibilityLabel="Labels" trackColor={{ true: color.peachDeep, false: 'rgba(255,255,255,0.14)' }} thumbColor="#fff" {...webThumb} /></View>
        </View>
      ) : null}

      <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, 12) + 6 }]} pointerEvents="box-none">
        {current && physical ? (
          <View testID="solar-card" style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle} numberOfLines={1}>{physical.name}</Text>
              {current !== focused ? <Pressable testID="solar-deselect" onPress={() => setSelected(null)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Clear the selection"><Icon name="close" size={16} tint={color.textSecondary} /></Pressable> : null}
            </View>
            <Text style={type.caption} numberOfLines={2}>
              {Math.round(physical.radius).toLocaleString('en-US')} km radius{fromPlanet ? ` · ${Math.round(fromPlanet).toLocaleString('en-US')} km from ${current === 'moon' ? 'Earth' : 'Jupiter'}` : ''}{info?.fromSunAU ? ` · ${info.fromSunAU.toFixed(2)} AU from the Sun` : ''}{info?.fromEarthAU && !fromPlanet ? ` · ${info.fromEarthAU.toFixed(2)} AU from Earth` : ''}
            </Text>
            {MAP_NOTE[current] ? <Text style={styles.mapNote} numberOfLines={2}>{MAP_NOTE[current]}</Text> : null}
            <View style={styles.actions}>
              {focused !== current ? <Action testID="solar-focus" icon="target" label="Visit" onPress={() => handle.current?.focus(current)} /> : null}
              {object ? <Action testID="solar-details" icon="info" label="Details" onPress={() => router.push({ pathname: '/object/[id]', params: { id: object } })} /> : null}
              {object && current !== 'sun' ? <Action testID="solar-find" icon="navigate" label="In the sky" onPress={() => { requestFocus(object); router.dismissTo('/sky'); }} /> : null}
              {current === 'moon' ? <Action testID="solar-atlas" icon="moonRing" label="Moon Atlas" onPress={() => router.push('/moon-atlas')} /> : null}
            </View>
          </View>
        ) : null}

        {moons.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
            {home ? <Chip id={home} name={PHYSICAL[home].name} on={focused === home} onPress={() => { choose(home); handle.current?.focus(home); }} /> : null}
            {focused && isSatellite(focused) ? <Chip id={focused} name={PHYSICAL[focused].name} on onPress={() => {}} /> : null}
            {moons.filter((m) => m !== focused).map((m) => <Chip key={m} id={m} name={PHYSICAL[m].name} on={false} onPress={() => { choose(m); handle.current?.focus(m); }} />)}
          </ScrollView>
        ) : !focused ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
            {SYSTEM_BODIES.map((id) => <Chip key={id} id={id} name={PHYSICAL[id as PlanetId].name} on={selected === id} onPress={() => { choose(id); handle.current?.focus(id); }} />)}
          </ScrollView>
        ) : null}

        <View style={styles.time}>
          <Text testID="solar-date" style={styles.date} numberOfLines={1}>{formatShortDate(date, tz)} {date.getUTCFullYear()} · {formatTime(date, tz, use24h)}</Text>
          <View style={styles.timeControls}>
            <Pressable testID="solar-speed" onPress={() => { const next = (speed + 1) % SPEEDS.length; setSpeed(next); if (playing) setRate(SPEEDS[next].rate); }} hitSlop={6} accessibilityRole="button" accessibilityLabel={`Speed ${SPEEDS[speed].label}. Change speed.`}>
              <Text style={styles.speed}>{SPEEDS[speed].label}</Text>
            </Pressable>
            <IconButton testID="solar-play" name={playing ? 'pause' : 'play'} label={playing ? 'Pause time' : 'Play time'} size={40} iconSize={18} filled onPress={() => setRate(playing ? 0 : SPEEDS[speed].rate)} />
            <Pressable testID="solar-now" onPress={resetToNow} hitSlop={6} accessibilityRole="button" accessibilityLabel="Return to the current time"><Text style={[styles.now, live && { color: color.textTertiary }]}>Now</Text></Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

function Action({ testID, icon, label, onPress }: { testID: string; icon: 'target' | 'info' | 'navigate' | 'moonRing'; label: string; onPress: () => void }) {
  return (
    <Pressable testID={testID} onPress={onPress} style={({ pressed }) => [styles.action, press(pressed)]} accessibilityRole="button" accessibilityLabel={label}>
      <Icon name={icon} size={17} tint={color.peach} /><Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

function Chip({ id, name, on, onPress }: { id: GlobeId; name: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable testID={`solar-go-${id}`} onPress={onPress} style={[styles.chip, on && styles.chipOn]} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={name}>
      <Text style={[styles.chipText, on && styles.chipTextOn]}>{name}</Text>
    </Pressable>
  );
}

const webThumb = { activeThumbColor: '#fff' };

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#03040A' },
  top: { position: 'absolute', left: 18, right: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { flex: 1, textAlign: 'center', fontFamily: font.serif, fontSize: 26, lineHeight: 32, color: color.text },
  scale: { position: 'absolute', alignSelf: 'center', width: 232 },
  back: { position: 'absolute', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: 12 },
  backText: { fontFamily: font.medium, fontSize: 13, color: color.peach },
  note: { position: 'absolute', left: 40, right: 40, textAlign: 'center', fontFamily: font.regular, fontSize: 11.5, lineHeight: 15, color: color.textSecondary },
  panel: { position: 'absolute', right: 18, width: 170, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: 'rgba(11,15,27,0.94)', borderWidth: StyleSheet.hairlineWidth, borderColor: color.hairlineStrong },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 42 },
  optionText: { fontFamily: font.regular, fontSize: 14, color: color.text },
  dock: { position: 'absolute', left: 0, right: 0, bottom: 0, gap: 8 },
  card: { marginHorizontal: 18, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4, borderRadius: 18, backgroundColor: 'rgba(11,15,27,0.92)', borderWidth: StyleSheet.hairlineWidth, borderColor: color.hairlineStrong },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontFamily: font.serif, fontSize: 22, lineHeight: 27, color: color.text, flex: 1 },
  mapNote: { fontFamily: font.regular, fontSize: 11.5, lineHeight: 15, color: color.textTertiary, marginTop: 4 },
  actions: { flexDirection: 'row', marginTop: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.hairline },
  action: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 42 },
  actionText: { fontFamily: font.medium, fontSize: 13, color: color.text },
  strip: { gap: 8, paddingHorizontal: 18 },
  chip: { paddingHorizontal: 13, height: 34, justifyContent: 'center', borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, borderColor: color.hairlineStrong, backgroundColor: 'rgba(11,15,27,0.6)' },
  chipOn: { backgroundColor: color.peachFill, borderColor: color.peachLine },
  chipText: { fontFamily: font.medium, fontSize: 13, color: color.textSecondary },
  chipTextOn: { color: color.text },
  time: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingHorizontal: 18 },
  date: { flex: 1, fontFamily: font.regular, fontSize: 12.5, color: color.textSecondary, fontVariant: ['tabular-nums'] },
  timeControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  speed: { fontFamily: font.medium, fontSize: 12.5, color: color.text, fontVariant: ['tabular-nums'] },
  now: { fontFamily: font.semibold, fontSize: 13, color: color.peach },
});
