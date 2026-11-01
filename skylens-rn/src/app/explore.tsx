import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { altitude, ALL_BODIES, appearance } from '../astronomy/core';
import { bodyObject, constellation, constellationObject, messier, object, SkyObject, TYPE_NAMES } from '../data/catalog';
import { IconButton, press, Row, SegmentedControl } from '../design/components';
import { Icon } from '../design/Icon';
import { images } from '../design/images';
import { ObjectThumb, Page } from '../design/Screen';
import { color, font, type } from '../design/tokens';
import { formatMagnitude } from '../state/format';
import { skyTime, useObserver } from '../state/store';

type Mode = 'featured' | 'solar' | 'deep';
const open = (o: SkyObject) => router.push({ pathname: '/object/[id]', params: { id: o.id } });

export default function Explore() {
  const [mode, setMode] = useState<Mode>('featured');
  const observer = useObserver();
  const solar = useMemo(() => {
    const d = new Date(skyTime());
    return ALL_BODIES.filter((b) => b !== 'sun').map((b) => {
      const alt = altitude(b, d, observer);
      return { body: b, line: `${alt > 0 ? `${Math.round(alt)}° up now` : 'Below the horizon'} · Mag ${formatMagnitude(appearance(b, d).magnitude)}` };
    });
  }, [observer]);
  const deep = useMemo(() => messier().filter((m) => m.designations.length > 1 || object(m.id)?.name !== m.id.slice(4)).slice(0, 24), []);

  return (
    <Page title="Explore" right={<IconButton testID="explore-search" name="search" label="Search" glass={false} iconSize={26} onPress={() => router.push('/search')} />}>
      <SegmentedControl style={styles.segments} value={mode} onChange={setMode}
        options={[{ value: 'featured', label: 'Featured' }, { value: 'solar', label: 'Solar System' }, { value: 'deep', label: 'Deep Sky' }]} />
      {mode === 'featured' ? (
        <>
          <Pressable testID="featured-orion" accessibilityRole="button" accessibilityLabel="The Orion Nebula. A stellar nursery in the heart of Orion." onPress={() => open(object('dso:M42')!)} style={({ pressed }) => [styles.hero, press(pressed)]}>
            <Image source={images.orionNebulaHero} style={StyleSheet.absoluteFill} contentFit="cover" />
            <LinearGradient colors={['rgba(5,8,16,0)', 'rgba(5,8,16,0.72)']} locations={[0.42, 1]} style={StyleSheet.absoluteFill} />
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>The Orion Nebula</Text>
              <Text style={styles.heroBody}>A stellar nursery in the heart of Orion.</Text>
            </View>
            <View style={styles.heroArrow}><Icon name="arrowUpRight" size={22} tint={color.peach} /></View>
          </Pressable>
          <View style={styles.rows}>
            <Row testID="cat-planets" leading={<ObjectThumb object={bodyObject('jupiter')} />} title="Planets" subtitle="Explore our solar system" onPress={() => setMode('solar')} />
            <Row testID="cat-constellations" leading={<ObjectThumb object={constellationObject(constellation('Cyg')!)} />} title="Constellations" subtitle="All 88 constellations" onPress={() => router.push('/category/constellations')} />
            <Row testID="cat-deep" leading={<ObjectThumb object={object('dso:M51')!} />} title="Deep Sky" subtitle="Galaxies, nebulae and clusters" onPress={() => router.push('/category/deepsky')} last />
          </View>
        </>
      ) : mode === 'solar' ? (
        <View style={styles.rows}>
          {solar.map((s, i) => (
            <Row key={s.body} testID={`solar-${s.body}`} leading={<ObjectThumb object={bodyObject(s.body)} />} title={bodyObject(s.body).name} subtitle={s.line} last={i === solar.length - 1} onPress={() => open(bodyObject(s.body))} />
          ))}
        </View>
      ) : (
        <View style={styles.rows}>
          {deep.map((d, i) => (
            <Row key={d.id} leading={<ObjectThumb object={d} />} title={d.name} subtitle={`${TYPE_NAMES[d.type]} · Mag ${formatMagnitude(d.magnitude)}`} last={i === deep.length - 1} onPress={() => open(d)} />
          ))}
          <Pressable style={styles.all} accessibilityRole="button" onPress={() => router.push('/category/deepsky')}><Text style={styles.allText}>All Messier objects</Text></Pressable>
        </View>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  segments: { marginHorizontal: 22, marginTop: 4 },
  hero: { marginHorizontal: 18, marginTop: 18, height: 262, borderRadius: 22, overflow: 'hidden', backgroundColor: color.surface },
  heroCopy: { position: 'absolute', left: 18, right: 70, bottom: 16 },
  heroTitle: { fontFamily: font.serif, fontSize: 27, lineHeight: 33, color: color.text, letterSpacing: -0.3 },
  heroBody: { ...type.caption, color: color.text, marginTop: 2 },
  heroArrow: { position: 'absolute', right: 16, bottom: 16, width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: color.peachLine, backgroundColor: 'rgba(14,19,32,0.5)' },
  rows: { paddingHorizontal: 22, marginTop: 10 },
  all: { paddingVertical: 16, alignItems: 'center' },
  allText: { fontFamily: font.medium, fontSize: 14, color: color.peach },
});
