// The device's copy of the deep star pack. It ships inside the app, so it needs no network.
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { PackStorage } from './deepPack';

export async function openDeepPackStorage(): Promise<PackStorage> {
  const asset = Asset.fromModule(require('../../../assets/catalogs/hip-deep-v1.db'));
  await asset.downloadAsync();
  if (!asset.localUri) throw new Error('The star pack has no local file');
  const handle = new File(asset.localUri).open();
  // One handle has one offset, so reads must not overlap.
  let turn: Promise<unknown> = Promise.resolve();
  return {
    read: (offset, length) => {
      const next = turn.then(() => { handle.offset = offset; return handle.readBytes(length); });
      turn = next.catch(() => undefined);
      return next;
    },
    close: () => handle.close(),
  };
}
