import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton, PrimaryButton, SecondaryButton } from '../design/components';
import { Icon } from '../design/Icon';
import { images } from '../design/images';
import { Reveal, Settle } from '../design/motion';
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
        <Settle style={StyleSheet.absoluteFill} from={1.05} rise={10}><Image source={images.mountains} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="top" /></Settle>
        <LinearGradient colors={['rgba(6,10,20,0)', color.base]} locations={[0.56, 1]} style={StyleSheet.absoluteFill} />
      </View>
      {router.canGoBack() ? (
        <View style={{ position: 'absolute', top: insets.top + 12, left: 14 }}>
          <IconButton name="back" label="Back" glass={false} onPress={() => router.back()} />
        </View>
      ) : null}
      <View style={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) + 18 }]}>
        <Reveal delay={160} style={styles.pin}>
          <Icon name="pin" size={28} tint={color.peachLight} weight={1.6} />
        </Reveal>
        <Reveal delay={260}>
          <Text style={[type.tracked, styles.tracked]}>Your location</Text>
          <Text style={styles.title} accessibilityRole="header">Where are you{'\n'}stargazing?</Text>
          <Text style={styles.body}>We&apos;ll use your location to show{'\n'}accurate sky, visibility, and events.</Text>
        </Reveal>
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
  hero: { position: 'absolute', top: 0, left: 0, right: 0, height: '60%' },
  content: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 28 },
  pin: { alignSelf: 'center', width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: color.peachLine, backgroundColor: 'rgba(40,28,30,0.62)' },
  tracked: { textAlign: 'center', marginTop: 24, color: color.text },
  title: { ...type.title, fontSize: 37, lineHeight: 42, textAlign: 'center', marginTop: 12 },
  body: { ...type.body, fontSize: 15.5, lineHeight: 23, textAlign: 'center', marginTop: 14 },
  problem: { fontFamily: font.regular, fontSize: 13, lineHeight: 19, color: color.peach, textAlign: 'center', marginTop: 12 },
  actions: { gap: 14, marginTop: 28 },
});
