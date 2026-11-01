import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { object } from '../data/catalog';
import { search } from '../data/search';
import { IconButton, Row } from '../design/components';
import { Icon } from '../design/Icon';
import { ObjectThumb } from '../design/Screen';
import { color, font, type } from '../design/tokens';

const SUGGESTIONS = ['Andromeda Galaxy', 'Orion Nebula', 'Jupiter', 'Betelgeuse', 'Pleiades', 'Saturn'];

export default function Search() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const results = useMemo(() => search(query, 30), [query]);
  const open = (id: string) => router.push({ pathname: '/object/[id]', params: { id } });

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
          <Text style={[type.tracked, { marginBottom: 6 }]}>Try</Text>
          {SUGGESTIONS.map((s) => <Row key={s} title={s} onPress={() => setQuery(s)} />)}
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(r) => r.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: insets.bottom + 16 }}
          ListEmptyComponent={<Text style={[type.body, { paddingVertical: 24 }]}>Nothing matches “{query}”.</Text>}
          renderItem={({ item, index }) => {
            const o = object(item.id);
            return (
              <Row testID={`result-${item.name}`} leading={o ? <ObjectThumb object={o} size={46} /> : undefined} title={item.name}
                subtitle={item.matchedAlias ? `${item.matchedAlias} · ${item.category}` : item.category} last={index === results.length - 1} onPress={() => open(item.id)} />
            );
          }}
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
