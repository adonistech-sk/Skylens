// The Fly, seen from above as it lands. Lambda is on the great eyes, Epsilon on the thorax, Alpha and
// Beta on the banded abdomen, and Gamma and Delta on the lower wing, whose veins
// carry the drawing. The warm note is the compound eye.
import { frame } from '../kit.mjs';

export default {
  tier: 'extended',
  subject: 'The Fly',
  pixels: 1000,
  anchors: [['λ Mus', 'eye'], ['ε Mus', 'thorax'], ['α Mus', 'abdomen'], ['β Mus', 'abdomen'], ['γ Mus', 'wing'], ['δ Mus', 'wing']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const lam = s('λ Mus'), eps = s('ε Mus'), bet = s('β Mus'), gam = s('γ Mus'), del = s('δ Mus');
    const tail = [-3.0, -0.8];
    const L = frame(tail, lam);
    const T = (f, u) => L(f, u);
    const a = L.angle;

    // Legs: three pairs, jointed and bristled, thrust out from the thorax.
    const leg = (pts, tone) => {
      const seg = (p, q, r0, r1) => limb([[p[0], p[1], r0], [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, Math.max(r0, r1) * 1.1], [q[0], q[1], r1]], { tone, hatch: a + 80, shadow: 0.3, melt: 0, band: 0.14 });
      seg(pts[0], pts[1], 0.17, 0.13); seg(pts[1], pts[2], 0.13, 0.1); seg(pts[2], pts[3], 0.09, 0.06);
      const [x, y] = pts[3], d = [pts[3][0] - pts[2][0], pts[3][1] - pts[2][1]], l = Math.hypot(...d);
      for (const k of [-1, 1]) line([[x, y], [x + (d[0] / l) * 0.44 - (d[1] / l) * 0.28 * k, y + (d[1] / l) * 0.44 + (d[0] / l) * 0.28 * k]], { w: 0.04, v: 0.7 });
      for (let i = 1; i < 4; i++) { const t = i / 4, p = [pts[1][0] + (pts[2][0] - pts[1][0]) * t, pts[1][1] + (pts[2][1] - pts[1][1]) * t]; line([p, [p[0] + (d[1] / l) * 0.2, p[1] - (d[0] / l) * 0.2]], { w: 0.022, v: 0.5 }); line([p, [p[0] - (d[1] / l) * 0.2, p[1] + (d[0] / l) * 0.2]], { w: 0.022, v: 0.5 }); }
    };
    for (const sg of [-1, 1]) {
      leg([T(sg * 0.5, 6.0), T(sg * 2.2, 7.0), T(sg * 3.4, 8.8), T(sg * 3.0, 10.6)], 1.04);
      leg([T(sg * 0.7, 5.0), T(sg * 3.0, 5.2), T(sg * 5.0, 6.4), T(sg * 6.6, 5.8)], 1.04);
      leg([T(sg * 0.6, 4.0), T(sg * 2.6, 2.8), T(sg * 4.0, 0.6), T(sg * 5.8, -1.4)], 1.04);
    }

    // A wing, glassy, with its veins drawn line by line.
    const wing = (root, tip, side, tone, starA) => {
      const d = [tip[0] - root[0], tip[1] - root[1]], len = Math.hypot(...d), u = [d[0] / len, d[1] / len], n = [-u[1] * side, u[0] * side];
      const W = (q, w) => [root[0] + u[0] * len * q + n[0] * w, root[1] + u[1] * len * q + n[1] * w];
      const veins = [
        [W(0, 0.1), W(0.3, 0.72), W(0.62, 1.1), W(0.98, 0.4)],
        [W(0, 0), W(0.3, 0.3), W(0.66, 0.4), W(1.0, -0.1)],
        [W(0.08, -0.04), W(0.34, -0.22), W(0.66, -0.34), W(0.95, -0.84)],
        [W(0.14, -0.2), W(0.36, -0.7), W(0.6, -1.0), W(0.8, -1.5)],
        [W(0.28, 0.33), W(0.34, -0.22)], [W(0.46, -0.25), W(0.46, -0.85)], [W(0.5, 0.36), W(0.54, 0.98)],
      ];
      blob([W(-0.02, 0.1), W(0.3, 1.0), W(0.68, 1.36), W(0.94, 1.0), W(1.04, 0.0), W(0.96, -1.0), W(0.74, -1.62), W(0.42, -1.5), W(0.16, -0.76), W(-0.02, -0.1)], {
        round: 0.2, tone, hatch: a + 30, shadow: 0.3, alpha: 0.72, band: 0.24, spacing: 1.2,
        creases: veins.map((p) => ({ pts: p, w: 0.05, depth: 0.08 })),
      });
      for (const p of veins) line(p, { w: 0.03, v: 0.62, taper: false });
      if (starA) void starA;
    };
    wing(T(-0.7, 5.3), [bet[0] - 7.0, bet[1] + 2.4], -1, 0.86, bet);
    wing(T(0.7, 5.3), [-4.0, -6.3], 1, 0.9, del);

    // Abdomen: broad, banded, ending blunt.
    const bands = [];
    for (let u = 0.6; u < 4; u += 0.78) bands.push({ pts: [T(-1.5, u + 0.3), T(0, u - 0.1), T(1.5, u + 0.3)], w: 0.12, depth: 0.16 });
    blob([T(-1.0, 4.4), T(-1.5, 3.2), T(-1.7, 1.8), T(-1.2, 0.4), T(0, -0.3), T(1.2, 0.4), T(1.7, 1.8), T(1.5, 3.2), T(1.0, 4.4)], {
      round: 1.2, tone: 1.14, hatch: a + 8, shadow: 0.5, band: 0.3, creases: bands,
    });
    for (let i = 0; i < 40; i++) { const u = 0.3 + (i * 7) % 3.6, f = -1.3 + ((i * 13) % 26) / 10; if (Math.abs(f) > 1.45 - Math.abs(u - 2) * 0.28) continue; const p = T(f, u); line([p, T(f + f * 0.1, u - 0.2)], { w: 0.022, v: 0.6 }); }

    // Thorax, hairy, striped.
    blob([T(-1.0, 6.5), T(-1.5, 5.4), T(-1.4, 4.4), T(-0.7, 3.7), T(0.7, 3.7), T(1.4, 4.4), T(1.5, 5.4), T(1.0, 6.5), T(0, 6.8)], {
      round: 1.0, tone: 1.2, hatch: a + 80, shadow: 0.5, band: 0.26,
      creases: [{ pts: [T(-0.6, 6.5), T(-0.5, 5.2), T(-0.6, 3.9)], w: 0.08, depth: 0.12 }, { pts: [T(0.6, 6.5), T(0.5, 5.2), T(0.6, 3.9)], w: 0.08, depth: 0.12 }, { pts: [T(0, 6.6), T(0, 4.0)], w: 0.05, depth: 0.08 }],
    });
    for (let i = 0; i < 56; i++) { const f = -1.3 + ((i * 17) % 27) / 10, u = 3.9 + ((i * 11) % 28) / 10; if (Math.hypot(f / 1.4, (u - 5.2) / 1.4) > 1) continue; line([T(f, u), T(f * 1.08, u + 0.26)], { w: 0.022, v: 0.76 }); }

    // Head and huge eyes.
    limb([[...T(-0.3, 7.0), 0.36], [...T(0.3, 7.0), 0.36]], { tone: 1.1, shadow: 0.3, melt: 0 });
    const eyeF = (sg) => [T(sg * 0.2, 6.9), T(sg * 0.7, 6.7), T(sg * 1.4, 7.0), T(sg * 1.56, 7.7), T(sg * 1.2, 8.5), T(sg * 0.5, 8.6), T(sg * 0.14, 8.1)];
    for (const sg of [-1, 1]) {
      const ticks = [];
      for (let x = 0.3; x < 1.5; x += 0.24) for (let y = 6.9; y < 8.6; y += 0.24) ticks.push({ pts: [T(sg * x, y), T(sg * x + 0.1, y + 0.1)], w: 0.02, depth: 0.03 });
      blob(eyeF(sg), { round: 0.7, tone: 1.26, warm: 0.34, hatch: a, shadow: 0.42, band: 0.2, spacing: 0.76, creases: ticks });
    }
    blob([T(-0.26, 7.0), T(0.26, 7.0), T(0.2, 8.6), T(-0.2, 8.6)], { round: 0.2, tone: 1.1, hatch: a + 80, shadow: 0.3, band: 0.1 });
    // Antennae.
    for (const sg of [-1, 1]) {
      limb([[...T(sg * 0.1, 8.6), 0.07], [...T(sg * 0.4, 9.1), 0.11], [...T(sg * 0.5, 9.5), 0.05]], { tone: 1.2, shadow: 0.2, melt: 0 });
      line([T(sg * 0.5, 9.5), T(sg * 0.9, 9.9)], { w: 0.025, v: 0.7 });
    }
    void eps; void gam;
  },
};
