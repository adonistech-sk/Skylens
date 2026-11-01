import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { DEG } from '../astronomy/core';
import { planTonight, TonightPlan } from '../astronomy/tonight';
import { Notice, Row } from '../design/components';
import { Icon, IconName } from '../design/Icon';
import { ObjectThumb, Page } from '../design/Screen';
import { color, font, type } from '../design/tokens';
import { MoonDisc } from '../features/tonight/MoonDisc';
import { formatShortDate, formatTime } from '../state/format';
import { skyTime, useObserver, useStore } from '../state/store';

function arcPath(cx: number, cy: number, r: number, from: number, to: number) {
  const p = (a: number) => `${(cx + r * Math.cos(a * DEG)).toFixed(2)} ${(cy + r * Math.sin(a * DEG)).toFixed(2)}`;
  return `M${p(from)} A${r} ${r} 0 0 1 ${p(to)}`;
}

function Time({ icon, tint, label, value }: { icon: IconName; tint: string; label: string; value: string }) {
  return (
    <View style={styles.time} accessible accessibilityLabel={`${label} ${value}`}>
      <Icon name={icon} size={25} tint={tint} weight={1.5} />
      <Text style={styles.timeLabel}>{label}</Text>
      <Text style={styles.timeValue}>{value}</Text>
    </View>
  );
}

export default function Tonight() {
  const observer = useObserver();
  const use24h = useStore((s) => s.use24h);
  const proActive = useStore((s) => s.proActive);
  const clock = useStore((s) => s.clock);
  const [plan, setPlan] = useState<TonightPlan | null>(null);
  const date = new Date(skyTime());
  const key = Math.floor(date.getTime() / 900_000);

  useEffect(() => {
    // Let the screen paint first; the plan is a real ephemeris search.
    const id = setTimeout(() => setPlan(planTonight(new Date(skyTime()), observer, observer.timeZone)), 30);
    return () => clearTimeout(id);
  }, [observer, key, clock.anchorSky]);

  const tz = observer.timeZone;
  const noDark = plan && plan.recommendations.length === 0;
  return (
    <Page title="Tonight">
      <Text style={styles.subtitle}>{formatShortDate(date, tz)} · {observer.name}</Text>
      {!plan ? <ActivityIndicator color={color.peach} style={{ marginTop: 80 }} /> : (
        <>
          <View style={styles.moonRow}>
            <View style={styles.moonStage}>
              <MoonDisc size={176} phaseAngle={plan.moon.phaseAngle} waxing={plan.moon.isWaxing} />
              <Svg width={232} height={214} style={StyleSheet.absoluteFill}>
                <Path d={arcPath(88, 107, 103, -58, 58)} stroke={color.peach} strokeWidth={2} strokeLinecap="round" fill="none" opacity={0.86} />
              </Svg>
            </View>
            <View style={styles.moonCopy}>
              <Text style={styles.phase} numberOfLines={2}>{plan.moon.name.replace(' ', '\n')}</Text>
              <Text style={styles.percent}>{Math.round(plan.moon.illuminatedFraction * 100)}%</Text>
              <Text style={styles.illuminated}>illuminated</Text>
            </View>
          </View>
          <View style={styles.times}>
            <Time icon="horizon" tint={color.peach} label="Sunset" value={formatTime(plan.night.sunset, tz, use24h)} />
            <View style={styles.vline} />
            <Time icon="horizon" tint={color.cool} label="Astronomical" value={formatTime(plan.night.astronomicalDusk, tz, use24h)} />
            <View style={styles.vline} />
            <Time icon="horizon" tint={color.peach} label="Sunrise" value={formatTime(plan.night.sunrise, tz, use24h)} />
          </View>
          <View style={styles.rule} />
          <View style={styles.section}>
            <Text style={styles.heading} accessibilityRole="header">Best to See Tonight</Text>
            {noDark ? (
              <Notice text={plan.night.condition === 'polarDay' ? 'The Sun stays up all night here, so nothing can be recommended.' : 'Nothing is well placed from here during tonight’s dark hours.'} />
            ) : plan.recommendations.filter((r) => r.object.id !== 'body:moon').slice(0, proActive ? 11 : 3).map((r, i, all) => (
              <Row key={r.object.id} testID={`tonight-${r.object.name}`} leading={<ObjectThumb object={r.object} />} title={r.object.name} subtitle={r.summary} last={i === all.length - 1}
                onPress={() => router.push({ pathname: '/object/[id]', params: { id: r.object.id } })} />
            ))}
            {!noDark && !proActive ? <Pressable testID="tonight-more" accessibilityRole="button" onPress={() => router.push('/pro')} style={styles.more}><Text style={styles.moreText}>See the complete list</Text></Pressable> : null}
          </View>
        </>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  subtitle: { ...type.caption, fontSize: 15, paddingHorizontal: 22, marginTop: -6 },
  moonRow: { flexDirection: 'row', alignItems: 'center', paddingLeft: 26, marginTop: 10 },
  moonStage: { width: 218, height: 214, justifyContent: 'center' },
  moonCopy: { flex: 1, paddingLeft: 6, paddingRight: 8 },
  phase: { fontFamily: font.regular, fontSize: 18, lineHeight: 24, color: color.peach },
  percent: { fontFamily: font.regular, fontSize: 18, lineHeight: 26, color: color.peach, marginTop: 2, fontVariant: ['tabular-nums'] },
  illuminated: { fontFamily: font.regular, fontSize: 16, lineHeight: 22, color: color.text },
  times: { flexDirection: 'row', paddingHorizontal: 22, marginTop: 8 },
  time: { flex: 1, alignItems: 'center', gap: 3 },
  timeLabel: { fontFamily: font.regular, fontSize: 13, color: color.textSecondary, marginTop: 4 },
  timeValue: { fontFamily: font.medium, fontSize: 15, color: color.text, fontVariant: ['tabular-nums'] },
  vline: { width: StyleSheet.hairlineWidth, backgroundColor: color.hairline, marginVertical: 8 },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: color.hairlineStrong, marginHorizontal: 22, marginTop: 16 },
  section: { paddingHorizontal: 22, marginTop: 14 },
  heading: { ...type.heading, fontSize: 25, marginBottom: 4 },
  more: { paddingVertical: 14, alignItems: 'center' },
  moreText: { fontFamily: font.medium, fontSize: 14, color: color.peach },
});
