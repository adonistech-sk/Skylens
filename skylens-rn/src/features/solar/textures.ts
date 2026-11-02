// Surface maps, loaded when a body first needs them and dropped when it hasn't been seen for a
// while. A map that hasn't arrived, or can't be read, leaves a plain shaded globe, never a
// wrong picture. Each file's source and rights are in assets/solar/provenance.json.
import { SkImage, Skia } from '@shopify/react-native-skia';
import { Asset } from 'expo-asset';

const FILES: Record<string, number> = {
  mercury: require('../../../assets/solar/mercury.jpg'), 'mercury-s': require('../../../assets/solar/mercury-s.jpg'),
  venus: require('../../../assets/solar/venus.jpg'), 'venus-s': require('../../../assets/solar/venus-s.jpg'),
  earth: require('../../../assets/solar/earth.jpg'), 'earth-s': require('../../../assets/solar/earth-s.jpg'), 'earth-night': require('../../../assets/solar/earth-night.jpg'),
  mars: require('../../../assets/solar/mars.jpg'), 'mars-s': require('../../../assets/solar/mars-s.jpg'),
  jupiter: require('../../../assets/solar/jupiter.jpg'), 'jupiter-s': require('../../../assets/solar/jupiter-s.jpg'),
  saturn: require('../../../assets/solar/saturn.jpg'), 'saturn-s': require('../../../assets/solar/saturn-s.jpg'),
  uranus: require('../../../assets/solar/uranus.jpg'), neptune: require('../../../assets/solar/neptune.jpg'),
  io: require('../../../assets/solar/io.jpg'), europa: require('../../../assets/solar/europa.jpg'), ganymede: require('../../../assets/solar/ganymede.jpg'), callisto: require('../../../assets/solar/callisto.jpg'),
  moon: require('../../../assets/moon/moon-base.jpg'), 'moon-s': require('../../../assets/moon/moon-s.jpg'), 'moon-relief': require('../../../assets/moon/moon-relief.jpg'),
  milkyway: require('../../../assets/sky/milkyway.jpg'),
};

const images = new Map<string, { image: SkImage; used: number }>();
const pending = new Set<string>();
const failed = new Set<string>();
const listeners = new Set<() => void>();
let clock = 0;

/** Full maps held at once. The small ones are few and tiny, so they stay. */
const MAX_LARGE = 4;

export const onTexture = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

async function load(key: string) {
  pending.add(key);
  try {
    const asset = Asset.fromModule(FILES[key]);
    await asset.downloadAsync();
    const data = await Skia.Data.fromURI(asset.localUri ?? asset.uri);
    const image = Skia.Image.MakeImageFromEncoded(data);
    if (!image) throw new Error(`could not decode ${key}`);
    images.set(key, { image, used: ++clock });
    const large = [...images.entries()].filter(([k]) => !k.endsWith('-s') && k !== 'milkyway' && k !== 'moon-relief' && k !== 'moon');
    if (large.length > MAX_LARGE) {
      const [oldest] = large.sort((a, b) => a[1].used - b[1].used)[0];
      images.get(oldest)?.image.dispose?.();
      images.delete(oldest);
    }
  } catch {
    failed.add(key);
  }
  pending.delete(key);
  listeners.forEach((l) => l());
}

/** The image if it's ready, asking for it otherwise. Never waits. */
export function texture(key: string): SkImage | null {
  const hit = images.get(key);
  if (hit) { hit.used = ++clock; return hit.image; }
  if (FILES[key] !== undefined && !pending.has(key) && !failed.has(key)) void load(key);
  return null;
}

export const textureFailed = (key: string) => failed.has(key);
