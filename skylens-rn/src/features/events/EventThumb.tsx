import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Line, Rect, Stop } from 'react-native-svg';
import { moonPhase } from '../../astronomy/core';
import { SkyEvent } from '../../astronomy/events';
import { bodyObject } from '../../data/catalog';
import { thumbFor } from '../../design/images';
import { color } from '../../design/tokens';
import { MoonDisc } from '../tonight/MoonDisc';

const SIZE = 66;

/** A drawn meteor streak, since a generic stock image would claim to show this shower. */
function Meteors() {
  return (
    <Svg width={SIZE} height={SIZE}>
      <Defs>
        <LinearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#0E1A3C" /><Stop offset="1" stopColor="#141230" />
        </LinearGradient>
        <LinearGradient id="tail" x1="1" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0} /><Stop offset="0.75" stopColor="#FFB98A" stopOpacity={0.85} /><Stop offset="1" stopColor="#FFF4E8" />
        </LinearGradient>
      </Defs>
      <Rect width={SIZE} height={SIZE} fill="url(#bg)" />
      {[[10, 12], [48, 10], [56, 40], [22, 52], [34, 22], [12, 34]].map(([x, y], i) => <Circle key={i} cx={x} cy={y} r={0.7} fill="#fff" opacity={0.7} />)}
      <Line x1={58} y1={8} x2={14} y2={54} stroke="url(#tail)" strokeWidth={2.4} strokeLinecap="round" />
      <Line x1={36} y1={8} x2={18} y2={27} stroke="url(#tail)" strokeWidth={1.2} strokeLinecap="round" />
    </Svg>
  );
}

export function EventThumb({ event }: { event: SkyEvent }) {
  const box = { width: SIZE, height: SIZE, borderRadius: 13 };
  if (event.kind === 'meteorShower') return <View style={[box, styles.box]}><Meteors /></View>;
  const bodies = event.bodies.filter((b) => b !== 'sun');
  if (event.kind === 'conjunction' && bodies.length === 2) {
    const a = thumbFor(bodyObject(bodies[0])), b = thumbFor(bodyObject(bodies[1]));
    return (
      <View style={[box, styles.pair]}>
        <Image source={a} style={[styles.dot, { left: 0, top: 18 }]} contentFit="cover" />
        <Image source={b} style={[styles.dot, { right: 0, top: 8 }]} contentFit="cover" />
      </View>
    );
  }
  if (event.kind === 'moonPhase') {
    const p = moonPhase(event.date);
    // A new Moon is black on black, so a fine limb shows where it is.
    return <View style={[box, styles.bare]}><View style={p.illuminatedFraction < 0.04 ? styles.limb : undefined}><MoonDisc size={SIZE - 4} phaseAngle={p.phaseAngle} waxing={p.isWaxing} /></View></View>;
  }
  if (bodies.length) {
    const source = thumbFor(bodyObject(bodies[0]));
    return <View style={[box, styles.bare]}><Image source={source} style={{ width: SIZE - 4, height: SIZE - 4, borderRadius: (SIZE - 4) / 2 }} contentFit="cover" /></View>;
  }
  // Sun events: seasons and the Sun itself, drawn rather than pictured.
  return (
    <View style={[box, styles.box]}>
      <Svg width={SIZE} height={SIZE}>
        <Defs>
          <LinearGradient id="s" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#FFE2B0" /><Stop offset="1" stopColor={color.peachDeep} /></LinearGradient>
        </Defs>
        <Circle cx={33} cy={33} r={13} fill="url(#s)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { overflow: 'hidden', backgroundColor: '#0A0F1C', borderWidth: StyleSheet.hairlineWidth, borderColor: color.hairlineStrong },
  bare: { alignItems: 'center', justifyContent: 'center' },
  limb: { borderRadius: SIZE, borderWidth: StyleSheet.hairlineWidth, borderColor: color.hairlineStrong },
  pair: { position: 'relative' },
  dot: { position: 'absolute', width: 32, height: 32, borderRadius: 16 },
});
