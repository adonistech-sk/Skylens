import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { color, font } from '../../design/tokens';

/** A drag or tap sets the value. VoiceOver adjusts it one step at a time. */
export function Slider({ label, value, min, max, step, format, onChange, testID }: {
  label: string; value: number; min: number; max: number; step: number; format: (v: number) => string; onChange: (v: number) => void; testID?: string;
}) {
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  widthRef.current = width;
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v / step) * step));
  const fromX = (x: number) => { if (widthRef.current) onChange(clamp(min + (Math.min(widthRef.current, Math.max(0, x)) / widthRef.current) * (max - min))); };
  const pan = Gesture.Pan().runOnJS(true).activeOffsetX([-3, 3]).failOffsetY([-12, 12]).onStart((e) => fromX(e.x)).onUpdate((e) => fromX(e.x));
  const tap = Gesture.Tap().runOnJS(true).onEnd((e, ok) => { if (ok) fromX(e.x); });
  const at = (value - min) / (max - min);
  return (
    <View style={styles.row}>
      <View style={styles.head}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{format(value)}</Text>
      </View>
      <GestureDetector gesture={Gesture.Race(pan, tap)}>
        <View testID={testID} style={styles.hit} onLayout={(e) => setWidth(e.nativeEvent.layout.width)} accessible accessibilityRole="adjustable" accessibilityLabel={label}
          accessibilityValue={{ text: format(value) }} accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) => onChange(clamp(value + (e.nativeEvent.actionName === 'increment' ? step : -step)))}>
          <View style={styles.track} />
          <View style={[styles.fill, { width: at * width }]} />
          <View style={[styles.thumb, { left: at * width - 9 }]} />
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 6 },
  head: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  label: { fontFamily: font.regular, fontSize: 14, color: color.text },
  value: { fontFamily: font.medium, fontSize: 13, color: color.textSecondary, fontVariant: ['tabular-nums'] },
  hit: { height: 32, justifyContent: 'center' },
  track: { height: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.16)' },
  fill: { position: 'absolute', height: 2, borderRadius: 1, backgroundColor: color.peachDeep },
  thumb: { position: 'absolute', width: 18, height: 18, borderRadius: 9, backgroundColor: color.peach },
});
