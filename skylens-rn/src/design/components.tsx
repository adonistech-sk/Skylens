import { LinearGradient } from 'expo-linear-gradient';
import { router, usePathname } from 'expo-router';
import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconName } from './Icon';
import { color, font, peachGradient, space, type } from './tokens';

export const press = (pressed: boolean) => ({ opacity: pressed ? 0.72 : 1 });

export function PrimaryButton({ label, onPress, icon = 'arrowRight', leading, disabled, busy, testID }: {
  label: string; onPress: () => void; icon?: IconName | null; leading?: IconName; disabled?: boolean; busy?: boolean; testID?: string;
}) {
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !!disabled, busy: !!busy }}
      disabled={disabled || busy} onPress={onPress} style={({ pressed }) => [styles.primaryWrap, press(pressed), disabled && { opacity: 0.45 }]}>
      <LinearGradient colors={peachGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primary}>
        {busy ? <ActivityIndicator color={color.peachInk} /> : (
          <>
            {leading ? <View style={styles.leading}><Icon name={leading} size={20} tint={color.peachInk} filled={leading === 'navigate'} /></View> : null}
            <Text style={styles.primaryLabel}>{label}</Text>
            {icon ? <View style={styles.trailing}><Icon name={icon} size={22} tint={color.peachInk} /></View> : null}
          </>
        )}
      </LinearGradient>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress, leading, testID, style }: { label: string; onPress: () => void; leading?: IconName; testID?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.secondary, press(pressed), style]}>
      {leading ? <Icon name={leading} size={20} /> : null}
      <Text style={styles.secondaryLabel}>{label}</Text>
    </Pressable>
  );
}

export function IconButton({ name, label, onPress, size = 44, iconSize = 21, tint = color.text, active, glass = true, weight, filled, testID, style }: {
  name: IconName; label: string; onPress: () => void; size?: number; iconSize?: number; tint?: string; active?: boolean; glass?: boolean; weight?: number; filled?: boolean; testID?: string; style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: !!active }} hitSlop={6} onPress={onPress}
      style={({ pressed }) => [{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }, glass && styles.glass, active && styles.glassActive, press(pressed), style]}>
      <Icon name={name} size={iconSize} tint={active ? color.peach : tint} weight={weight} filled={filled} />
    </Pressable>
  );
}

export function SegmentedControl<T extends string>({ options, value, onChange, style, solid }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; style?: StyleProp<ViewStyle>; solid?: boolean }) {
  return (
    <View style={[styles.segments, style]} accessibilityRole="tablist">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable key={o.value} accessibilityRole="tab" accessibilityLabel={o.label} accessibilityState={{ selected }} onPress={() => onChange(o.value)} style={[styles.segment, selected && !solid && styles.segmentOn]}>
            {selected && solid ? <LinearGradient colors={peachGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: 19 }]} /> : null}
            <Text style={[styles.segmentLabel, selected && styles.segmentLabelOn, selected && solid && { color: color.peachInk, fontFamily: font.semibold }]} numberOfLines={1}>{o.label}</Text>
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
            <Icon name={t.icon} size={23} tint={selected ? color.peach : color.textSecondary} weight={1.35} />
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
  primaryLabel: { fontFamily: font.semibold, fontSize: 17, color: color.peachInk },
  leading: { marginRight: 12 },
  trailing: { position: 'absolute', right: 24 },
  secondary: { height: 54, borderRadius: 27, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, borderWidth: 1, borderColor: color.hairlineStrong, backgroundColor: 'rgba(11,16,32,0.5)', paddingHorizontal: 20 },
  secondaryLabel: { fontFamily: font.medium, fontSize: 16, color: color.text },
  glass: { backgroundColor: 'rgba(14,19,32,0.62)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.18)' },
  glassActive: { borderColor: color.peachLine, borderWidth: 1, backgroundColor: 'rgba(30,22,24,0.72)' },
  segments: { flexDirection: 'row', height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.055)', padding: 2 },
  segment: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 19, borderWidth: 1, borderColor: 'transparent' },
  segmentOn: { backgroundColor: color.peachFill, borderColor: color.peachLine },
  segmentLabel: { fontFamily: font.medium, fontSize: 14, color: color.textSecondary },
  segmentLabelOn: { color: color.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 11, minHeight: 66 },
  rowLine: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.hairlineStrong },
  rowText: { flex: 1 },
  rowTitle: { fontFamily: font.semibold, fontSize: 15, lineHeight: 20, color: color.text },
  rowSubtitle: { fontFamily: font.regular, fontSize: 13, lineHeight: 18, color: color.textSecondary, marginTop: 2, fontVariant: ['tabular-nums'] },
  tabBar: { flexDirection: 'row', paddingTop: 10, backgroundColor: 'rgba(11,15,25,0.92)', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.hairline, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  tabBarFloating: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  tab: { flex: 1, alignItems: 'center', gap: 4, minHeight: 48 },
  tabLabel: { fontFamily: font.medium, fontSize: 11, color: color.textSecondary },
  notice: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start', paddingVertical: space.sm },
});
