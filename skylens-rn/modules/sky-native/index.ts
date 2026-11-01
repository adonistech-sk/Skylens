import { requireOptionalNativeModule } from 'expo-modules-core';

export interface AttitudeSample {
  /** CMAttitude.rotationMatrix, row by row. */
  matrix: number[];
  gravity: number[];
  timestamp: number;
  /** CLHeading.headingAccuracy; negative means invalid. */
  headingAccuracy: number;
  frame: 'trueNorth' | 'magneticNorth' | 'arbitrary';
}

interface Native {
  isAvailable(): boolean;
  start(): string;
  stop(): void;
  addListener(event: 'onAttitude', listener: (s: AttitudeSample) => void): { remove(): void };
}

const native = requireOptionalNativeModule<Native>('SkyNative');

export const attitudeAvailable = () => native?.isAvailable() ?? false;

/** Returns a stop function, or null where the device has no motion sensors. */
export function startAttitude(onSample: (s: AttitudeSample) => void): (() => void) | null {
  if (!native || !native.isAvailable()) return null;
  const sub = native.addListener('onAttitude', onSample);
  native.start();
  return () => { sub.remove(); native.stop(); };
}
