import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton, PrimaryButton, SecondaryButton } from '../design/components';
import { Icon } from '../design/Icon';
import { images } from '../design/images';
import { color, font, type } from '../design/tokens';
import { currentLocation } from '../features/location/currentLocation';
import { leaveLocationFlow } from '../features/location/leave';
import { completeOnboarding, setLocation, useStore } from '../state/store';

export default function LocationScreen() {
  const insets = useSafeAreaInsets();
  const onboarded = useStore((s) => s.onboarded);
  const first = useLocalSearchParams<{ first?: string }>().first === '1' || !onboarded;
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<{ text: string; settings?: boolean } | null>(null);

  const useCurrent = async () => {
    setBusy(true);
    setProblem(null);
    const result = await currentLocation();
    setBusy(false);
    if (result.kind === 'ok') {
      setLocation(result.location);
      completeOnboarding();
      leaveLocationFlow(first);
    } else if (result.kind === 'denied') {
      setProblem({ text: 'Location access is off. Choose a place manually, or allow it in Settings.', settings: !result.canAskAgain });
    } else {
      setProblem({ text: result.message });
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <Image source={images.mountains} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="bottom" />
        <LinearGradient colors={['rgba(6,10,20,0.96)', 'rgba(6,10,20,0.5)', 'rgba(6,10,20,0)']} locations={[0, 0.3, 0.52]} style={StyleSheet.absoluteFill} />
        <LinearGradient colors={['rgba(6,10,20,0)', color.base]} locations={[0.62, 0.95]} style={StyleSheet.absoluteFill} />
      </View>
      {router.canGoBack() ? (
        <View style={{ position: 'absolute', top: insets.top + 12, left: 14 }}>
          <IconButton name="back" label="Back" glass={false} onPress={() => router.back()} />
        </View>
      ) : null}
      <View style={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) + 18 }]}>
        <View style={styles.pin}>
          <Icon name="pin" size={28} tint={color.peachLight} weight={1.6} />
        </View>
        <Text style={[type.tracked, styles.tracked]}>Your location</Text>
        <Text style={styles.title} accessibilityRole="header">Where are you stargazing?</Text>
        <Text style={styles.body}>We&apos;ll use your location to show accurate sky, visibility, and events.</Text>
        {problem ? (
          <Pressable disabled={!problem.settings} onPress={() => Linking.openSettings()}>
            <Text style={styles.problem}>{problem.text}{problem.settings ? ' Open Settings' : ''}</Text>
          </Pressable>
        ) : null}
        <View style={styles.actions}>
          <PrimaryButton testID="use-current" label="Use Current Location" leading="navigate" icon={null} busy={busy} onPress={useCurrent} />
          <SecondaryButton testID="choose-manually" label="Choose Manually" leading="search" onPress={() => router.push(first ? '/location-search?first=1' : '/location-search')} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.base },
  hero: { position: 'absolute', top: 0, left: 0, right: 0, height: '56%' },
  content: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 28 },
  pin: { alignSelf: 'center', width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: color.peachLine, backgroundColor: 'rgba(40,28,30,0.62)' },
  tracked: { textAlign: 'center', marginTop: 24, color: color.text },
  title: { fontFamily: font.serif, fontSize: 38, lineHeight: 44, color: color.text, textAlign: 'center', marginTop: 12, letterSpacing: -0.5 },
  body: { fontFamily: font.regular, fontSize: 16, lineHeight: 24, color: color.textSecondary, textAlign: 'center', marginTop: 14, paddingHorizontal: 8 },
  problem: { fontFamily: font.regular, fontSize: 13, lineHeight: 19, color: color.peach, textAlign: 'center', marginTop: 12 },
  actions: { gap: 14, marginTop: 28 },
});
