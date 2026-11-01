// The three ways of looking at the sky. A mode only changes what is shown: every object is
// placed by the same engine in every mode, so nothing moves when the mode changes.

export type SkyMode = 'observe' | 'explore' | 'atlas';

export interface Layers {
  stars: boolean;
  constellations: boolean;
  boundaries: boolean;
  labels: boolean;
  deepSky: boolean;
  galaxies: boolean;
  clusters: boolean;
  nebulae: boolean;
  planets: boolean;
  milkyWay: boolean;
  artwork: boolean;
  atmosphere: boolean;
  ground: boolean;
  /** The artistic landscape along the bottom of the sky view. Not the true horizon. */
  framing: boolean;
  gridEquatorial: boolean;
  gridHorizontal: boolean;
  gridEcliptic: boolean;
  gridGalactic: boolean;
}

export interface SkySettings {
  layers: Layers;
  /** 0 to 1, with 0.5 neutral. Moves the automatic star limit by up to 1.5 magnitudes. */
  density: number;
  /** Hard ceiling on star magnitude. */
  magnitudeCap: number;
  /** 0 to 1, with 0.5 neutral. */
  labelDensity: number;
}

export type ModeSettings = Record<SkyMode, SkySettings>;

export const NO_CAP = 14.5;
/** The bundled stars end here. The deep pack carries the view past it. */
export const BUNDLED_LIMIT = 8;

/** Today's TestFlight sky, unchanged. */
export const DEFAULT_LAYERS: Layers = {
  stars: true, constellations: true, boundaries: false, labels: true, deepSky: true, galaxies: true, clusters: true, nebulae: true, planets: true, milkyWay: true,
  artwork: true, atmosphere: true, ground: true, framing: true, gridEquatorial: false, gridHorizontal: false, gridEcliptic: false, gridGalactic: false,
};

export const MODE_DEFAULTS: ModeSettings = {
  observe: {
    layers: { ...DEFAULT_LAYERS, constellations: false, deepSky: false, artwork: false, framing: false },
    density: 0.5, magnitudeCap: 6.5, labelDensity: 0.4,
  },
  explore: { layers: DEFAULT_LAYERS, density: 0.5, magnitudeCap: NO_CAP, labelDensity: 0.5 },
  atlas: {
    layers: { ...DEFAULT_LAYERS, boundaries: true, artwork: false, atmosphere: false, ground: false, framing: false, gridEquatorial: true },
    density: 0.5, magnitudeCap: NO_CAP, labelDensity: 0.7,
  },
};

export const MODE_LABELS: Record<SkyMode, string> = { observe: 'Observe', explore: 'Explore', atlas: 'Deep Atlas' };

const log60 = (fov: number) => Math.max(0, Math.log10(60 / Math.max(fov, 0.5)));

/**
 * The faintest star drawn. Explore keeps the original formula exactly. Observe stays near
 * what an eye can do from a dark site, however far the view zooms. Deep Atlas goes deeper.
 * A bright sky always takes stars away, unless the atmosphere layer is off.
 */
export function starLimit(mode: SkyMode, settings: Pick<SkySettings, 'density' | 'magnitudeCap'>, fov: number, brightness: number, moving: boolean): number {
  const l = log60(fov);
  const offset = (settings.density - 0.5) * 3;
  const faded = 7 * brightness;
  const motion = moving ? 0.5 : 0;
  let limit: number;
  if (mode === 'observe') limit = Math.min(6.5, 5.6 + 1.2 * l);
  else limit = (mode === 'atlas' ? 6.7 : 6.1) + 5.4 * l;
  return Math.min(settings.magnitudeCap, limit + offset - faded - motion);
}

/** The widest Deep Atlas view that draws a star of this magnitude. */
export const fovForMagnitude = (magnitude: number) => Math.min(46, Math.max(2, 60 / Math.pow(10, (magnitude + 0.3 - 6.7) / 5.4)));

/** Named stars brighter than this get a label. */
export function labelLimit(mode: SkyMode, labelDensity: number, fov: number): number {
  const steps = mode === 'atlas'
    ? (fov > 60 ? 1.5 : fov > 30 ? 2.5 : fov > 16 ? 3.5 : fov > 9 ? 5 : 7)
    : (fov > 16 ? 1.0 : fov > 9 ? 2.6 : 4.2);
  return steps + (labelDensity - 0.5) * 3;
}

/** The most labels on screen at once. */
export const labelBudget = (labelDensity: number) => Math.round(8 + labelDensity * 72);

export const isChartOnly = (key: keyof Layers) => key === 'boundaries' || key.startsWith('grid');

/**
 * Fills saved sky settings out to the current shape. A file from before the sky modes holds
 * one flat set of layers, and those are the sky the user already chose, so they become
 * Explore, which is the mode that looks like the app they had.
 */
export function migrateSkySettings(saved: { layers?: Partial<Layers>; modes?: Partial<Record<SkyMode, Partial<SkySettings>>>; skyMode?: SkyMode }): { skyMode: SkyMode; modes: ModeSettings } {
  const modes = {} as ModeSettings;
  for (const mode of ['observe', 'explore', 'atlas'] as SkyMode[]) {
    const fallback = MODE_DEFAULTS[mode];
    const stored = saved.modes?.[mode];
    const legacy = mode === 'explore' && !saved.modes ? saved.layers : undefined;
    modes[mode] = { ...fallback, ...stored, layers: { ...fallback.layers, ...legacy, ...stored?.layers } };
  }
  const skyMode = saved.skyMode && modes[saved.skyMode] ? saved.skyMode : 'explore';
  return { skyMode, modes };
}
