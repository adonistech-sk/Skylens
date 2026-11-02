// The Little Horse: only the head and neck of a foal, the way the sky shows it, looking west.
// Gamma marks the forehead, Delta the poll between the ears, and Kitalpha the base of the neck.
// A narrow bridle with a small brass cheek-ring takes the warm note.
import { locks } from '../kit.mjs';

export default {
  tier: 'extended',
  subject: 'The Little Horse',
  pixels: 1100,
  anchors: [['Kitalpha', 'base of the neck'], ['δ Equ', 'poll'], ['γ Equ', 'forehead']],
  draw({ s, E }) {
    const { blob, limb, line, strands } = E;
    const kit = s('Kitalpha'), del = s('δ Equ'), gam = s('γ Equ');
    const P = (dx, dy) => [del[0] + dx, del[1] + dy];   // Everything is hung from the poll.

    // Mane streaming east behind the neck, under the neck itself.
    strands([P(-0.3, 0.1), P(-1.5, -0.9), P(-2.2, -2.5), P(-2.5, -4.1)], { n: 900, angle: 214, len: 1.25, jitter: 15, v: 0.56, spread: 0.5, seed: 11, curl: 1.2, w: 0.018 });
    locks(E, [
      [P(-0.2, 0.3), P(-1.6, 0.2), P(-3.0, -0.8), P(-3.5, -1.7)], [P(-0.8, -0.3), P(-2.2, -0.6), P(-3.4, -1.9), P(-3.8, -3.0)], [P(-1.3, -1.1), P(-2.6, -1.6), P(-3.5, -3.0), P(-3.7, -4.2)],
      [P(-1.7, -2.0), P(-2.9, -2.7), P(-3.4, -4.0), P(-3.3, -5.0)], [P(-2.0, -3.0), P(-3.0, -3.8), P(-3.1, -4.9)],
    ], { w: 0.055, v: 0.6 });

    // Far ear.
    blob([P(0.2, 0.0), P(-0.08, 0.7), [...P(-0.12, 1.3), 'c'], P(0.34, 0.76), P(0.62, 0.1)], { round: 0.2, tone: 0.82, hatch: 70, shadow: 0.3 });

    // The neck, arched, cut off in a clean curve at its base.
    const neck = [P(0.36, 0.16), P(-0.5, 0.1), P(-1.3, -0.9), P(-1.8, -2.2), P(-2.0, -3.5), [kit[0] - 1.5, kit[1] + 0.1, 'c'], [kit[0] - 0.1, kit[1] - 0.5], [kit[0] + 1.3, kit[1] - 0.3], [kit[0] + 2.3, kit[1] + 0.3, 'c'], P(1.5, -3.6), P(1.1, -2.4), P(1.0, -1.5)];
    blob(neck, {
      round: 1.4, tone: 1.06, hatch: 56, shadow: 0.5, band: 0.6, spacing: 0.86,
      creases: [
        { pts: [P(0.2, -1.5), P(-0.3, -2.5), P(-0.3, -3.6), P(-0.5, -4.5)], w: 0.07, depth: 0.14 },
        { pts: [P(0.9, -2.2), P(0.9, -3.2), P(1.2, -4.2)], w: 0.06, depth: 0.12 },
        { pts: [P(-1.1, -1.2), P(-1.2, -2.5), P(-1.3, -4.0)], w: 0.05, depth: 0.09 },
        { pts: [[kit[0] - 1.4, kit[1] + 0.45], [kit[0], kit[1] - 0.04], [kit[0] + 2.1, kit[1] + 0.7]], w: 0.05, depth: 0.1 },
      ],
      bumps: [{ at: P(-0.2, -2.6), r: [1.1, 1.8], h: 0.3 }],
    });

    // Short mane locks that fall over the crest from the neck's own side.
    locks(E, [[P(-0.1, 0.2), P(-0.7, -0.4), P(-0.8, -1.3)], [P(-0.7, -0.3), P(-1.2, -1.1), P(-1.2, -2.2)], [P(-1.2, -1.2), P(-1.6, -2.2), P(-1.5, -3.2)]], { w: 0.05, v: 0.56 });

    // The head: flat forehead, deep cheek, narrow nose, soft muzzle, drawn as one form.
    blob([P(-0.1, 0.42), P(0.5, 0.46), [gam[0], gam[1] + 0.16], P(1.7, 0.66), P(2.5, -0.5), P(3.1, -1.5), P(3.6, -2.0), P(3.7, -2.5), P(3.4, -2.9), [...P(2.86, -2.86), 'c'], P(2.7, -3.04), P(2.2, -3.0), P(1.9, -2.5), P(1.3, -2.1), P(0.7, -2.1), P(0.04, -1.6), P(-0.28, -0.7)], {
      round: 0.9, tone: 1.2, hatch: 44, shadow: 0.56, band: 0.5, spacing: 0.86,
      creases: [
        { pts: [P(0.2, -1.5), P(0.7, -1.2), P(1.1, -1.7), P(1.0, -2.1)], w: 0.07, depth: 0.14 },
        { pts: [P(1.5, -0.1), P(2.1, -0.9), P(2.7, -1.6)], w: 0.05, depth: 0.08 },
        { pts: [P(3.2, -2.1), P(3.0, -1.95), P(2.86, -2.1)], w: 0.05, depth: 0.12 },
        { pts: [P(2.86, -2.86), P(3.1, -2.5), P(3.5, -2.56)], w: 0.04, depth: 0.08 },
      ],
      bumps: [{ at: P(0.6, -1.0), r: [0.8, 0.8], h: 0.24 }, { at: P(3.1, -2.4), r: [0.5, 0.5], h: 0.14 }],
    });

    // The eye, with its lid.
    blob([P(1.02, -0.26), P(1.2, -0.12), P(1.42, -0.28), P(1.22, -0.42)], { round: 0.1, tone: 1.3, hatch: 30, shadow: 0.5, band: 0.05, creases: [{ pts: [P(1.04, -0.28), P(1.22, -0.27), P(1.4, -0.3)], w: 0.05, depth: 0.1 }] });
    line([P(0.88, -0.16), P(1.2, 0.02), P(1.56, -0.2)], { w: 0.03, v: 0.86 });

    // Near ear, cupped, with its inner line.
    blob([P(-0.32, 0.26), P(-0.6, 1.0), [...P(-0.62, 1.68), 'c'], P(-0.12, 1.08), P(0.2, 0.3)], {
      round: 0.26, tone: 1.2, hatch: 76, shadow: 0.42, band: 0.14,
      creases: [{ pts: [P(-0.2, 0.42), P(-0.42, 0.98), P(-0.56, 1.46)], w: 0.05, depth: 0.1 }],
    });
    // A short forelock.
    locks(E, [[P(0.0, 0.4), P(0.46, 0.2), P(0.74, -0.32)], [P(0.14, 0.44), P(0.72, 0.1), P(0.94, -0.16)]], { w: 0.05, v: 0.62 });

    // Bridle: crown strap, cheek strap, brow band, nose band, and a small brass ring at the cheek.
    const strap = { tone: 1.2, warm: 0.74, shadow: 0.34, melt: 0, flat: 0.5 };
    limb([[...P(0.12, 0.42), 0.05], [...P(0.26, -0.5), 0.055], [...P(1.0, -1.5), 0.055], [...P(1.6, -1.98), 0.05]], strap);
    limb([[...P(2.54, -0.54), 0.06], [...P(2.3, -1.2), 0.07], [...P(1.8, -1.92), 0.07]], strap);
    limb([[...P(0.2, -0.1), 0.05], [...P(1.0, 0.36), 0.06], [...P(1.5, 0.54), 0.05]], strap);
    blob([P(1.58, -1.92), P(1.74, -1.76), P(1.92, -1.94), P(1.74, -2.1)], { round: 0.1, tone: 1.34, warm: 0.86, shadow: 0.34 });
  },
};
