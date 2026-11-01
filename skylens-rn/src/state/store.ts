// The single shared ObserverContext. Sky, Tonight, Explore, Object Detail, AR and Time
// Travel all read this store, so they can't disagree about where or when the user is.
// Frame-rate values (the view angle during a drag) live in the renderer, not here.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { Observer } from '../astronomy/core';
import { DEMO_DATE, DEMO_LOCATION, DEMO_MODE } from './demo';

export interface SavedLocation extends Observer {
  name: string;
  timeZone: string;
  source: 'gps' | 'manual';
}

export interface Layers {
  constellations: boolean;
  labels: boolean;
  deepSky: boolean;
  planets: boolean;
  milkyWay: boolean;
  artwork: boolean;
  ground: boolean;
  /** The artistic landscape along the bottom of the sky view. Not the true horizon. */
  framing: boolean;
}

export interface Persisted {
  onboarded: boolean;
  location: SavedLocation | null;
  favorites: string[];
  layers: Layers;
  use24h: boolean;
  nightVision: boolean;
  /** Set only from a verified StoreKit entitlement, never from a button press. */
  proActive: boolean;
}

interface Clock {
  /** Null while following real time. */
  anchorSky: number | null;
  anchorReal: number;
  /** Simulated seconds per real second. Zero is paused. */
  rate: number;
}

export interface FocusRequest { id: string; nonce: number }

interface State extends Persisted {
  hydrated: boolean;
  clock: Clock;
  selection: string | null;
  focus: FocusRequest | null;
  /** Shows the stars in daylight, labelled on screen. It never changes the clock. */
  nightPreview: boolean;
}

const KEY = 'skylens.user.v1';
export const DEFAULT_LAYERS: Layers = { constellations: true, labels: true, deepSky: true, planets: true, milkyWay: true, artwork: true, ground: true, framing: true };

const initial: State = {
  hydrated: false,
  onboarded: false,
  location: null,
  favorites: [],
  layers: DEFAULT_LAYERS,
  use24h: true,
  nightVision: false,
  proActive: false,
  clock: { anchorSky: null, anchorReal: 0, rate: 1 },
  selection: null,
  focus: null,
  nightPreview: false,
};

let state = initial;
const listeners = new Set<() => void>();

function persist() {
  if (DEMO_MODE) return; // Screenshot runs never touch saved user data.
  const { onboarded, location, favorites, layers, use24h, nightVision } = state;
  // proActive is deliberately not restored from here: entitlements are re-read from StoreKit.
  AsyncStorage.setItem(KEY, JSON.stringify({ onboarded, location, favorites, layers, use24h, nightVision })).catch(() => {});
}

function set(patch: Partial<State>, save = false) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
  if (save) persist();
}

export const getState = () => state;
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };

export function useStore<T>(pick: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => pick(state), () => pick(state));
}

export async function hydrate() {
  if (DEMO_MODE) {
    set({
      hydrated: true, onboarded: true, location: DEMO_LOCATION,
      clock: { anchorSky: Date.parse(DEMO_DATE), anchorReal: Date.now(), rate: 0 },
    });
    return;
  }
  try {
    const raw = await AsyncStorage.getItem(KEY);
    // Missing keys fall back to defaults, so new options never reset settings.
    const saved = raw ? (JSON.parse(raw) as Partial<Persisted>) : {};
    set({ ...saved, layers: { ...DEFAULT_LAYERS, ...saved.layers }, hydrated: true });
  } catch {
    // A corrupt file must not stop the app. Starting fresh is the safe recovery.
    set({ hydrated: true });
  }
}

export const completeOnboarding = () => set({ onboarded: true }, true);
export const setLocation = (location: SavedLocation) => set({ location }, true);
export const setLayer = (key: keyof Layers, value: boolean) => set({ layers: { ...state.layers, [key]: value } }, true);
export const setUse24h = (use24h: boolean) => set({ use24h }, true);
export const setNightVision = (nightVision: boolean) => set({ nightVision }, true);
export const setNightPreview = (nightPreview: boolean) => set({ nightPreview });
export const setProActive = (proActive: boolean) => set({ proActive });
export const select = (selection: string | null) => set({ selection });

export function toggleFavorite(id: string) {
  const has = state.favorites.includes(id);
  set({ favorites: has ? state.favorites.filter((f) => f !== id) : [id, ...state.favorites] }, true);
}

let nonce = 0;
/** Asks the sky to fly to an object, wherever the request came from. */
export const requestFocus = (id: string) => set({ selection: id, focus: { id, nonce: ++nonce } });

// ---- The one clock ----

export const MIN_DATE = Date.UTC(1800, 0, 1);
export const MAX_DATE = Date.UTC(2199, 11, 31);

export function skyTime(now = Date.now()): number {
  const c = state.clock;
  if (c.anchorSky === null) return now;
  const t = c.anchorSky + (now - c.anchorReal) * c.rate;
  return Math.min(MAX_DATE, Math.max(MIN_DATE, t));
}

export const isLive = () => state.clock.anchorSky === null;

function freezeAt(time: number, rate: number) {
  set({ clock: { anchorSky: Math.min(MAX_DATE, Math.max(MIN_DATE, time)), anchorReal: Date.now(), rate } });
}
export const setSkyTime = (ms: number) => freezeAt(ms, state.clock.anchorSky === null ? 0 : state.clock.rate);
export const shiftSkyTime = (deltaMs: number) => freezeAt(skyTime() + deltaMs, state.clock.anchorSky === null ? 0 : state.clock.rate);
export const setRate = (rate: number) => freezeAt(skyTime(), rate);
export function resetToNow() {
  if (DEMO_MODE) { freezeAt(Date.parse(DEMO_DATE), 0); return; }
  set({ clock: { anchorSky: null, anchorReal: 0, rate: 1 } });
}

export function useObserver(): SavedLocation {
  const location = useStore((s) => s.location);
  return location ?? FALLBACK_LOCATION;
}

/** Used only until the user picks a location: the Greenwich meridian, labelled as such. */
export const FALLBACK_LOCATION: SavedLocation = {
  name: 'Greenwich (no location set)', latitude: 51.4769, longitude: 0, elevation: 46, timeZone: 'Etc/UTC', source: 'manual',
};
