import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { GestureResponderEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Line, Path, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';
import { BodyId, bodyName, normalize180, position } from '../astronomy/core';
import { startOfLocalDay } from '../astronomy/night';
import { IconButton, press } from '../design/components';
import { Icon } from '../design/Icon';
import { Tap } from '../design/motion';
import { images } from '../design/images';
import { color, font, type } from '../design/tokens';
import { formatLongDate, formatTime } from '../state/format';
import { isLive, MAX_DATE, MIN_DATE, resetToNow, setRate, setSkyTime, shiftSkyTime, skyTime, useObserver, useStore } from '../state/store';

const SPEEDS = [10, 100, 1000, 10000];
const HOUR = 3_600_000, DAY = 86_400_000;
// Earth in assets/images/earth-horizon.jpg, in points at 393pt wide. The arcs share its
// centre, so they read as orbits around the planet.
const EARTH_CENTRE_Y = 603, EARTH_ART_WIDTH = 393, EARTH_ART_HEIGHT = 500;
const ARC_BODIES: { id: BodyId; radius: number; dot: number; tint: string }[] = [
  { id: 'sun', radius: 478, dot: 7, tint: '#FFA861' },
  { id: 'moon', radius: 446, dot: 5, tint: '#F1EEE7' },
  { id: 'venus', radius: 416, dot: 3, tint: '#FFE9C8' },
  { id: 'mars', radius: 416, dot: 3, tint: '#FF9A6B' },
  { id: 'jupiter', radius: 382, dot: 3.4, tint: '#FFDDB5' },
  { id: 'saturn', radius: 382, dot: 2.8, tint: '#F5DCA8' },
];
const ORBITS = [478, 446, 416, 382, 352];

/** The sky as a dome above the observer's horizon: each body sits at its true azimuth, and vanishes when it sets. */
function Dome({ time, width }: { time: number; width: number }) {
  const observer = useObserver();
  // The Earth art scales with the screen width, so the orbits must too.
  const k = width / EARTH_ART_WIDTH;
  const cx = width / 2, cy = EARTH_CENTRE_Y * k;
  const bodies = useMemo(() => ARC_BODIES.map((b) => {
    const p = position(b.id, new Date(time), observer).apparent;
    // True azimuth, compressed to span the arc: due south is the top of the dome.
    const theta = (normalize180(p.azimuth - 180) * Math.PI) / 180 * 0.21;
    return { ...b, up: p.altitude > 0, x: cx + Math.sin(theta) * b.radius * k, y: cy - Math.cos(theta) * b.radius * k };
  }), [time, observer.latitude, observer.longitude, cx, cy, k]);
  return (
    <Svg width={width} height={320 * k} style={StyleSheet.absoluteFill}>
      <Defs>
        <RadialGradient id="glow"><Stop offset="0" stopColor="#FFB36B" stopOpacity={0.85} /><Stop offset="1" stopColor="#FFB36B" stopOpacity={0} /></RadialGradient>
      </Defs>
      {ORBITS.map((r) => (
        <Circle key={r} cx={cx} cy={cy} r={r * k} stroke="rgba(190,205,235,0.20)" strokeWidth={0.8} fill="none" />
      ))}
      {bodies.filter((b) => b.up).map((b) => (
        <Circle key={`g${b.id}`} cx={b.x} cy={b.y} r={b.dot * 3.4} fill="url(#glow)" />
      ))}
      {bodies.filter((b) => b.up).map((b) => (
        <Circle key={b.id} cx={b.x} cy={b.y} r={b.dot} fill={b.tint} />
      ))}
      {bodies.filter((b) => b.up).map((b) => (
        <SvgText key={`t${b.id}`} x={b.x} y={b.y - b.dot - 6} fontSize={10.5} fill="rgba(245,242,240,0.62)" textAnchor="middle" fontFamily={font.medium}>{bodyName(b.id)}</SvgText>
      ))}
    </Svg>
  );
}

function Ruler({ time, tz, width }: { time: number; tz: string; width: number }) {
  const dayStart = startOfLocalDay(new Date(time), tz).getTime();
  const fraction = Math.min(1, Math.max(0, (time - dayStart) / DAY));
  const inset = 8;
  const x = inset + fraction * (width - inset * 2);
  const responder = (e: GestureResponderEvent) => {
    const f = Math.min(1, Math.max(0, (e.nativeEvent.locationX - inset) / (width - inset * 2)));
    setSkyTime(dayStart + f * DAY);
  };
  return (
    <View style={{ width, height: 46 }} onStartShouldSetResponder={() => true} onMoveShouldSetResponder={() => true} onResponderGrant={responder} onResponderMove={responder}
      accessible accessibilityRole="adjustable" accessibilityLabel="Time of day" accessibilityValue={{ text: `${Math.round(fraction * 24)} hours` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]} onAccessibilityAction={(e) => shiftSkyTime(e.nativeEvent.actionName === 'increment' ? HOUR : -HOUR)}>
      <Svg width={width} height={46} pointerEvents="none">
        <Defs><RadialGradient id="mark"><Stop offset="0" stopColor={color.peachLight} stopOpacity={0.95} /><Stop offset="1" stopColor={color.peach} stopOpacity={0} /></RadialGradient></Defs>
        <Line x1={inset} x2={width - inset} y1={23} y2={23} stroke="rgba(255,255,255,0.28)" strokeWidth={0.8} />
        {Array.from({ length: 49 }, (_, i) => {
          const px = inset + (i / 48) * (width - inset * 2);
          const major = i % 12 === 0, mid = i % 6 === 0, minor = i % 2 === 0;
          const h = major ? 11 : mid ? 8 : minor ? 5.5 : 3.5;
          const warm = Math.abs(px - x) < 62;
          return <Line key={i} x1={px} x2={px} y1={23 - h} y2={23 + h} stroke={warm ? 'rgba(255,190,150,0.7)' : 'rgba(255,255,255,0.46)'} strokeWidth={0.8} />;
        })}
        <Circle cx={x} cy={23} r={22} fill="url(#mark)" />
        <Line x1={x} x2={x} y1={1} y2={45} stroke={color.peachLight} strokeWidth={1.3} />
        <Line x1={x - 13} x2={x + 13} y1={23} y2={23} stroke={color.peachLight} strokeWidth={1.1} />
        <Circle cx={x} cy={23} r={3} fill="#FFF3E6" />
      </Svg>
    </View>
  );
}

export default function TimeTravel() {
  const insets = useSafeAreaInsets();
  const observer = useObserver();
  const use24h = useStore((s) => s.use24h);
  const clock = useStore((s) => s.clock);
  const [time, setTime] = useState(skyTime());
  const [speed, setSpeed] = useState(0);
  const [width, setWidth] = useState(393);
  const [editing, setEditing] = useState(false);
  const raf = useRef<ReturnType<typeof setInterval> | null>(null);
  const playing = clock.anchorSky !== null && clock.rate !== 0;

  useEffect(() => {
    setTime(skyTime());
    raf.current = setInterval(() => setTime(skyTime()), playing ? 120 : 500);
    return () => { if (raf.current) clearInterval(raf.current); };
  }, [clock, playing]);

  // Reaching the validated range's edge stops playback instead of extrapolating.
  useEffect(() => { if (playing && (time <= MIN_DATE || time >= MAX_DATE)) setRate(0); }, [time, playing]);

  const date = new Date(time);
  const tz = observer.timeZone;
  const togglePlay = () => setRate(playing ? 0 : SPEEDS[speed]);
  const cycleSpeed = () => {
    const next = (speed + 1) % SPEEDS.length;
    setSpeed(next);
    if (playing) setRate(SPEEDS[next]);
  };
  const shiftYear = (n: number) => {
    const d = new Date(time);
    d.setUTCFullYear(d.getUTCFullYear() + n);
    setSkyTime(d.getTime());
  };

  return (
    <View style={styles.root} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <Image source={images.earthHorizon} style={{ position: 'absolute', top: 0, left: 0, width, height: (width * EARTH_ART_HEIGHT) / EARTH_ART_WIDTH }} contentFit="fill" />
      <LinearGradient colors={['rgba(6,10,20,0)', color.base]} locations={[0.43, 0.585]} style={StyleSheet.absoluteFill} pointerEvents="none" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <IconButton testID="tt-close" name="close" label="Close Time Travel" glass={false} iconSize={25} onPress={() => (router.canGoBack() ? router.back() : router.replace('/sky'))} />
        <Text style={styles.title} accessibilityRole="header">Time Travel</Text>
      </View>
      <View style={styles.dome} pointerEvents="none"><Dome time={time} width={width} /></View>

      <View style={[styles.panel, { paddingBottom: Math.max(insets.bottom, 14) + 12 }]}>
        <View style={styles.dateRow}>
          <IconButton testID="tt-calendar" name="calendar" label="Change the date" glass={false} iconSize={26} active={editing} onPress={() => setEditing(!editing)} />
          <Text style={styles.dateText} accessibilityLiveRegion="polite">{formatLongDate(date, tz)}</Text>
          <Text style={styles.timeText}>{formatTime(date, tz, use24h)}</Text>
        </View>
        {editing ? (
          <View style={styles.steppers}>
            {[['−1 yr', () => shiftYear(-1)], ['−1 mo', () => shiftSkyTime(-30 * DAY)], ['−1 day', () => shiftSkyTime(-DAY)], ['+1 day', () => shiftSkyTime(DAY)], ['+1 mo', () => shiftSkyTime(30 * DAY)], ['+1 yr', () => shiftYear(1)]].map(([label, fn]) => (
              <Pressable key={label as string} accessibilityRole="button" onPress={fn as () => void} style={({ pressed }) => [styles.step, press(pressed)]}><Text style={styles.stepText}>{label as string}</Text></Pressable>
            ))}
          </View>
        ) : null}
        <Ruler time={time} tz={tz} width={width - 44} />
        <View style={styles.controls}>
          <IconButton name="rewind" label="Back one day" glass={false} iconSize={25} onPress={() => shiftSkyTime(-DAY)} />
          <IconButton testID="tt-back" name="rewind" label="Back one hour" glass={false} iconSize={25} onPress={() => shiftSkyTime(-HOUR)} />
          <Tap testID="tt-play" depth={0.93} accessibilityRole="button" accessibilityLabel={playing ? 'Pause' : 'Play'} onPress={togglePlay} style={styles.play}>
            <Icon name={playing ? 'pause' : 'play'} size={28} tint={color.peachLight} filled={!playing} weight={2.2} />
          </Tap>
          <IconButton testID="tt-forward" name="forward" label="Forward one hour" glass={false} iconSize={25} onPress={() => shiftSkyTime(HOUR)} />
          <Pressable testID="tt-speed" accessibilityRole="button" accessibilityLabel={`Speed ${SPEEDS[speed]} times. Change speed.`} onPress={cycleSpeed} style={({ pressed }) => [styles.speed, press(pressed)]}>
            <Text style={styles.speedText} numberOfLines={1} adjustsFontSizeToFit>{SPEEDS[speed].toLocaleString('en-US')}×</Text>
          </Pressable>
        </View>
        <Pressable testID="tt-now" accessibilityRole="button" accessibilityLabel="Return to the present" disabled={isLive() && !playing} onPress={() => { setSpeed(0); resetToNow(); }} style={({ pressed }) => [styles.now, press(pressed)]}>
          <Text style={styles.nowText}>Now</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.base },
  header: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12 },
  title: { ...type.heading, fontSize: 28 },
  dome: { position: 'absolute', top: 0, left: 0, right: 0, height: 320 },
  panel: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 22 },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  dateText: { fontFamily: font.medium, fontSize: 17, color: color.text, fontVariant: ['tabular-nums'], marginRight: 10 },
  timeText: { fontFamily: font.medium, fontSize: 18, color: color.text, fontVariant: ['tabular-nums'] },
  steppers: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  step: { paddingHorizontal: 9, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.07)' },
  stepText: { fontFamily: font.medium, fontSize: 12, color: color.text },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingHorizontal: 4 },
  play: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center', borderWidth: 1.6, borderColor: color.peach, backgroundColor: 'rgba(40,24,20,0.5)', shadowColor: color.peach, shadowOpacity: 0.45, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } },
  speed: { width: 50, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, backgroundColor: 'rgba(255,255,255,0.08)' },
  speedText: { fontFamily: font.medium, fontSize: 13, color: color.text, fontVariant: ['tabular-nums'] },
  now: { alignSelf: 'center', marginTop: 20, width: 210, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: color.hairlineStrong, backgroundColor: 'rgba(17,26,48,0.72)' },
  nowText: { fontFamily: font.semibold, fontSize: 16, color: color.text },
});
