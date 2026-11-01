import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { deepPack } from '../../data/catalogs/runtime';
import { DEEP_PACK } from '../../data/generated/deepPack';
import { color, font } from '../../design/tokens';
import { Layers, MODE_LABELS, NO_CAP } from '../../state/skyModes';
import { resetSkyMode, setDensity, setLabelDensity, setLayer, setMagnitudeCap, setNightVision, useStore } from '../../state/store';
import { perfSnapshot, PerfSnapshot } from './perf';
import { Slider } from './Slider';

type Row = { key: keyof Layers; label: string; needs?: keyof Layers; inset?: boolean };

const GROUPS: { title: string; rows: Row[] }[] = [
  { title: 'Sky', rows: [
    { key: 'stars', label: 'Stars' },
    { key: 'planets', label: 'Planets, Sun and Moon' },
    { key: 'milkyWay', label: 'Milky Way' },
    { key: 'atmosphere', label: 'Atmosphere' },
  ] },
  { title: 'Deep sky', rows: [
    { key: 'deepSky', label: 'Deep sky objects' },
    { key: 'galaxies', label: 'Galaxies', needs: 'deepSky', inset: true },
    { key: 'clusters', label: 'Clusters', needs: 'deepSky', inset: true },
    { key: 'nebulae', label: 'Nebulae', needs: 'deepSky', inset: true },
  ] },
  { title: 'Constellations', rows: [
    { key: 'constellations', label: 'Constellations' },
    { key: 'boundaries', label: 'Boundaries' },
    { key: 'artwork', label: 'Orion artwork', needs: 'constellations' },
    { key: 'labels', label: 'Labels' },
  ] },
  { title: 'Grids', rows: [
    { key: 'gridEquatorial', label: 'Equatorial (J2000)' },
    { key: 'gridHorizontal', label: 'Horizontal (altitude, azimuth)' },
    { key: 'gridEcliptic', label: 'Ecliptic' },
    { key: 'gridGalactic', label: 'Galactic' },
  ] },
  { title: 'Foreground', rows: [
    { key: 'ground', label: 'True horizon' },
    { key: 'framing', label: 'Landscape framing (artistic)', needs: 'ground' },
  ] },
];

const trackColor = { true: color.peachDeep, false: 'rgba(255,255,255,0.14)' };
const webThumb = { activeThumbColor: '#fff' };

function Toggle({ label, value, onChange, disabled, inset }: { label: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean; inset?: boolean }) {
  return (
    <View style={[styles.row, inset && styles.inset, disabled && styles.off]}>
      <Text style={styles.label}>{label}</Text>
      <Switch value={value} disabled={disabled} onValueChange={onChange} trackColor={trackColor} thumbColor="#fff" accessibilityLabel={label} {...webThumb} />
    </View>
  );
}

function Diagnostics() {
  const [s, setS] = useState<PerfSnapshot>(perfSnapshot());
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => { setS(perfSnapshot()); setTick((n) => n + 1); }, 1000);
    return () => clearInterval(id);
  }, []);
  const n = (v: number) => Math.round(v).toLocaleString('en-US');
  const pack = deepPack();
  return (
    <View testID="sky-diagnostics" accessible accessibilityLabel={`Frame ${s.p50.toFixed(1)} milliseconds. ${n(s.drawn)} stars drawn of ${n(s.indexed)} indexed. Deep pack ${pack.status}.`}>
      <Text style={styles.stat}>Frame JS {s.p50.toFixed(1)} ms · p95 {s.p95.toFixed(1)} · worst {s.worst.toFixed(1)} ({s.frames})</Text>
      <Text style={styles.stat}>Stars drawn {n(s.drawn)} · scanned {n(s.scanned)} · loaded {n(s.loaded)} · indexed {n(s.indexed)}</Text>
      <Text style={styles.stat}>Deep pack {pack.status} · {n(pack.loadedStars)} of {n(DEEP_PACK.stars)} · {pack.loadedTiles} tiles{pack.badTiles ? ` · ${pack.badTiles} bad` : ''}</Text>
    </View>
  );
}

export function LayersPanel({ top, maxHeight }: { top: number; maxHeight: number }) {
  const layers = useStore((s) => s.layers);
  const mode = useStore((s) => s.skyMode);
  const settings = useStore((s) => s.modes[s.skyMode]);
  const nightVision = useStore((s) => s.nightVision);
  const faintest = settings.magnitudeCap >= NO_CAP ? 'Automatic' : `V ${settings.magnitudeCap.toFixed(1)}`;
  return (
    <View testID="sky-layers-panel" style={[styles.panel, { top, maxHeight }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>{MODE_LABELS[mode]} layers</Text>
          <Pressable testID="layers-reset" onPress={resetSkyMode} accessibilityRole="button" accessibilityLabel={`Reset ${MODE_LABELS[mode]} to its defaults`} hitSlop={8}>
            <Text style={styles.reset}>Reset</Text>
          </Pressable>
        </View>
        {GROUPS.map((g) => (
          <View key={g.title}>
            <Text style={styles.group}>{g.title}</Text>
            {g.rows.map((r) => (
              <Toggle key={r.key} label={r.label} value={layers[r.key]} onChange={(v) => setLayer(r.key, v)} disabled={r.needs ? !layers[r.needs] : false} inset={r.inset} />
            ))}
          </View>
        ))}
        <Toggle label="Night vision" value={nightVision} onChange={setNightVision} />
        <Text style={styles.group}>Density</Text>
        <Slider testID="layers-density" label="Star density" value={settings.density} min={0} max={1} step={0.05} format={(v) => `${v >= 0.5 ? '+' : '−'}${Math.abs((v - 0.5) * 3).toFixed(1)} mag`} onChange={setDensity} />
        <Slider testID="layers-magnitude" label="Faintest stars" value={settings.magnitudeCap} min={1} max={NO_CAP} step={0.5} format={() => faintest} onChange={setMagnitudeCap} />
        <Slider testID="layers-labels" label="Label density" value={settings.labelDensity} min={0} max={1} step={0.05} format={(v) => `${Math.round(v * 100)}%`} onChange={setLabelDensity} />
        <Text style={styles.group}>On this device</Text>
        <Diagnostics />
        <Text style={styles.note}>Stars come from Hipparcos, complete to about V 7.3. Fainter stars are real but increasingly sparse. Changing mode never moves an object.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { position: 'absolute', left: 18, right: 18, borderRadius: 18, backgroundColor: 'rgba(11,15,27,0.94)', borderWidth: StyleSheet.hairlineWidth, borderColor: color.hairlineStrong, overflow: 'hidden' },
  content: { paddingHorizontal: 16, paddingBottom: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, paddingBottom: 2 },
  title: { fontFamily: font.serif, fontSize: 22, lineHeight: 28, color: color.text },
  reset: { fontFamily: font.medium, fontSize: 13, color: color.peach },
  group: { fontFamily: font.medium, fontSize: 11, lineHeight: 14, letterSpacing: 2.4, textTransform: 'uppercase', color: color.textTertiary, marginTop: 14, marginBottom: 2 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  inset: { paddingLeft: 14 },
  off: { opacity: 0.45 },
  label: { fontFamily: font.regular, fontSize: 14, color: color.text, flexShrink: 1 },
  stat: { fontFamily: font.regular, fontSize: 12, lineHeight: 18, color: color.textSecondary, fontVariant: ['tabular-nums'] },
  note: { fontFamily: font.regular, fontSize: 12, lineHeight: 17, color: color.textTertiary, marginTop: 10 },
});
