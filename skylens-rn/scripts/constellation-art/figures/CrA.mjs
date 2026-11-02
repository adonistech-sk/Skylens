// The Southern Crown, a victor's wreath of laurel. Two branches rise from a knot of ribbon near
// Zeta and Delta: one climbs through Beta, Meridiana and Gamma to Epsilon, the other runs through
// Eta to Theta. The ring stays open to the north-west, as a wreath does. Ribbon and berries are warm.
import { spline } from '../engrave.mjs';

export default {
  tier: 'extended',
  subject: 'The Southern Crown',
  pixels: 1100,
  anchors: [['Meridiana', 'laurel branch'], ['β CrA', 'laurel branch'], ['γ CrA', 'laurel branch'], ['ε CrA', 'tip of the branch'], ['δ CrA', 'laurel branch'], ['ζ CrA', 'knot of the ribbon'], ['η² CrA', 'laurel branch'], ['θ CrA', 'tip of the branch']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const eps = s('ε CrA'), gam = s('γ CrA'), mer = s('Meridiana'), bet = s('β CrA'), del = s('δ CrA'), zet = s('ζ CrA'), eta = s('η² CrA'), the = s('θ CrA');
    const knot = [zet[0] - 0.1, zet[1] - 0.1];

    /** One laurel leaf from a stem point, turned by angle and curved a little. */
    const leaf = (at, angle, len, wide, tone, curl) => {
      const a = (angle * Math.PI) / 180, c = Math.cos(a), n = Math.sin(a);
      const Q = (u, v) => [at[0] + c * u * len - n * v * wide, at[1] + n * u * len + c * v * wide];
      blob([[...Q(0, 0), 'c'], Q(0.26, 0.86 + curl * 0.3), Q(0.56, 1.0 + curl * 0.6), Q(0.82, 0.54 + curl), [...Q(1.02, curl * 1.3), 'c'], Q(0.8, -0.3 + curl), Q(0.54, -0.8 + curl * 0.5), Q(0.24, -0.76)], {
        round: wide * 0.6, tone, hatch: 90 - angle + 60, shadow: 0.36, spacing: 0.76, band: 0.14,
        creases: [{ pts: [Q(0.03, 0), Q(0.5, 0.1 + curl * 0.6), Q(0.96, curl * 1.2)], w: 0.03, depth: 0.05 }],
      });
      for (const t of [0.3, 0.52, 0.72]) {
        const m = Q(t, 0.1 + curl * 0.6 * t * 2);
        line([m, Q(t + 0.14, 0.62 + curl * 0.6)], { w: 0.008, v: 0.5 });
        line([m, Q(t + 0.14, -0.42 + curl * 0.4)], { w: 0.008, v: 0.42 });
      }
    };

    /** A branch through its stars, with paired leaves that shrink toward the tip. */
    const branch = (pts, count, outer, seed) => {
      const path = spline(pts, false, 14);
      limb(pts.map((p, i) => [p[0], p[1], 0.075 - (0.05 * i) / (pts.length - 1)]), { tone: 1.08, warm: 0.5, shadow: 0, melt: 0, flat: 0.8 });
      for (let i = count - 1; i >= 0; i--) {
        const t = (i + 0.3) / count, k = Math.round(t * (path.length - 2)), p = path[k], q = path[k + 1];
        const dir = (Math.atan2(q[1] - p[1], q[0] - p[0]) * 180) / Math.PI;
        const size = 1 - t * 0.36, wob = ((i * 37 + seed) % 11) - 5;
        leaf(p, dir + outer * (36 + wob), 1.34 * size, 0.27 * size, 0.98 + ((i + seed) % 3) * 0.06, 0.1 * outer);
        leaf(p, dir - outer * (32 - wob), 1.12 * size, 0.25 * size, 1.12, -0.1 * outer);
        if (i % 3 === 1) {
          const b = [p[0] + Math.cos(((dir + outer * 76) * Math.PI) / 180) * 0.34, p[1] + Math.sin(((dir + outer * 76) * Math.PI) / 180) * 0.34];
          blob([[b[0] - 0.09, b[1]], [b[0], b[1] + 0.09], [b[0] + 0.09, b[1]], [b[0], b[1] - 0.09]], { round: 0.08, tone: 1.3, warm: 0.76, shadow: 0.24 });
        }
      }
      // A last small leaf closes each tip.
      const end = path[path.length - 1], prev = path[path.length - 6];
      leaf(end, (Math.atan2(end[1] - prev[1], end[0] - prev[0]) * 180) / Math.PI, 0.9, 0.2, 1.12, 0);
    };

    // Ribbon tails, behind the wreath, falling away to the south-east.
    limb([[knot[0] - 0.1, knot[1] - 0.1, 0.06], [knot[0] - 0.9, knot[1] - 0.9, 0.2], [knot[0] - 1.05, knot[1] - 1.9, 0.24], [knot[0] - 1.9, knot[1] - 2.7, 0.22], [knot[0] - 2.0, knot[1] - 3.5, 0.04]], { tone: 1.0, warm: 0.6, flat: 0.45, hatch: 60, shadow: 0, melt: 0, creases: [{ pts: [[knot[0] - 0.9, knot[1] - 0.9], [knot[0] - 1.05, knot[1] - 1.9], [knot[0] - 1.9, knot[1] - 2.7]], w: 0.03, depth: 0.05 }] });
    limb([[knot[0] + 0.1, knot[1] - 0.1, 0.06], [knot[0] + 0.3, knot[1] - 1.0, 0.2], [knot[0] + 1.0, knot[1] - 1.8, 0.22], [knot[0] + 0.8, knot[1] - 2.8, 0.2], [knot[0] + 1.3, knot[1] - 3.5, 0.04]], { tone: 0.9, warm: 0.6, flat: 0.45, hatch: 120, shadow: 0.2, melt: 0 });

    // The two branches.
    branch([knot, del, bet, mer, gam, [eps[0] - 0.3, eps[1] + 0.2], [eps[0] + 0.9, eps[1] + 0.1]], 11, -1, 2);
    branch([knot, [zet[0] + 0.9, zet[1] - 1.0], eta, [the[0] - 1.4, the[1] - 1.5], the, [the[0] + 0.7, the[1] + 0.8]], 11, 1, 5);

    // The knot.
    blob([[knot[0] - 0.56, knot[1] + 0.16], [knot[0] - 0.1, knot[1] + 0.42], [knot[0] + 0.5, knot[1] + 0.32], [knot[0] + 0.62, knot[1] - 0.1], [knot[0] + 0.2, knot[1] - 0.42], [knot[0] - 0.42, knot[1] - 0.3]], {
      round: 0.3, tone: 1.2, warm: 0.7, hatch: 30, shadow: 0.42, band: 0.2,
      creases: [{ pts: [[knot[0] - 0.34, knot[1] + 0.2], [knot[0] + 0.02, knot[1] + 0.02], [knot[0] + 0.34, knot[1] + 0.14]], w: 0.04, depth: 0.06 }, { pts: [[knot[0] - 0.22, knot[1] - 0.22], [knot[0] + 0.02, knot[1] + 0.02], [knot[0] + 0.2, knot[1] - 0.24]], w: 0.04, depth: 0.06 }],
    });
  },
};
