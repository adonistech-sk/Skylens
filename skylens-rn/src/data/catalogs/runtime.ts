// The app's one deep pack. Kept apart from deepPack.ts so that file stays free of device
// APIs and can be tested under Node against the real file.
import { directionAt, rememberDeepStar } from '../catalog';
import { DeepPack } from './deepPack';
import { openDeepPackStorage } from './storage';

const listeners = new Set<() => void>();
let pack: DeepPack | null = null;

export function deepPack(): DeepPack {
  pack ??= new DeepPack(openDeepPackStorage, { direction: directionAt, onChange: () => listeners.forEach((l) => l()) });
  return pack;
}

export function onDeepPackChange(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** Makes saved pack stars resolvable after a restart. Only runs if some are saved. */
export async function restoreDeepFavorites(ids: string[], isKnown: (id: string) => boolean): Promise<boolean> {
  const hips = new Set(ids.filter((id) => id.startsWith('star:') && !isKnown(id)).map((id) => Number(id.slice(5))));
  if (!hips.size) return false;
  const rows = await deepPack().find(hips);
  rows.forEach(rememberDeepStar);
  return rows.length > 0;
}
