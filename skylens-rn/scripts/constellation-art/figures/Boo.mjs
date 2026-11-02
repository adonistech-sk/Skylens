// The Herdsman, in full stride after the Bear, cap on, cloak streaming, his crook held high. Drawn
// upright in his own frame and leaning east in the sky. Nekkar is his head, Seginus and delta his
// shoulders, rho and Izar the belted waist, Arcturus the driving knee, as the old tables say,
// Muphrid and tau the forward shin, zeta the trailing leg, Xuange his elbow, and kappa and theta
// the raised hand. The warm note is the hook of the crook.
import { frame } from '../kit.mjs';

export default {
  tier: 'extended',
  subject: 'The Herdsman',
  pixels: 1100,
  anchors: [['Nekkar', 'head'], ['Seginus', 'shoulder'], ['δ Boo', 'shoulder'], ['ρ Boo', 'waist'], ['Izar', 'waist'], ['Arcturus', 'knee'], ['Muphrid', 'shin'], ['τ Boo', 'shin'], ['ζ Boo', 'calf'], ['Xuange', 'elbow'], ['κ² Boo', 'hand'], ['θ Boo', 'hand']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const L = frame([-1.6, -6.8], s('Nekkar'));
    const P = (pts) => pts.map(([f, u, ...rest]) => [...L(f, u), ...rest]);
    const hatch = L.angle;
    const zet = L.back(s('ζ Boo')), arc = L.back(s('Arcturus')), xua = L.back(s('Xuange'));

    // Cloak, thrown out behind by the run, a long rippling sweep.
    blob(P([[-2.0, 14.0], [-6.4, 14.4], [-11.0, 13.8], [-15.4, 13.2], [-19.0, 14.4], [-22.8, 14.2, 'c'], [-20.2, 11.8], [-20.8, 9.6], [-23.6, 7.4, 'c'], [-19.4, 7.2], [-16.6, 5.4], [-17.2, 2.6, 'c'], [-13.6, 4.2], [-10.6, 4.0], [-7.2, 6.2], [-4.6, 9.2], [-2.6, 11.8]]), {
      round: 1.5, tone: 1.08, hatch: hatch + 18, shadow: 0, band: 0.7,
      creases: [
        { pts: P([[-3.4, 12.8], [-9.0, 12.4], [-15.0, 11.4], [-20.0, 12.6]]), w: 0.22, depth: 0.32 }, { pts: P([[-4.4, 11.2], [-9.4, 9.8], [-14.6, 8.4], [-20.0, 8.0]]), w: 0.22, depth: 0.32 },
        { pts: P([[-6.0, 9.0], [-10.4, 6.6], [-14.2, 5.6], [-16.6, 3.4]]), w: 0.2, depth: 0.28 }, { pts: P([[-8.0, 13.4], [-13.0, 12.6], [-18.0, 13.0]]), w: 0.14, depth: 0.2 },
      ],
      bumps: [{ at: L(-12.0, 10.6), r: [4.0, 1.4], angle: hatch + 8, h: 0.4 }, { at: L(-13.0, 7.2), r: [3.4, 1.2], angle: hatch + 16, h: 0.36 }],
    });

    // Trailing leg, pushing off behind him through zeta.
    limb(P([[-1.8, -0.6, 2.9], [-3.4, -4.0, 2.5], [-4.4, -7.4, 1.76]]), {
      tone: 0.96, hatch: hatch + 74, shadow: 0.4, creases: [{ pts: P([[-0.4, -3.4], [-2.2, -5.8], [-3.2, -8.0]]), w: 0.18, depth: 0.26 }],
      bumps: [{ at: L(-3.0, -3.8), r: [1.4, 2.8], h: 0.46 }],
    });
    limb(P([[-4.4, -7.4, 1.6], [zet[0] - 0.4, zet[1] + 1.4, 1.7], [zet[0] - 1.2, zet[1] - 1.8, 1.12], [zet[0] - 2.0, zet[1] - 3.4, 0.84]]), {
      tone: 0.94, hatch: hatch + 78, shadow: 0.42, creases: [{ pts: P([[-3.8, -9.8], [-4.8, -12.0], [-6.0, -14.0]]), w: 0.13, depth: 0.2 }],
      bumps: [{ at: L(-4.4, -7.4), r: [1.0, 1.0], h: 0.3 }, { at: L(zet[0] - 0.6, zet[1] + 1.2), r: [1.0, 2.0], h: 0.3 }],
    });
    // Boot, up on the toe.
    blob(P([[-8.6, -13.6], [-6.4, -13.8], [-5.8, -15.4], [-5.2, -16.8], [-3.4, -17.8], [-3.4, -18.6], [-6.2, -18.4], [-8.6, -16.4]]), {
      round: 0.6, tone: 1.06, hatch: hatch + 14, shadow: 0.42,
      creases: [{ pts: P([[-8.2, -14.2], [-7.0, -14.6], [-6.0, -14.4]]), w: 0.07, depth: 0.1 }, { pts: P([[-8.0, -15.0], [-6.8, -15.4], [-5.8, -15.2]]), w: 0.07, depth: 0.1 }, { pts: P([[-7.6, -15.9], [-6.6, -16.2], [-5.6, -16.0]]), w: 0.07, depth: 0.1 }],
    });

    // Driving leg: a hard short thigh to the knee on Arcturus, the shin kicked out to Muphrid and tau.
    limb(P([[arc[0], arc[1], 1.66], [4.8, -8.9, 1.72], [7.0, -9.9, 1.22], [8.9, -11.2, 0.84]]), {
      tone: 1.04, hatch: hatch + 26, shadow: 0.46, creases: [{ pts: P([[3.2, -10.2], [5.6, -11.2], [8.0, -12.2]]), w: 0.14, depth: 0.2 }, { pts: P([[4.2, -7.6], [6.2, -8.6], [8.4, -10.0]]), w: 0.12, depth: 0.14 }],
      bumps: [{ at: L(4.6, -9.0), r: [2.0, 1.1], angle: hatch + 26, h: 0.34 }],
    });
    blob(P([[8.4, -9.6], [10.2, -10.0], [10.9, -11.0], [11.6, -12.8], [12.2, -14.0], [11.4, -14.6], [9.0, -13.8], [7.8, -11.8]]), {
      round: 0.6, tone: 1.12, hatch: hatch + 60, shadow: 0.42,
      creases: [{ pts: P([[8.6, -10.3], [9.4, -11.2], [10.8, -11.4]]), w: 0.07, depth: 0.1 }, { pts: P([[8.2, -11.2], [9.0, -12.0], [10.8, -12.2]]), w: 0.07, depth: 0.1 }, { pts: P([[8.6, -12.2], [9.6, -12.8], [10.8, -13.0]]), w: 0.07, depth: 0.1 }],
    });
    limb(P([[1.8, -0.4, 3.0], [2.6, -4.0, 2.6], [arc[0] + 0.3, arc[1] - 0.2, 1.8]]), {
      tone: 1.12, hatch: hatch + 96, shadow: 0.54, creases: [{ pts: P([[0.4, -3.2], [0.8, -5.6], [1.0, -7.4]]), w: 0.18, depth: 0.26 }, { pts: P([[4.8, -3.0], [4.6, -5.4], [4.0, -7.2]]), w: 0.15, depth: 0.2 }],
      bumps: [{ at: L(2.6, -4.0), r: [1.6, 2.6], h: 0.5 }, { at: L(arc[0] + 0.3, arc[1] - 0.2), r: [1.14, 1.14], h: 0.42 }],
    });

    // Tunic, belted at rho and Izar, skirt flaring and flicked back by the stride.
    blob(P([[-5.6, 12.2], [-2.4, 13.2], [1.2, 13.4], [4.6, 12.8], [5.8, 11.0], [4.6, 8.4], [3.4, 5.6], [3.2, 3.2], [4.8, 0.4], [6.2, -3.4, 'c'], [4.2, -3.0], [2.2, -5.2, 'c'], [0.6, -3.6], [-1.6, -5.4, 'c'], [-3.0, -3.6], [-5.8, -5.8, 'c'], [-6.8, -2.4], [-5.4, 0.6], [-3.6, 3.4], [-3.4, 5.6], [-4.4, 8.4], [-6.0, 10.6]]), {
      round: 2.4, tone: 1.36, hatch: hatch + 74, shadow: 0.62, band: 0.8,
      creases: [
        { pts: P([[-2.4, 12.4], [-1.0, 8.2], [-0.8, 4.0]]), w: 0.2, depth: 0.28 }, { pts: P([[2.4, 12.6], [1.6, 8.2], [1.0, 4.0]]), w: 0.2, depth: 0.28 }, { pts: P([[4.6, 11.4], [3.2, 8.2], [2.4, 4.0]]), w: 0.16, depth: 0.22 }, { pts: P([[-4.6, 11.0], [-3.0, 7.8], [-2.4, 4.0]]), w: 0.16, depth: 0.22 },
        { pts: P([[-2.2, 2.2], [-3.4, -0.6], [-5.0, -4.4]]), w: 0.2, depth: 0.28 }, { pts: P([[-0.6, 2.2], [-0.8, -1.4], [-1.4, -4.2]]), w: 0.2, depth: 0.28 }, { pts: P([[0.8, 2.2], [1.2, -0.8], [2.0, -4.0]]), w: 0.2, depth: 0.28 }, { pts: P([[2.2, 2.2], [3.2, -0.4], [4.8, -2.6]]), w: 0.18, depth: 0.24 },
      ],
      bumps: [{ at: L(-1.8, 9.6), r: [2.4, 2.0], h: 0.5 }, { at: L(2.6, 9.6), r: [2.4, 2.0], h: 0.5 }, { at: L(2.8, -1.4), r: [1.6, 2.2], h: 0.3 }, { at: L(-2.8, -1.4), r: [1.6, 2.2], h: 0.3 }],
    });
    // Rope belt, knotted, with its end flying.
    limb(P([[-3.7, 3.7, 0.3], [-0.2, 3.1, 0.34], [3.4, 3.5, 0.3]]), { tone: 1.3, hatch: hatch + 86, shadow: 0.4, melt: 0, creases: [-2.6, -1.4, -0.2, 1.0, 2.2].map((f) => ({ pts: P([[f - 0.2, 3.0], [f + 0.2, 3.8]]), w: 0.05, depth: 0.08 })) });
    limb(P([[-0.4, 3.0, 0.2], [-1.6, 1.6, 0.16], [-3.2, 1.2, 0.14], [-4.8, 0.0, 0.08]]), { tone: 1.26, shadow: 0.34, melt: 0 });
    // Shoulder clasp holding the cloak.
    limb(P([[-5.4, 12.2, 0.36], [-2.0, 12.0, 0.26], [1.0, 13.0, 0.24]]), { tone: 1.2, hatch: hatch, shadow: 0.3, melt: 0 });

    // Trailing arm flung back to balance, down from delta.
    limb(P([[-5.2, 10.8, 2.0], [-8.0, 8.4, 1.56], [-10.2, 6.2, 1.2]]), {
      tone: 1.14, hatch: hatch + 46, shadow: 0.55, creases: [{ pts: P([[-4.8, 8.6], [-7.0, 6.6], [-9.2, 4.8]]), w: 0.13, depth: 0.2 }],
      bumps: [{ at: L(-5.8, 10.2), r: [1.5, 1.5], h: 0.46 }, { at: L(-8.0, 8.2), r: [1.8, 0.9], angle: hatch + 44, h: 0.3 }],
    });
    limb(P([[-10.2, 6.2, 1.14], [-12.6, 4.9, 1.14], [-14.8, 4.0, 0.72]]), {
      tone: 1.1, hatch: hatch + 26, shadow: 0.5, creases: [{ pts: P([[-10.4, 4.8], [-12.4, 3.9], [-14.4, 3.4]]), w: 0.1, depth: 0.15 }],
      bumps: [{ at: L(-10.2, 6.2), r: [0.7, 0.7], h: 0.26 }, { at: L(-12.2, 5.2), r: [1.3, 0.8], h: 0.26 }],
    });
    blob(P([[-14.6, 4.9], [-15.6, 4.8], [-17.8, 5.0, 'c'], [-16.6, 4.2], [-18.0, 3.8, 'c'], [-16.6, 3.4], [-17.2, 2.4, 'c'], [-15.6, 2.8], [-14.6, 3.0]]), { round: 0.3, tone: 1.3, hatch: hatch + 20, shadow: 0.4 });

    // The crook: a long ash staff through the raised fist, its hook the warm note.
    const a = [15.8, 8.4], b = [9.4, 28.8];
    limb(P([[...a, 0.22], [11.1, 23.4, 0.28], [...b, 0.24]]), { tone: 1.3, hatch: hatch + 72, shadow: 0.4, melt: 0, creases: [{ pts: P([[14.8, 12.0], [12.6, 18.4], [10.4, 25.6]]), w: 0.06, depth: 0.08 }] });
    limb(P([[b[0] - 0.2, b[1] - 1.4, 0.24], [...b, 0.3], [b[0] - 0.6, b[1] + 2.0, 0.28], [b[0] - 2.4, b[1] + 3.4, 0.25], [b[0] - 4.4, b[1] + 2.8, 0.22], [b[0] - 4.9, b[1] + 1.0, 0.18], [b[0] - 3.8, b[1] + 0.2, 0.05]]), { tone: 1.42, warm: 0.62, hatch: hatch + 50, shadow: 0.3, melt: 0 });

    // Raised arm: Seginus to the elbow on Xuange, the forearm up to the fist on kappa and theta.
    limb(P([[4.6, 11.4, 2.0], [7.4, 15.2, 1.6], [xua[0], xua[1], 1.2]]), {
      tone: 1.2, hatch: hatch + 54, shadow: 0.6, creases: [{ pts: P([[6.4, 11.8], [8.4, 14.6], [10.4, 17.2]]), w: 0.13, depth: 0.2 }, { pts: P([[4.4, 13.8], [6.4, 16.4], [8.4, 18.6]]), w: 0.12, depth: 0.16 }],
      bumps: [{ at: L(5.2, 11.8), r: [1.6, 1.6], h: 0.5 }, { at: L(7.4, 15.4), r: [0.9, 1.8], angle: hatch + 36, h: 0.32 }],
    });
    limb(P([[xua[0], xua[1], 1.14], [10.6, 20.8, 1.16], [11.0, 22.6, 0.74]]), {
      tone: 1.18, hatch: hatch + 84, shadow: 0.5, creases: [{ pts: P([[9.2, 19.8], [9.8, 21.2], [10.4, 22.6]]), w: 0.1, depth: 0.15 }],
      bumps: [{ at: L(xua[0], xua[1]), r: [0.7, 0.7], h: 0.26 }, { at: L(10.4, 20.4), r: [0.8, 1.2], h: 0.26 }],
    });
    blob(P([[9.5, 22.8], [9.4, 24.2], [10.2, 25.4], [11.8, 25.4], [12.8, 24.6], [12.8, 23.2], [11.4, 22.3]]), {
      round: 0.56, tone: 1.42, hatch: hatch + 30, shadow: 0.55,
      creases: [{ pts: P([[9.6, 24.4], [11.1, 24.3], [12.7, 24.4]]), w: 0.07, depth: 0.13 }, { pts: P([[9.5, 23.6], [11.1, 23.5], [12.7, 23.6]]), w: 0.07, depth: 0.13 }, { pts: P([[10.2, 25.0], [11.3, 25.0], [12.4, 25.1]]), w: 0.07, depth: 0.13 }],
    });

    // Neck, and a head in profile looking up the crook.
    limb(P([[0.0, 12.6, 1.5], [0.3, 14.0, 1.26]]), { tone: 1.14, hatch: hatch + 88, shadow: 0.5 });
    const c = [0.4, 16.0], k = 1.5;
    const H = (f, u) => [c[0] + f * k, c[1] + u * k];
    const Q = (pts) => P(pts.map(([f, u, ...r]) => [...H(f, u), ...r]));
    // Hair escaping the cap.
    blob(Q([[-0.3, 0.6], [-1.3, 0.6], [-1.9, -0.4], [-1.8, -1.5], [-1.1, -1.5], [-0.7, -0.5]]), { round: 0.5, tone: 0.96, hatch: hatch + 60, shadow: 0.34, relief: 0.3, edge: 0.6 });
    for (const pts of [[[-1.0, 0.6], [-1.7, 0.0], [-1.9, -1.3]], [[-0.7, 0.2], [-1.3, -0.5], [-1.4, -1.4]], [[-1.3, 0.5], [-2.0, -0.3], [-2.2, -1.1]]]) line(Q(pts), { w: 0.14, v: 0.7 });
    blob(Q([[-1.2, -0.8], [-1.5, 0.5], [-0.8, 1.6], [0.4, 1.7], [1.2, 1.0], [1.45, 0.2], [1.75, -0.2], [1.35, -0.5], [1.35, -1.0], [1.1, -1.3], [0.7, -1.85], [0.0, -1.9], [-0.7, -1.5]]), {
      round: 1.4, tone: 1.46, hatch: hatch + 40, shadow: 0.55, spacing: 0.86,
      creases: [
        { pts: Q([[0.5, 0.3], [0.95, 0.4], [1.3, 0.22]]), w: 0.13, depth: 0.28 }, { pts: Q([[0.6, -0.02], [0.96, 0.06], [1.26, -0.04]]), w: 0.08, depth: 0.14 },
        { pts: Q([[0.9, -0.95], [1.22, -0.9]]), w: 0.07, depth: 0.14 }, { pts: Q([[1.3, -0.28], [1.5, -0.34], [1.4, -0.52]]), w: 0.05, depth: 0.1 },
      ],
      bumps: [{ at: H(1.32, -0.2), r: [0.5, 0.7], h: 0.24 }, { at: H(0.2, -0.3), r: [0.9, 0.7], h: 0.2 }],
    });
    line(Q([[0.72, 0.17], [0.98, 0.22], [1.2, 0.14]]), { w: 0.08, v: 0.95 });
    for (const pts of [[[0.5, -1.0], [0.5, -1.6], [0.7, -2.0]], [[0.8, -1.2], [0.95, -1.6], [1.1, -1.9]], [[0.2, -1.1], [0.15, -1.7], [0.3, -2.1]], [[-0.15, -1.0], [-0.2, -1.5], [-0.1, -1.9]], [[1.05, -1.25], [1.2, -1.5], [1.32, -1.7]], [[-0.5, -0.9], [-0.56, -1.3], [-0.45, -1.6]]]) line(Q(pts), { w: 0.08, v: 0.62 });
    // The cap, soft and pointed, its tip tipped forward.
    blob(Q([[1.34, 0.72], [0.6, 0.86], [-0.7, 0.72], [-1.56, 0.38], [-1.6, 1.3], [-1.0, 2.2], [0.0, 3.0], [1.2, 3.3], [2.4, 2.9, 'c'], [1.7, 2.3], [1.5, 1.6]]), {
      round: 0.8, tone: 1.38, hatch: hatch + 24, shadow: 0.5, band: 0.4,
      creases: [{ pts: Q([[-1.5, 0.76], [0.0, 1.1], [1.36, 1.0]]), w: 0.13, depth: 0.2 }, { pts: Q([[-0.8, 1.2], [0.0, 2.0], [1.4, 2.6]]), w: 0.12, depth: 0.18 }, { pts: Q([[0.6, 1.2], [0.9, 1.9], [1.8, 2.6]]), w: 0.1, depth: 0.14 }],
    });
  },
};
