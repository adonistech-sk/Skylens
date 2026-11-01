import { LinearGradient } from 'expo-linear-gradient';
import { router, usePathname } from 'expo-router';
import { ReactNode, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { Icon, IconName } from './Icon';
import { motion, Tap } from './motion';
import { color, font, peachGradient, space, type } from './tokens';

export const press = (pressed: boolean) => ({ opacity: pressed ? 0.72 : 1 });

export function PrimaryButton({ label, onPress, icon = 'arrowRight', leading, disabled, busy, testID }: {
  label: string; onPress: () => void; icon?: IconName | null; leading?: IconName; disabled?: boolean; busy?: boolean; testID?: string;
}) {
  return (
    <Tap testID={testID} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !!disabled, busy: !!busy }}
      disabled={disabled || busy} onPress={onPress} style={[styles.primaryWrap, disabled && { opacity: 0.55 }]}>
      <LinearGradient colors={peachGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primary}>
        {busy ? <ActivityIndicator color={color.peachInk} /> : (
          <>
            {leading ? <View style={styles.leading}><Icon name={leading} size={20} tint={color.peachInk} filled={leading === 'navigate'} /></View> : null}
            <Text style={styles.primaryLabel}>{label}</Text>
            {icon ? <View style={styles.trailing}><Icon name={icon} size={22} tint={color.peachInk} /></View> : null}
          </>
        )}
      </LinearGradient>
    </Tap>
  );
}

export function SecondaryButton({ label, onPress, leading, testID, style }: { label: string; onPress: () => void; leading?: IconName; testID?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <Tap testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={[styles.secondary, style]}>
      {leading ? <Icon name={leading} size={20} /> : null}
      <Text style={styles.secondaryLabel}>{label}</Text>
    </Tap>
  );
}

export function IconButton({ name, label, onPress, size = 44, iconSize = 21, tint = color.text, active, glass = true, weight, filled, testID, style }: {
  name: IconName; label: string; onPress: () => void; size?: number; iconSize?: number; tint?: string; active?: boolean; glass?: boolean; weight?: number; filled?: boolean; testID?: string; style?: StyleProp<ViewStyle>;
}) {
  return (
    <Tap testID={testID} depth={0.92} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: !!active }} hitSlop={6} onPress={onPress}
      style={[{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }, glass && styles.glass, active && styles.glassActive, style]}>
      <Icon name={name} size={iconSize} tint={active ? color.peach : tint} weight={weight} filled={filled} />
    </Tap>
  );
}

export function SegmentedControl<T extends string>({ options, value, onChange, style, solid, compact }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; style?: StyleProp<ViewStyle>; solid?: boolean; compact?: boolean }) {
  const [width, setWidth] = useState(0);
  const reduced = useReducedMotion();
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const segment = (width - 4) / options.length;
  const x = useSharedValue(0);
  // The selection slides between segments rather than jumping.
  useEffect(() => {
    const to = index * segment;
    x.value = reduced || !width ? to : withTiming(to, { duration: motion.base, easing: motion.ease });
  }, [index, segment, reduced, width, x]);
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <View style={[styles.segments, compact && styles.segmentsCompact, style]} accessibilityRole="tablist" onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width ? (
        <Animated.View pointerEvents="none" style={[styles.segmentPill, { width: segment }, !solid && styles.segmentOn, pill]}>
          {solid ? <LinearGradient colors={peachGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: 19 }]} /> : null}
        </Animated.View>
      ) : null}
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable key={o.value} testID={`segment-${o.value}`} accessibilityRole="tab" accessibilityLabel={o.label} accessibilityState={{ selected }} onPress={() => onChange(o.value)} style={styles.segment}>
            <Text style={[styles.segmentLabel, compact && styles.segmentLabelCompact, selected && styles.segmentLabelOn, selected && solid && { color: color.peachInk, fontFamily: font.semibold }]} numberOfLines={1}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** The narrow rule-separated row used across Tonight, Explore and Events. */
export function Row({ leading, title, subtitle, onPress, last, right, testID }: { leading?: ReactNode; title: string; subtitle?: string; onPress?: () => void; last?: boolean; right?: ReactNode; testID?: string }) {
  return (
    <Pressable testID={testID} disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title} onPress={onPress}
      style={({ pressed }) => [styles.row, !last && styles.rowLine, press(pressed)]}>
      {leading}
      <View style={styles.rowText}>
        <Text style={styles.rowTitle} numberOfLines={2}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle} numberOfLines={2}>{subtitle}</Text> : null}
      </View>
      {right ?? (onPress ? <Icon name="chevron" size={20} tint={color.text} weight={1.6} /> : null)}
    </Pressable>
  );
}

type Tab = { href: string; label: string; icon: IconName };
const TABS: Tab[] = [
  { href: '/sky', label: 'Sky', icon: 'sparkle' },
  { href: '/tonight', label: 'Tonight', icon: 'moonRing' },
  { href: '/explore', label: 'Explore', icon: 'exploreOrb' },
  { href: '/events', label: 'Events', icon: 'calendar' },
  { href: '/more', label: 'More', icon: 'menu' },
];

export function TabBar({ floating }: { floating?: boolean }) {
  const insets = useSafeAreaInsets();
  const path = usePathname();
  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom - 6, 10) }, floating && styles.tabBarFloating]} accessibilityRole="tablist">
      {TABS.map((t) => {
        const selected = path.startsWith(t.href);
        return (
          <Pressable key={t.href} testID={`tab-${t.label}`} accessibilityRole="tab" accessibilityLabel={t.label} accessibilityState={{ selected }}
            onPress={() => { if (!selected || floating) router.replace(t.href as never); }} style={styles.tab}>
            {selected ? (
              <Svg width={72} height={46} style={styles.tabGlow} pointerEvents="none">
                <Defs><RadialGradient id="tabGlow"><Stop offset="0" stopColor={color.peach} stopOpacity={0.26} /><Stop offset="1" stopColor={color.peach} stopOpacity={0} /></RadialGradient></Defs>
                <Ellipse cx={36} cy={22} rx={36} ry={23} fill="url(#tabGlow)" />
              </Svg>
            ) : null}
            <Icon name={t.icon} size={25} tint={selected ? color.peach : color.textSecondary} weight={1.35} />
            <Text style={[styles.tabLabel, selected && { color: color.peach, fontFamily: font.semibold }]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Notice({ text, tone = 'quiet' }: { text: string; tone?: 'quiet' | 'warn' }) {
  return (
    <View style={styles.notice}>
      <Icon name="info" size={18} tint={tone === 'warn' ? color.peach : color.textSecondary} />
      <Text style={[type.caption, { flex: 1 }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  primaryWrap: { borderRadius: 30, shadowColor: color.peach, shadowOpacity: 0.22, shadowRadius: 18, shadowOffset: { width: 0, height: 6 } },
  primary: { height: 58, borderRadius: 29, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  primaryLabel: { ...type.button, fontSize: 17, color: color.peachInk },
  leading: { marginRight: 12 },
  trailing: { position: 'absolute', right: 24 },
  secondary: { height: 54, borderRadius: 27, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, borderWidth: 1, borderColor: color.hairlineStrong, backgroundColor: 'rgba(11,16,32,0.5)', paddingHorizontal: 20 },
  secondaryLabel: { fontFamily: font.medium, fontSize: 16, color: color.text },
  glass: { backgroundColor: 'rgba(14,19,32,0.62)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.18)' },
  glassActive: { borderColor: color.peachLine, borderWidth: 1, backgroundColor: 'rgba(30,22,24,0.72)' },
  segments: { flexDirection: 'row', height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.055)', padding: 2 },
  segmentsCompact: { height: 36, borderRadius: 18, backgroundColor: 'rgba(14,19,32,0.62)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.18)' },
  segment: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 19 },
  segmentPill: { position: 'absolute', top: 2, bottom: 2, left: 2, borderRadius: 19, borderWidth: 1, borderColor: 'transparent' },
  segmentOn: { backgroundColor: color.peachFill, borderColor: color.peachLine },
  segmentLabel: { fontFamily: font.medium, fontSize: 14, color: color.textSecondary },
  segmentLabelCompact: { fontSize: 12.5 },
  segmentLabelOn: { color: color.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 11, minHeight: 66 },
  rowLine: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.hairlineStrong },
  rowText: { flex: 1 },
  rowTitle: { fontFamily: font.semibold, fontSize: 15, lineHeight: 20, color: color.text },
  rowSubtitle: { fontFamily: font.regular, fontSize: 13, lineHeight: 18, color: color.textSecondary, marginTop: 2, fontVariant: ['tabular-nums'] },
  tabBar: { flexDirection: 'row', paddingTop: 10, backgroundColor: 'rgba(11,15,25,0.92)', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.hairline, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  tabBarFloating: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  tab: { flex: 1, alignItems: 'center', gap: 4, minHeight: 50 },
  tabGlow: { position: 'absolute', top: -8, alignSelf: 'center' },
  tabLabel: { fontFamily: font.medium, fontSize: 11.5, color: color.textSecondary },
  notice: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start', paddingVertical: space.sm },
});
