import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Mat3 } from '../astronomy/core';
import { orientationFor } from '../astronomy/camera';
import { IconButton, press, PrimaryButton } from '../design/components';
import { images } from '../design/images';
import { color, font, type } from '../design/tokens';
import { saveARPhoto } from '../features/ar/capture';
import { cameraFieldOfView } from '../features/sky/attitude';
import { CompassSession } from '../features/sky/CompassSession';
import { SkyView } from '../features/sky/SkyView';
import { DEMO_MODE } from '../state/demo';
import { setLayer, useStore } from '../state/store';

// Wide camera of current iPhones: 69.4° across the long side of a 4:3 sensor format.
const SENSOR_FOV = 69.4, SENSOR_ASPECT = 4 / 3;

function FrameGuide() {
  const c = (d: string, i: number) => <Path key={i} d={d} stroke="rgba(255,255,255,0.72)" strokeWidth={1.1} fill="none" />;
  return (
    <View style={styles.guide} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 240 280" preserveAspectRatio="none">
        {['M0 18V0H18', 'M222 0H240V18', 'M240 262V280H222', 'M18 280H0V262'].map(c)}
      </Svg>
    </View>
  );
}

export default function ARSky() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView | null>(null);
  const orientation = useRef<Mat3 | null>(DEMO_MODE ? orientationFor(163.5, 38) : null);
  const [size, setSize] = useState({ width: 393, height: 852 });
  const [noSensors, setNoSensors] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [correction, setCorrection] = useState(0);
  const [showAlign, setShowAlign] = useState(false);
  const [chrome, setChrome] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const layers = useStore((s) => s.layers);
  const fov = useMemo(() => cameraFieldOfView(SENSOR_FOV, SENSOR_ASPECT, size.width, size.height), [size]);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/sky'));
  const live = !DEMO_MODE && Platform.OS !== 'web';
  const granted = permission?.granted ?? false;

  const shoot = async () => {
    setStatus('Saving…');
    const ok = camera.current ? await saveARPhoto(camera.current, orientation.current, fov, size).catch(() => false) : false;
    setStatus(ok ? 'Saved to Photos' : "The photo couldn't be saved");
    setTimeout(() => setStatus(null), 2200);
  };

  if (live && permission && !granted) {
    return (
      <View style={[styles.root, styles.state, { paddingTop: insets.top + 60 }]}>
        <Text style={type.title} accessibilityRole="header">AR Sky needs the camera</Text>
        <Text style={[type.body, { marginTop: 12 }]}>It shows the stars over your live view. Nothing is recorded unless you press the shutter.</Text>
        <View style={{ height: 24 }} />
        {permission.canAskAgain ? <PrimaryButton label="Allow Camera" onPress={requestPermission} icon={null} /> : <PrimaryButton label="Open Settings" onPress={() => Linking.openSettings()} icon={null} />}
        <Pressable accessibilityRole="button" onPress={close} style={styles.back}><Text style={styles.backText}>Back to the sky</Text></Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root} onLayout={(e) => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}>
      {live ? <CameraView ref={camera} style={StyleSheet.absoluteFill} facing="back" onMountError={() => setNoSensors(true)} /> : <Image source={images.arStandIn} style={StyleSheet.absoluteFill} contentFit="cover" />}
      {DEMO_MODE ? null : <CompassSession orientationRef={orientation} correction={correction} onUnavailable={() => setNoSensors(true)} onMessage={setMessage} />}
      <View style={StyleSheet.absoluteFill}>
        <SkyView orientationRef={orientation} projection="rectilinear" fixedFov={fov} overlayOnly showCompass={false} interactive={false} hideGround topInset={insets.top + 60} bottomInset={120} />
      </View>
      {chrome ? <FrameGuide /> : null}

      {chrome ? (
        <View style={[styles.top, { top: insets.top + 8 }]}>
          <IconButton testID="ar-close" name="close" label="Close AR Sky" glass={false} iconSize={25} onPress={close} />
          <View style={styles.mode} accessibilityRole="tablist">
            <View style={styles.modeOn} accessibilityRole="tab" accessibilityState={{ selected: true }}><Text style={styles.modeOnText}>AR Sky</Text></View>
            <Pressable accessibilityRole="tab" accessibilityLabel="Sky map" style={styles.modeOff} onPress={close}><Text style={styles.modeOffText}>Sky</Text></Pressable>
          </View>
          <IconButton testID="ar-align" name="gear" label="Alignment" glass={false} iconSize={25} active={showAlign} onPress={() => setShowAlign(!showAlign)} />
        </View>
      ) : null}

      {DEMO_MODE ? <Text style={[styles.standIn, { top: insets.top + 60 }]}>Test mode: photo stands in for the camera</Text> : null}
      {noSensors ? <Text style={[styles.notice, { top: insets.top + 66 }]}>Motion sensors or the camera aren&apos;t available here, so AR Sky can&apos;t line up with the real sky.</Text> : null}
      {message && !noSensors ? <Text style={[styles.notice, { top: insets.top + 66 }]}>{message}</Text> : null}
      {status ? <Text style={[styles.notice, { top: insets.top + 110 }]}>{status}</Text> : null}

      {showAlign && chrome ? (
        <View style={[styles.align, { bottom: 150 + insets.bottom }]}>
          <Text style={styles.alignTitle}>Alignment</Text>
          <Text style={type.caption}>Compasses can be off by several degrees. If a star sits beside its label, nudge the sky until they meet.</Text>
          <View style={styles.alignRow}>
            <IconButton name="back" label="Turn the sky left one degree" size={40} onPress={() => setCorrection(correction - 1)} />
            <Text style={styles.alignValue}>{correction > 0 ? '+' : ''}{correction}°</Text>
            <IconButton name="chevron" label="Turn the sky right one degree" size={40} onPress={() => setCorrection(correction + 1)} />
          </View>
        </View>
      ) : null}

      <View style={[styles.bottom, { bottom: Math.max(insets.bottom, 14) + 16 }]}>
        {chrome ? <IconButton testID="ar-layers" name="layers" label={layers.constellations ? 'Hide constellation lines' : 'Show constellation lines'} size={54} onPress={() => setLayer('constellations', !layers.constellations)} /> : <View style={{ width: 54 }} />}
        {live ? (
          <Pressable testID="ar-shutter" accessibilityRole="button" accessibilityLabel="Take a photo with the sky overlay" onPress={shoot} style={({ pressed }) => [styles.shutter, press(pressed)]}>
            <View style={styles.shutterCore} />
          </Pressable>
        ) : <View style={styles.shutterDemo}><View style={styles.shutterCore} /></View>}
        <IconButton testID="ar-chrome" name="fullscreen" label={chrome ? 'Hide the controls' : 'Show the controls'} size={54} onPress={() => setChrome(!chrome)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#05060C' },
  state: { paddingHorizontal: 26 },
  back: { alignSelf: 'center', padding: 16, marginTop: 8 },
  backText: { fontFamily: font.medium, fontSize: 15, color: color.textSecondary },
  top: { position: 'absolute', left: 12, right: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mode: { flexDirection: 'row', borderRadius: 22, backgroundColor: 'rgba(20,24,38,0.62)', padding: 3 },
  modeOn: { paddingHorizontal: 20, paddingVertical: 9, borderRadius: 19, backgroundColor: color.peach },
  modeOnText: { fontFamily: font.semibold, fontSize: 14, color: color.peachInk },
  modeOff: { paddingHorizontal: 20, paddingVertical: 9 },
  modeOffText: { fontFamily: font.medium, fontSize: 14, color: color.text },
  guide: { position: 'absolute', left: '15%', right: '15%', top: '27%', bottom: '31%' },
  standIn: { position: 'absolute', alignSelf: 'center', fontFamily: font.regular, fontSize: 10.5, color: 'rgba(255,255,255,0.6)' },
  notice: { position: 'absolute', left: 30, right: 30, textAlign: 'center', fontFamily: font.medium, fontSize: 13, lineHeight: 18, color: color.text, backgroundColor: 'rgba(11,15,27,0.78)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, overflow: 'hidden' },
  align: { position: 'absolute', left: 18, right: 18, padding: 16, borderRadius: 18, backgroundColor: 'rgba(11,15,27,0.92)' },
  alignTitle: { fontFamily: font.serif, fontSize: 22, color: color.text, marginBottom: 4 },
  alignRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, marginTop: 10 },
  alignValue: { fontFamily: font.medium, fontSize: 18, color: color.text, width: 60, textAlign: 'center', fontVariant: ['tabular-nums'] },
  bottom: { position: 'absolute', left: 24, right: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  shutter: { width: 84, height: 84, borderRadius: 42, borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  shutterDemo: { width: 84, height: 84, borderRadius: 42, borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', opacity: 0.9 },
  shutterCore: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#EDE9E9' },
});
