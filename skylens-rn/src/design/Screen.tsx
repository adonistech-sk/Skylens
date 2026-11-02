import { Image } from 'expo-image';
import { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Line, RadialGradient, Stop } from 'react-native-svg';
import { constellation, SkyObject, starColor, stars } from '../data/catalog';
import { ART_ASSETS } from '../data/generated/constellationArtAssets';
import { TabBar } from './components';
import { images, thumbFor } from './images';
import { Reveal } from './motion';
import { color, type } from './tokens';

/** The near-black, faintly starred page used by the tab screens. */
export function Page({ title, right, children, tabs = true, scroll = true }: { title: string; right?: ReactNode; children: ReactNode; tabs?: boolean; scroll?: boolean }) {
  const insets = useSafeAreaInsets();
  const body = (
    <>
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Text style={type.title} accessibilityRole="header">{title}</Text>
        {right}
      </View>
      <Reveal>{children}</Reveal>
    </>
  );
  return (
    <View style={styles.page}>
      <Image source={images.backdrop} style={StyleSheet.absoluteFill} contentFit="cover" />
      <View style={[StyleSheet.absoluteFill, styles.veil]} />
      {scroll ? <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>{body}</ScrollView> : <View style={{ flex: 1 }}>{body}</View>}
      {tabs ? <TabBar /> : null}
    </View>
  );
}

const HUES: Record<string, string> = { sun: '#FFD79A' };

/** A real image of the object, or an honest drawn symbol built from its own data. */
export function ObjectThumb({ object, size = 54 }: { object: SkyObject; size?: number }) {
  const source = thumbFor(object);
  const box = { width: size, height: size, borderRadius: 12 };
  if (source) return <View style={[box, styles.thumb]}><Image source={source} style={box} contentFit="cover" /></View>;

  const plate = object.type === 'constellation' ? ART_ASSETS[object.id.slice(4)]?.plate : undefined;
  if (plate) return <View style={[box, styles.thumb]}><Image source={plate} style={box} contentFit="contain" /></View>;

  if (object.type === 'constellation') {
    const c = constellation(object.id.slice(4));
    const t = stars();
    const pts = c ? c.lines.map((l) => l.map((h) => t.indexByHip.get(h)!)) : [];
    const all = pts.flat();
    const cRA = c ? c.center[0] : 0;
    const proj = (i: number) => {
      let dra = t.ra[i] - cRA;
      if (dra > 180) dra -= 360;
      if (dra < -180) dra += 360;
      return [-dra * Math.cos(((c?.center[1] ?? 0) * Math.PI) / 180), t.dec[i]];
    };
    const xs = all.map((i) => proj(i)[0]), ys = all.map((i) => proj(i)[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const span = Math.max(maxX - minX, maxY - minY, 1);
    const f = (size - 16) / span;
    const sx = (i: number) => size / 2 + (proj(i)[0] - (minX + maxX) / 2) * f;
    const sy = (i: number) => size / 2 - (proj(i)[1] - (minY + maxY) / 2) * f;
    return (
      <View style={[box, styles.thumb]}>
        <Svg width={size} height={size}>
          {pts.flatMap((l, a) => l.slice(1).map((_, b) => <Line key={`${a}-${b}`} x1={sx(l[b])} y1={sy(l[b])} x2={sx(l[b + 1])} y2={sy(l[b + 1])} stroke={color.cool} strokeWidth={0.8} />))}
          {[...new Set(all)].map((i) => <Circle key={i} cx={sx(i)} cy={sy(i)} r={1.3} fill="#fff" />)}
        </Svg>
      </View>
    );
  }

  const bv = object.star?.colorIndex;
  const [r, g, b] = starColor(bv ?? 0.3);
  const glow = HUES[object.id.slice(5)] ?? `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`;
  const isStar = object.type === 'star' || object.type === 'sun';
  return (
    <View style={[box, styles.thumb]}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id="g" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#fff" stopOpacity={1} />
            <Stop offset="0.16" stopColor={isStar ? glow : color.peachLight} stopOpacity={0.9} />
            <Stop offset="1" stopColor={isStar ? glow : color.peach} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size * (isStar ? 0.34 : 0.26)} fill="url(#g)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: color.base },
  veil: { backgroundColor: 'rgba(5,8,16,0.52)' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, marginBottom: 12 },
  thumb: { backgroundColor: '#080C16', overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: color.hairlineStrong },
});
