// The app's one deep pack. Kept apart from deepPack.ts so that file stays free of device
// APIs and can be tested under Node against the real file.
import { directionAt, object, rememberDeepStar, rememberStarMeta, SkyObject } from '../catalog';
import { deepSearchReady, installDeepSearch } from '../search';
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

/** Adds the pack's star numbers to search. Resolves false if the pack can't be read. */
export async function loadDeepSearch(): Promise<boolean> {
  if (deepSearchReady()) return true;
  const index = await deepPack().index();
  if (!index) return false;
  rememberStarMeta(index.extra);
  installDeepSearch(index.hips, index.extra);
  return true;
}

/** An object by ID, reading its star from the pack if that's where it lives. */
export async function ensureObject(id: string): Promise<SkyObject | null> {
  const known = object(id);
  if (known || !id.startsWith('star:')) return known;
  const rows = await deepPack().find(new Set([Number(id.slice(5))]));
  rows.forEach(rememberDeepStar);
  return object(id);
}

/** Makes saved pack stars resolvable after a restart. Only runs if some are saved. */
export async function restoreDeepFavorites(ids: string[], isKnown: (id: string) => boolean): Promise<boolean> {
  const hips = new Set(ids.filter((id) => id.startsWith('star:') && !isKnown(id)).map((id) => Number(id.slice(5))));
  if (!hips.size) return false;
  const rows = await deepPack().find(hips);
  rows.forEach(rememberDeepStar);
  return rows.length > 0;
}
