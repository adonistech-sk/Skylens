import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { object, TYPE_NAMES } from '../../data/catalog';
import { IconButton, Row } from '../../design/components';
import { ObjectThumb } from '../../design/Screen';
import { color, font, type } from '../../design/tokens';
import { OrderButtons } from '../../features/lists/OrderButtons';
import { deleteList, moveInList, removeFromList, renameList, useStore } from '../../state/store';

export default function ListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const list = useStore((s) => s.lists.find((l) => l.id === id) ?? null);
  useStore((s) => s.catalogRevision); // Saved pack stars resolve just after launch.
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(list?.name ?? '');
  const [confirming, setConfirming] = useState(false);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/favorites'));

  if (!list) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 60, paddingHorizontal: 24 }]}>
        <Text style={type.heading}>This list no longer exists.</Text>
        <IconButton name="back" label="Back" onPress={back} style={{ marginTop: 20 }} />
      </View>
    );
  }

  const objects = list.items.map((i) => ({ id: i, object: object(i) }));
  const save = () => { renameList(list.id, name); setEditing(false); };
  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <IconButton name="back" label="Back" glass={false} onPress={back} />
        {editing ? (
          <TextInput testID="list-rename" style={styles.title} value={name} onChangeText={setName} autoFocus maxLength={40} onSubmitEditing={save} onBlur={save} returnKeyType="done" accessibilityLabel="List name" />
        ) : (
          <Pressable testID="list-title" onPress={() => { setName(list.name); setEditing(true); }} accessibilityRole="button" accessibilityLabel={`${list.name}. Rename.`} style={{ flex: 1 }}>
            <Text style={[type.heading, { textAlign: 'center' }]} numberOfLines={1}>{list.name}</Text>
          </Pressable>
        )}
        <View style={{ width: 44 }} />
      </View>
      <FlatList
        data={objects}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: insets.bottom + 16 }}
        ListEmptyComponent={<Text style={[type.body, { paddingTop: 24 }]}>Nothing here yet. Add objects from the sky or from any detail page.</Text>}
        renderItem={({ item, index }) => {
          const label = item.object?.name ?? item.id;
          return (
            <Row testID={`list-item-${label}`} leading={item.object ? <ObjectThumb object={item.object} /> : undefined} title={label} subtitle={item.object ? TYPE_NAMES[item.object.type] : 'Loading from the star pack'} last={index === objects.length - 1}
              onPress={item.object ? () => router.push({ pathname: '/object/[id]', params: { id: item.id } }) : undefined}
              right={(
                <View style={styles.rowEnd}>
                  <OrderButtons name={label} first={index === 0} last={index === objects.length - 1} onMove={(o) => moveInList(list.id, item.id, o)} />
                  <IconButton name="close" label={`Remove ${label}`} size={36} iconSize={16} glass={false} tint={color.textSecondary} onPress={() => removeFromList(list.id, item.id)} />
                </View>
              )} />
          );
        }}
        ListFooterComponent={(
          <Pressable testID="list-delete" onPress={() => { if (confirming) { deleteList(list.id); back(); } else setConfirming(true); }} style={styles.delete} accessibilityRole="button" accessibilityLabel={confirming ? `Confirm deleting ${list.name}` : `Delete ${list.name}`}>
            <Text style={styles.deleteText}>{confirming ? 'Tap again to delete this list' : 'Delete list'}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.base },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 8 },
  title: { flex: 1, textAlign: 'center', fontFamily: font.serif, fontSize: 24, lineHeight: 30, color: color.text, padding: 0 },
  rowEnd: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  delete: { alignSelf: 'center', padding: 16, marginTop: 12 },
  deleteText: { fontFamily: font.medium, fontSize: 14, color: color.danger },
});
