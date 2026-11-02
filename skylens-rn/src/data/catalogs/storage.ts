// The device's copy of the deep star pack. It ships inside the app, so it needs no network.
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { PackStorage } from './deepPack';

export const openDeepPackStorage = () => openAssetStorage(require('../../../assets/catalogs/hip-deep-v1.db'));

/** Random access to any file bundled with the app. */
export async function openAssetStorage(module: number): Promise<PackStorage> {
  const asset = Asset.fromModule(module);
  await asset.downloadAsync();
  if (!asset.localUri) throw new Error('The star pack has no local file');
  const file = new File(asset.localUri);
  const handle = file.open();
  // One handle has one offset, so reads must not overlap.
  let turn: Promise<unknown> = Promise.resolve();
  return {
    size: file.size ?? undefined,
    read: (offset, length) => {
      const next = turn.then(() => { handle.offset = offset; return handle.readBytes(length); });
      turn = next.catch(() => undefined);
      return next;
    },
    close: () => handle.close(),
  };
}
