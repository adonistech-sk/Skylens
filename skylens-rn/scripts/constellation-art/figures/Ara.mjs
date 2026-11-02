// The Altar, a carved stone altar with its fire lit. Delta and Eta sit on the corners of the
// stepped plinth, Beta, Gamma and Zeta on the shaft, Epsilon on the cornice, and Alpha burns in
// the fire. The stone is cool, and the fire is the warm note.
import { frame } from '../kit.mjs';

export default {
  tier: 'extended',
  subject: 'The Altar',
  pixels: 1100,
  anchors: [['α Ara', 'flame'], ['β Ara', 'shaft'], ['γ Ara', 'shaft'], ['ζ Ara', 'shaft'], ['δ Ara', 'plinth'], ['η Ara', 'plinth'], ['ε¹ Ara', 'cornice']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const del = s('δ Ara'), eta = s('η Ara'), eps = s('ε¹ Ara');
    const L = frame([(del[0] + eta[0]) / 2, (del[1] + eta[1]) / 2], [-0.3, 5.0]);
    const P = (pts) => pts.map(([f, u, ...rest]) => [...L(f, u), ...rest]);
    const hatch = L.angle;
    const [, ue] = L.back(eps);

    /** A squared block of stone. */
    const block = (f0, f1, u0, u1, o = {}) => blob(P([[f0, u0, 'c'], [f1, u0, 'c'], [f1, u1, 'c'], [f0, u1, 'c']]), { round: o.round ?? 0.3, tone: o.tone ?? 1.04, hatch: hatch + (o.turn ?? 84), shadow: o.shadow ?? 0.5, band: 0.2, creases: o.creases, warm: o.warm });

    // The fire, far tongues first. Every tongue is set out on its own and leans with the draught.
    const flame = (pts, tone, lick) => blob(P(pts), {
      round: 0.7, tone, warm: 0.62, hatch: hatch + 86, shadow: 0, band: 0.34, spacing: 0.86,
      creases: lick.map((c) => ({ pts: P(c), w: 0.06, depth: 0.1 })),
    });
    flame([[-2.0, 6.8], [-2.5, 8.4], [-3.4, 9.6], [-3.1, 10.8], [-3.7, 12.0, 'c'], [-2.4, 11.2], [-2.0, 9.9], [-1.1, 9.0], [-0.6, 7.6], [-0.4, 6.8]], 0.84, [[[-1.7, 7.3], [-2.0, 8.8], [-2.8, 10.2]]]);
    flame([[0.2, 6.8], [0.7, 8.6], [1.8, 9.8], [2.1, 11.4], [3.4, 13.4, 'c'], [3.1, 11.2], [2.7, 9.8], [2.5, 8.0], [2.0, 6.8]], 0.86, [[[1.2, 7.3], [1.8, 8.9], [2.5, 10.8]]]);
    flame([[-2.2, 6.8], [-2.6, 8.2], [-2.0, 9.6], [-2.5, 10.9], [-1.5, 12.0], [-1.4, 13.3], [-0.2, 15.2, 'c'], [-0.5, 13.3], [0.5, 12.2], [0.5, 10.6], [1.4, 9.4], [1.5, 7.9], [2.0, 6.8]], 1.08, [[[-1.2, 7.2], [-1.3, 9.0], [-1.0, 10.9], [-0.7, 12.8]], [[0.1, 7.2], [0.2, 8.8], [-0.1, 10.5]], [[0.9, 7.3], [0.8, 8.4]]]);
    flame([[-1.2, 6.8], [-1.2, 8.0], [-0.5, 9.1], [-0.4, 10.2], [0.5, 11.7, 'c'], [0.3, 10.0], [0.9, 8.8], [0.9, 7.6], [1.1, 6.8]], 1.3, [[[-0.2, 7.2], [-0.1, 8.6], [0.25, 10.2]]]);
    // Rising sparks of line, kept as thin strokes rather than points of light.
    for (const pts of [[[1.3, 12.0], [1.0, 13.2], [1.5, 14.4]], [[-2.2, 12.6], [-2.5, 13.6], [-2.0, 14.5]], [[2.6, 13.8], [2.3, 14.8], [2.7, 15.6]]]) line(P(pts), { w: 0.05, v: 0.66, warm: 0.7 });

    // Fire bowl on top of the altar.
    blob(P([[-2.9, 7.0, 'c'], [2.7, 7.0, 'c'], [2.3, 6.3], [-2.5, 6.3]]), { round: 0.3, tone: 1.14, warm: 0.5, hatch: hatch + 84, shadow: 0.5, band: 0.16 });

    // Plinth, two steps, and the base moulding.
    block(-3.7, 3.7, -1.4, -0.3, { tone: 0.96, creases: [{ pts: P([[-3.5, -0.9], [0, -0.92], [3.5, -0.9]]), w: 0.04, depth: 0.06 }] });
    block(-3.3, 3.3, -0.4, 0.7, { tone: 1.02 });
    limb(P([[-3.0, 0.9, 0.2], [0, 0.92, 0.2], [3.0, 0.9, 0.2]]), { tone: 1.14, hatch: hatch + 90, shadow: 0.42, melt: 0, flat: 0.7 });

    // The shaft of the altar, with a sunken panel.
    block(-2.42, 2.42, 1.0, 5.6, {
      tone: 1.1, shadow: 0.56,
      creases: [
        { pts: P([[-1.9, 1.5], [-1.9, 3.2], [-1.9, 5.1]]), w: 0.06, depth: 0.1 }, { pts: P([[1.9, 1.5], [1.9, 3.2], [1.9, 5.1]]), w: 0.06, depth: 0.1 },
        { pts: P([[-1.9, 1.5], [0, 1.5], [1.9, 1.5]]), w: 0.06, depth: 0.1 }, { pts: P([[-1.9, 5.1], [0, 5.1], [1.9, 5.1]]), w: 0.06, depth: 0.1 },
      ],
    });

    // A garland slung across the panel from two ribbons, with leaves cut along it.
    const swag = [[-1.5, 4.6], [-0.9, 3.6], [0, 3.2], [0.9, 3.6], [1.5, 4.6]];
    limb(P(swag.map(([f, u], i) => [f, u, 0.15 + 0.2 * Math.sin((i / 4) * Math.PI)])), { tone: 1.2, hatch: hatch + 40, shadow: 0.44, melt: 0, flat: 0.8, creases: [-1.1, -0.7, -0.3, 0.1, 0.5, 0.9].map((f) => ({ pts: P([[f, 3.0 + Math.abs(f) * 0.9 + 0.5], [f + 0.2, 3.4 + Math.abs(f) * 0.9 + 0.2], [f + 0.08, 3.9 + Math.abs(f) * 0.9]]), w: 0.03, depth: 0.05 })) });
    for (const side of [-1, 1]) {
      line(P([[side * 1.5, 4.6], [side * 1.68, 3.8], [side * 1.5, 3.0], [side * 1.64, 2.3]]), { w: 0.05, v: 0.76 });
      blob(P([[side * 1.5 - 0.17, 4.7], [side * 1.5, 4.87], [side * 1.5 + 0.17, 4.7], [side * 1.5, 4.53]]), { round: 0.15, tone: 1.2, shadow: 0.34 });
    }
    // A round boss under the swag.
    limb(P([[-0.1, 2.2, 0.3], [0.1, 2.2, 0.3]]), { tone: 1.2, hatch: hatch + 40, shadow: 0.42, melt: 0, flat: 0.7, creases: [{ pts: P([[-0.2, 2.2], [0, 2.38], [0.2, 2.2], [0, 2.02], [-0.2, 2.2]]), w: 0.02, depth: 0.04 }] });

    // Cornice, in two courses, Epsilon near its western end.
    block(-3.0, 3.0, 5.5, 5.95, { tone: 1.0, shadow: 0.5 });
    block(-3.3, 3.3, Math.min(5.9, ue - 0.5), Math.max(6.5, ue + 0.1), { tone: 1.18, shadow: 0.52, creases: [{ pts: P([[-3.1, 6.05], [0, 6.05], [3.1, 6.05]]), w: 0.03, depth: 0.05 }] });
    // The dentils under the cornice.
    for (let f = -2.8; f < 2.9; f += 0.46) line(P([[f, 5.56], [f, 5.9]]), { w: 0.1, v: 0.5, taper: false });
  },
};
