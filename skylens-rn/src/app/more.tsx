import { router } from 'expo-router';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { Row } from '../design/components';
import { Icon, IconName } from '../design/Icon';
import { Page } from '../design/Screen';
import { color, font } from '../design/tokens';
import { setNightVision, setUse24h, useObserver, useStore } from '../state/store';

const Lead = ({ icon }: { icon: IconName }) => <View style={styles.lead}><Icon name={icon} size={22} tint={color.peach} weight={1.4} /></View>;
const Toggle = ({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) => (
  <Switch value={value} onValueChange={onChange} accessibilityLabel={label} trackColor={{ true: color.peachDeep, false: 'rgba(255,255,255,0.14)' }} thumbColor="#fff" />
);

export default function More() {
  const observer = useObserver();
  const favorites = useStore((s) => s.favorites);
  const use24h = useStore((s) => s.use24h);
  const nightVision = useStore((s) => s.nightVision);
  const proActive = useStore((s) => s.proActive);

  return (
    <Page title="More">
      <View style={styles.list}>
        <Row testID="more-pro" leading={<Lead icon="crown" />} title="SkyLens Pro" subtitle={proActive ? 'Active' : 'Unlock the complete experience'} onPress={() => router.push('/pro')} />
        <Row testID="more-favorites" leading={<Lead icon="star" />} title="Favorites" subtitle={favorites.length ? `${favorites.length} saved` : 'Objects you star appear here'} onPress={() => router.push('/favorites')} />
        <Row testID="more-location" leading={<Lead icon="pin" />} title="Location" subtitle={observer.name} onPress={() => router.push('/location')} />
        <Row leading={<Lead icon="nightEye" />} title="Night vision" subtitle="Red star map that protects dark adaptation" right={<Toggle value={nightVision} onChange={setNightVision} label="Night vision" />} />
        <Row leading={<Lead icon="calendar" />} title="24-hour time" right={<Toggle value={use24h} onChange={setUse24h} label="24-hour time" />} />
        <Row leading={<Lead icon="doc" />} title="Credits and data sources" subtitle="Imagery, catalogs and licenses" onPress={() => router.push('/credits')} />
        <Row leading={<Lead icon="shield" />} title="Privacy" onPress={() => router.push('/privacy')} last />
      </View>
      <Text style={styles.foot}>Astronomy Engine · Hipparcos · NASA · ESA</Text>
    </Page>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 22 },
  lead: { width: 40, alignItems: 'center' },
  foot: { fontFamily: font.regular, fontSize: 12, color: color.textTertiary, textAlign: 'center', marginTop: 22 },
});
