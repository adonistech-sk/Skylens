// Deterministic screenshot mode. It only fixes the clock and the observer so screens
// can be compared between builds: every value shown is still calculated by the normal
// code. It is off in any build not made with EXPO_PUBLIC_SCREENSHOT_MODE=1, and on the
// web it needs ?demo=1 in the URL.
import { Platform } from 'react-native';

function webFlag(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('demo') === '1';
}

export const DEMO_MODE = process.env.EXPO_PUBLIC_SCREENSHOT_MODE === '1' || webFlag();

/** A waxing gibbous evening with Orion high in the south over Bratislava. */
export const DEMO_DATE = '2027-01-17T20:25:00Z';

export const DEMO_LOCATION = {
  name: 'Bratislava',
  latitude: 48.1486,
  longitude: 17.1077,
  elevation: 134,
  timeZone: 'Europe/Bratislava',
  source: 'manual' as const,
};
