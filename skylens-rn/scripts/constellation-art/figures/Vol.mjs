// The Flying Fish, out of the water with its great pectoral wings open. Alpha is the head, Beta the
// shoulder, Epsilon the narrowing of the body, and Delta and Gamma the two blades of the tail,
// the lower one longer as it is in life. The warm note is the eye.
import { frame } from '../kit.mjs';

export default {
  tier: 'extended',
  subject: 'The Flying Fish',
  pixels: 1000,
  anchors: [['α Vol', 'head'], ['β Vol', 'shoulder'], ['ε Vol', 'body'], ['δ Vol', 'tail'], ['γ² Vol', 'tail']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const alp = s('α Vol'), eps = s('ε Vol'), del = s('δ Vol'), gam = s('γ² Vol');
    // Along the fish u from tail root to head, f toward the back.
    const root = [1.8, -0.7];
    const L = frame(root, [alp[0] - 0.6, alp[1] + 0.1], -1);
    const T = (u, f) => L(f, u);
    const a = L.angle;
    const rel = (p) => { const b = L.back(p); return [b[1], b[0]]; };

    // Tail: two long blades, each with its star, the lower reaching farther.
    const blade = (star, grow, side, tone) => {
      const r = rel(star), tip = [r[0] * grow, r[1] * grow];
      const rays = [];
      for (let k = 1; k < 7; k++) { const q = k / 7; rays.push({ pts: [T(-0.1, 0), T(tip[0] * 0.56, tip[1] * 0.56 + side * (0.54 - q * 1.08)), T(tip[0] * (1 - q * 0.26), tip[1] * (1 - q * 0.26))], w: 0.035, depth: 0.06 }); }
      blob([T(0.5, side * 0.3), T(tip[0] * 0.5, tip[1] * 0.5 + side * 0.7), [...T(...tip), 'c'], T(tip[0] * 0.6, tip[1] * 0.6 - side * 0.5), T(-0.2, 0)], { round: 0.34, tone, hatch: a + 80, shadow: 0.4, band: 0.2, creases: rays });
    };
    blade(del, 1.5, 1, 1.02);
    blade(gam, 1.55, -1, 1.08);

    // The far wing, up behind the body, long-rayed with a scalloped trailing edge.
    const fan = (origin, tips, tone, hatch, w) => {
      tips.forEach((t, i) => {
        const o = [origin[0] + (i * w[0]) / tips.length, origin[1] + (i * w[1]) / tips.length], m = [(o[0] + t[0]) / 2 - (t[1] - o[1]) * 0.04, (o[1] + t[1]) / 2 + (t[0] - o[0]) * 0.04];
        limb([[...o, 0.1], [...m, 0.42], [t[0] - (t[0] - o[0]) * 0.1, t[1] - (t[1] - o[1]) * 0.1, 0.44], [...t, 0.14]], { flat: 0.34, tone: tone * (0.94 + 0.1 * (i / tips.length)), hatch, shadow: 0.34, melt: 0, band: 0.2, creases: [{ pts: [o, m, t], w: 0.04, depth: 0.05 }] });
      });
    };
    fan(T(8.6, 1.0), [T(0.6, 8.2), T(1.0, 9.0), T(1.6, 9.7), T(2.3, 10.2), T(3.1, 10.5), T(4.0, 10.7), T(4.9, 10.8), T(5.8, 10.8), T(6.7, 10.5), T(7.5, 10.0), T(8.3, 9.2)], 1.02, a + 80, [0.0, 0.0]);
    limb([[...T(8.7, 1.2), 0.4], [...T(9.2, 6.0), 0.2], [...T(8.3, 9.3), 0.1]], { tone: 1.2, hatch: a, shadow: 0.3, melt: 0 });

    // Dorsal, set far back as a flying fish carries it, and the low fin below it.
    blob([T(3.8, 0.9), T(3.4, 1.8), T(2.6, 2.3), T(1.8, 2.2), [...T(1.1, 1.8), 'c'], T(1.8, 0.8)], { round: 0.2, tone: 1.04, hatch: a, shadow: 0.34, band: 0.16, creases: [{ pts: [T(3.2, 1.0), T(3.0, 2.0)], w: 0.035, depth: 0.06 }, { pts: [T(2.6, 0.9), T(2.4, 2.1)], w: 0.035, depth: 0.06 }, { pts: [T(2.0, 0.8), T(1.9, 2.0)], w: 0.035, depth: 0.06 }] });
    blob([T(3.6, -0.8), T(3.0, -1.6), T(2.2, -2.0), [...T(1.1, -2.0), 'c'], T(1.8, -0.7)], { round: 0.2, tone: 1.0, hatch: a, shadow: 0.34, band: 0.16, creases: [{ pts: [T(3.0, -0.9), T(2.6, -1.6)], w: 0.035, depth: 0.06 }, { pts: [T(2.3, -0.8), T(2.1, -1.7)], w: 0.035, depth: 0.06 }] });
    // The small hind wing under the belly.
    fan(T(4.6, -1.0), [T(0.4, -4.4), T(1.0, -4.9), T(1.8, -5.2), T(2.6, -5.2), T(3.4, -4.8)], 0.96, a + 80, [0, 0]);

    // The body, a clean torpedo, deeper at the shoulder.
    const lat = [];
    for (let n = -1; n <= 1; n++) { const pts = []; for (let u = 0.6; u <= 8; u += 1) pts.push(T(u, n * (0.24 + u * 0.06) + 0.08)); lat.push({ pts, w: 0.04, depth: 0.05 }); }
    const sc = [];
    for (let u = 1; u < 7.8; u += 0.5) for (let f = -1.2; f < 1.3; f += 0.36) { const q = f + (Math.round(u * 2) % 2 ? 0.18 : 0); if (Math.abs(q) > 0.42 + u * 0.09) continue; sc.push({ pts: [T(u + 0.15, q + 0.14), T(u, q), T(u + 0.15, q - 0.14)], w: 0.02, depth: 0.04 }); }
    blob([T(-0.2, 0.28), T(2, 0.74), T(4, 1.08), T(6, 1.3), T(8, 1.36), T(9.4, 1.2), T(10.4, 0.8), T(10.9, 0.2), T(10.7, -0.3), T(10, -0.74), T(8, -1.2), T(6, -1.3), T(4, -1.06), T(2, -0.72), T(-0.2, -0.28)], {
      round: 0.74, tone: 1.14, hatch: a + 70, shadow: 0.54, band: 0.26, creases: [...lat, ...sc],
    });
    blob([T(8.4, 1.2), T(8.8, 0.3), T(8.6, -0.6), T(8.6, -1.1), T(10, -0.74), T(10.7, -0.3), T(10.9, 0.2), T(10.4, 0.8), T(9.4, 1.2)], {
      round: 0.34, tone: 1.2, hatch: a + 44, shadow: 0.4, band: 0.2,
      creases: [{ pts: [T(10.9, 0.1), T(10.3, 0.0), T(9.9, -0.2)], w: 0.04, depth: 0.08 }],
    });

    // The near wing, the great fan, sweeping down and back from Beta.
    fan(T(8.4, -0.5), [T(8.2, -8.6), T(7.4, -9.6), T(6.5, -10.3), T(5.6, -10.8), T(4.7, -11.1), T(3.8, -11.1), T(3.0, -10.9), T(2.2, -10.5), T(1.5, -9.9), T(0.9, -9.1), T(0.5, -8.2)], 1.3, a + 80, [0, 0]);
    blob([T(8.8, 0.5), T(8.9, -0.4), T(8.4, -1.6), T(7.3, -1.8), T(7.2, -0.9), T(7.8, 0.1)], { round: 0.3, tone: 1.26, hatch: a + 20, shadow: 0.4, band: 0.16, creases: [{ pts: [T(8.5, 0.2), T(7.7, -1.5)], w: 0.04, depth: 0.08 }] });
    limb([[...T(8.5, -0.6), 0.36], [...T(9.2, -5.0), 0.22], [...T(8.2, -8.7), 0.1]], { tone: 1.24, hatch: a, shadow: 0.34, melt: 0 });

    // Eye.
    const eye = T(10.0, 0.3);
    limb([[eye[0], eye[1], 0.28], [eye[0] + 0.01, eye[1], 0.28]], { tone: 1.3, warm: 0.74, shadow: 0.2, melt: 0 });
    limb([[eye[0], eye[1], 0.15], [eye[0] + 0.01, eye[1], 0.15]], { tone: 0.14, shadow: 0, melt: 0 });
    void eps; void line;
  },
};
