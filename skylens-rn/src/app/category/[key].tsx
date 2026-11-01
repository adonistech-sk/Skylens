import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { constellationMeaning, constellationObject, constellations, deepSky, messier, SkyObject, TYPE_NAMES } from '../../data/catalog';
import { IconButton, Row } from '../../design/components';
import { ObjectThumb } from '../../design/Screen';
import { color, font, type } from '../../design/tokens';
import { formatMagnitude } from '../../state/format';
import { useStore } from '../../state/store';

export default function Category() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const insets = useSafeAreaInsets();
  const isCon = key === 'constellations';
  const proActive = useStore((s) => s.proActive);
  const rows = useMemo(() => {
    if (isCon) {
      return [...constellations].sort((a, b) => a.name.localeCompare(b.name)).map((c) => ({ object: constellationObject(c), subtitle: constellationMeaning(c.id) ?? c.genitive }));
    }
    const list = proActive ? [...messier(), ...deepSky.filter((d) => !d.deepSky?.messier)] : messier();
    return list.map((m: SkyObject) => ({ object: m, subtitle: `${m.designations.includes(m.id.slice(4)) ? `${m.id.slice(4)} · ` : ''}${TYPE_NAMES[m.type]} · Mag ${formatMagnitude(m.magnitude)}` }));
  }, [isCon, proActive]);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <IconButton name="back" label="Back" glass={false} onPress={() => router.back()} />
        <Text style={type.heading} accessibilityRole="header">{isCon ? 'Constellations' : 'Deep Sky'}</Text>
        <View style={{ width: 44 }} />
      </View>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.object.id}
        initialNumToRender={12}
        ListFooterComponent={!isCon && !proActive ? <Pressable accessibilityRole="button" onPress={() => router.push('/pro')} style={styles.more}><Text style={styles.moreText}>Unlock all 1,643 objects</Text></Pressable> : undefined}
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: insets.bottom + 16 }}
        renderItem={({ item, index }) => (
          <Row leading={<ObjectThumb object={item.object} />} title={item.object.name} subtitle={item.subtitle} last={index === rows.length - 1}
            onPress={() => router.push({ pathname: '/object/[id]', params: { id: item.object.id } })} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.base },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 8 },
  more: { paddingVertical: 18, alignItems: 'center' },
  moreText: { fontFamily: font.medium, fontSize: 14, color: color.peach },
});
