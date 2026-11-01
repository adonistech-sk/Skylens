import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { locate } from '../astronomy/locator';
import { object, TYPE_NAMES } from '../data/catalog';
import { IconButton, press, TabBar } from '../design/components';
import { Icon } from '../design/Icon';
import { color, font, type } from '../design/tokens';
import { CompassSession } from '../features/sky/CompassSession';
import { SkyHandle, SkyView } from '../features/sky/SkyView';
import { DEMO_MODE } from '../state/demo';
import { Layers, requestFocus, select, setLayer, skyTime, useObserver, useStore } from '../state/store';

const LAYERS: { key: keyof Layers; label: string }[] = [
  { key: 'constellations', label: 'Constellations' },
  { key: 'labels', label: 'Labels' },
  { key: 'planets', label: 'Planets, Sun and Moon' },
  { key: 'deepSky', label: 'Deep sky objects' },
  { key: 'milkyWay', label: 'Milky Way' },
  { key: 'artwork', label: 'Orion artwork' },
  { key: 'ground', label: 'Horizon' },
];

export default function SkyScreen() {
  const insets = useSafeAreaInsets();
  const handle = useRef<SkyHandle | null>(null);
  const [panel, setPanel] = useState<'none' | 'layers' | 'nav'>('none');
  const [compass, setCompass] = useState(false);
  const [compassNote, setCompassNote] = useState<string | null>(null);
  const orientation = useRef(null);
  const selection = useStore((s) => s.selection);
  const layers = useStore((s) => s.layers);
  const live = useStore((s) => s.clock.anchorSky === null);
  const observer = useObserver();

  const selected = selection ? object(selection) : null;
  const location = selected ? locate(selected, new Date(skyTime()), observer) : null;
  const controlsBottom = Math.max(insets.bottom, 14) + 10;

  return (
    <View style={styles.root}>
      <SkyView handleRef={handle} orientationRef={compass ? orientation : undefined} bottomInset={controlsBottom + 118} topInset={insets.top + 56}
        onTapObject={() => setPanel('none')} />
      {compass ? <CompassSession orientationRef={orientation} onMessage={setCompassNote} onUnavailable={() => { setCompass(false); setCompassNote('Motion sensors aren’t available on this device. Drag to explore.'); }} /> : null}
      {compassNote ? <Pressable onPress={() => setCompassNote(null)} style={[styles.note, { top: insets.top + 58 }]} accessibilityRole="button"><Text style={styles.noteText}>{compassNote}</Text></Pressable> : null}

      <View style={[styles.top, { top: insets.top + 6 }]} pointerEvents="box-none">
        <IconButton testID="sky-search" name="search" label="Search the sky" onPress={() => router.push('/search')} />
        <View style={{ flex: 1 }} pointerEvents="none" />
        <IconButton testID="sky-layers" name="layers" label="Sky layers" onPress={() => setPanel(panel === 'layers' ? 'none' : 'layers')} active={panel === 'layers'} />
      </View>

      {!live && !DEMO_MODE ? (
        <Pressable onPress={() => router.push('/time-travel')} style={[styles.simulated, { top: insets.top + 14 }]} accessibilityRole="button" accessibilityLabel="Simulated time. Open Time Travel.">
          <Text style={styles.simulatedText}>Simulated time</Text>
        </Pressable>
      ) : null}

      {panel === 'layers' ? (
        <View style={[styles.layers, { top: insets.top + 58 }]}>
          {LAYERS.map((l) => (
            <View key={l.key} style={styles.layerRow}>
              <Text style={styles.layerLabel}>{l.label}</Text>
              <Switch value={layers[l.key]} onValueChange={(v) => setLayer(l.key, v)} trackColor={{ true: color.peachDeep, false: 'rgba(255,255,255,0.14)' }} thumbColor="#fff" accessibilityLabel={l.label} />
            </View>
          ))}
        </View>
      ) : null}

      {selected && location ? (
        <Pressable testID="sky-selection" onPress={() => router.push({ pathname: '/object/[id]', params: { id: selected.id } })}
          style={({ pressed }) => [styles.card, { bottom: controlsBottom + 100 }, press(pressed)]} accessibilityRole="button" accessibilityLabel={`${selected.name}. Open details.`}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle} numberOfLines={1}>{selected.name}</Text>
            <Text style={type.caption} numberOfLines={2}>{TYPE_NAMES[selected.type]} · {location.explanation}</Text>
          </View>
          <Icon name="chevron" size={20} />
        </Pressable>
      ) : null}

      <View style={[styles.controls, { bottom: controlsBottom }]}>
        <IconButton testID="sky-compass" name="navigate" label={compass ? 'Turn off compass mode' : 'Follow the compass'} onPress={() => setCompass(!compass)} active={compass} size={50} />
        <IconButton testID="sky-time" name="calendar" label="Time Travel" onPress={() => router.push('/time-travel')} size={50} />
        <Pressable testID="sky-identify" accessibilityRole="button" accessibilityLabel="Identify what is in the centre of the view"
          onPress={() => {
            const id = handle.current?.identifyCentre() ?? null;
            if (id) { select(id); requestFocus(id); }
          }} style={({ pressed }) => [styles.identify, press(pressed)]}>
          <Icon name="scan" size={27} tint={color.peach} weight={1.5} />
        </Pressable>
        <Pressable testID="sky-ar" accessibilityRole="button" accessibilityLabel="AR Sky" onPress={() => router.push('/ar')} style={({ pressed }) => [styles.ar, press(pressed)]}>
          <Text style={styles.arText}>AR</Text>
        </Pressable>
        <IconButton testID="sky-more" name="dots" label="Open navigation" onPress={() => setPanel(panel === 'nav' ? 'none' : 'nav')} active={panel === 'nav'} size={50} />
      </View>

      {panel === 'nav' ? <TabBar floating /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050810' },
  top: { position: 'absolute', left: 18, right: 18, flexDirection: 'row', alignItems: 'center' },
  simulated: { position: 'absolute', alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 15, borderWidth: 1, borderColor: color.peachLine, backgroundColor: 'rgba(14,19,32,0.7)' },
  simulatedText: { fontFamily: font.medium, fontSize: 12, color: color.peach },
  note: { position: 'absolute', left: 74, right: 74, padding: 10, borderRadius: 14, backgroundColor: 'rgba(11,15,27,0.88)' },
  noteText: { fontFamily: font.medium, fontSize: 12.5, lineHeight: 17, color: color.text, textAlign: 'center' },
  layers: { position: 'absolute', right: 18, width: 250, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(11,15,27,0.94)', borderWidth: StyleSheet.hairlineWidth, borderColor: color.hairlineStrong },
  layerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  layerLabel: { fontFamily: font.regular, fontSize: 14, color: color.text },
  card: { position: 'absolute', left: 18, right: 18, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, backgroundColor: 'rgba(11,15,27,0.92)', borderWidth: StyleSheet.hairlineWidth, borderColor: color.hairlineStrong },
  cardTitle: { fontFamily: font.serif, fontSize: 22, lineHeight: 26, color: color.text },
  controls: { position: 'absolute', left: 18, right: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  identify: { width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: color.peach, backgroundColor: 'rgba(40,24,20,0.5)', shadowColor: color.peach, shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } },
  ar: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(14,19,32,0.62)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.18)' },
  arText: { fontFamily: font.semibold, fontSize: 15, color: color.text },
});
