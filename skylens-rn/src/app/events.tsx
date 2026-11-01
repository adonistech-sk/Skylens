import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SkyEvent } from '../astronomy/events';
import { timeZoneOffset } from '../astronomy/night';
import { IconButton, Notice, press, SegmentedControl } from '../design/components';
import { Icon } from '../design/Icon';
import { Reveal } from '../design/motion';
import { Page } from '../design/Screen';
import { color, font, type } from '../design/tokens';
import { EventThumb } from '../features/events/EventThumb';
import { useEvents } from '../features/events/useEvents';
import { dayAndMonth, dayOfMonth } from '../state/format';
import { skyTime, useObserver, useStore } from '../state/store';

const WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY = 86_400_000;

function EventRow({ event, tz, last }: { event: SkyEvent; tz: string; last: boolean }) {
  const { day, month } = dayAndMonth(event.date, tz);
  return (
    <Pressable testID={`event-${event.title}`} accessibilityRole="button" accessibilityLabel={`${event.title}, ${month} ${day}. ${event.subtitle}`}
      onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
      style={({ pressed }) => [styles.row, !last && styles.rowLine, press(pressed)]}>
      <View style={styles.date}>
        <Text style={styles.day}>{day}</Text>
        <Text style={styles.month}>{month}</Text>
      </View>
      <EventThumb event={event} />
      <View style={styles.rowText}>
        <Text style={styles.title} numberOfLines={2}>{event.title}</Text>
        <Text style={styles.subtitle} numberOfLines={2}>{event.subtitle}</Text>
      </View>
      <Icon name="chevron" size={20} weight={1.6} />
    </Pressable>
  );
}

function Calendar({ tz }: { tz: string }) {
  const now = new Date(skyTime() + timeZoneOffset(new Date(skyTime()), tz));
  const [cursor, setCursor] = useState({ year: now.getUTCFullYear(), month: now.getUTCMonth() });
  const start = Date.UTC(cursor.year, cursor.month, 1);
  const daysInMonth = new Date(Date.UTC(cursor.year, cursor.month + 1, 0)).getUTCDate();
  const { events, failed } = useEvents(start, daysInMonth + 1);
  const [selected, setSelected] = useState<number | null>(null);
  const inMonth = useMemo(() => (events ?? []).filter((e) => {
    const d = new Date(e.date.getTime() + timeZoneOffset(e.date, tz));
    return d.getUTCMonth() === cursor.month && d.getUTCFullYear() === cursor.year;
  }), [events, cursor, tz]);
  const byDay = useMemo(() => {
    const m = new Map<number, SkyEvent[]>();
    inMonth.forEach((e) => { const d = dayOfMonth(e.date, tz); m.set(d, [...(m.get(d) ?? []), e]); });
    return m;
  }, [inMonth, tz]);
  const lead = (new Date(start).getUTCDay() + 6) % 7;
  const cells = [...Array.from({ length: lead }, () => 0), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const list = selected ? byDay.get(selected) ?? [] : inMonth;
  const shift = (n: number) => {
    setSelected(null);
    setCursor((c) => {
      const m = c.month + n;
      return { year: c.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 };
    });
  };

  return (
    <View style={styles.list}>
      <View style={styles.calHead}>
        <IconButton name="back" label="Previous month" glass={false} size={40} onPress={() => shift(-1)} />
        <Text style={styles.calTitle}>{MONTHS[cursor.month]} {cursor.year}</Text>
        <IconButton name="chevron" label="Next month" glass={false} size={40} onPress={() => shift(1)} />
      </View>
      <View style={styles.grid}>
        {WEEK.map((d, i) => <Text key={i} style={styles.weekday}>{d}</Text>)}
        {cells.map((d, i) => (
          <Pressable key={i} disabled={!d} accessibilityRole="button" accessibilityLabel={d ? `${MONTHS[cursor.month]} ${d}${byDay.has(d) ? `, ${byDay.get(d)!.length} events` : ''}` : undefined}
            onPress={() => setSelected(selected === d ? null : d)} style={[styles.cell, selected === d && styles.cellOn]}>
            {d ? <Text style={[styles.cellText, selected === d && { color: color.peach }]}>{d}</Text> : null}
            {byDay.has(d) ? <View style={styles.dot} /> : null}
          </Pressable>
        ))}
      </View>
      {failed ? <Notice tone="warn" text="These events couldn't be calculated." /> : !events ? <ActivityIndicator color={color.peach} style={{ marginTop: 24 }} /> : (
        list.length ? list.map((e, i) => <EventRow key={e.id} event={e} tz={tz} last={i === list.length - 1} />)
          : <Text style={[type.body, { paddingTop: 16 }]}>Nothing calculated for this day.</Text>
      )}
    </View>
  );
}

export default function Events() {
  const [mode, setMode] = useState<'upcoming' | 'calendar'>('upcoming');
  const observer = useObserver();
  const proActive = useStore((s) => s.proActive);
  const choose = (m: 'upcoming' | 'calendar') => { if (m === 'calendar' && !proActive) router.push('/pro'); else setMode(m); };
  const { events, failed } = useEvents(skyTime(), 120);
  const upcoming = useMemo(() => (events ?? [])
    .filter((e) => e.title !== 'New Moon' && e.date.getTime() >= skyTime() - DAY && (e.isSignificant || e.kind === 'meteorShower' || (e.kind === 'conjunction' && !e.bodies.includes('moon'))) && e.visibility.kind !== 'notVisible')
    .slice(0, 16), [events]);

  return (
    <Page title="Events" right={<IconButton testID="events-calendar" name="calendar" label="Show calendar" glass={false} iconSize={26} active={mode === 'calendar'} onPress={() => choose(mode === 'calendar' ? 'upcoming' : 'calendar')} />}>
      <SegmentedControl style={styles.segments} value={mode} onChange={choose} options={[{ value: 'upcoming', label: 'Upcoming' }, { value: 'calendar', label: 'Calendar' }]} />
      {mode === 'calendar' ? <Reveal key="calendar" fade><Calendar tz={observer.timeZone} /></Reveal> : failed ? <View style={styles.list}><Notice tone="warn" text="Events couldn't be calculated for this date." /></View> : !events ? (
        <View style={styles.loading}><ActivityIndicator color={color.peach} /><Text style={[type.caption, { marginTop: 10 }]}>Calculating from the ephemeris</Text></View>
      ) : (
        <View style={styles.list}>
          {upcoming.map((e, i) => <EventRow key={e.id} event={e} tz={observer.timeZone} last={i === upcoming.length - 1} />)}
          {upcoming.length === 0 ? <Text style={type.body}>No notable events in the next four months.</Text> : null}
        </View>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  segments: { marginHorizontal: 22, marginTop: 4 },
  loading: { alignItems: 'center', marginTop: 90 },
  list: { paddingHorizontal: 22, marginTop: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, minHeight: 100 },
  rowLine: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.hairlineStrong },
  date: { width: 42, alignItems: 'center' },
  day: { fontFamily: font.serif, fontSize: 32, lineHeight: 35, color: color.textSecondary, fontVariant: ['tabular-nums'] },
  month: { fontFamily: font.medium, fontSize: 13, color: color.text, letterSpacing: 0.4 },
  rowText: { flex: 1 },
  title: { fontFamily: font.semibold, fontSize: 15.5, lineHeight: 21, color: color.text },
  subtitle: { fontFamily: font.regular, fontSize: 13, lineHeight: 18, color: color.textSecondary, marginTop: 3 },
  calHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  calTitle: { fontFamily: font.serif, fontSize: 24, color: color.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, marginBottom: 8 },
  weekday: { width: '14.28%', textAlign: 'center', fontFamily: font.medium, fontSize: 11, color: color.textTertiary, paddingVertical: 6 },
  cell: { width: '14.28%', height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  cellOn: { backgroundColor: color.peachFill },
  cellText: { fontFamily: font.regular, fontSize: 15, color: color.text, fontVariant: ['tabular-nums'] },
  dot: { position: 'absolute', bottom: 6, width: 4, height: 4, borderRadius: 2, backgroundColor: color.peach },
});
