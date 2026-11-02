// The Arrow, flying east. Gamma sits on the bronze head, Delta on the shaft at the head of the
// fletching, and Sham and Beta on the two feathers. The bronze head takes the warm note.
import { frame } from '../kit.mjs';

export default {
  tier: 'extended',
  subject: 'The Arrow',
  pixels: 1100,
  anchors: [['γ Sge', 'arrow head'], ['δ Sge', 'shaft'], ['Sham', 'fletching'], ['β Sge', 'fletching']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const de = s('δ Sge'), ga = s('γ Sge');
    // Here u runs along the shaft to the point, and f across it.
    const L = frame([ga[0] + (de[0] - ga[0]) * 1.6, ga[1] + (de[1] - ga[1]) * 1.6], ga);
    const A = (pts) => pts.map(([u, f, ...rest]) => [...L(f, u), ...rest]);
    const hatch = L.angle;

    // A feather on either side of the shaft: low at the front, tall behind, cut on a slant.
    const vane = (u) => { const t = Math.min(1, (1.25 - u) / 2.6); return 0.08 + 0.8 * Math.pow(t, 0.62); };
    for (const side of [1, -1]) {
      const v = (u, f) => [u, f * side];
      const outline = [v(1.25, 0.02)];
      for (let u = 0.9; u > -1.3; u -= 0.4) outline.push(v(u, vane(u)));
      blob(A([...outline, [...v(-1.38, vane(-1.38)), 'c'], v(-1.62, 0.5), [...v(-1.34, 0.03), 'c']]), {
        round: 0.3, tone: 1.08, hatch: hatch + 58 * side, shadow: 0.4, spacing: 0.8, edge: 0.6,
      });
      for (let i = 0; i < 30; i++) {
        const u = 1.05 - 2.36 * (i / 29), end = u - 0.36;
        const gap = i === 11 || i === 12 || i === 21;
        if (!gap) line(A([v(u, 0.06), v(u - 0.16, vane(end) * 0.55), v(end, vane(end) * 1.02)]), { w: 0.012, v: 0.66 });
      }
    }

    // The shaft, from the nock to the socket.
    limb(A([[-2.05, 0, 0.095], [1.0, 0, 0.11], [3.6, 0, 0.1]]), { tone: 1.2, warm: 0.5, hatch: hatch + 86, shadow: 0.4, melt: 0, flat: 0.8 });

    // Thread bindings, ahead of the fletching and behind it.
    for (const [a, b] of [[1.18, 1.56], [-1.66, -1.4]]) {
      for (let u = a; u < b; u += 0.04) line(A([[u, -0.1], [u + 0.012, 0], [u + 0.024, 0.1]]), { w: 0.012, v: 0.78, warm: 0.6, taper: false });
    }

    // The nock.
    limb(A([[-2.04, 0.04, 0.1], [-2.24, 0.12, 0.04]]), { tone: 1.2, warm: 0.7, melt: 0, flat: 0.7, shadow: 0.2 });
    limb(A([[-2.04, -0.04, 0.1], [-2.24, -0.12, 0.04]]), { tone: 1.2, warm: 0.7, melt: 0, flat: 0.7, shadow: 0.2 });

    // Socket and barbed head.
    limb(A([[3.3, 0, 0.1], [3.9, 0, 0.16], [4.2, 0, 0.16]]), { tone: 1.2, warm: 0.74, hatch: hatch + 90, shadow: 0.34, melt: 0, flat: 0.8, creases: [{ pts: A([[3.52, -0.13], [3.54, 0.13]]), w: 0.025, depth: 0.04 }, { pts: A([[3.66, -0.15], [3.68, 0.15]]), w: 0.025, depth: 0.04 }] });
    blob(A([[5.95, 0, 'c'], [5.2, 0.27], [4.55, 0.46], [3.72, 0.62, 'c'], [3.94, 0.3], [4.06, 0.14], [4.06, -0.14], [3.94, -0.3], [3.72, -0.62, 'c'], [4.55, -0.46], [5.2, -0.27]]), {
      round: 0.42, tone: 1.26, warm: 0.76, hatch: hatch + 30, shadow: 0.42, band: 0.3,
      creases: [{ pts: A([[4.1, 0], [5.0, 0], [5.92, 0]]), w: 0.05, depth: 0.09 }, { pts: A([[4.1, 0.18], [4.9, 0.12], [5.7, 0.04]]), w: 0.02, depth: 0.03 }, { pts: A([[4.1, -0.18], [4.9, -0.12], [5.7, -0.04]]), w: 0.02, depth: 0.03 }],
    });
  },
};
