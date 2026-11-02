import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ObjectLocation } from '../../astronomy/locator';
import { constellationName, SkyObject } from '../../data/catalog';
import { tourFor } from '../../data/constellationTours';
import { press } from '../../design/components';
import { Icon } from '../../design/Icon';
import { color, font, type } from '../../design/tokens';
import { endTour, stepTour } from './tour';

interface Props {
  constellation: string;
  index: number;
  object: SkyObject;
  location: ObjectLocation;
  /** Directions when the stop is off screen. */
  guide: string | null;
  inline?: boolean;
}

/** One stop of a guided tour. The sky above it stays live: only this card replaces the selection card. */
export function TourCard({ constellation, index, object: o, location, guide, inline }: Props) {
  const tour = tourFor(constellation);
  const stop = tour?.stops[index];
  if (!tour || !stop) return null;
  const last = index === tour.stops.length - 1;
  const name = constellationName(constellation) ?? constellation;
  return (
    <View testID="tour-card" style={[styles.card, inline && styles.inline]}>
      <View style={styles.head}>
        <Text style={styles.kicker} numberOfLines={1}>{name} · Stop {index + 1} of {tour.stops.length}</Text>
        <Pressable testID="tour-exit" onPress={() => endTour()} hitSlop={8} accessibilityRole="button" accessibilityLabel="End the guided tour"><Icon name="close" size={16} tint={color.textSecondary} /></Pressable>
      </View>
      <View style={styles.progress} accessible accessibilityLabel={`Stop ${index + 1} of ${tour.stops.length}`}>
        {tour.stops.map((s, i) => <View key={s.id} style={[styles.pip, i <= index && styles.pipOn]} />)}
      </View>
      <Pressable testID="tour-open" onPress={() => router.push({ pathname: '/object/[id]', params: { id: o.id } })} style={({ pressed }) => press(pressed)} accessibilityRole="button" accessibilityLabel={`${stop.title ?? o.name}. Open details.`}>
        <Text style={styles.title} numberOfLines={1}>{stop.title ?? o.name}</Text>
        <Text style={styles.note} numberOfLines={3}>{stop.note}</Text>
        <Text style={type.caption} numberOfLines={2}>{location.explanation}</Text>
        {guide ? <Text testID="tour-guide" style={styles.guide} numberOfLines={1}>{guide}</Text> : null}
      </Pressable>
      <View style={styles.actions}>
        <Pressable testID="tour-prev" disabled={index === 0} onPress={() => stepTour(-1)} style={({ pressed }) => [styles.action, index === 0 && styles.off, press(pressed)]} accessibilityRole="button" accessibilityLabel="Previous stop">
          <Icon name="back" size={17} tint={color.peach} /><Text style={styles.actionText}>Back</Text>
        </Pressable>
        <Pressable testID="tour-next" onPress={() => stepTour(1)} style={({ pressed }) => [styles.action, press(pressed)]} accessibilityRole="button" accessibilityLabel={last ? 'Finish the tour' : 'Next stop'}>
          <Text style={styles.actionText}>{last ? 'Finish' : 'Next'}</Text><Icon name="chevron" size={17} tint={color.peach} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { paddingHorizontal: 14, paddingTop: 11, paddingBottom: 3, borderRadius: 18, backgroundColor: 'rgba(11,15,27,0.92)', borderWidth: StyleSheet.hairlineWidth, borderColor: color.hairlineStrong },
  inline: { backgroundColor: 'rgba(255,255,255,0.04)' },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  kicker: { flex: 1, fontFamily: font.medium, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: color.textTertiary },
  progress: { flexDirection: 'row', gap: 4, marginTop: 7, marginBottom: 6 },
  pip: { flex: 1, height: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.16)' },
  pipOn: { backgroundColor: color.peach },
  title: { fontFamily: font.serif, fontSize: 22, lineHeight: 27, color: color.text },
  note: { fontFamily: font.regular, fontSize: 13.5, lineHeight: 19, color: color.text, marginTop: 2, marginBottom: 3 },
  guide: { fontFamily: font.medium, fontSize: 12.5, lineHeight: 17, color: color.peach, marginTop: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', marginTop: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.hairline },
  action: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, height: 42 },
  actionText: { fontFamily: font.medium, fontSize: 13, color: color.text },
  off: { opacity: 0.35 },
});
