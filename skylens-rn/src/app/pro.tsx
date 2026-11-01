import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton, PrimaryButton, press } from '../design/components';
import { Icon, IconName } from '../design/Icon';
import { images } from '../design/images';
import { motion, Reveal, Settle } from '../design/motion';
import { color, font, type } from '../design/tokens';
import { buy, listen, loadPlans, PlanOption, refreshEntitlement, restore } from '../features/subscription/iap';
import { useStore } from '../state/store';

const TERMS = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

const FEATURES: { icon: IconName; text: string }[] = [
  { icon: 'layers', text: 'The full deep sky catalog, 1,643 objects' },
  { icon: 'moonRing', text: 'The complete Tonight list' },
  { icon: 'calendar', text: 'Event calendar for any month' },
  { icon: 'check', text: 'The live sky, search and AR stay free' },
];

export default function Pro() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const proActive = useStore((s) => s.proActive);
  const [plans, setPlans] = useState<PlanOption[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadPlans().then((p) => {
      if (cancelled) return;
      setPlans(p);
      setSelected(p.find((x) => x.period === 'year')?.id ?? p[0]?.id ?? null);
    }).catch(() => { if (!cancelled) setPlans([]); });
    refreshEntitlement().catch(() => {});
    const stop = listen((e) => {
      setBusy(false);
      if (e.kind === 'purchased') setMessage(null);
      else if (e.kind === 'failed') setMessage(e.message);
    });
    return () => { cancelled = true; stop(); };
  }, []);

  const unlock = async () => {
    if (!selected) return;
    setBusy(true);
    setMessage(null);
    try { await buy(selected); } catch (e) { setBusy(false); setMessage(e instanceof Error ? e.message : 'The purchase could not be started.'); }
  };
  const doRestore = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const on = await restore();
      setMessage(on ? 'Your subscription is restored.' : 'No active subscription was found for this Apple Account.');
    } catch { setMessage('Purchases could not be restored. Check your connection and try again.'); }
    setBusy(false);
  };

  const plan = plans?.find((p) => p.id === selected) ?? null;
  const unavailable = plans !== null && plans.length === 0;

  return (
    <View style={styles.root}>
      <Settle style={styles.saturn} from={1.05} rise={-10}><Image source={images.saturnPro} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="top" /></Settle>
      <LinearGradient colors={['rgba(6,10,20,0)', color.base]} locations={[0.34, 0.6]} style={StyleSheet.absoluteFill} pointerEvents="none" />
      <LinearGradient colors={['rgba(226,153,125,0)', 'rgba(226,153,125,0.13)']} style={styles.floorGlow} pointerEvents="none" />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + (height < 760 ? 34 : 112), paddingHorizontal: 28, paddingBottom: Math.max(insets.bottom, 14) + 8, flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <Reveal delay={120}>
          <Icon name="crown" size={40} tint={color.peach} weight={1.4} />
          <Text style={styles.title} accessibilityRole="header">SkyLens Pro</Text>
          <Text style={styles.lead}>Unlock the complete{'\n'}astronomy experience.</Text>
        </Reveal>
        <Reveal delay={120 + motion.stagger * 2} style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.text} style={styles.feature}>
              <Icon name={f.icon} size={22} tint={color.peach} weight={1.4} />
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </Reveal>
        <View style={{ flex: 1, minHeight: 20 }} />
        <Reveal delay={120 + motion.stagger * 4}>
          {proActive ? (
            <Text style={styles.active}>SkyLens Pro is active on this Apple Account.</Text>
          ) : (
            <>
              {plans && plans.length > 0 ? (
                <View style={styles.plans} accessibilityRole="radiogroup">
                  {plans.map((p) => {
                    const on = selected === p.id;
                    return (
                      <Pressable key={p.id} accessibilityRole="radio" accessibilityLabel={`${p.price}${p.period ? ` per ${p.period}` : ''}`} accessibilityState={{ selected: on }} onPress={() => setSelected(p.id)} style={[styles.plan, on && styles.planOn]}>
                        <Text style={styles.planName}>{p.period === 'year' ? 'Yearly' : p.period === 'month' ? 'Monthly' : p.title}</Text>
                        <Text style={styles.planPrice}>{p.price}</Text>
                        <Text style={styles.planPeriod}>{p.trial ?? (p.period ? `per ${p.period}` : '')}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
              {unavailable ? (
                <View style={styles.unavailable}>
                  <Text style={styles.unavailableTitle}>Subscriptions aren&apos;t available right now</Text>
                  <Text style={styles.unavailableBody}>Nothing has been charged. The sky, search and AR stay free.</Text>
                </View>
              ) : null}
              <PrimaryButton testID="unlock-pro" label="Unlock Pro" disabled={!plan} busy={busy} onPress={unlock} />
              {plan ? (
                <Text style={styles.legal}>
                  {plan.trial ? `${plan.trial}, then ` : ''}{plan.price}{plan.period ? ` per ${plan.period}` : ''}. Renews automatically until cancelled at least 24 hours before the period ends. Manage it in your Apple Account settings.
                </Text>
              ) : null}
            </>
          )}
          {message ? <Text style={styles.note}>{message}</Text> : null}
        </Reveal>
        <View style={styles.links}>
          <Pressable hitSlop={10} accessibilityRole="button" disabled={busy} onPress={doRestore} style={({ pressed }) => press(pressed)}><Text style={styles.link}>Restore Purchases</Text></Pressable>
          <Text style={styles.linkDot}>·</Text>
          <Pressable hitSlop={10} accessibilityRole="link" onPress={() => WebBrowser.openBrowserAsync(TERMS)} style={({ pressed }) => press(pressed)}><Text style={styles.link}>Terms</Text></Pressable>
          <Text style={styles.linkDot}>·</Text>
          <Pressable hitSlop={10} accessibilityRole="link" onPress={() => router.push('/privacy')} style={({ pressed }) => press(pressed)}><Text style={styles.link}>Privacy</Text></Pressable>
        </View>
      </ScrollView>
      <View style={{ position: 'absolute', top: insets.top + 8, left: 12 }}>
        <IconButton testID="pro-close" name="close" label="Close" glass={false} onPress={() => (router.canGoBack() ? router.back() : router.replace('/more'))} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.base },
  saturn: { position: 'absolute', top: 0, left: 0, right: 0, height: 560 },
  floorGlow: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 170 },
  title: { ...type.title, fontSize: 40, lineHeight: 47, marginTop: 14 },
  lead: { fontFamily: font.regular, fontSize: 17.5, lineHeight: 25, color: color.text, marginTop: 8 },
  features: { marginTop: 26, gap: 17 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  featureText: { fontFamily: font.regular, fontSize: 15, color: color.text, flex: 1 },
  active: { ...type.bodyStrong, color: color.peach, textAlign: 'center', paddingVertical: 20 },
  plans: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  plan: { flex: 1, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, borderColor: color.hairlineStrong, backgroundColor: 'rgba(14,19,32,0.5)' },
  planOn: { borderColor: color.peach, backgroundColor: color.peachFill },
  planName: { ...type.micro, color: color.textSecondary },
  planPrice: { fontFamily: font.semibold, fontSize: 18, color: color.text, marginTop: 4, fontVariant: ['tabular-nums'] },
  planPeriod: { ...type.micro, marginTop: 2 },
  unavailable: { paddingVertical: 13, paddingHorizontal: 16, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: color.hairlineStrong, backgroundColor: 'rgba(14,19,32,0.56)', marginBottom: 14 },
  unavailableTitle: { fontFamily: font.medium, fontSize: 14, lineHeight: 19, color: color.text, textAlign: 'center' },
  unavailableBody: { ...type.caption, textAlign: 'center', marginTop: 2 },
  legal: { ...type.micro, lineHeight: 16, textAlign: 'center', marginTop: 10 },
  note: { ...type.caption, textAlign: 'center', marginBottom: 12, marginTop: 4 },
  links: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 14 },
  link: { fontFamily: font.medium, fontSize: 13, color: color.textSecondary },
  linkDot: { color: color.textTertiary },
});
