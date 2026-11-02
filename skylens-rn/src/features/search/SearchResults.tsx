import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { bodyObject, object, TYPE_NAMES } from '../../data/catalog';
import { loadDeepSearch } from '../../data/catalogs/runtime';
import { Category, normalize, prepareSearch, search, SearchResult } from '../../data/search';
import { Row } from '../../design/components';
import { ObjectThumb } from '../../design/Screen';
import { color, font, type } from '../../design/tokens';
import { FeatureIndex, featureType } from '../moon/moonData';
import { loadLunarFeatures } from '../moon/moonStore';
import { clearRecents, useStore } from '../../state/store';

export const CATEGORIES: (Category | 'All')[] = ['All', 'Solar System', 'Moon', 'Stars', 'Constellations', 'Deep Sky'];

export type DeepSearchState = 'loading' | 'ready' | 'failed';

/** Lunar features live in the atlas, which opens centred on the one chosen. */
export const openLunar = (id: string) => router.push({ pathname: '/moon-atlas', params: { feature: id } });

const lunarResults = (index: FeatureIndex | null, query: string, limit: number): SearchResult[] =>
  (index ? index.search(query, limit) : []).map((f, i) => ({ id: f.id, name: f.name, matchedAlias: null, category: 'Moon', score: 1 - i / 100, detail: `${featureType(f.code)} on the Moon${f.diameter ? ` · ${f.diameter >= 10 ? Math.round(f.diameter) : f.diameter.toFixed(1)} km` : ''}` }));

/** Search across every catalog. Bundled results are immediate, the pack joins when it's read. */
export function useUniversalSearch(query: string, category: Category | 'All', limit = 30) {
  const [deep, setDeep] = useState<DeepSearchState>('loading');
  useEffect(() => {
    let live = true;
    // After the first paint, because building the index is real work on a phone.
    const id = setTimeout(() => {
      prepareSearch();
      loadDeepSearch().then((ok) => { if (live) setDeep(ok ? 'ready' : 'failed'); }).catch(() => { if (live) setDeep('failed'); });
    }, 0);
    return () => { live = false; clearTimeout(id); };
  }, []);
  const [lunar, setLunar] = useState<FeatureIndex | null>(null);
  useEffect(() => {
    let live = true;
    const id = setTimeout(() => { loadLunarFeatures().then((i) => { if (live) setLunar(i); }); }, 0);
    return () => { live = false; clearTimeout(id); };
  }, []);
  const results = useMemo(() => {
    if (category === 'Moon') return lunarResults(lunar, query, limit);
    const sky = search(query, limit, category === 'All' ? undefined : category);
    // Sky objects keep first place: lunar names follow unless the name is an exact match.
    if (category !== 'All') return sky;
    const moon = lunarResults(lunar, query, 6);
    const exact = moon.filter((m) => normalize(m.name) === normalize(query));
    return [...exact, ...sky, ...moon.filter((m) => !exact.includes(m))].slice(0, limit);
  }, [query, category, limit, deep, lunar]);
  return { results, deep };
}

export function CategoryChips({ value, onChange }: { value: Category | 'All'; onChange: (c: Category | 'All') => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.chips}>
      {CATEGORIES.map((c) => {
        const on = c === value;
        return (
          <Pressable key={c} testID={`chip-${c}`} onPress={() => onChange(c)} accessibilityRole="button" accessibilityState={{ selected: on }} style={[styles.chip, on && styles.chipOn]}>
            <Text style={[styles.chipText, on && styles.chipTextOn]}>{c}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function ResultRow({ item, last, onPress }: { item: SearchResult; last?: boolean; onPress: () => void }) {
  const o = object(item.id);
  const kind = item.detail ?? (o ? TYPE_NAMES[o.type] : item.category);
  const lunar = item.id.startsWith('lunar:');
  return (
    <Row testID={`result-${item.name}`} leading={o ? <ObjectThumb object={o} size={46} /> : lunar ? <ObjectThumb object={bodyObject('moon')} size={46} /> : <View style={styles.blank} />} title={item.name}
      subtitle={item.matchedAlias ? `${item.matchedAlias} · ${kind}` : kind} last={last} onPress={onPress} />
  );
}

/** Objects opened before. An ID that can't be resolved yet is skipped, not shown broken. */
export function RecentRows({ onPick }: { onPick: (id: string) => void }) {
  const recents = useStore((s) => s.recents);
  useStore((s) => s.catalogRevision);
  const shown = recents.map(object).filter((o) => o !== null).slice(0, 6);
  if (!shown.length) return null;
  return (
    <View testID="search-recents">
      <View style={styles.head}>
        <Text style={type.tracked}>Recent</Text>
        <Pressable testID="recents-clear" onPress={clearRecents} accessibilityRole="button" accessibilityLabel="Clear recent searches" hitSlop={8}><Text style={styles.clear}>Clear</Text></Pressable>
      </View>
      {shown.map((o, i) => <Row key={o.id} leading={<ObjectThumb object={o} size={46} />} title={o.name} subtitle={TYPE_NAMES[o.type]} last={i === shown.length - 1} onPress={() => onPick(o.id)} />)}
    </View>
  );
}

export const deepNote = (deep: DeepSearchState) => (deep === 'failed' ? 'The deep star pack could not be read, so faint Hipparcos stars are missing from these results.' : null);

const styles = StyleSheet.create({
  chips: { gap: 8, paddingVertical: 8 },
  chip: { paddingHorizontal: 13, height: 32, justifyContent: 'center', borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: color.hairlineStrong },
  chipOn: { backgroundColor: color.peachFill, borderColor: color.peachLine },
  chipText: { fontFamily: font.medium, fontSize: 13, color: color.textSecondary },
  chipTextOn: { color: color.text },
  blank: { width: 46, height: 46, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)' },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  clear: { fontFamily: font.medium, fontSize: 13, color: color.peach },
});
