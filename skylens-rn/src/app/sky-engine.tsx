import { router } from 'expo-router';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton, Row } from '../design/components';
import { color, type } from '../design/tokens';
import { DEEP_PACK } from '../data/generated/deepPack';
import { Flags } from '../state/flags';
import { setFlag, useStore } from '../state/store';

const ROWS: { key: keyof Flags; title: string; subtitle: string }[] = [
  { key: 'catalogsV1', title: 'Spatial star index', subtitle: 'Off uses the original full scan of the catalog' },
  { key: 'skyModes', title: 'Sky modes', subtitle: 'Off keeps a single sky with no mode switch' },
  { key: 'deepPack', title: 'Deep star pack', subtitle: `${DEEP_PACK.stars.toLocaleString('en-US')} more Hipparcos stars in Deep Atlas` },
];

/** Lets a tester compare or turn off new sky work on a device, without a new build. */
export default function SkyEngine() {
  const insets = useSafeAreaInsets();
  const flags = useStore((s) => s.flags);
  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <IconButton name="back" label="Back" glass={false} onPress={() => (router.canGoBack() ? router.back() : router.replace('/more'))} />
        <Text style={type.heading} accessibilityRole="header">Sky engine</Text>
        <View style={{ width: 44 }} />
      </View>
      <View style={styles.list}>
        {ROWS.map((r, i) => (
          <Row key={r.key} title={r.title} subtitle={r.subtitle} last={i === ROWS.length - 1}
            right={<Switch testID={`flag-${r.key}`} value={flags[r.key]} onValueChange={(v) => setFlag(r.key, v)} accessibilityLabel={r.title} trackColor={{ true: color.peachDeep, false: 'rgba(255,255,255,0.14)' }} thumbColor="#fff" />} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.base },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 8 },
  list: { paddingHorizontal: 22 },
});
