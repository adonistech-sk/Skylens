import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Category } from '../data/search';
import { IconButton, Notice, Row } from '../design/components';
import { Icon } from '../design/Icon';
import { color, font, type } from '../design/tokens';
import { CategoryChips, deepNote, RecentRows, ResultRow, useUniversalSearch } from '../features/search/SearchResults';
import { rememberRecent } from '../state/store';

const SUGGESTIONS = ['Andromeda Galaxy', 'Orion Nebula', 'Jupiter', 'Betelgeuse', 'Pleiades', 'Saturn'];

export default function Search() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | 'All'>('All');
  const { results, deep } = useUniversalSearch(query, category);
  const open = (id: string) => { rememberRecent(id); router.push({ pathname: '/object/[id]', params: { id } }); };
  const note = deepNote(deep);

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.bar, { paddingTop: insets.top + 10 }]}>
        <View style={styles.field}>
          <Icon name="search" size={19} tint={color.textSecondary} />
          <TextInput testID="search-input" style={styles.input} autoFocus value={query} onChangeText={setQuery} placeholder="Stars, planets, galaxies, M31…" placeholderTextColor={color.textTertiary} autoCorrect={false} returnKeyType="search" accessibilityLabel="Search the sky" />
        </View>
        <IconButton name="close" label="Close search" glass={false} onPress={() => router.back()} />
      </View>
      {query.trim() === '' ? (
        <View style={styles.suggest}>
          <RecentRows onPick={open} />
          <Text style={[type.tracked, { marginBottom: 6, marginTop: 14 }]}>Try</Text>
          {SUGGESTIONS.map((s) => <Row key={s} title={s} onPress={() => setQuery(s)} />)}
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(r) => r.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: insets.bottom + 16 }}
          ListHeaderComponent={<><CategoryChips value={category} onChange={setCategory} />{note ? <Notice text={note} tone="warn" /> : null}</>}
          ListEmptyComponent={<Text style={[type.body, { paddingVertical: 24 }]}>Nothing matches “{query}”.</Text>}
          renderItem={({ item, index }) => <ResultRow item={item} last={index === results.length - 1} onPress={() => open(item.id)} />}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.base },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 18, paddingRight: 8, paddingBottom: 8 },
  field: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.07)' },
  input: { flex: 1, fontFamily: font.regular, fontSize: 16, color: color.text, height: 44 },
  suggest: { paddingHorizontal: 22, paddingTop: 16 },
});
