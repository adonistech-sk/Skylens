// Frame timing and catalog counters, kept on the device and shown in the Layers panel. It
// sends nothing anywhere. The time covers recording a frame on the JS thread. Skia's GPU work
// happens later on the UI thread, so a good number here doesn't prove a smooth screen.

export interface FrameCounts {
  /** Stars in the bundled table plus the pack. */
  indexed: number;
  /** Stars held in memory. */
  loaded: number;
  /** Stars considered this frame. */
  scanned: number;
  /** Stars on screen this frame. */
  drawn: number;
  limit: number;
}

const SIZE = 240;
const samples = new Float32Array(SIZE);
let count = 0, next = 0;
let counts: FrameCounts = { indexed: 0, loaded: 0, scanned: 0, drawn: 0, limit: 0 };

export const now = () => performance.now();

export function recordFrame(ms: number, c: FrameCounts) {
  samples[next] = ms;
  next = (next + 1) % SIZE;
  count = Math.min(SIZE, count + 1);
  counts = c;
}

export function resetFrames() { count = 0; next = 0; }

export interface PerfSnapshot extends FrameCounts { frames: number; p50: number; p95: number; worst: number }

export function perfSnapshot(): PerfSnapshot {
  const s = Array.from(samples.subarray(0, count)).sort((a, b) => a - b);
  const at = (q: number) => (s.length ? s[Math.min(s.length - 1, Math.floor(s.length * q))] : 0);
  return { ...counts, frames: count, p50: at(0.5), p95: at(0.95), worst: at(1) };
}
