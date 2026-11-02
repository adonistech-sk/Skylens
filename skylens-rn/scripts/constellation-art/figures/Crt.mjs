// The Cup, a two-handled bronze krater of Apollo, tilted as the sky carries it. Alkes and Beta are
// the two edges of its round foot, Lambda and Gamma sit on the stem below the bowl, Delta, Epsilon
// and Zeta on the swell of the body, and Theta and Eta on the lip. Bronze is the warm note here.
import { frame } from '../kit.mjs';

export default {
  tier: 'extended',
  subject: 'The Cup',
  pixels: 1100,
  anchors: [['Alkes', 'foot'], ['β Crt', 'foot'], ['λ Crt', 'stem'], ['γ Crt', 'base of the bowl'], ['δ Crt', 'body'], ['ε Crt', 'shoulder'], ['ζ Crt', 'shoulder'], ['θ Crt', 'lip'], ['η Crt', 'lip']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const alk = s('Alkes'), bet = s('β Crt'), the = s('θ Crt'), eta = s('η Crt');
    const L = frame([(alk[0] + bet[0]) / 2, (alk[1] + bet[1]) / 2], [(the[0] + eta[0]) / 2, (the[1] + eta[1]) / 2]);
    const P = (pts) => pts.map(([f, u, ...rest]) => [...L(f, u), ...rest]);
    const hatch = L.angle;
    const c = 0;

    // Volute handles, behind the body: each rises from the shoulder, over the lip, and curls back.
    for (const side of [-1, 1]) {
      const h = (f, u) => [c + side * f, u];
      limb(P([[...h(5.1, 8.4), 0.42], [...h(6.8, 8.9), 0.4], [...h(7.5, 10.6), 0.38], [...h(7.0, 12.4), 0.36], [...h(5.8, 13.5), 0.34], [...h(4.7, 13.1), 0.3], [...h(4.9, 12.2), 0.24], [...h(5.6, 12.5), 0.17], [...h(5.5, 12.95), 0.1]]), {
        tone: 1.12, warm: 0.66, hatch: hatch + 80, shadow: 0, melt: 0, flat: 0.7,
        creases: [{ pts: P([h(6.8, 8.9), h(7.5, 10.6), h(7.0, 12.4), h(5.8, 13.5)]), w: 0.07, depth: 0.09 }],
      });
      // Strap that carries the handle up to the lip.
      limb(P([[...h(4.8, 12.6), 0.3], [...h(4.5, 12.1), 0.34]]), { tone: 1.1, warm: 0.66, shadow: 0.3, melt: 0, flat: 0.7 });
    }

    // The round foot, with the Alkes and Beta edges, stepped twice.
    blob(P([[-3.5, -0.3], [-3.2, 0.3], [-1.5, 0.52], [c, 0.58], [1.5, 0.52], [3.2, 0.3], [3.5, -0.3], [3.1, -0.72], [1.5, -0.86], [c, -0.9], [-1.5, -0.86], [-3.1, -0.72]]), {
      round: 0.5, tone: 1.04, warm: 0.62, hatch: hatch + 86, shadow: 0, band: 0.3,
      creases: [{ pts: P([[-3.1, -0.1], [c, -0.42], [3.4, -0.1]]), w: 0.07, depth: 0.1 }],
    });

    // The stem, with a knop midway.
    limb(P([[c, 0.35, 1.0], [c, 1.3, 0.56], [c, 2.3, 0.46], [c, 3.2, 0.52], [c, 4.5, 1.3]]), { tone: 1.08, warm: 0.6, hatch: hatch + 82, shadow: 0.4, melt: 0, flat: 0.76 });
    limb(P([[c - 1.0, 2.75, 0.3], [c, 2.72, 0.4], [c + 1.0, 2.75, 0.3]]), { tone: 1.24, warm: 0.74, hatch: hatch + 86, shadow: 0.42, melt: 0, flat: 0.8 });

    // The body: narrow at the stem, swelling through the shoulders, drawn in at the neck.
    const outer = (u) => (u < 9.4 ? 5.45 * Math.sin(Math.min(1, (u - 4.2) / 5.2) * Math.PI / 2) ** 0.8 + 0.4 : 5.85 - (u - 9.4) * 0.74);
    const lefts = [], rights = [];
    for (let u = 5.15; u <= 11.9; u += 0.75) { lefts.push([c - outer(u), u]); rights.push([c + outer(u), u]); }
    blob(P([[c - 1.4, 4.1], ...lefts, [c - 4.0, 11.85], [c, 12.05], [c + 4.0, 12.2], ...rights.reverse(), [c + 1.4, 4.1]]), {
      round: 3.0, tone: 1.1, warm: 0.5, hatch: hatch + 86, shadow: 0.62, band: 0.5, spacing: 0.92,
      creases: [
        // Long tongues of fluting that rise from the stem to the frieze.
        ...[-4.4, -3.2, -2.1, -1.05, 0, 1.05, 2.1, 3.2, 4.4].map((d) => ({ pts: P([[c + d * 0.24, 4.5], [c + d * 0.72, 6.0], [c + d, 7.9]]), w: 0.09, depth: 0.15 })),
        { pts: P([[c - 5.4, 8.1], [c - 2.6, 7.7], [c, 7.6], [c + 2.6, 7.7], [c + 5.4, 8.1]]), w: 0.09, depth: 0.15 },
        { pts: P([[c - 5.6, 10.4], [c - 2.6, 10.0], [c, 9.9], [c + 2.6, 10.0], [c + 5.5, 10.4]]), w: 0.09, depth: 0.15 },
      ],
      bumps: [{ at: L(c, 8.4), r: [4.4, 3.4], h: 0.7 }],
    });

    // The frieze, egg and dart, foreshortened as it wraps round the body.
    for (let i = -6; i <= 6; i++) {
      const th = (i * 12.2 * Math.PI) / 180, f = 5.6 * Math.sin(th), w = 0.32 * Math.cos(th), u = 7.82 + 0.024 * f * f;
      line(P([[f - w * 0.9, u + 0.3], [f - w, u + 1.2], [f, u + 1.86], [f + w, u + 1.2], [f + w * 0.9, u + 0.3], [f, u + 0.12], [f - w * 0.9, u + 0.3]]), { w: 0.03, v: 0.68, warm: 0.74, taper: false });
      line(P([[f - w * 0.45, u + 0.5], [f - w * 0.5, u + 1.14], [f, u + 1.5], [f + w * 0.5, u + 1.14], [f + w * 0.45, u + 0.5]]), { w: 0.018, v: 0.56, warm: 0.74 });
      if (i < 6) { const g = 5.6 * Math.sin(((i + 0.5) * 12.2 * Math.PI) / 180), v = 7.82 + 0.024 * g * g; line(P([[g, v + 0.1], [g, v + 1.5]]), { w: 0.04, v: 0.62, warm: 0.74 }); }
    }

    // The tall neck band, plain, with vertical tooling near the lip.
    for (let i = -13; i <= 13; i++) {
      const f = c + i * 0.32;
      line(P([[f, 11.15], [f * 1.0, 11.75]]), { w: 0.03, v: 0.6, warm: 0.7, taper: false });
    }

    // Lip.
    limb(P([[c - 5.1, 11.68, 0.22], [c - 2.4, 11.98, 0.32], [c, 12.1, 0.36], [c + 2.4, 12.26, 0.32], [c + 5.1, 12.38, 0.22]]), { tone: 1.3, warm: 0.8, hatch: hatch + 90, shadow: 0.46, melt: 0, flat: 0.7 });
  },
};
