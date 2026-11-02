// Constellation plates, loaded when a figure first comes into view and dropped when it hasn't
// been seen for a while. A plate that hasn't arrived, or can't be read, leaves the real sky with
// its lines and stars, which is all the sky ever needed.
import { FilterMode, MipmapMode, SkImage, SkShader, Skia, TileMode } from '@shopify/react-native-skia';
import { Asset } from 'expo-asset';
import { ART_ASSETS } from '../../data/generated/constellationArtAssets';

export interface ArtTexture { plate: SkImage; plateShader: SkShader; glow: SkImage; glowShader: SkShader; used: number }

/** Plates held at once: the frame's cap and a couple of neighbours, so a small pan doesn't reload. */
const MAX_HELD = 9;

const held = new Map<string, ArtTexture>();
const pending = new Set<string>();
const failed = new Set<string>();
const listeners = new Set<() => void>();
let clock = 0;

export const onArtTexture = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

async function decode(module: number): Promise<SkImage> {
  const asset = Asset.fromModule(module);
  await asset.downloadAsync();
  const data = await Skia.Data.fromURI(asset.localUri ?? asset.uri);
  const image = Skia.Image.MakeImageFromEncoded(data);
  if (!image) throw new Error('could not decode a plate');
  return image;
}

async function load(id: string) {
  pending.add(id);
  try {
    const files = ART_ASSETS[id];
    const [plate, glow] = await Promise.all([decode(files.plate), decode(files.glow)]);
    const plateShader = plate.makeShaderOptions(TileMode.Decal, TileMode.Decal, FilterMode.Linear, MipmapMode.Linear);
    const glowShader = glow.makeShaderOptions(TileMode.Decal, TileMode.Decal, FilterMode.Linear, MipmapMode.None);
    held.set(id, { plate, plateShader, glow, glowShader, used: ++clock });
    if (held.size > MAX_HELD) {
      const oldest = [...held.entries()].sort((a, b) => a[1].used - b[1].used)[0][0];
      held.delete(oldest);
    }
  } catch {
    failed.add(id);
  }
  pending.delete(id);
  listeners.forEach((l) => l());
}

/** The plate for a figure, or null while it loads. */
export function artTexture(id: string): ArtTexture | null {
  const t = held.get(id);
  if (t) { t.used = ++clock; return t; }
  if (!pending.has(id) && !failed.has(id) && ART_ASSETS[id]) load(id).catch(() => {});
  return null;
}
