import { Newsreader_400Regular, Newsreader_400Regular_Italic } from '@expo-google-fonts/newsreader';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { ReactNode, useEffect } from 'react';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaInsetsContext, SafeAreaProvider } from 'react-native-safe-area-context';
import { object } from '../data/catalog';
import { restoreDeepFavorites } from '../data/catalogs/runtime';
import { color } from '../design/tokens';
import { refreshEntitlement } from '../features/subscription/iap';
import { DEMO_MODE } from '../state/demo';
import { allListItems } from '../state/lists';
import { bumpCatalog, getState, hydrate, useStore } from '../state/store';

SplashScreen.preventAutoHideAsync().catch(() => {});

// A browser has no notch, so web screenshots would sit 59pt too high against the design.
// Screenshot mode lends them the insets of an iPhone 16. It changes nothing on a device.
const IPHONE_INSETS = { top: 59, bottom: 34, left: 0, right: 0 };
function ScreenshotInsets({ children }: { children: ReactNode }) {
  if (!DEMO_MODE || Platform.OS !== 'web') return <>{children}</>;
  return <SafeAreaInsetsContext.Provider value={IPHONE_INSETS}>{children}</SafeAreaInsetsContext.Provider>;
}

export default function RootLayout() {
  const [fonts] = useFonts({ Newsreader_400Regular, Newsreader_400Regular_Italic, Inter_400Regular, Inter_500Medium, Inter_600SemiBold });
  const hydrated = useStore((s) => s.hydrated);

  useEffect(() => { hydrate().then(() => { if (!DEMO_MODE) refreshEntitlement().catch(() => {}); }); }, []);
  useEffect(() => { if (fonts && hydrated) SplashScreen.hideAsync().catch(() => {}); }, [fonts, hydrated]);
  useEffect(() => {
    if (hydrated) restoreDeepFavorites([...getState().favorites, ...allListItems(getState().lists), ...getState().recents], (id) => object(id) !== null).then((changed) => { if (changed) bumpCatalog(); }).catch(() => {});
  }, [hydrated]);

  if (!fonts || !hydrated) return <View style={{ flex: 1, backgroundColor: color.base }} />;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: color.base }}>
      <SafeAreaProvider>
        <ScreenshotInsets>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.base }, animation: 'fade' }}>
            <Stack.Screen name="object/[id]" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="search" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="pro" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="time-travel" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="ar" options={{ animation: 'fade' }} />
            <Stack.Screen name="location-search" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="sky-engine" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="list/[id]" options={{ animation: 'slide_from_right' }} />
          </Stack>
        </ScreenshotInsets>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
