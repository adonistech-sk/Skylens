import { getCalendars } from 'expo-localization';
import * as Location from 'expo-location';
import { SavedLocation } from '../../state/store';

export type LocationResult =
  | { kind: 'ok'; location: SavedLocation }
  | { kind: 'denied'; canAskAgain: boolean }
  | { kind: 'failed'; message: string };

/** A real GPS fix or a clear failure. Nothing here ever invents a position. */
export async function currentLocation(): Promise<LocationResult> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) return { kind: 'denied', canAskAgain: permission.canAskAgain };
  try {
    const fix = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 15_000)),
    ]);
    const position = fix ?? (await Location.getLastKnownPositionAsync());
    if (!position) return { kind: 'failed', message: "Your position couldn't be found. Try again outdoors, or choose a place manually." };
    const { latitude, longitude, altitude } = position.coords;
    let name = `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`;
    try {
      const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
      name = place?.city ?? place?.subregion ?? place?.region ?? place?.country ?? name;
    } catch {
      // Offline, or a platform with no geocoder. Coordinates are still a true label.
    }
    const timeZone = getCalendars()[0]?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'Etc/UTC';
    return { kind: 'ok', location: { name, latitude, longitude, elevation: altitude ?? 0, timeZone, source: 'gps' } };
  } catch {
    return { kind: 'failed', message: "Your position couldn't be found. Check that Location Services are on, or choose a place manually." };
  }
}
