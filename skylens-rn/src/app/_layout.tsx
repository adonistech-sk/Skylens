import { Newsreader_300Light, Newsreader_300Light_Italic } from '@expo-google-fonts/newsreader';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { color } from '../design/tokens';
import { hydrate, useStore } from '../state/store';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fonts] = useFonts({ Newsreader_300Light, Newsreader_300Light_Italic, Inter_400Regular, Inter_500Medium, Inter_600SemiBold });
  const hydrated = useStore((s) => s.hydrated);

  useEffect(() => { hydrate(); }, []);
  useEffect(() => { if (fonts && hydrated) SplashScreen.hideAsync().catch(() => {}); }, [fonts, hydrated]);

  if (!fonts || !hydrated) return <View style={{ flex: 1, backgroundColor: color.base }} />;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: color.base }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.base }, animation: 'fade' }}>
          <Stack.Screen name="object/[id]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="search" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="pro" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="time-travel" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="ar" options={{ animation: 'fade' }} />
          <Stack.Screen name="location-search" options={{ animation: 'slide_from_right' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
