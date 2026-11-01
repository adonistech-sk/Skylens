// The spatial index over the bundled stars. It adds no data: it only remembers which rows of
// the star table fall in which sky cell, so a frame touches the sky it can see.
import { CELL_COUNT, cellGeometry, cellOf } from './grid';
import { stars, StarTable } from '../catalog';
import { DEG, Vec3 } from '../../astronomy/core';

export interface CellIndex {
  /** Rows of a cell are rows[starts[c]] up to rows[starts[c + 1]], brightest first. */
  starts: Uint32Array;
  rows: Uint32Array;
  /** Fastest proper motion in each cell, milliarcseconds a year. */
  fastest: Float32Array;
}

/** Stars are binned by their J2000 place. Visibility widens by proper motion, not the bins. */
export function buildCellIndex(t: StarTable): CellIndex {
  const counts = new Uint32Array(CELL_COUNT + 1);
  const cells = new Uint16Array(t.count);
  const fastest = new Float32Array(CELL_COUNT);
  for (let i = 0; i < t.count; i++) {
    const a = t.ra[i] * DEG, d = t.dec[i] * DEG, cd = Math.cos(d);
    const c = cellOf(cd * Math.cos(a), cd * Math.sin(a), Math.sin(d));
    cells[i] = c;
    counts[c + 1]++;
    const pm = Math.hypot(t.pmRA[i], t.pmDec[i]);
    if (pm > fastest[c]) fastest[c] = pm;
  }
  for (let c = 0; c < CELL_COUNT; c++) counts[c + 1] += counts[c];
  const starts = counts.slice();
  const cursor = counts.slice();
  const rows = new Uint32Array(t.count);
  // The table is brightest first and this pass keeps that order inside every cell.
  for (let i = 0; i < t.count; i++) rows[cursor[cells[i]]++] = i;
  return { starts, rows, fastest };
}

let index: CellIndex | null = null;
export function starIndex(): CellIndex {
  if (!index) index = buildCellIndex(stars());
  return index;
}

const MAS_TO_DEG = 1 / 3_600_000;

/**
 * Cells that can hold a star within `halfAngle` degrees of `forward` at an epoch. A cell
 * counts its own radius plus how far its fastest star can have moved, so a star never drops
 * out of view for having crossed a cell edge, even at the far ends of Time Travel.
 */
export function visibleCells(forward: Vec3, halfAngle: number, years: number, fastest: Float32Array, deepFastest: ((cell: number) => number) | null, out: Uint16Array): number {
  const { centers, radii } = cellGeometry();
  const [fx, fy, fz] = forward;
  const drift = Math.abs(years) * MAS_TO_DEG;
  let n = 0;
  for (let c = 0; c < CELL_COUNT; c++) {
    const pm = Math.max(fastest[c], deepFastest ? deepFastest(c) : 0);
    const reach = halfAngle + radii[c] + pm * drift;
    if (reach >= 180 || fx * centers[c * 3] + fy * centers[c * 3 + 1] + fz * centers[c * 3 + 2] >= Math.cos(reach * DEG)) out[n++] = c;
  }
  return n;
}
