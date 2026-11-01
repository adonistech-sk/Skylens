import { getCalendars } from 'expo-localization';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton, Row, SecondaryButton } from '../design/components';
import { Icon } from '../design/Icon';
import { color, font, type } from '../design/tokens';
import { normalize } from '../data/search';
import { CITIES, City } from '../features/location/cities';
import { leaveLocationFlow } from '../features/location/leave';
import { completeOnboarding, setLocation, useStore } from '../state/store';

export default function LocationSearch() {
  const insets = useSafeAreaInsets();
  const onboarded = useStore((s) => s.onboarded);
  const first = useLocalSearchParams<{ first?: string }>().first === '1' || !onboarded;
  const [query, setQuery] = useState('');
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');

  const results = useMemo(() => {
    const q = normalize(query);
    return q ? CITIES.filter((c) => normalize(`${c.name} ${c.country}`).includes(q)) : CITIES;
  }, [query]);

  const finish = () => {
    completeOnboarding();
    leaveLocationFlow(first);
  };
  const pick = (c: City) => {
    setLocation({ name: c.name, latitude: c.lat, longitude: c.lon, elevation: c.m, timeZone: c.tz, source: 'manual' });
    finish();
  };
  const latitude = Number(lat.replace(',', '.')), longitude = Number(lon.replace(',', '.'));
  const validCoords = lat !== '' && lon !== '' && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180 && !Number.isNaN(latitude) && !Number.isNaN(longitude);
  const useCoords = () => {
    const timeZone = getCalendars()[0]?.timeZone ?? 'Etc/UTC';
    setLocation({ name: `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`, latitude, longitude, elevation: 0, timeZone, source: 'manual' });
    finish();
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <IconButton name="back" label="Back" glass={false} onPress={() => router.back()} />
        <Text style={type.heading}>Choose a place</Text>
        <View style={{ width: 44 }} />
      </View>
      <View style={styles.search}>
        <Icon name="search" size={19} tint={color.textSecondary} />
        <TextInput testID="city-input" style={styles.input} value={query} onChangeText={setQuery} placeholder="City or country" placeholderTextColor={color.textTertiary} autoCorrect={false} accessibilityLabel="Search for a city or country" />
      </View>
      <FlatList
        data={results}
        keyExtractor={(c) => c.name}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: insets.bottom + 16 }}
        ListHeaderComponent={query ? undefined : (
          <View style={styles.coords}>
            <Text style={type.micro}>Or enter coordinates, north and east positive</Text>
            <View style={styles.coordRow}>
              <TextInput style={styles.coord} value={lat} onChangeText={setLat} placeholder="Latitude" placeholderTextColor={color.textTertiary} keyboardType="numbers-and-punctuation" accessibilityLabel="Latitude" />
              <TextInput style={styles.coord} value={lon} onChangeText={setLon} placeholder="Longitude" placeholderTextColor={color.textTertiary} keyboardType="numbers-and-punctuation" accessibilityLabel="Longitude" />
            </View>
            {validCoords ? <SecondaryButton label="Use these coordinates" onPress={useCoords} style={{ marginTop: 10 }} /> : null}
          </View>
        )}
        ListEmptyComponent={<Text style={[type.body, { paddingVertical: 24 }]}>No place matches. Coordinates work anywhere on Earth: clear the search to enter them.</Text>}
        renderItem={({ item, index }) => <Row testID={`city-${item.name}`} title={item.name} subtitle={item.country} onPress={() => pick(item)} last={index === results.length - 1} />}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.base },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 8 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 22, marginBottom: 8, paddingHorizontal: 14, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.06)' },
  input: { flex: 1, fontFamily: font.regular, fontSize: 16, color: color.text, height: 44 },
  coords: { paddingVertical: 10 },
  coordRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  coord: { flex: 1, height: 44, borderRadius: 12, paddingHorizontal: 12, fontFamily: font.regular, fontSize: 15, color: color.text, backgroundColor: 'rgba(255,255,255,0.06)' },
});
