import { router } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { object, TYPE_NAMES } from '../data/catalog';
import { IconButton, Row } from '../design/components';
import { ObjectThumb } from '../design/Screen';
import { color, type } from '../design/tokens';
import { useStore } from '../state/store';

export default function Favorites() {
  const insets = useSafeAreaInsets();
  const favorites = useStore((s) => s.favorites);
  const objects = favorites.map(object).filter((o) => o !== null);
  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <IconButton name="back" label="Back" glass={false} onPress={() => router.back()} />
        <Text style={type.heading} accessibilityRole="header">Favorites</Text>
        <View style={{ width: 44 }} />
      </View>
      <FlatList
        data={objects}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: insets.bottom + 16 }}
        ListEmptyComponent={<Text style={[type.body, { paddingTop: 24 }]}>Tap the star on any object to keep it here.</Text>}
        renderItem={({ item, index }) => (
          <Row leading={<ObjectThumb object={item} />} title={item.name} subtitle={TYPE_NAMES[item.type]} last={index === objects.length - 1}
            onPress={() => router.push({ pathname: '/object/[id]', params: { id: item.id } })} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.base },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 8 },
});
