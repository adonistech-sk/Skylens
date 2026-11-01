import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BodyId, compass16 } from '../../astronomy/core';
import { observe } from '../../astronomy/locator';
import { bodyEditorial, bodyIdOf, constellationMeaning, constellationName, describeObject, distanceLightYears, object, objectNote, SkyObject, TYPE_NAMES } from '../../data/catalog';
import { IconButton, SegmentedControl } from '../../design/components';
import { Icon, IconName } from '../../design/Icon';
import { Pop, Reveal, Tap } from '../../design/motion';
import { heroFor } from '../../design/images';
import { color, font, type } from '../../design/tokens';
import { SkyView } from '../../features/sky/SkyView';
import { formatDec, formatDistanceAU, formatDistanceLy, formatMagnitude, formatRA, formatSize, formatTime } from '../../state/format';
import { requestFocus, skyTime, toggleFavorite, useObserver, useStore } from '../../state/store';

// Morphology the catalog's type column doesn't carry, for the showpiece galaxies.
const SPIRALS = new Set(['M31', 'M33', 'M51', 'M58', 'M61', 'M63', 'M64', 'M65', 'M66', 'M74', 'M77', 'M81', 'M83', 'M88', 'M90', 'M91', 'M95', 'M96', 'M98', 'M99', 'M100', 'M101', 'M104', 'M106', 'M108', 'M109']);

function kindLine(o: SkyObject): string {
  const spiral = o.deepSky && SPIRALS.has(o.id.slice(4));
  return spiral ? 'Spiral Galaxy' : TYPE_NAMES[o.type];
}

function Cell({ icon, label, value, line }: { icon: IconName; label: string; value: string; line?: boolean }) {
  return (
    <View style={[styles.cell, line && styles.cellLine]} accessible accessibilityLabel={`${label}: ${value}`}>
      <Icon name={icon} size={24} tint={color.text} weight={1.3} />
      <Text style={styles.cellLabel} numberOfLines={1}>{label}</Text>
      <Text style={styles.cellValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

export default function ObjectDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const observer = useObserver();
  const favorites = useStore((s) => s.favorites);
  const use24h = useStore((s) => s.use24h);
  const [tab, setTab] = useState<'overview' | 'observing' | 'details'>('overview');
  const o = useMemo(() => object(id), [id]);
  const date = new Date(skyTime());
  const info = useMemo(() => (o ? observe(o, date, observer) : null), [o, observer, Math.floor(date.getTime() / 60000)]);

  if (!o || !info) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 60, paddingHorizontal: 24 }]}>
        <Text style={type.heading}>This object isn&apos;t in the catalog.</Text>
        <IconButton name="back" label="Back" onPress={() => router.back()} style={{ marginTop: 20 }} />
      </View>
    );
  }

  const body: BodyId | null = bodyIdOf(o.id);
  const favorite = favorites.includes(o.id);
  const editorial = body ? bodyEditorial(body) : null;
  const con = o.type === 'constellation' ? constellationMeaning(o.id.slice(4)) : null;
  const overview = objectNote(o) ?? editorial?.summary ?? (con ? `${o.name}, “${con}”.` : describeObject(o));
  const designation = o.deepSky?.messier ? `M${o.deepSky.messier}` : o.star?.bayer ?? null;
  const ly = distanceLightYears(o);
  const distance = ly ? formatDistanceLy(ly) : info.distanceAU !== null ? formatDistanceAU(info.distanceAU) : null;
  const size = o.deepSky ? formatSize(o.deepSky.majorAxis, o.deepSky.minorAxis) : info.angularDiameter !== null ? `${(info.angularDiameter * 60).toFixed(info.angularDiameter > 0.2 ? 0 : 2)}′` : null;
  const place = constellationName(info.constellation) ?? '—';
  const hero = heroFor(o);
  const tz = observer.timeZone;
  const rts = info.riseTransitSet;
  const cannotFind = info.location.status === 'unavailable';

  const find = () => { requestFocus(o.id); router.dismissTo('/sky'); };
  const share = () => Share.share({ message: `${o.name} · ${kindLine(o)}${distance ? ` · ${distance}` : ''}. Seen with SkyLens.` }).catch(() => {});

  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        {hero ? <Image source={hero} style={StyleSheet.absoluteFill} contentFit="cover" />
          : <SkyView key={o.id} interactive={false} showCompass={false} hideGround focusId={o.id} initial={{ fov: o.type === 'constellation' ? 42 : 24 }} />}
        <LinearGradient pointerEvents="none" colors={['rgba(6,10,20,0.35)', 'rgba(6,10,20,0)', color.base]} locations={[0, 0.3, 1]} style={StyleSheet.absoluteFill} />
      </View>
      <ScrollView contentContainerStyle={{ paddingTop: 262, paddingBottom: 128 + insets.bottom }} showsVerticalScrollIndicator={false}>
        <Reveal style={styles.titleBlock}>
          {designation ? <View style={styles.pill}><Text style={styles.pillText}>{designation}</Text></View> : null}
          <Text style={styles.title} accessibilityRole="header">{o.name}</Text>
          <Text style={styles.subtitle}>{kindLine(o)}{distance ? ` · ${distance}` : ''}</Text>
        </Reveal>
        <SegmentedControl solid style={styles.segments} value={tab} onChange={setTab}
          options={[{ value: 'overview', label: 'Overview' }, { value: 'observing', label: 'Observing' }, { value: 'details', label: 'Details' }]} />
        {tab === 'overview' ? (
          <View style={styles.section}>
            <Text style={styles.copy}>{overview}</Text>
            <View style={styles.cells}>
              <Cell icon="pulse" label="Magnitude" value={formatMagnitude(info.magnitude)} />
              <Cell line icon="size" label={size ? 'Size (apparent)' : 'Distance'} value={size ?? (ly ? `${Math.round(ly).toLocaleString('en-US')} ly` : '—')} />
              <Cell line icon="diamond" label="Constellation" value={place} />
            </View>
          </View>
        ) : tab === 'observing' ? (
          <View style={styles.section}>
            <Text style={styles.copy}>{info.location.explanation}</Text>
            {editorial?.observing ? <Text style={[styles.copy, { marginTop: 10 }]}>{editorial.observing}</Text> : null}
            <View style={{ marginTop: 10 }}>
              {info.location.horizontal ? <Fact label="Now" value={`${info.location.horizontal.altitude.toFixed(1)}° high, ${compass16(info.location.horizontal.azimuth)}`} /> : null}
              {info.illuminatedFraction !== null ? <Fact label="Illuminated" value={`${Math.round(info.illuminatedFraction * 100)}%`} /> : null}
              {rts?.circumstance === 'alwaysUp' ? <Fact label="Rise and set" value="Stays above the horizon" /> : null}
              {rts?.circumstance === 'alwaysDown' ? <Fact label="Rise and set" value="Stays below the horizon" /> : null}
              {rts?.rise ? <Fact label="Next rise" value={formatTime(rts.rise, tz, use24h)} /> : null}
              {rts?.transit ? <Fact label="Highest" value={`${formatTime(rts.transit, tz, use24h)}${rts.transitAltitude !== null ? `, ${Math.round(rts.transitAltitude)}°` : ''}`} /> : null}
              {rts?.set ? <Fact label="Next set" value={formatTime(rts.set, tz, use24h)} /> : null}
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            {info.j2000 ? <Fact label="Right ascension (J2000)" value={formatRA(info.j2000.raHours)} /> : null}
            {info.j2000 ? <Fact label="Declination (J2000)" value={formatDec(info.j2000.decDeg)} /> : null}
            {o.star?.spectralType ? <Fact label="Spectral type" value={o.star.spectralType} /> : null}
            {o.star?.colorIndex !== null && o.star?.colorIndex !== undefined ? <Fact label="B−V colour index" value={o.star.colorIndex.toFixed(2)} /> : null}
            {distance ? <Fact label="Distance" value={distance} /> : null}
            {editorial?.facts.map((f) => <Fact key={f.label} label={f.label} value={f.value} />)}
            {o.designations.length ? <Fact label="Also known as" value={o.designations.slice(0, 5).join(', ')} /> : null}
            {editorial?.learn ? <Text style={[styles.copy, { marginTop: 14 }]}>{editorial.learn}</Text> : null}
          </View>
        )}
      </ScrollView>

      <View style={[styles.topBar, { top: insets.top + 8 }]} pointerEvents="box-none">
        <IconButton name="back" label="Back" glass={false} onPress={() => (router.canGoBack() ? router.back() : router.replace('/sky'))} iconSize={24} />
        <View style={{ flex: 1 }} />
        <Pop active={favorite}><IconButton testID="detail-favorite" name="heart" label={favorite ? 'Remove from favorites' : 'Add to favorites'} glass={false} active={favorite} filled={favorite} iconSize={27} onPress={() => toggleFavorite(o.id)} /></Pop>
        <IconButton name="share" label="Share" glass={false} onPress={share} iconSize={27} />
      </View>
      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 14) + 8 }]}>
        <Tap testID="find-in-sky" disabled={cannotFind} accessibilityRole="button" accessibilityLabel="Find in Sky" onPress={find} style={styles.find}>
          <Icon name="target" size={23} />
          <Text style={styles.findText}>Find in Sky</Text>
        </Tap>
        <Pop active={favorite}><IconButton testID="detail-star" name="star" label={favorite ? 'Remove from favorites' : 'Add to favorites'} size={56} iconSize={25} tint={color.peach} active filled={favorite} onPress={() => toggleFavorite(o.id)} /></Pop>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.base },
  hero: { position: 'absolute', top: 0, left: 0, right: 0, height: 386 },
  titleBlock: { paddingHorizontal: 26 },
  pill: { alignSelf: 'flex-start', paddingHorizontal: 11, paddingVertical: 3, borderRadius: 11, borderWidth: 1, borderColor: color.peachLine, marginBottom: 8, backgroundColor: 'rgba(14,19,32,0.4)' },
  pillText: { fontFamily: font.medium, fontSize: 12, color: color.text },
  title: type.objectTitle,
  subtitle: { ...type.body, color: color.text, marginTop: 8, fontSize: 15 },
  segments: { marginHorizontal: 22, marginTop: 16 },
  section: { paddingHorizontal: 26, marginTop: 16 },
  copy: { fontFamily: font.regular, fontSize: 15, lineHeight: 22, color: color.text },
  cells: { flexDirection: 'row', marginTop: 16 },
  cell: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 2, paddingHorizontal: 4 },
  cellLine: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: color.hairlineStrong },
  cellLabel: { fontFamily: font.regular, fontSize: 12.5, color: color.textSecondary, marginTop: 3 },
  cellValue: { fontFamily: font.medium, fontSize: 15, color: color.text, fontVariant: ['tabular-nums'] },
  fact: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.hairline },
  factLabel: { fontFamily: font.regular, fontSize: 14, color: color.textSecondary, flexShrink: 1 },
  factValue: { fontFamily: font.medium, fontSize: 14, color: color.text, flexShrink: 1, textAlign: 'right', fontVariant: ['tabular-nums'] },
  topBar: { position: 'absolute', left: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 4 },
  actions: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 22, paddingTop: 10, backgroundColor: 'rgba(6,10,20,0.97)' },
  find: { flex: 1, height: 56, borderRadius: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, borderWidth: 1, borderColor: color.hairlineStrong, backgroundColor: 'rgba(17,26,48,0.72)' },
  findText: { fontFamily: font.medium, fontSize: 17, color: color.text },
});
