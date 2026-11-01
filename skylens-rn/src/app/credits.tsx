import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton } from '../design/components';
import { color, font, type } from '../design/tokens';
import { CREDITS, DATA_SOURCES } from '../data/credits';

export default function Credits() {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 12 }}>
        <IconButton name="back" label="Back" glass={false} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: insets.bottom + 22 }}>
        <Text style={type.title} accessibilityRole="header">Credits</Text>
        <Text style={styles.section}>Imagery</Text>
        {CREDITS.map((c) => (
          <View key={c.used} style={styles.item}>
            <Text style={styles.used}>{c.used}</Text>
            <Text style={type.caption}>{c.credit}</Text>
            <Text style={styles.license}>{c.license}{c.edits ? ` · ${c.edits}` : ''}</Text>
          </View>
        ))}
        <Text style={styles.section}>Data and software</Text>
        {DATA_SOURCES.map((d) => <Text key={d} style={[type.caption, { paddingVertical: 5 }]}>{d}</Text>)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.base },
  section: { ...type.tracked, marginTop: 24, marginBottom: 6 },
  item: { paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.hairline },
  used: { fontFamily: font.medium, fontSize: 14, color: color.text },
  license: { fontFamily: font.regular, fontSize: 12, color: color.textTertiary, marginTop: 2 },
});
