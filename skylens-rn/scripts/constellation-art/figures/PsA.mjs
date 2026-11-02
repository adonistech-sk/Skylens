// The Southern Fish, a great carp-like fish that swims east with its mouth open, drinking the
// stream poured from Aquarius's jar. Fomalhaut, "the mouth of the fish", sits on its lip. Epsilon
// tops the dorsal fin, Delta, Gamma and Beta run along the belly, Mu at the root of the tail, and
// Iota and Theta on the two lobes of the tail fin. A fine warm line picks out the fin spines.
import { spline } from '../engrave.mjs';

export default {
  tier: 'extended',
  subject: 'The Southern Fish',
  pixels: 1100,
  anchors: [['Fomalhaut', 'mouth'], ['ε PsA', 'dorsal fin'], ['δ PsA', 'belly'], ['γ PsA', 'belly'], ['β PsA', 'belly'], ['μ PsA', 'root of the tail'], ['ι PsA', 'tail'], ['θ PsA', 'tail']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const fom = s('Fomalhaut'), eps = s('ε PsA'), del = s('δ PsA'), gam = s('γ PsA'), bet = s('β PsA'), mu = s('μ PsA'), iot = s('ι PsA'), the = s('θ PsA');

    // Back and belly, each drawn as a line from mouth to tail root.
    const back = [[fom[0] - 0.1, fom[1] + 0.5], [-5.2, 3.0], [-3.2, 3.5], [-0.6, 3.1], [2.0, 1.7], [4.4, 0.4], [6.0, -0.5]];
    const belly = [[fom[0] - 0.2, fom[1] - 0.6], [-7.0, -0.6], [-6.0, -1.7], [-3.4, -2.3], [-0.8, -1.9], [2.0, -1.8], [4.4, -1.8], [6.0, -1.5]];
    const B = spline(back, false, 10), U = spline(belly, false, 10);
    const edge = (list, x) => { for (let i = 1; i < list.length; i++) if (x <= list[i][0]) { const a = list[i - 1], b = list[i], t = (x - a[0]) / (b[0] - a[0] || 1); return a[1] + (b[1] - a[1]) * t; } return list[list.length - 1][1]; };

    /** A fin of rays from a base line to a set outer edge. */
    const fin = (base, tips, o = {}) => {
      blob([...base, ...tips.slice().reverse()], { round: 0.5, tone: o.tone ?? 0.96, hatch: o.hatch ?? 70, shadow: 0, band: 0.2, spacing: 0.86 });
      const a = spline(base, false, 6), b = spline(tips, false, 6), n = o.rays ?? 18;
      for (let i = 0; i <= n; i++) {
        const t = i / n, p = a[Math.round(t * (a.length - 1))], q = b[Math.round(t * (b.length - 1))];
        line([p, [(p[0] + q[0]) / 2 + (o.bend ?? 0), (p[1] + q[1]) / 2 + (o.bend ?? 0) * 0.5], q], { w: 0.035, v: 0.74, warm: i % 3 === 0 ? 0.56 : 0 });
      }
    };

    // Tail fin, deeply forked, Theta on the upper lobe and Iota on the lower.
    fin([[5.6, -0.4], [6.0, -0.9], [5.7, -1.7]], [[the[0] + 1.3, the[1] + 1.9], [the[0] + 0.4, the[1] + 0.7], [8.3, -0.7], [iot[0] - 0.2, iot[1] + 0.3], [iot[0] + 0.9, iot[1] - 0.9]], { rays: 22, hatch: 10, tone: 1.02, bend: 0.1 });

    // Dorsal fin, rising to Epsilon.
    fin([[-4.2, 3.2], [-2.2, 3.4], [0.2, 2.8], [2.4, 1.6]], [[-4.4, 4.5], [eps[0] - 0.2, eps[1] + 0.5], [-0.8, 4.3], [1.8, 3.3], [3.4, 1.5]], { rays: 22, hatch: 60, tone: 1.0, bend: 0.15 });
    // Anal and belly fins.
    fin([[2.0, -1.7], [3.6, -1.75]], [[1.5, -3.4], [2.8, -3.5], [3.9, -2.7]], { rays: 9, tone: 0.94, hatch: 80 });
    fin([[-3.2, -2.2], [-1.6, -2.1]], [[-3.8, -3.9], [-2.6, -4.2], [-1.2, -3.2]], { rays: 9, tone: 0.94, hatch: 80 });

    // The body. The light falls from the back, and the belly goes pale at the throat.
    blob([...back, [6.2, -1.0], ...belly.slice().reverse()], {
      round: 2.2, tone: 1.12, hatch: 18, shadow: 0, band: 0.34, spacing: 0.9,
      creases: [{ pts: [[-3.6, 0.6], [-0.4, 0.5], [3.0, -0.3], [5.8, -1.0]], w: 0.05, depth: 0.08 }],
      bumps: [{ at: [-3.0, 0.8], r: [3.0, 1.9], h: 0.5 }, { at: [1.0, 0.2], r: [2.8, 1.3], h: 0.3 }],
    });

    // Scales, row on row, laid toward the tail and shrinking as the body narrows.
    for (let col = 0; col < 27; col++) {
      const x = -3.5 + col * 0.36, top = edge(B, x), low = edge(U, x), h = top - low, rows = Math.max(4, Math.round(h / 0.46));
      for (let r = 0; r < rows; r++) {
        const t = (r + (col % 2 ? 0.5 : 0.15)) / rows;
        if (t > 0.98) continue;
        const y = top - h * t, size = h / rows;
        const v = 0.28 + 0.44 * (1 - t);
        line([[x - 0.02, y + size * 0.52], [x + 0.26, y + size * 0.3], [x + 0.34, y], [x + 0.26, y - size * 0.3], [x - 0.02, y - size * 0.52]], { w: 0.022, v });
      }
    }

    // The head, smooth and heavy, with the gill cover cut across it and the mouth open on Fomalhaut.
    blob([[-3.3, 3.45], [-5.2, 3.0], [-6.6, 2.4], [fom[0] - 0.7, fom[1] + 0.74], [fom[0] - 1.02, fom[1] + 0.3], [fom[0] - 0.1, fom[1] - 0.02, 'c'], [fom[0] - 1.1, fom[1] - 0.46], [fom[0] - 0.8, fom[1] - 1.0], [-7.1, -0.7], [-6.0, -1.76], [-4.2, -2.3], [-3.5, -1.0], [-3.2, 0.9]], {
      round: 1.6, tone: 1.24, hatch: 30, shadow: 0.5, band: 0.34, spacing: 0.86,
      creases: [
        { pts: [[-3.9, 3.0], [-3.5, 1.2], [-3.8, -0.8], [-4.4, -2.1]], w: 0.09, depth: 0.18 },
        { pts: [[-4.6, 2.6], [-4.4, 1.2], [-4.6, -0.4], [-5.2, -1.6]], w: 0.05, depth: 0.09 },
        { pts: [[fom[0] - 0.1, fom[1] - 0.02], [-5.9, 0.9], [-5.5, 0.6]], w: 0.05, depth: 0.09 },
      ],
      bumps: [{ at: [-5.6, 1.4], r: [1.4, 1.5], h: 0.3 }],
    });

    // Eye, with a bright ring and a dark pupil.
    const eye = [-5.7, 2.0];
    blob([[eye[0] - 0.36, eye[1]], [eye[0], eye[1] + 0.36], [eye[0] + 0.36, eye[1]], [eye[0], eye[1] - 0.36]], { round: 0.3, tone: 1.36, warm: 0.6, hatch: 20, shadow: 0.5, band: 0.1 });
    limb([[eye[0] - 0.04, eye[1], 0.17], [eye[0] + 0.04, eye[1], 0.17]], { tone: 0.3, shadow: 0, melt: 0 });

    // The barbel at the lip.
    line([[fom[0] - 0.8, fom[1] - 0.6], [fom[0] - 1.4, fom[1] - 1.3], [fom[0] - 1.2, fom[1] - 2.1]], { w: 0.05, v: 0.8 });

    // Pectoral fin, laid along the flank just behind the gill.
    fin([[-3.7, 0.3], [-3.5, -0.6]], [[-2.4, 0.5], [-1.5, 0.0], [-1.3, -0.8], [-2.0, -1.5]], { rays: 11, tone: 1.1, hatch: 20 });
    if (del[0] && gam[0] && bet[0] && mu[0]) return;
  },
};
