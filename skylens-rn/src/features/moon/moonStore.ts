// Opens the Moon's bundled data once. Everything here ships inside the app, so the atlas
// works offline. A file that can't be read leaves the atlas without that layer, nothing more.
import { openAssetStorage } from '../../data/catalogs/storage';
import { bytesToText, Elevation, FeatureIndex, parseFeatures } from './moonData';

async function readAll(module: number): Promise<Uint8Array> {
  const storage = await openAssetStorage(module);
  try {
    if (!storage.size) throw new Error('The file has no size');
    return await storage.read(0, storage.size);
  } finally {
    storage.close?.();
  }
}

let features: Promise<FeatureIndex | null> | null = null;
let elevation: Promise<Elevation | null> | null = null;

export function loadLunarFeatures(): Promise<FeatureIndex | null> {
  features ??= readAll(require('../../../assets/moon/moon-features-v1.db')).then((b) => new FeatureIndex(parseFeatures(bytesToText(b)))).catch(() => { features = null; return null; });
  return features;
}

export function loadElevation(): Promise<Elevation | null> {
  elevation ??= readAll(require('../../../assets/moon/moon-dem-v1.db')).then((b) => new Elevation(b)).catch(() => { elevation = null; return null; });
  return elevation;
}

export const openTileStorage = () => openAssetStorage(require('../../../assets/moon/moon-tiles-v1.db'));
