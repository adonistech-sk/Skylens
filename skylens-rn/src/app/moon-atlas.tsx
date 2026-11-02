import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { moonPhase } from '../astronomy/core';
import { facesEarth, moonGeometry, sunAltitudeAt } from '../astronomy/moonGeometry';
import { IconButton, Notice, press, Row } from '../design/components';
import { Icon } from '../design/Icon';
import { color, font, type } from '../design/tokens';
import { formatElevation, formatLunarPosition, sunLine } from '../features/moon/atlas';
import { Elevation, FeatureIndex, featureType, LunarFeature } from '../features/moon/moonData';
import { loadElevation, loadLunarFeatures } from '../features/moon/moonStore';
import { MoonHandle, MoonView } from '../features/moon/MoonView';
import { formatShortDate, formatTime } from '../state/format';
import { resetToNow, select, shiftSkyTime, skyTime, useObserver, useStore } from '../state/store';

const DAY = 86_400_000;
const LEVEL_NOTE = ['Base map, 2K', 'Map detail, 4K', 'Map detail, 8K'];

export default function MoonAtlas() {
  const params = useLocalSearchParams<{ feature?: string }>();
  const insets = useSafeAreaInsets();
  const observer = useObserver();
  const use24h = useStore((s) => s.use24h);
  useStore((s) => s.clock);
  const handle = useRef<MoonHandle | null>(null);
  const [index, setIndex] = useState<FeatureIndex | null>(null);
  const [elevation, setElevation] = useState<Elevation | null>(null);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<LunarFeature | null>(null);
  const [labels, setLabels] = useState(true);
  const [fullLight, setFullLight] = useState(false);
  const [relief, setRelief] = useState(true);
  const [heights, setHeights] = useState(false);
  const [panel, setPanel] = useState(false);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState(0);

  useEffect(() => {
    select('body:moon');
    loadLunarFeatures().then((i) => { if (i) setIndex(i); else setFailed(true); });
    loadElevation().then(setElevation);
  }, []);

  const date = new Date(skyTime());
  const tz = observer.timeZone;
  const moon = useMemo(() => moonGeometry(date), [date.getTime()]);
  const phase = useMemo(() => moonPhase(date), [date.getTime()]);
  const results = useMemo(() => (index && query.trim() ? index.search(query, 30) : []), [index, query]);

  const choose = (f: LunarFeature) => {
    setSelected(f);
    setSearching(false);
    setQuery('');
    handle.current?.goTo(f.lat, f.lon, f.diameter);
  };

  // A feature opened from universal search, once both the catalog and the view are ready.
  const opened = useRef<string | null>(null);
  useEffect(() => {
    if (!index || !params.feature || opened.current === params.feature) return;
    const f = index.byId.get(params.feature);
    if (!f) return;
    let tries = 0;
    const id = setInterval(() => {
      tries++;
      if (handle.current && (tries > 1 || tries > 40)) { opened.current = params.feature!; choose(f); clearInterval(id); }
      if (tries > 40) clearInterval(id);
    }, 80);
    return () => clearInterval(id);
  }, [index, params.feature]);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/explore'));
  const altitude = selected ? sunAltitudeAt(selected.lat, selected.lon, moon.sun) : 0;
  const metres = selected && elevation ? elevation.at(selected.lat, selected.lon) : null;

  return (
    <View style={styles.root}>
      <MoonView index={index} selected={selected} labels={labels} fullLight={fullLight} relief={relief} elevation={heights} handleRef={handle} onSelect={setSelected} onView={(l) => { if (l !== level) setLevel(l); }} topInset={insets.top + 100} bottomInset={selected ? 260 : 130} />

      <View style={[styles.top, { top: insets.top + 6 }]} pointerEvents="box-none">
        <IconButton testID="moon-close" name="close" label="Close the Moon Atlas" onPress={close} />
        <Text style={styles.title} accessibilityRole="header">Moon Atlas</Text>
        <View style={styles.topRight}>
          <IconButton testID="moon-search" name="search" label="Search lunar features" onPress={() => setSearching(true)} />
          <IconButton testID="moon-layers" name="layers" label="Atlas layers" active={panel} onPress={() => setPanel(!panel)} />
        </View>
      </View>
      <Text testID="moon-phase" style={[styles.phase, { top: insets.top + 56 }]} numberOfLines={1}>{phase.name} · {Math.round(moon.illuminated * 100)}% lit{fullLight ? ' · full light view' : ''}</Text>

      {panel ? (
        <View testID="moon-layers-panel" style={[styles.panel, { top: insets.top + 80 }]}>
          <Option testID="moon-labels" label="Feature names" value={labels} onChange={setLabels} />
          <Option testID="moon-fulllight" label="Full light" hint="Ignores today’s Sun" value={fullLight} onChange={setFullLight} />
          <Option testID="moon-relief" label="Terrain relief" hint="LOLA data, exaggerated on the globe" value={relief} onChange={setRelief} />
          <Option testID="moon-elevation" label="Elevation colour" value={heights} onChange={setHeights} />
          {heights ? (
            <View testID="moon-legend" style={styles.legend}>
              <LinearGradient colors={['#1A245C', '#4D5C9E', '#C7997F', '#FFEBD1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.legendBar} />
              <View style={styles.legendRow}><Text style={styles.legendText}>−11 km</Text><Text style={styles.legendText}>0</Text><Text style={styles.legendText}>+11 km</Text></View>
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, 12) + 6 }]} pointerEvents="box-none">
        {failed ? <View style={styles.notice}><Notice text="The feature catalog couldn’t be read. The map still works." tone="warn" /></View> : null}
        {selected ? (
          <View testID="moon-card" style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle} numberOfLines={1}>{selected.name}</Text>
              <Pressable testID="moon-deselect" onPress={() => setSelected(null)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Clear the selection"><Icon name="close" size={16} tint={color.textSecondary} /></Pressable>
            </View>
            <Text style={type.caption} numberOfLines={1}>{featureType(selected.code)}{selected.diameter ? ` · ${selected.diameter >= 10 ? Math.round(selected.diameter) : selected.diameter.toFixed(1)} km across` : ''}</Text>
            <View style={styles.facts}>
              <Fact label="Position" value={formatLunarPosition(selected.lat, selected.lon)} />
              <Fact label="Now" value={sunLine(altitude)} />
              {metres !== null ? <Fact label="Elevation" value={formatElevation(metres)} /> : null}
              <Fact label="From Earth" value={facesEarth(selected.lat, selected.lon, moon.earth) ? 'In view now' : 'Out of view now'} />
            </View>
            {selected.origin ? <Text style={styles.origin} numberOfLines={2}>Named for {selected.origin}</Text> : null}
            {altitude < -0.5 && !fullLight ? <Pressable testID="moon-show-night" onPress={() => setFullLight(true)} hitSlop={6} accessibilityRole="button" accessibilityLabel="See it in full light" style={({ pressed }) => press(pressed)}><Text style={[styles.link, { marginTop: 8 }]}>It’s night there. See it in full light</Text></Pressable> : null}
            <Text style={styles.source}>IAU name, USGS Gazetteer no. {selected.id.slice(6)}</Text>
          </View>
        ) : null}
        <View style={styles.time}>
          <Text testID="moon-date" style={styles.date} numberOfLines={1}>{formatShortDate(date, tz)} {date.getUTCFullYear()} · {formatTime(date, tz, use24h)}</Text>
          <View style={styles.timeControls}>
            <IconButton testID="moon-day-back" name="back" label="One day earlier" size={36} iconSize={16} onPress={() => shiftSkyTime(-DAY)} />
            <IconButton testID="moon-day-forward" name="chevron" label="One day later" size={36} iconSize={16} onPress={() => shiftSkyTime(DAY)} />
            <Pressable testID="moon-now" onPress={resetToNow} hitSlop={6} accessibilityRole="button" accessibilityLabel="Return to the current time"><Text style={styles.link}>Now</Text></Pressable>
          </View>
        </View>
        <View style={styles.time}>
          <Text testID="moon-level" style={styles.level} numberOfLines={1}>{LEVEL_NOTE[level]}</Text>
          <View style={styles.timeControls}>
            <Pressable testID="moon-earth-view" onPress={() => handle.current?.earthView()} hitSlop={6} accessibilityRole="button" accessibilityLabel="See the Moon as it faces Earth now" style={({ pressed }) => press(pressed)}><Text style={styles.link}>Earth view</Text></Pressable>
            <Pressable testID="moon-facts" onPress={() => router.push({ pathname: '/object/[id]', params: { id: 'body:moon' } })} hitSlop={6} accessibilityRole="button" accessibilityLabel="Moon details" style={({ pressed }) => press(pressed)}><Text style={styles.link}>Details</Text></Pressable>
          </View>
        </View>
      </View>

      {searching ? (
        <KeyboardAvoidingView testID="moon-search-sheet" style={styles.search} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.searchBar, { paddingTop: insets.top + 10 }]}>
            <View style={styles.field}>
              <Icon name="search" size={19} tint={color.textSecondary} />
              <TextInput testID="moon-search-input" style={styles.input} autoFocus value={query} onChangeText={setQuery} placeholder="Craters, seas, mountains…" placeholderTextColor={color.textTertiary} autoCorrect={false} returnKeyType="search" />
            </View>
            <IconButton name="close" label="Close search" glass={false} onPress={() => { setSearching(false); setQuery(''); }} />
          </View>
          {!index ? <Text style={[type.body, styles.empty]}>Opening the catalog…</Text> : (
            <FlatList
              data={results}
              keyExtractor={(f) => f.id}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: insets.bottom + 16 }}
              ListEmptyComponent={<Text style={[type.body, { paddingVertical: 24 }]}>{query.trim() ? `Nothing on the Moon matches “${query}”.` : `${index.features.length.toLocaleString('en-US')} official IAU names, from the USGS Gazetteer.`}</Text>}
              renderItem={({ item, index: i }) => <Row testID={`moon-result-${item.name}`} title={item.name} subtitle={`${featureType(item.code)}${item.diameter ? ` · ${item.diameter >= 10 ? Math.round(item.diameter) : item.diameter.toFixed(1)} km` : ''} · ${formatLunarPosition(item.lat, item.lon)}`} last={i === results.length - 1} onPress={() => choose(item)} />}
            />
          )}
        </KeyboardAvoidingView>
      ) : null}
    </View>
  );
}

function Option({ testID, label, hint, value, onChange }: { testID: string; label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.option}>
      <View style={{ flex: 1 }}>
        <Text style={styles.optionText}>{label}</Text>
        {hint ? <Text style={styles.optionHint}>{hint}</Text> : null}
      </View>
      <Switch testID={testID} value={value} onValueChange={onChange} accessibilityLabel={label} trackColor={{ true: color.peachDeep, false: 'rgba(255,255,255,0.14)' }} thumbColor="#fff" {...{ activeThumbColor: '#fff' }} />
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return <View style={styles.fact}><Text style={styles.factLabel}>{label}</Text><Text style={styles.factValue} numberOfLines={1}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#03040A' },
  top: { position: 'absolute', left: 18, right: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { flex: 1, marginLeft: 12, fontFamily: font.serif, fontSize: 26, lineHeight: 32, color: color.text },
  topRight: { flexDirection: 'row', gap: 8 },
  phase: { position: 'absolute', left: 74, right: 18, fontFamily: font.regular, fontSize: 12.5, color: color.textSecondary },
  panel: { position: 'absolute', right: 18, width: 214, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: 'rgba(11,15,27,0.94)', borderWidth: StyleSheet.hairlineWidth, borderColor: color.hairlineStrong },
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 46 },
  optionText: { fontFamily: font.regular, fontSize: 14, color: color.text },
  optionHint: { fontFamily: font.regular, fontSize: 11, color: color.textTertiary },
  legend: { paddingVertical: 8 },
  legendBar: { height: 8, borderRadius: 4 },
  legendRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  legendText: { fontFamily: font.regular, fontSize: 11, color: color.textSecondary, fontVariant: ['tabular-nums'] },
  dock: { position: 'absolute', left: 0, right: 0, bottom: 0, gap: 6 },
  notice: { paddingHorizontal: 18 },
  card: { marginHorizontal: 18, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 18, backgroundColor: 'rgba(11,15,27,0.92)', borderWidth: StyleSheet.hairlineWidth, borderColor: color.hairlineStrong },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontFamily: font.serif, fontSize: 22, lineHeight: 27, color: color.text, flex: 1 },
  facts: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, rowGap: 6 },
  fact: { width: '50%', paddingRight: 8 },
  factLabel: { fontFamily: font.regular, fontSize: 11, color: color.textTertiary },
  factValue: { fontFamily: font.medium, fontSize: 13, color: color.text, fontVariant: ['tabular-nums'] },
  origin: { fontFamily: font.regular, fontSize: 12.5, lineHeight: 17, color: color.textSecondary, marginTop: 8 },
  source: { fontFamily: font.regular, fontSize: 11, color: color.textTertiary, marginTop: 4 },
  time: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingHorizontal: 18, minHeight: 28 },
  date: { flex: 1, fontFamily: font.regular, fontSize: 12.5, color: color.textSecondary, fontVariant: ['tabular-nums'] },
  level: { flex: 1, fontFamily: font.regular, fontSize: 11.5, color: color.textTertiary },
  timeControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  link: { fontFamily: font.semibold, fontSize: 13, color: color.peach },
  search: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: color.base },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 18, paddingRight: 8, paddingBottom: 8 },
  field: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.07)' },
  input: { flex: 1, fontFamily: font.regular, fontSize: 16, color: color.text, height: 44 },
  empty: { padding: 22 },
});
