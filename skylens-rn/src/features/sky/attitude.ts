// Ported from SkyProjection/DeviceAttitude.swift, with the same tests in spirit: the
// convention is measured against gravity at runtime rather than assumed, because a
// wrong guess is a mirrored sky.
import { angleBetween, cross, DEG, dot, Mat3, mul, normalized, transpose, Vec3 } from '../../astronomy/core';

export class AttitudeSolver {
  private useTransposed = false;
  resolved = false;

  referenceToDevice(m: Mat3, gravity: Vec3): Mat3 {
    const g = normalized(gravity);
    const zenith: Vec3 = [0, 0, 1];
    const a = mul(m, zenith), b = mul(transpose(m), zenith);
    const asIs = Math.hypot(a[0] + g[0], a[1] + g[1], a[2] + g[2]);
    const flipped = Math.hypot(b[0] + g[0], b[1] + g[1], b[2] + g[2]);
    // A flat device gives both the same answer, so demand clear evidence.
    if (Math.abs(asIs - flipped) > 0.2) {
      this.useTransposed = flipped < asIs;
      this.resolved = true;
    }
    return this.useTransposed ? transpose(m) : m;
  }
}

export class AttitudeFilter {
  private state: Mat3 | null = null;
  constructor(public timeConstant = 0.09) {}

  reset() { this.state = null; }

  filter(sample: Mat3, dt: number): Mat3 {
    const s = this.state;
    if (!s) { this.state = sample; return sample; }
    // A large jump means the sensor re-referenced, so snap instead of swinging.
    const forwardNew = mul(transpose(sample), [0, 0, -1]);
    const forwardOld = mul(transpose(s), [0, 0, -1]);
    if (angleBetween(forwardNew, forwardOld) > 25) { this.state = sample; return sample; }
    const alpha = 1 - Math.exp(-Math.max(dt, 0) / this.timeConstant);
    const r0 = normalized([s[0] + (sample[0] - s[0]) * alpha, s[1] + (sample[1] - s[1]) * alpha, s[2] + (sample[2] - s[2]) * alpha]);
    const r1raw: Vec3 = [s[3] + (sample[3] - s[3]) * alpha, s[4] + (sample[4] - s[4]) * alpha, s[5] + (sample[5] - s[5]) * alpha];
    const d = dot(r0, r1raw);
    const r1 = normalized([r1raw[0] - r0[0] * d, r1raw[1] - r0[1] * d, r1raw[2] - r0[2] * d]);
    const r2 = cross(r0, r1);
    const out: Mat3 = [r0[0], r0[1], r0[2], r1[0], r1[1], r1[2], r2[0], r2[1], r2[2]];
    this.state = out;
    return out;
  }
}

/** Turns the sky around the zenith, the only axis a magnetometer gets wrong. */
export function applyCompassCorrection(orientation: Mat3, degrees: number): Mat3 {
  if (!degrees) return orientation;
  const c = Math.cos(degrees * DEG), s = Math.sin(degrees * DEG);
  return [
    orientation[0] * c + orientation[1] * s, -orientation[0] * s + orientation[1] * c, orientation[2],
    orientation[3] * c + orientation[4] * s, -orientation[3] * s + orientation[4] * c, orientation[5],
    orientation[6] * c + orientation[7] * s, -orientation[6] * s + orientation[7] * c, orientation[8],
  ];
}

export type HeadingQuality = 'good' | 'approximate' | 'unreliable' | 'unavailable';

export function headingQuality(accuracy: number): HeadingQuality {
  if (accuracy < 0) return 'unavailable';
  if (accuracy < 10) return 'good';
  if (accuracy < 30) return 'approximate';
  return 'unreliable';
}

export function headingMessage(accuracy: number, frame: string): string | null {
  if (frame === 'arbitrary') return "This iPhone can't find north, so the direction may be off. Use the alignment slider.";
  if (frame === 'magneticNorth') return 'Using magnetic north, so expect a small offset.';
  switch (headingQuality(accuracy)) {
    case 'good': return null;
    case 'approximate': return `Compass accurate to about ${Math.round(accuracy)}°`;
    case 'unreliable': return 'Compass is unreliable here. Move away from metal, or wave the phone in a figure eight.';
    default: return 'Compass warming up. Wave the phone in a figure eight if this stays.';
  }
}

/** Field of view across the screen's short side when the back camera fills the screen. */
export function cameraFieldOfView(sensorFov: number, sensorAspect: number, width: number, height: number): number {
  const screenAspect = Math.max(width, height) / Math.max(Math.min(width, height), 1);
  const halfLong = Math.tan((sensorFov * DEG) / 2);
  const halfShort = screenAspect >= sensorAspect ? halfLong / screenAspect : halfLong / sensorAspect;
  return (2 * Math.atan(halfShort)) / DEG;
}
