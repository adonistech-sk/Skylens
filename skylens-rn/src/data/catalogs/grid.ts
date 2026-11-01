// A one-level cube-sphere grid over the celestial sphere. It has no imports and only
// erasable TypeScript, because scripts/build-data.mjs runs this same file to lay out the
// star pack, so the build and the app cannot disagree about which cell a star is in.
//
// Each cube face is cut at equal angles, not equal distances, which keeps the cells close
// to the same size from the middle of a face to its corners.

export const GRID_SIDE = 16;
export const CELL_COUNT = 6 * GRID_SIDE * GRID_SIDE;

const QUARTER = Math.PI / 4;

type Triple = [number, number, number];

/** The cell holding a direction. The direction need not be unit length. */
export function cellOf(x: number, y: number, z: number): number {
  const ax = Math.abs(x), ay = Math.abs(y), az = Math.abs(z);
  let face: number, u: number, v: number;
  if (ax >= ay && ax >= az) { face = x > 0 ? 0 : 1; u = y / ax; v = z / ax; }
  else if (ay >= ax && ay >= az) { face = y > 0 ? 2 : 3; u = x / ay; v = z / ay; }
  else { face = z > 0 ? 4 : 5; u = x / az; v = y / az; }
  const s = GRID_SIDE;
  const i = Math.min(s - 1, Math.floor(((Math.atan(u) / QUARTER + 1) / 2) * s));
  const j = Math.min(s - 1, Math.floor(((Math.atan(v) / QUARTER + 1) / 2) * s));
  return face * s * s + j * s + i;
}

/** The unit direction at face coordinates running -1 to 1 across a face. */
function direction(face: number, a: number, b: number): Triple {
  const u = Math.tan(a * QUARTER), v = Math.tan(b * QUARTER);
  const sign = face % 2 === 0 ? 1 : -1;
  const p: Triple = face < 2 ? [sign, u, v] : face < 4 ? [u, sign, v] : [u, v, sign];
  const l = Math.hypot(p[0], p[1], p[2]);
  return [p[0] / l, p[1] / l, p[2] / l];
}

export interface CellGeometry {
  /** Unit vectors, three numbers per cell. */
  centers: Float32Array;
  /** Degrees from a cell's centre to its farthest corner. */
  radii: Float32Array;
}

let geometry: CellGeometry | null = null;

export function cellGeometry(): CellGeometry {
  if (geometry) return geometry;
  const s = GRID_SIDE;
  const centers = new Float32Array(CELL_COUNT * 3), radii = new Float32Array(CELL_COUNT);
  for (let face = 0; face < 6; face++) {
    for (let j = 0; j < s; j++) {
      for (let i = 0; i < s; i++) {
        const c = face * s * s + j * s + i;
        const left = (i / s) * 2 - 1, right = ((i + 1) / s) * 2 - 1, low = (j / s) * 2 - 1, high = ((j + 1) / s) * 2 - 1;
        const mid = direction(face, (left + right) / 2, (low + high) / 2);
        centers.set(mid, c * 3);
        let widest = 0;
        for (const [a, b] of [[left, low], [right, low], [left, high], [right, high]]) {
          const q = direction(face, a, b);
          const dot = Math.min(1, mid[0] * q[0] + mid[1] * q[1] + mid[2] * q[2]);
          widest = Math.max(widest, Math.acos(dot));
        }
        radii[c] = (widest * 180) / Math.PI;
      }
    }
  }
  geometry = { centers, radii };
  return geometry;
}

/** A table of 256 entries for CRC-32, which guards each tile of a pack. */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export const PACK_MAGIC = 'SKP1';
export const PACK_VERSION = 1;
export const PACK_RECORD = 28;
/** Magic, version, star count, cell count, grid side, record size. */
export const PACK_HEADER = 24;
/** Per cell: first row, then maximum proper motion, then CRC-32 of its records. */
export const PACK_DIRECTORY_ENTRY = 12;
export const packRecordsOffset = () => PACK_HEADER + PACK_DIRECTORY_ENTRY * (CELL_COUNT + 1);
