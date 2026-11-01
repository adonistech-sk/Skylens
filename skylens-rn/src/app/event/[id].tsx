import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton, Row, SecondaryButton } from '../../design/components';
import { ObjectThumb } from '../../design/Screen';
import { color, font, type } from '../../design/tokens';
import { bodyObject } from '../../data/catalog';
import { EventThumb } from '../../features/events/EventThumb';
import { eventById } from '../../features/events/useEvents';
import { formatLongDate, formatTime } from '../../state/format';
import { setSkyTime, useObserver, useStore } from '../../state/store';

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const observer = useObserver();
  const use24h = useStore((s) => s.use24h);
  const event = eventById.get(id);

  return (
    <View style={styles.root}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 12 }}>
        <IconButton name="back" label="Back" glass={false} onPress={() => router.back()} />
      </View>
      {!event ? <Text style={[type.body, { padding: 24 }]}>This event is no longer available. Open it again from the Events list.</Text> : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 24 }}>
          <EventThumb event={event} />
          <Text style={styles.title} accessibilityRole="header">{event.title}</Text>
          <Text style={styles.when}>{formatLongDate(event.date, observer.timeZone)} · {formatTime(event.date, observer.timeZone, use24h)}</Text>
          <Text style={styles.copy}>{event.detail}</Text>
          {event.visibility.kind !== 'general' ? (
            <Text style={[styles.copy, { color: event.visibility.kind === 'visible' ? color.peach : color.textSecondary, marginTop: 12 }]}>{event.visibility.note}</Text>
          ) : null}
          <Text style={styles.source}>{event.source}</Text>
          <SecondaryButton label="See this in Time Travel" leading="calendar" style={{ marginTop: 22 }} onPress={() => { setSkyTime(event.date.getTime()); router.push('/time-travel'); }} />
          {event.bodies.length ? <View style={{ marginTop: 18 }}>
            {event.bodies.map((b, i) => (
              <Row key={b} leading={<ObjectThumb object={bodyObject(b)} />} title={bodyObject(b).name} last={i === event.bodies.length - 1}
                onPress={() => router.push({ pathname: '/object/[id]', params: { id: `body:${b}` } })} />
            ))}
          </View> : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.base },
  title: { ...type.title, marginTop: 16 },
  when: { ...type.body, color: color.text, marginTop: 6, fontVariant: ['tabular-nums'] },
  copy: { fontFamily: font.regular, fontSize: 16, lineHeight: 24, color: color.text, marginTop: 16 },
  source: { ...type.caption, marginTop: 14 },
});
