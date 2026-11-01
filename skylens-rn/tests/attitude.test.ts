import { describe, expect, it, vi } from 'vitest';

// These modules import the renderer's types only through react-native-free paths.
vi.mock('react-native', () => ({ Platform: { OS: 'web' } }));

import { angleBetween, Mat3, mul, transpose, Vec3, vectorHorizontal } from '../src/astronomy/core';
import { orientationFor } from '../src/astronomy/camera';
import { applyCompassCorrection, AttitudeFilter, AttitudeSolver, cameraFieldOfView, headingMessage, headingQuality } from '../src/features/sky/attitude';
import { CITIES } from '../src/features/location/cities';
import { timeZoneOffset } from '../src/astronomy/night';

const lookingSouthUp = orientationFor(180, 40);
const gravityFor = (referenceToDevice: Mat3): Vec3 => {
  const z = mul(referenceToDevice, [0, 0, 1]);
  return [-z[0], -z[1], -z[2]];
};

describe('attitude', () => {
  it('finds the matrix convention from gravity, in either convention', () => {
    const asGiven = new AttitudeSolver();
    expect(asGiven.referenceToDevice(lookingSouthUp, gravityFor(lookingSouthUp))).toEqual(lookingSouthUp);
    expect(asGiven.resolved).toBe(true);
    const flipped = new AttitudeSolver();
    expect(flipped.referenceToDevice(transpose(lookingSouthUp), gravityFor(lookingSouthUp))).toEqual(lookingSouthUp);
  });
  it('stays undecided on a flat phone, where gravity cannot tell them apart', () => {
    const flat: Mat3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    const s = new AttitudeSolver();
    s.referenceToDevice(flat, [0, 0, -1]);
    expect(s.resolved).toBe(false);
  });
  it('filter smooths small jitter and snaps on a large jump', () => {
    const f = new AttitudeFilter();
    const a = orientationFor(180, 40), b = orientationFor(181, 40), far = orientationFor(90, 40);
    f.filter(a, 0);
    const smoothed = f.filter(b, 0.02);
    const axis = (m: Mat3) => mul(transpose(m), [0, 0, -1]);
    expect(angleBetween(axis(smoothed), axis(a))).toBeLessThan(0.5);
    expect(f.filter(far, 0.02)).toEqual(far);
  });
  it('filter keeps the rotation orthonormal, so the sky never shears', () => {
    const f = new AttitudeFilter();
    f.filter(orientationFor(180, 40), 0);
    const m = f.filter(orientationFor(184, 44), 0.05);
    expect(Math.hypot(m[0], m[1], m[2])).toBeCloseTo(1, 9);
    expect(m[0] * m[3] + m[1] * m[4] + m[2] * m[5]).toBeCloseTo(0, 9);
  });
  it('compass correction turns the sky about the zenith only', () => {
    const o = orientationFor(180, 40);
    const c = applyCompassCorrection(o, 10);
    const view = vectorHorizontal(mul(transpose(c), [0, 0, -1]));
    expect(view.altitude).toBeCloseTo(40, 6);
    expect(Math.abs(view.azimuth - 180)).toBeCloseTo(10, 6);
  });
  it('states compass quality honestly', () => {
    expect(headingQuality(-1)).toBe('unavailable');
    expect(headingQuality(5)).toBe('good');
    expect(headingQuality(20)).toBe('approximate');
    expect(headingQuality(45)).toBe('unreliable');
    expect(headingMessage(5, 'trueNorth')).toBeNull();
    expect(headingMessage(5, 'arbitrary')).toContain('north');
  });
  it('matches the lens math of the Swift app for a tall screen', () => {
    const fov = cameraFieldOfView(69.4, 4 / 3, 393, 852);
    expect(fov).toBeGreaterThan(30);
    expect(fov).toBeLessThan(40);
  });
});

describe('cities', () => {
  it('every city has a valid position and a time zone the system knows', () => {
    for (const c of CITIES) {
      expect(Math.abs(c.lat)).toBeLessThanOrEqual(90);
      expect(Math.abs(c.lon)).toBeLessThanOrEqual(180);
      expect(() => timeZoneOffset(new Date(), c.tz), c.name).not.toThrow();
    }
    expect(new Set(CITIES.map((c) => c.name)).size).toBe(CITIES.length);
  });
});
