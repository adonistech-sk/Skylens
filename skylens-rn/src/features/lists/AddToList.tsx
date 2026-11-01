import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Icon } from '../../design/Icon';
import { color, font, type } from '../../design/tokens';
import { addToList, createList, removeFromList, toggleFavorite, useStore } from '../../state/store';

/** Saves one object to favorites or any list, and makes a new list without leaving. */
export function AddToList({ id, name, onClose }: { id: string; name: string; onClose: () => void }) {
  const lists = useStore((s) => s.lists);
  const favorite = useStore((s) => s.favorites.includes(id));
  const [draft, setDraft] = useState('');
  const create = () => { if (createList(draft, id)) setDraft(''); };
  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
        <View testID="add-to-list" style={styles.panel} accessibilityViewIsModal>
          <Text style={type.heading} numberOfLines={1}>Add {name}</Text>
          <ScrollView style={styles.rows} keyboardShouldPersistTaps="handled">
            <Pressable testID="list-toggle-favorites" onPress={() => toggleFavorite(id)} style={styles.row} accessibilityRole="checkbox" accessibilityState={{ checked: favorite }} accessibilityLabel="Favorites">
              <Text style={styles.rowText}>Favorites</Text>
              {favorite ? <Icon name="star" size={18} tint={color.peach} filled /> : null}
            </Pressable>
            {lists.map((l) => {
              const inside = l.items.includes(id);
              return (
                <Pressable key={l.id} testID={`list-toggle-${l.name}`} onPress={() => (inside ? removeFromList(l.id, id) : addToList(l.id, id))} style={styles.row} accessibilityRole="checkbox" accessibilityState={{ checked: inside }} accessibilityLabel={l.name}>
                  <Text style={styles.rowText} numberOfLines={1}>{l.name}</Text>
                  {inside ? <Icon name="star" size={18} tint={color.peach} filled /> : <Text style={styles.count}>{l.items.length}</Text>}
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={styles.create}>
            <TextInput testID="list-new-name" style={styles.input} value={draft} onChangeText={setDraft} placeholder="New list" placeholderTextColor={color.textTertiary} maxLength={40} returnKeyType="done" onSubmitEditing={create} accessibilityLabel="Name for a new list" />
            <Pressable testID="list-create" onPress={create} disabled={!draft.trim()} style={[styles.add, !draft.trim() && { opacity: 0.4 }]} accessibilityRole="button" accessibilityLabel="Create list and add this object">
              <Icon name="plus" size={20} tint={color.peach} />
            </Pressable>
          </View>
          <Pressable testID="list-done" onPress={onClose} style={styles.done} accessibilityRole="button"><Text style={styles.doneText}>Done</Text></Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', padding: 22, backgroundColor: 'rgba(3,5,10,0.6)' },
  panel: { maxHeight: '76%', padding: 18, borderRadius: 20, backgroundColor: color.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: color.hairlineStrong },
  rows: { marginTop: 8, flexGrow: 0 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 46, gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.hairline },
  rowText: { flex: 1, fontFamily: font.regular, fontSize: 15, color: color.text },
  count: { fontFamily: font.regular, fontSize: 13, color: color.textTertiary, fontVariant: ['tabular-nums'] },
  create: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  input: { flex: 1, height: 44, paddingHorizontal: 14, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.07)', fontFamily: font.regular, fontSize: 15, color: color.text },
  add: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: color.peachLine },
  done: { alignSelf: 'center', paddingHorizontal: 24, paddingVertical: 12, marginTop: 6 },
  doneText: { fontFamily: font.medium, fontSize: 15, color: color.peach },
});
