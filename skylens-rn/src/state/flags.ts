// Switches for V1 work that hasn't yet earned trust on a real iPhone. A build can set them
// with EXPO_PUBLIC_FLAG_<NAME>=0 or 1, and More → Sky engine changes them on the device, so
// the old behaviour stays one tap away.

export interface Flags {
  /** Draw and hit-test through the spatial index. Off is the original linear loops. */
  catalogsV1: boolean;
  /** Observe, Explore and Deep Atlas. Off keeps today's sky with no switch. */
  skyModes: boolean;
  /** Read the deep star pack in Deep Atlas. Off stops at the bundled stars. */
  deepPack: boolean;
}

// Metro inlines EXPO_PUBLIC_ values only when written out in full.
const fromBuild = (value: string | undefined, fallback: boolean) => (value === '1' ? true : value === '0' ? false : fallback);

export const DEFAULT_FLAGS: Flags = {
  catalogsV1: fromBuild(process.env.EXPO_PUBLIC_FLAG_CATALOGSV1, true),
  skyModes: fromBuild(process.env.EXPO_PUBLIC_FLAG_SKYMODES, true),
  deepPack: fromBuild(process.env.EXPO_PUBLIC_FLAG_DEEPPACK, true),
};
