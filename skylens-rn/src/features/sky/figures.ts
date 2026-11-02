// How a constellation's figure unfolds when it is chosen. Pure timing: this decides how much of
// a line to draw and how bright a mark is, and it has no access to where anything is. Every
// point an animation touches comes from the star field, untouched, so an animation can't move
// a star, and with motion off the same figure simply arrives complete.
import { stars } from '../../data/catalog';
import { constellationGeometry } from './scene';

/** Seconds. The lines draw first, the outline follows them, then the plate comes up. */
export const REVEAL = { lines: 1.15, traceFrom: 0.55, traceFor: 1.05, plateFrom: 0.95, plateFor: 1.05 } as const;
export const REVEAL_TOTAL = Math.max(REVEAL.lines, REVEAL.traceFrom + REVEAL.traceFor, REVEAL.plateFrom + REVEAL.plateFor);

export interface RevealState { lines: number; trace: number; plate: number; done: boolean }

const ease = (t: number) => { const c = Math.min(1, Math.max(0, t)); return 1 - (1 - c) * (1 - c) * (1 - c); };

export function revealAt(age: number): RevealState {
  if (!(age < REVEAL_TOTAL)) return { lines: 1, trace: 1, plate: 1, done: true };
  return {
    lines: Math.min(1, Math.max(0, age / REVEAL.lines)),
    trace: ease((age - REVEAL.traceFrom) / REVEAL.traceFor),
    plate: ease((age - REVEAL.plateFrom) / REVEAL.plateFor),
    done: false,
  };
}

export interface FigurePlan {
  /** Star rows, with the moment in 0 to 1 each segment starts and ends. */
  segments: { a: number; b: number; from: number; to: number }[];
  /** The moment the line reaches each star. */
  stars: { row: number; at: number }[];
}

const plans = new Map<string, FigurePlan>();

/** Lines grow outward from the brightest star, along the figure's own branches. */
export function figurePlan(id: string): FigurePlan | null {
  const cached = plans.get(id);
  if (cached) return cached;
  const figure = constellationGeometry().find((c) => c.id === id);
  if (!figure) return null;
  const table = stars();
  const edges = new Map<number, [number, number][]>();
  figure.segments.forEach(([a, b], i) => {
    if (!edges.has(a)) edges.set(a, []);
    if (!edges.has(b)) edges.set(b, []);
    edges.get(a)!.push([b, i]);
    edges.get(b)!.push([a, i]);
  });
  const depth = new Map<number, number>();
  const done = new Map<number, { a: number; b: number; depth: number }>();
  // A figure may be several pieces: each starts from its own brightest star.
  const rows = [...edges.keys()].sort((p, q) => table.mag[p] - table.mag[q]);
  for (const start of rows) {
    if (depth.has(start)) continue;
    depth.set(start, 0);
    const queue = [start];
    while (queue.length) {
      const at = queue.shift()!, d = depth.get(at)!;
      for (const [next, seg] of edges.get(at)!) {
        if (!done.has(seg)) done.set(seg, { a: at, b: next, depth: d });
        if (!depth.has(next)) { depth.set(next, d + 1); queue.push(next); }
      }
    }
  }
  const deepest = Math.max(1, ...[...done.values()].map((s) => s.depth + 1));
  const plan: FigurePlan = {
    segments: [...done.values()].map((s) => ({ a: s.a, b: s.b, from: s.depth / deepest, to: (s.depth + 1) / deepest })),
    stars: [...depth.entries()].map(([row, d]) => ({ row, at: d / deepest })),
  };
  plans.set(id, plan);
  return plan;
}

let owner: Map<number, string> | null = null;

/** The constellation a star's figure line passes through, by star-table row. */
export function figureOfRow(row: number): string | null {
  if (!owner) {
    owner = new Map();
    for (const c of constellationGeometry()) for (const [a, b] of c.segments) { if (!owner.has(a)) owner.set(a, c.id); if (!owner.has(b)) owner.set(b, c.id); }
  }
  return owner.get(row) ?? null;
}
