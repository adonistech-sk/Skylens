import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton, PrimaryButton } from '../design/components';
import { Emblem } from '../design/Icon';
import { images } from '../design/images';
import { color, font } from '../design/tokens';

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <Image source={images.earthOnboarding} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="bottom" />
      <View style={[styles.top, { top: insets.top + 18 }]}>
        <View style={styles.lockup} accessibilityRole="header" accessibilityLabel="SkyLens">
          <Emblem size={32} />
          <Text style={styles.brand}>SkyLens</Text>
        </View>
        <IconButton name="dots" label="About and credits" glass={false} onPress={() => router.push('/credits')} />
      </View>
      <View style={[styles.copy, { top: insets.top + 118 }]}>
        <Text style={styles.title}>Explore</Text>
        <Text style={[styles.title, styles.italic]}>the Universe</Text>
        <Text style={styles.body}>A modern guide to the night sky, stars, planets, and beyond.</Text>
      </View>
      <View style={[styles.cta, { bottom: Math.max(insets.bottom, 18) + 22 }]}>
        <PrimaryButton testID="get-started" label="Get Started" onPress={() => router.push('/location')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.base },
  top: { position: 'absolute', left: 26, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lockup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brand: { fontFamily: font.serif, fontSize: 27, color: color.text, letterSpacing: -0.3 },
  copy: { position: 'absolute', left: 28, right: 28 },
  title: { fontFamily: font.serif, fontSize: 52, lineHeight: 58, color: color.text, letterSpacing: -0.8 },
  italic: { fontFamily: font.serifItalic },
  body: { fontFamily: font.regular, fontSize: 17, lineHeight: 25, color: color.text, marginTop: 14, maxWidth: 320 },
  cta: { position: 'absolute', left: 26, right: 26 },
});
