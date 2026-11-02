import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { IAU_NOTE, NO_MYTH, ORIGIN_TEXT, storyOf } from '../../data/constellationStories';
import { tourFor } from '../../data/constellationTours';
import { Row } from '../../design/components';
import { color, font, type } from '../../design/tokens';
import { beginTour } from '../sky/tour';

/**
 * A constellation's story, kept in three parts so that what is measured, what is history and
 * what is told are never mistaken for each other.
 */
export function ConstellationStory({ id }: { id: string }) {
  const story = storyOf(id);
  const tour = tourFor(id);
  if (!story) return null;
  const start = () => { beginTour(id); router.dismissTo('/sky'); };
  return (
    <View testID="constellation-story" style={{ marginTop: 14 }}>
      {tour ? <Row testID="detail-tour" title="Guided exploration" subtitle={`${tour.stops.length} stops, placed by the sky engine`} last onPress={start} /> : null}
      <Text style={styles.heading}>The science</Text>
      <Text style={styles.copy}>{story.science}</Text>
      <Text style={styles.heading}>History</Text>
      <Text style={styles.copy}>{ORIGIN_TEXT[story.origin]}{story.history ? ` ${story.history}` : ''}</Text>
      <Text style={styles.note}>{IAU_NOTE}</Text>
      <Text style={styles.heading}>Stories people tell</Text>
      <Text testID="story-disclaimer" style={styles.note}>These are traditions, not astronomy. Each belongs to the people named, and none describes the stars themselves.</Text>
      {story.traditions.length ? story.traditions.map((t) => (
        <View key={t.culture} testID="story-tradition" style={styles.tradition}>
          <Text style={styles.culture}>{t.culture}</Text>
          <Text style={styles.copy}>{t.text}</Text>
          {t.source ? <Text style={styles.source}>{t.source}</Text> : null}
        </View>
      )) : <Text style={styles.copy}>{NO_MYTH}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { ...type.heading, marginTop: 18, marginBottom: 4 },
  copy: { fontFamily: font.regular, fontSize: 15, lineHeight: 22, color: color.text },
  note: { fontFamily: font.regular, fontSize: 13, lineHeight: 19, color: color.textSecondary, marginTop: 8 },
  tradition: { marginTop: 12, paddingLeft: 12, borderLeftWidth: 1.5, borderLeftColor: color.peachLine },
  culture: { fontFamily: font.medium, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: color.peach, marginBottom: 3 },
  source: { fontFamily: font.regular, fontSize: 12.5, lineHeight: 18, color: color.textTertiary, marginTop: 3 },
});
