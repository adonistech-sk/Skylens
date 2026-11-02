// The web build fetches the pack once and slices it. This is only the development loop.
import { Asset } from 'expo-asset';
import { PackStorage } from './deepPack';

export const openDeepPackStorage = () => openAssetStorage(require('../../../assets/catalogs/hip-deep-v1.db'));

export async function openAssetStorage(module: number): Promise<PackStorage> {
  const asset = Asset.fromModule(module);
  const response = await fetch(asset.uri);
  if (!response.ok) throw new Error(`The star pack returned ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  return { read: async (offset, length) => bytes.slice(offset, offset + length), size: bytes.length };
}
