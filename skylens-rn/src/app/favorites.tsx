import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { object, TYPE_NAMES } from '../data/catalog';
import { IconButton, Row, SegmentedControl } from '../design/components';
import { Icon } from '../design/Icon';
import { ObjectThumb } from '../design/Screen';
import { color, font, type } from '../design/tokens';
import { OrderButtons } from '../features/lists/OrderButtons';
import { createList, moveFavorite, useStore } from '../state/store';

export default function Favorites() {
  const insets = useSafeAreaInsets();
  const favorites = useStore((s) => s.favorites);
  const lists = useStore((s) => s.lists);
  useStore((s) => s.catalogRevision); // Saved pack stars resolve just after launch.
  const [tab, setTab] = useState<'saved' | 'lists'>('saved');
  const [draft, setDraft] = useState('');
  const objects = favorites.map(object).filter((o) => o !== null);
  const create = () => { if (createList(draft)) setDraft(''); };
  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <IconButton name="back" label="Back" glass={false} onPress={() => (router.canGoBack() ? router.back() : router.replace('/more'))} />
        <Text style={type.heading} accessibilityRole="header">{tab === 'saved' ? 'Favorites' : 'Lists'}</Text>
        <View style={{ width: 44 }} />
      </View>
      <SegmentedControl style={styles.tabs} value={tab} onChange={setTab} options={[{ value: 'saved', label: 'Saved' }, { value: 'lists', label: 'Lists' }]} />
      {tab === 'saved' ? (
        <FlatList
          data={objects}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: insets.bottom + 16 }}
          ListEmptyComponent={<Text style={[type.body, { paddingTop: 24 }]}>Tap the star on any object to keep it here.</Text>}
          renderItem={({ item, index }) => (
            <Row leading={<ObjectThumb object={item} />} title={item.name} subtitle={TYPE_NAMES[item.type]} last={index === objects.length - 1}
              onPress={() => router.push({ pathname: '/object/[id]', params: { id: item.id } })}
              right={objects.length > 1 ? <OrderButtons name={item.name} first={index === 0} last={index === objects.length - 1} onMove={(o) => moveFavorite(item.id, o)} /> : undefined} />
          )}
        />
      ) : (
        <FlatList
          data={lists}
          keyExtractor={(l) => l.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: insets.bottom + 16 }}
          ListHeaderComponent={(
            <View style={styles.create}>
              <TextInput testID="lists-new-name" style={styles.input} value={draft} onChangeText={setDraft} placeholder="New list" placeholderTextColor={color.textTertiary} maxLength={40} returnKeyType="done" onSubmitEditing={create} accessibilityLabel="Name for a new list" />
              <Pressable testID="lists-create" onPress={create} disabled={!draft.trim()} style={[styles.add, !draft.trim() && { opacity: 0.4 }]} accessibilityRole="button" accessibilityLabel="Create list">
                <Icon name="plus" size={20} tint={color.peach} />
              </Pressable>
            </View>
          )}
          ListEmptyComponent={<Text style={[type.body, { paddingTop: 12 }]}>Group objects for a night out, a season or a target list.</Text>}
          renderItem={({ item, index }) => (
            <Row testID={`list-${item.name}`} title={item.name} subtitle={item.items.length === 1 ? '1 object' : `${item.items.length} objects`} last={index === lists.length - 1}
              onPress={() => router.push({ pathname: '/list/[id]', params: { id: item.id } })} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.base },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 8 },
  tabs: { marginHorizontal: 22, marginBottom: 6 },
  create: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 8 },
  input: { flex: 1, height: 44, paddingHorizontal: 14, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.07)', fontFamily: font.regular, fontSize: 15, color: color.text },
  add: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: color.peachLine },
});
