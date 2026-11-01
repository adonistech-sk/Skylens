// The web build fetches the pack once and slices it. This is only the development loop.
import { Asset } from 'expo-asset';
import { PackStorage } from './deepPack';

export async function openDeepPackStorage(): Promise<PackStorage> {
  const asset = Asset.fromModule(require('../../../assets/catalogs/hip-deep-v1.db'));
  const response = await fetch(asset.uri);
  if (!response.ok) throw new Error(`The star pack returned ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  return { read: async (offset, length) => bytes.slice(offset, offset + length) };
}
