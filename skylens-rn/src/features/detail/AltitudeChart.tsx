import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Path, Rect } from 'react-native-svg';
import { DARK_SUN, MIN_ALTITUDE, Visibility } from '../../astronomy/observing';
import { color, font, type } from '../../design/tokens';
import { formatTime } from '../../state/format';

const HEIGHT = 132, TOP = 90, BOTTOM = -30;

/** Sunlight behind the curve, from the Sun's real altitude at each sample. */
const skyTint = (sun: number) => (sun > 0 ? 'rgba(120,150,210,0.20)' : sun > -6 ? 'rgba(120,120,190,0.13)' : sun > DARK_SUN ? 'rgba(100,100,170,0.08)' : 'rgba(0,0,0,0)');

/** Altitude through one observing night, noon to noon. */
export function AltitudeChart({ data, now, timeZone, use24h }: { data: Visibility; now: number; timeZone: string; use24h: boolean }) {
  const [width, setWidth] = useState(0);
  const x = (t: number) => ((t - data.start) / (data.end - data.start)) * width;
  const y = (alt: number) => ((TOP - Math.max(BOTTOM, Math.min(TOP, alt))) / (TOP - BOTTOM)) * HEIGHT;
  const line = data.points.map((p, i) => `${i ? 'L' : 'M'}${x(p.time).toFixed(1)} ${y(p.altitude).toFixed(1)}`).join(' ');
  const step = data.points[1].time - data.points[0].time;
  const summary = data.windowStart !== null
    ? `Up in a dark sky from ${formatTime(new Date(data.windowStart), timeZone, use24h)} to ${formatTime(new Date(data.windowEnd!), timeZone, use24h)}, about ${data.darkHours.toFixed(1)} hours above ${MIN_ALTITUDE}°.`
    : data.peak.altitude <= 0 ? 'It stays below the horizon this night.' : `It doesn't get ${MIN_ALTITUDE}° high in a dark sky this night.`;
  const peak = `Highest ${Math.round(data.peak.altitude)}° at ${formatTime(new Date(data.peak.time), timeZone, use24h)}.`;
  const ticks = [0, 6, 12, 18, 24].map((h) => data.start + h * 3_600_000);
  return (
    <View testID="altitude-chart" accessible accessibilityRole="image" accessibilityLabel={`Altitude through the night. ${peak} ${summary}`}>
      <View style={{ height: HEIGHT }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width ? (
          <Svg width={width} height={HEIGHT}>
            {data.points.map((p) => <Rect key={p.time} x={x(p.time)} y={0} width={(step / (data.end - data.start)) * width + 0.5} height={HEIGHT} fill={skyTint(p.sun)} />)}
            <Line x1={0} x2={width} y1={y(0)} y2={y(0)} stroke="rgba(255,255,255,0.3)" strokeWidth={0.8} />
            <Line x1={0} x2={width} y1={y(MIN_ALTITUDE)} y2={y(MIN_ALTITUDE)} stroke="rgba(255,255,255,0.12)" strokeWidth={0.7} strokeDasharray="3 4" />
            <Path d={line} stroke={color.peach} strokeWidth={1.6} fill="none" strokeLinejoin="round" />
            {now >= data.start && now <= data.end ? <Line x1={x(now)} x2={x(now)} y1={0} y2={HEIGHT} stroke={color.cool} strokeWidth={0.9} /> : null}
          </Svg>
        ) : null}
      </View>
      <View style={styles.ticks}>
        {ticks.map((t) => <Text key={t} style={styles.tick}>{formatTime(new Date(t), timeZone, true)}</Text>)}
      </View>
      <Text style={[type.caption, { marginTop: 6 }]}>{peak} {summary}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ticks: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  tick: { fontFamily: font.regular, fontSize: 11, color: color.textTertiary, fontVariant: ['tabular-nums'] },
});
