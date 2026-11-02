// Label decluttering, free of any drawing API. Candidates arrive with a priority and one or
// more places they may sit. The most important get first choice of the sky, the rest take
// what is left or stay hidden, so labels never collide however dense the view becomes.

export interface LabelBox { x: number; y: number; w: number; h: number }

export type LabelStyle = 'selection' | 'body' | 'constellation' | 'chartConstellation' | 'star' | 'chartStar' | 'deep' | 'grid';

export interface LabelCandidate {
  text: string;
  style: LabelStyle;
  priority: number;
  /** Preferred place first. */
  boxes: LabelBox[];
  /** The object a tap on this label selects. */
  id?: string;
  /** Multiplies the style's strength, for labels easing in and out. */
  alpha?: number;
}

export interface PlacedLabel { candidate: LabelCandidate; box: LabelBox }

export interface LabelBounds { w: number; top: number; bottom: number }

export const PRIORITY = { selection: 1000, body: 800, constellation: 600, deep: 300, grid: 100, star: 500 } as const;

const overlaps = (a: LabelBox, b: LabelBox) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

const fits = (b: LabelBox, bounds: LabelBounds) => b.x >= 6 && b.x + b.w <= bounds.w - 6 && b.y >= bounds.top && b.y + b.h <= bounds.bottom;

/** Places labels greedily by priority. The selection is exempt from the budget. */
export function placeLabels(candidates: LabelCandidate[], bounds: LabelBounds, budget: number): PlacedLabel[] {
  const ordered = candidates.map((c, i) => ({ c, i })).sort((a, b) => b.c.priority - a.c.priority || a.i - b.i);
  const placed: PlacedLabel[] = [];
  for (const { c } of ordered) {
    if (placed.length >= budget && c.style !== 'selection') break;
    for (const box of c.boxes) {
      if (!fits(box, bounds) || placed.some((p) => overlaps(p.box, box))) continue;
      placed.push({ candidate: c, box });
      break;
    }
  }
  return placed;
}

/** The label under a point, given a little slack for a finger. */
export function labelAt(placed: PlacedLabel[], x: number, y: number, slack = 6): PlacedLabel | null {
  for (const p of placed) {
    if (!p.candidate.id) continue;
    const b = p.box;
    if (x >= b.x - slack && x <= b.x + b.w + slack && y >= b.y - slack && y <= b.y + b.h + slack) return p;
  }
  return null;
}
