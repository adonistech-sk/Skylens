// The Lyre of Orpheus, a tortoise-shell lyre standing on its sound box. Sulafat and Sheliak sit on
// the shell, Delta and Zeta on the narrow waist of the two horns, Vega at the tip of the western
// horn, and Epsilon on the yoke that carries the strings. Horn and yoke take the warm note.
import { frame } from '../kit.mjs';

export default {
  tier: 'extended',
  subject: 'The Lyre',
  pixels: 1100,
  anchors: [['Vega', 'tip of the horn'], ['ε² Lyr', 'yoke'], ['ζ¹ Lyr', 'arm'], ['δ² Lyr', 'arm'], ['Sheliak', 'sound box'], ['Sulafat', 'sound box']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const she = s('Sheliak'), sul = s('Sulafat'), zet = s('ζ¹ Lyr'), del = s('δ² Lyr');
    const L = frame([(she[0] + sul[0]) / 2, (she[1] + sul[1]) / 2], [(zet[0] + del[0]) / 2, (zet[1] + del[1]) / 2]);
    const P = (pts) => pts.map(([f, u, ...rest]) => [...L(f, u), ...rest]);
    const hatch = L.angle;

    // The two horns, far behind the shell, with a fine groove down each.
    for (const side of [-1, 1]) {
      const spine = [[1.75, 0.2, 0.46], [2.3, 1.8, 0.44], [1.55, 3.0, 0.36], [0.98, 3.9, 0.3], [0.92, 4.9, 0.29], [1.3, 5.8, 0.26], [2.0, 6.4, 0.2], [2.75, 6.75, 0.13]];
      limb(P(spine.map(([f, u, r]) => [f * side, u, r])), {
        tone: 1.1, warm: 0.58, hatch: hatch + 86 * side, shadow: 0.36, melt: 0, flat: 0.8,
        creases: [{ pts: P([[1.95, 0.8], [2.25, 1.8], [1.55, 3.0], [1.0, 3.9], [0.94, 4.9], [1.3, 5.8], [1.95, 6.38]].map(([f, u]) => [f * side + 0.02, u])), w: 0.05, depth: 0.06 }],
      });
      // Horn tip and the collars that break the long curve.
      limb(P([[side * 2.72, 6.74, 0.13], [side * 2.98, 6.98, 0.17], [side * 3.1, 7.25, 0.08]]), { tone: 1.28, warm: 0.8, shadow: 0.2, melt: 0, flat: 0.7 });
      limb(P([[side * 1.36, 3.3, 0.11], [side * 0.62, 3.46, 0.11]]), { tone: 1.26, warm: 0.76, shadow: 0.18, melt: 0, flat: 0.6 });
      limb(P([[side * 2.55, 1.4, 0.13], [side * 1.95, 1.2, 0.13]]), { tone: 1.26, warm: 0.76, shadow: 0.18, melt: 0, flat: 0.6 });
    }

    // Yoke, turned and banded, resting across the horns.
    limb(P([[-2.3, 6.55, 0.2], [-1.2, 6.62, 0.3], [0, 6.64, 0.33], [1.2, 6.62, 0.3], [2.3, 6.55, 0.2]]), {
      tone: 1.16, warm: 0.66, hatch: hatch + 90, shadow: 0.4, melt: 0, flat: 0.74,
      creases: [-1.3, -0.65, 0, 0.65, 1.3].map((f) => ({ pts: P([[f, 6.34], [f + 0.04, 6.64], [f, 6.94]]), w: 0.04, depth: 0.08 })),
    });

    // The shell, its scutes cut in by hand.
    const shell = [[-2.4, 0.72], [-1.2, 1.02], [0, 1.1], [1.2, 1.02], [2.4, 0.72], [3.0, -0.3], [2.6, -1.7], [1.4, -2.7], [0, -3.0], [-1.4, -2.7], [-2.6, -1.7], [-3.0, -0.3]];
    blob(P(shell), {
      round: 1.5, tone: 1.14, hatch: hatch + 24, shadow: 0.6, band: 0.5, spacing: 0.9,
      creases: [
        { pts: P([[-0.8, 1.0], [-0.72, 0.1], [-0.76, -1.1], [-0.5, -2.3], [-0.3, -2.95]]), w: 0.07, depth: 0.14 },
        { pts: P([[0.8, 1.0], [0.72, 0.1], [0.76, -1.1], [0.5, -2.3], [0.3, -2.95]]), w: 0.07, depth: 0.14 },
        { pts: P([[-0.72, 0.1], [0, -0.02], [0.72, 0.1]]), w: 0.06, depth: 0.11 },
        { pts: P([[-0.76, -1.1], [0, -1.2], [0.76, -1.1]]), w: 0.06, depth: 0.11 },
        { pts: P([[-0.5, -2.2], [0, -2.28], [0.5, -2.2]]), w: 0.06, depth: 0.1 },
        { pts: P([[-0.72, 0.1], [-1.6, 0.0], [-2.9, -0.1]]), w: 0.06, depth: 0.11 },
        { pts: P([[0.72, 0.1], [1.6, 0.0], [2.9, -0.1]]), w: 0.06, depth: 0.11 },
        { pts: P([[-0.76, -1.1], [-1.6, -1.2], [-2.6, -1.6]]), w: 0.06, depth: 0.11 },
        { pts: P([[0.76, -1.1], [1.6, -1.2], [2.6, -1.6]]), w: 0.06, depth: 0.11 },
        { pts: P([[-0.5, -2.2], [-1.1, -2.2], [-1.6, -2.5]]), w: 0.05, depth: 0.09 },
        { pts: P([[0.5, -2.2], [1.1, -2.2], [1.6, -2.5]]), w: 0.05, depth: 0.09 },
        { pts: P([[-1.8, 0.86], [-1.7, 0.0]]), w: 0.05, depth: 0.09 },
        { pts: P([[1.8, 0.86], [1.7, 0.0]]), w: 0.05, depth: 0.09 },
        { pts: P([[-1.65, -0.05], [-1.7, -1.25]]), w: 0.05, depth: 0.09 },
        { pts: P([[1.65, -0.05], [1.7, -1.25]]), w: 0.05, depth: 0.09 },
      ],
      bumps: [{ at: L(0, -0.8), r: [2.4, 1.8], h: 0.26 }],
    });
    // Bridge and tailpiece on the shell.
    limb(P([[-1.25, -0.72, 0.09], [1.25, -0.72, 0.09]]), { tone: 1.3, warm: 0.8, shadow: 0.34, melt: 0, flat: 0.7 });
    limb(P([[-0.95, -1.75, 0.07], [0.95, -1.75, 0.07]]), { tone: 1.2, warm: 0.74, shadow: 0.24, melt: 0, flat: 0.7 });

    // Seven strings, from tailpiece over the bridge to the yoke.
    for (let i = -3; i <= 3; i++) {
      line(P([[i * 0.26, -1.75], [i * 0.36, -0.72], [i * 0.33, 6.36]]), { w: 0.015, v: 0.78, warm: 0.5, taper: false });
      limb(P([[i * 0.33, 6.86, 0.06], [i * 0.33, 7.14, 0.05]]), { tone: 1.3, warm: 0.8, shadow: 0.16, melt: 0, flat: 0.7 });
    }
  },
};
