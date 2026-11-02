// The King, enthroned, robed and bearded, sceptre grounded at his side. He is drawn upright in his
// own frame and set on the stars with his head to the south, so that his feet rest toward the
// pole, as the old maps have them. Epsilon, zeta, delta and mu lie in the crown, Alderamin and iota
// are his shoulders, Alfirk the girdle, eta and theta his sceptre arm, and Errai the shin under the
// robe. The warm note is the crown.
import { frame } from '../kit.mjs';

export default {
  tier: 'extended',
  subject: 'The King',
  pixels: 1100,
  anchors: [['ε Cep', 'crown'], ['ζ Cep', 'crown'], ['δ Cep', 'crown'], ['μ Cep', 'crown'], ['Alderamin', 'shoulder'], ['ι Cep', 'shoulder'], ['Alfirk', 'girdle'], ['η Cep', 'elbow'], ['θ Cep', 'hand'], ['Errai', 'shin']],
  draw({ s, E }) {
    const { blob, limb, line, strands } = E;
    const L = frame([2.6, 9.2], [-3.0, -6.4]);
    const P = (pts) => pts.map(([f, u, ...rest]) => [...L(f, u), ...rest]);
    const hatch = L.angle;
    const eta = L.back(s('η Cep')), the = L.back(s('θ Cep')), ald = L.back(s('Alderamin')), iot = L.back(s('ι Cep'));

    // The throne: high back, a side rail, a seat and two strong legs, all behind him.
    blob(P([[-7.8, 16.4], [-6.6, 17.2], [-5.4, 16.4], [-5.0, 10.0], [-5.0, -1.8], [-8.2, -1.8], [-8.0, 8.0]]), {
      round: 0.7, tone: 1.2, hatch: hatch + 86, shadow: 0, band: 0.4,
      creases: [{ pts: P([[-6.6, 15.6], [-6.5, 8.0], [-6.5, -1.2]]), w: 0.14, depth: 0.2 }, { pts: P([[-7.8, 13.4], [-6.6, 13.2], [-5.2, 13.4]]), w: 0.08, depth: 0.12 }, { pts: P([[-7.8, 4.4], [-6.6, 4.2], [-5.2, 4.4]]), w: 0.08, depth: 0.12 }],
    });
    limb(P([[-6.6, 17.0, 0.4], [-6.6, 18.0, 0.26], [-6.6, 18.7, 0.5], [-6.6, 19.5, 0.08]]), { tone: 1.3, hatch, shadow: 0.3, melt: 0 });
    limb(P([[-7.0, -1.8, 0.8], [-7.2, -4.6, 0.5], [-7.0, -6.8, 0.54], [-7.4, -9.4, 0.72]]), { tone: 1.12, hatch: hatch + 86, shadow: 0.4, melt: 0, bumps: [{ at: L(-7.0, -6.8), r: [0.6, 0.6], h: 0.2 }] });
    limb(P([[2.2, -3.0, 0.7], [2.2, -5.4, 0.46], [2.3, -7.0, 0.5], [2.0, -9.4, 0.66]]), { tone: 0.96, hatch: hatch + 86, shadow: 0.4, melt: 0 });
    blob(P([[-8.6, -0.6], [3.8, -0.6], [4.2, -1.4], [3.6, -2.8], [-8.0, -2.8], [-8.8, -1.8]]), { round: 0.5, tone: 1.14, hatch: hatch + 4, shadow: 0.4, band: 0.3, creases: [{ pts: P([[-8.2, -1.6], [-2.0, -1.8], [3.8, -1.6]]), w: 0.08, depth: 0.12 }] });
    // Footstool.
    blob(P([[6.2, -9.8], [13.8, -9.8], [14.2, -11.2], [5.8, -11.2]]), { round: 0.34, tone: 1.1, hatch: hatch + 4, shadow: 0.4, band: 0.3, creases: [{ pts: P([[6.2, -10.5], [10.0, -10.6], [13.8, -10.5]]), w: 0.07, depth: 0.1 }] });
    // Pointed shoes on it.
    blob(P([[7.8, -8.6], [10.4, -8.6], [11.8, -9.2], [12.8, -9.9, 'c'], [8.0, -9.9]]), { round: 0.3, tone: 1.14, hatch: hatch + 10, shadow: 0.3 });
    blob(P([[9.6, -8.4], [12.2, -8.4], [13.8, -9.2], [14.8, -9.9, 'c'], [9.8, -9.9]]), { round: 0.3, tone: 1.3, hatch: hatch + 10, shadow: 0.34 });

    // The robe: one long fall from the waist, over the lap and the great knee, to the feet.
    blob(P([[-5.0, 4.2], [0.0, 3.6], [5.0, 4.2], [8.2, 3.8], [11.0, 3.0], [12.0, 1.0], [11.6, -2.6], [12.2, -6.0], [13.4, -8.6, 'c'], [10.8, -8.0], [9.0, -8.9, 'c'], [7.0, -7.8], [5.4, -8.8, 'c'], [4.6, -5.6], [3.6, -2.6], [-3.4, -2.2], [-5.6, 0.4]]), {
      round: 2.2, tone: 1.3, hatch: hatch + 80, shadow: 0.6, band: 0.8,
      creases: [
        { pts: P([[-1.4, 3.4], [2.8, 2.0], [6.4, 1.6], [9.8, 1.8]]), w: 0.2, depth: 0.3 }, { pts: P([[-2.6, 2.0], [1.6, 0.2], [6.0, -0.4], [9.6, -0.2]]), w: 0.2, depth: 0.3 }, { pts: P([[-3.4, 0.6], [0.4, -1.2], [4.4, -1.4]]), w: 0.16, depth: 0.22 },
        { pts: P([[10.4, 2.0], [10.2, -1.6], [10.8, -5.0], [11.8, -7.8]]), w: 0.2, depth: 0.3 }, { pts: P([[8.4, 0.8], [8.2, -2.6], [8.4, -5.4], [9.0, -8.2]]), w: 0.2, depth: 0.3 }, { pts: P([[6.2, 0.2], [6.0, -2.6], [6.0, -5.2], [5.8, -8.0]]), w: 0.18, depth: 0.26 },
        { pts: P([[-4.4, 3.0], [-3.8, 1.0], [-2.8, -1.8]]), w: 0.14, depth: 0.2 },
      ],
      bumps: [{ at: L(10.0, 1.6), r: [1.8, 1.6], h: 0.5 }, { at: L(4.0, 1.4), r: [3.2, 1.5], h: 0.4 }],
    });
    // A patterned hem, the mark of a king.
    for (const [a, b] of [[[5.2, -7.9], [7.0, -7.1]], [[7.0, -7.1], [9.0, -8.0]], [[9.0, -8.0], [10.9, -7.2]], [[10.9, -7.2], [13.0, -7.9]]]) {
      for (let i = 0; i < 4; i++) { const t = (i + 0.5) / 4, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t; line(P([[x - 0.16, y], [x, y + 0.2], [x + 0.16, y], [x, y - 0.2], [x - 0.16, y]]), { w: 0.03, v: 0.8, taper: false }); }
    }

    // The tunic, chest to girdle.
    blob(P([[-5.6, 10.2], [-2.0, 11.2], [2.4, 11.2], [6.6, 10.2], [7.0, 8.2], [5.4, 5.8], [4.8, 3.2], [-4.6, 3.2], [-5.4, 6.0], [-6.2, 8.2]]), {
      round: 1.6, tone: 1.3, hatch: hatch + 74, shadow: 0.5, band: 0.6,
      creases: [{ pts: P([[-2.4, 9.8], [-1.8, 7.4], [-1.6, 4.0]]), w: 0.16, depth: 0.22 }, { pts: P([[2.8, 9.8], [2.2, 7.4], [2.0, 4.0]]), w: 0.16, depth: 0.22 }, { pts: P([[0.2, 9.6], [0.2, 7.0], [0.2, 4.0]]), w: 0.14, depth: 0.2 }, { pts: P([[-4.0, 7.8], [-3.6, 5.6], [-3.6, 4.0]]), w: 0.12, depth: 0.16 }, { pts: P([[4.6, 7.8], [4.0, 5.6], [3.8, 4.0]]), w: 0.12, depth: 0.16 }],
    });
    // Girdle on Alfirk.
    limb(P([[-4.8, 3.3, 0.36], [0.0, 2.6, 0.44], [5.0, 3.3, 0.36]]), { tone: 1.44, hatch: hatch + 86, flat: 0.5, shadow: 0.4, melt: 0 });
    blob(P([[-0.7, 3.4], [0.8, 3.4], [0.8, 1.9], [-0.7, 1.9]]), { round: 0.3, tone: 1.6, shadow: 0.3, creases: [{ pts: P([[-0.3, 3.0], [0.4, 2.3]]), w: 0.05, depth: 0.1 }] });

    // Mantle over both shoulders with a heavy collar, falling behind the arms.
    blob(P([[ald[0] - 1.8, ald[1] + 1.4], [-1.8, 12.2], [0.4, 11.0], [2.0, 12.2], [iot[0] + 1.8, iot[1] + 1.6], [iot[0] + 2.0, iot[1] - 1.2], [4.2, 7.4], [1.6, 10.2], [0.4, 9.6], [-1.0, 10.2], [-3.4, 7.4], [ald[0] - 2.2, ald[1] - 1.4]]), {
      round: 0.9, tone: 1.34, hatch: hatch + 26, shadow: 0.55, band: 0.5,
      creases: [{ pts: P([[-5.4, 8.6], [-3.0, 10.2], [-0.8, 11.0]]), w: 0.14, depth: 0.2 }, { pts: P([[6.2, 8.2], [3.6, 10.0], [1.6, 11.0]]), w: 0.14, depth: 0.2 }],
    });

    // The sceptre, grounded, long as a spear, with a turned shaft and a knop.
    limb(P([[-10.0, -9.4, 0.14], [-9.8, 4.0, 0.2], [-9.6, 17.0, 0.18]]), { tone: 1.4, hatch: hatch + 86, shadow: 0.36, melt: 0, band: 0.16 });
    limb(P([[-9.6, 16.8, 0.2], [-9.6, 17.6, 0.5], [-9.6, 18.2, 0.24], [-9.6, 19.0, 0.46], [-9.6, 20.2, 0.04]]), { tone: 1.46, hatch, shadow: 0.34, melt: 0 });

    // Sceptre arm: Alderamin, out to the elbow on eta, down to the hand on theta.
    limb(P([[ald[0] - 0.2, ald[1] - 0.2, 1.7], [(ald[0] + eta[0]) / 2, (ald[1] + eta[1]) / 2 + 0.2, 1.3], [eta[0], eta[1], 1.0]]), {
      tone: 1.2, hatch: hatch + 10, shadow: 0.55, creases: [{ pts: P([[-4.6, 7.8], [-6.2, 7.0], [-7.6, 6.8]]), w: 0.13, depth: 0.2 }],
      bumps: [{ at: L(ald[0] - 0.6, ald[1]), r: [1.5, 1.4], h: 0.4 }],
    });
    limb(P([[eta[0], eta[1], 0.96], [the[0] - 0.1, the[1] + 0.8, 0.92], [the[0] - 0.4, the[1] - 0.4, 0.62]]), { tone: 1.2, hatch: hatch + 80, shadow: 0.5, bumps: [{ at: L(eta[0], eta[1]), r: [0.7, 0.7], h: 0.24 }] });
    blob(P([[the[0] - 1.4, the[1] - 0.2], [the[0] - 0.2, the[1] - 0.2], [the[0] + 0.1, the[1] - 1.2], [the[0] - 0.4, the[1] - 2.2], [the[0] - 1.5, the[1] - 2.2], [the[0] - 2.0, the[1] - 1.2]]), {
      round: 0.46, tone: 1.46, hatch: hatch + 30, shadow: 0.55,
      creases: [{ pts: P([[the[0] - 1.9, the[1] - 0.8], [the[0] - 1.0, the[1] - 0.9], [the[0] - 0.1, the[1] - 0.8]]), w: 0.05, depth: 0.09 }, { pts: P([[the[0] - 1.9, the[1] - 1.4], [the[0] - 1.0, the[1] - 1.5], [the[0] - 0.1, the[1] - 1.4]]), w: 0.05, depth: 0.09 }],
    });

    // Near arm, laid along the thigh, the hand resting on the knee.
    limb(P([[iot[0], iot[1] - 0.2, 1.8], [7.6, 6.6, 1.4], [9.0, 4.6, 1.06]]), {
      tone: 1.26, hatch: hatch + 46, shadow: 0.6, creases: [{ pts: P([[5.8, 6.4], [7.0, 5.2], [8.2, 3.8]]), w: 0.12, depth: 0.18 }],
      bumps: [{ at: L(iot[0] + 0.4, iot[1]), r: [1.5, 1.4], h: 0.4 }],
    });
    limb(P([[9.0, 4.6, 1.02], [10.0, 3.8, 1.0], [11.0, 2.8, 0.62]]), { tone: 1.26, hatch: hatch + 20, shadow: 0.55, bumps: [{ at: L(9.0, 4.6), r: [0.7, 0.7], h: 0.24 }] });
    blob(P([[10.6, 3.6], [11.8, 3.2], [13.0, 2.2], [13.2, 1.4], [12.0, 1.2], [10.8, 1.8], [10.4, 2.6]]), {
      round: 0.4, tone: 1.46, hatch: hatch + 30, shadow: 0.5,
      creases: [{ pts: P([[12.8, 2.6], [12.0, 2.0], [11.2, 1.6]]), w: 0.05, depth: 0.09 }, { pts: P([[12.2, 3.0], [11.5, 2.5], [10.8, 2.0]]), w: 0.05, depth: 0.09 }],
    });

    // Head in profile, heavy-browed, long-bearded, looking out over the knee.
    const c = [-0.2, 12.7], k = 1.8;
    const H = (f, u) => [c[0] + f * k, c[1] + u * k];
    const Q = (pts) => P(pts.map(([f, u, ...r]) => [...H(f, u), ...r]));
    // Hair falling behind.
    blob(Q([[0.0, 1.0], [-1.4, 0.8], [-2.0, -0.6], [-1.8, -2.0], [-1.0, -2.0], [-0.6, -0.8]]), { round: 0.6, tone: 1.0, hatch: hatch + 70, shadow: 0.4, relief: 0.3, edge: 0.6 });
    for (const pts of [[[-0.9, 0.8], [-1.7, 0.0], [-1.9, -1.8]], [[-0.7, 0.4], [-1.3, -0.4], [-1.4, -1.9]], [[-1.2, 0.7], [-2.0, -0.4], [-2.1, -1.6]], [[-0.6, -0.2], [-0.9, -1.0], [-1.0, -1.8]]]) line(Q(pts), { w: 0.12, v: 0.7 });
    // Beard mass, a long square fall.
    blob(Q([[1.2, -1.0], [0.5, -0.8], [-0.5, -0.9], [-0.9, -1.8], [-0.7, -3.0], [0.0, -3.5], [0.8, -3.3], [1.2, -2.2]]), {
      round: 0.6, tone: 1.1, hatch: hatch + 80, shadow: 0.5, relief: 0.3,
    });
    blob(Q([[-1.2, -0.8], [-1.5, 0.5], [-0.8, 1.6], [0.4, 1.7], [1.2, 1.0], [1.45, 0.2], [1.75, -0.2], [1.35, -0.5], [1.35, -1.0], [1.1, -1.25], [0.6, -1.2], [-0.2, -1.1], [-0.8, -1.1]]), {
      round: 1.3, tone: 1.56, hatch: hatch + 40, shadow: 0.55, spacing: 0.86,
      creases: [{ pts: Q([[0.45, 0.34], [0.95, 0.5], [1.34, 0.26]]), w: 0.13, depth: 0.28 }, { pts: Q([[1.3, -0.28], [1.5, -0.34], [1.4, -0.52]]), w: 0.05, depth: 0.1 }],
      bumps: [{ at: H(1.32, -0.2), r: [0.5, 0.7], h: 0.24 }, { at: H(0.8, -0.6), r: [0.5, 0.4], h: 0.14 }],
    });
    line(Q([[0.72, 0.17], [0.98, 0.22], [1.2, 0.14]]), { w: 0.07, v: 1 });
    // Moustache, then the beard lock by lock.
    for (const pts of [[[1.3, -0.72], [0.9, -0.82], [0.5, -1.2]], [[1.3, -0.82], [1.0, -1.1], [0.9, -1.6]]]) line(Q(pts), { w: 0.11, v: 0.84 });
    for (let i = 0; i < 12; i++) { const a = 1.08 - i * 0.16, wob = i % 2 ? 0.08 : -0.06, end = -3.0 - 0.45 * Math.sin((i / 11) * Math.PI); line(Q([[a, -1.1], [a + 0.08 + wob, -1.9], [a - 0.04 - wob, -2.6], [a * 0.82, end]]), { w: 0.055, v: 0.6 }); }

    // The crown, the warm note: a flared band with five points.
    blob(P([[-3.8, 15.6], [-2.2, 15.2], [0.0, 15.0], [2.2, 15.2], [3.7, 15.6], [3.4, 13.9], [2.0, 13.7], [-0.2, 13.5], [-2.4, 13.7], [-3.6, 13.9]]), {
      round: 0.4, tone: 1.5, warm: 0.74, hatch: hatch + 80, shadow: 0.4, band: 0.3,
      creases: [{ pts: P([[-3.5, 14.2], [-0.2, 13.8], [3.3, 14.2]]), w: 0.06, depth: 0.1 }, { pts: P([[-3.6, 15.3], [0.0, 14.8], [3.6, 15.3]]), w: 0.06, depth: 0.1 }],
    });
    for (const [f, h] of [[-3.5, 1.5], [-1.7, 1.9], [0.25, 2.2], [2.1, 1.9], [3.5, 1.5]]) {
      const lean = f * 0.1;
      blob(P([[f - 0.56, 15.2], [f + lean, 15.2 + h, 'c'], [f + 0.56, 15.2]]), { round: 0.2, tone: 1.5, warm: 0.74, hatch: hatch + 80, shadow: 0.34, band: 0.14 });
      blob(P([[f + lean - 0.26, 15.3 + h], [f + lean, 15.56 + h], [f + lean + 0.26, 15.3 + h], [f + lean, 15.04 + h]]), { round: 0.2, tone: 1.6, warm: 0.74, shadow: 0.2 });
    }
  },
};
