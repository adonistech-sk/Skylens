// The Kneeler, Hercules down on one knee in a fierce lunge, club swung back, the apples of the
// Hesperides held out before him. Drawn upright in his own frame, he hangs head-down in the
// north-up sky, as the old name Engonasin always had him. Rasalgethi is his brow, Kornephoros and
// Sarin his shoulders, the Keystone his body, tau the grounded knee, theta the forward knee, and
// mu, xi and omicron run along the arm to the hand. The warm note is the golden apples.
import { frame, paw, fur } from '../kit.mjs';

export default {
  tier: 'extended',
  subject: 'The Kneeler',
  pixels: 1100,
  anchors: [['Rasalgethi', 'brow'], ['Kornephoros', 'shoulder'], ['Sarin', 'shoulder'], ['γ Her', 'upper arm'], ['ζ Her', 'ribs'], ['ε Her', 'belly'], ['π Her', 'hip'], ['η Her', 'hip'], ['ρ Her', 'thigh'], ['θ Her', 'knee'], ['σ Her', 'thigh'], ['τ Her', 'knee'], ['φ Her', 'calf'], ['χ Her', 'ankle'], ['μ Her', 'elbow'], ['ξ Her', 'wrist'], ['ο Her', 'hand']],
  draw({ s, E }) {
    const { blob, limb, line, strands } = E;
    const L = frame([0.5, 4.9], [1.8, -9.7]);
    const P = (pts) => pts.map(([f, u, ...rest]) => [...L(f, u), ...rest]);
    const hatch = L.angle;

    // The grounded leg: thigh down to the knee on tau, the shin thrown out behind through phi and chi.
    limb(P([[-15.0, -3.6, 0.8], [-13.0, -4.8, 1.2], [-9.9, -7.0, 1.8], [-7.7, -8.4, 1.6]]), {
      tone: 0.96, hatch: hatch + 54, shadow: 0, creases: [{ pts: P([[-9.0, -5.6], [-11.0, -4.4], [-13.4, -3.6]]), w: 0.14, depth: 0.2 }, { pts: P([[-11.2, -7.6], [-12.6, -6.4]]), w: 0.12, depth: 0.14 }],
      bumps: [{ at: L(-10.0, -6.8), r: [2.0, 1.1], angle: hatch + 36, h: 0.36 }],
    });
    blob(P([[-14.6, -2.6], [-16.4, -2.2], [-18.4, -2.8], [-20.2, -4.4], [-19.4, -5.0], [-17.4, -4.6], [-15.2, -4.6]]), { round: 0.5, tone: 1.02, hatch: hatch + 30, shadow: 0.4, creases: [{ pts: P([[-19.6, -4.4], [-19.0, -3.9]]), w: 0.05, depth: 0.08 }, { pts: P([[-19.0, -4.7], [-18.4, -4.2]]), w: 0.05, depth: 0.08 }] });
    limb(P([[-3.0, -0.6, 3.3], [-5.0, -4.2, 2.8], [-7.6, -8.0, 1.86]]), {
      tone: 1.04, hatch: hatch + 58, shadow: 0.5, creases: [{ pts: P([[-1.8, -3.6], [-3.6, -6.2], [-5.8, -8.8]]), w: 0.2, depth: 0.28 }, { pts: P([[-6.0, -2.2], [-7.4, -4.6], [-9.0, -6.8]]), w: 0.16, depth: 0.2 }],
      bumps: [{ at: L(-4.8, -3.6), r: [1.6, 3.2], angle: hatch + 34, h: 0.5 }, { at: L(-7.8, -8.2), r: [1.1, 1.1], h: 0.4 }],
    });

    // The forward leg, thigh flung out level to theta, the shin straight down to a planted foot.
    limb(P([[11.3, -1.2, 1.76], [11.9, -3.6, 1.86], [11.6, -7.0, 1.24], [11.1, -9.6, 0.9]]), {
      tone: 1.02, hatch: hatch + 88, shadow: 0.4, creases: [{ pts: P([[10.4, -3.2], [10.4, -5.6], [10.4, -8.4]]), w: 0.14, depth: 0.2 }, { pts: P([[13.0, -3.2], [12.8, -5.6], [12.0, -8.2]]), w: 0.13, depth: 0.16 }],
      bumps: [{ at: L(12.1, -3.8), r: [1.1, 2.0], h: 0.34 }],
    });
    blob(P([[10.2, -9.2], [12.0, -9.4], [12.8, -10.2], [14.4, -11.0], [15.8, -11.5], [15.4, -12.2], [11.0, -12.1], [10.0, -11.0]]), { round: 0.5, tone: 1.06, hatch: hatch + 10, shadow: 0.4, creases: [{ pts: P([[14.8, -12.0], [14.2, -11.3]]), w: 0.05, depth: 0.08 }, { pts: P([[14.0, -12.0], [13.4, -11.3]]), w: 0.05, depth: 0.08 }] });
    limb(P([[3.2, 0.0, 3.4], [7.2, 0.4, 2.8], [11.2, -0.9, 1.92]]), {
      tone: 1.12, hatch: hatch + 6, shadow: 0.55, creases: [{ pts: P([[5.0, -2.4], [8.0, -2.0], [10.4, -2.6]]), w: 0.2, depth: 0.28 }, { pts: P([[5.0, 2.2], [8.0, 2.2], [10.6, 0.6]]), w: 0.16, depth: 0.2 }],
      bumps: [{ at: L(7.0, 0.2), r: [3.4, 1.6], h: 0.54 }, { at: L(11.4, -1.0), r: [1.2, 1.2], h: 0.4 }],
    });

    // Torso, twisting: the club shoulder high, the bough shoulder dropped and driving forward.
    blob(P([[-7.2, 16.2], [-5.0, 17.6], [-1.6, 17.2], [2.0, 16.0], [5.6, 14.2], [6.6, 12.4], [5.4, 9.6], [4.2, 6.8], [4.8, 3.6], [5.0, 0.6], [0.4, -1.4], [-4.6, -0.8], [-4.8, 3.0], [-4.4, 6.4], [-5.4, 10.0], [-7.8, 13.6]]), {
      round: 2.6, tone: 1.42, hatch: hatch + 30, shadow: 0.6, band: 0.9,
      creases: [
        { pts: P([[-1.2, 16.6], [-0.4, 12.6], [-0.2, 9.8]]), w: 0.22, depth: 0.34 },
        { pts: P([[-6.0, 12.8], [-3.4, 10.0], [-0.2, 9.8]]), w: 0.24, depth: 0.36 }, { pts: P([[5.2, 12.0], [2.8, 9.8], [-0.2, 9.8]]), w: 0.24, depth: 0.36 },
        { pts: P([[-0.2, 9.4], [0.2, 5.6], [0.4, 0.8]]), w: 0.16, depth: 0.26 },
        { pts: P([[-3.2, 7.8], [0.1, 7.6], [3.4, 7.2]]), w: 0.13, depth: 0.2 }, { pts: P([[-3.2, 5.4], [0.3, 5.2], [3.2, 4.8]]), w: 0.13, depth: 0.2 }, { pts: P([[-3.2, 3.2], [0.4, 3.0], [3.4, 2.6]]), w: 0.13, depth: 0.18 },
        { pts: P([[-4.6, 8.8], [-3.8, 5.0], [-3.2, 1.6]]), w: 0.16, depth: 0.22 }, { pts: P([[4.0, 8.4], [3.4, 5.0], [3.6, 1.6]]), w: 0.16, depth: 0.22 },
        { pts: P([[-5.6, 10.6], [-4.2, 9.8]]), w: 0.1, depth: 0.14 }, { pts: P([[-5.2, 9.4], [-4.2, 8.8]]), w: 0.1, depth: 0.14 }, { pts: P([[4.8, 10.0], [3.8, 9.2]]), w: 0.1, depth: 0.14 },
      ],
      bumps: [{ at: L(-3.2, 13.2), r: [3.0, 2.3], h: 0.68 }, { at: L(2.4, 12.6), r: [2.8, 2.2], h: 0.66 }, ...[[-1.6, 6.6], [1.8, 6.4], [-1.5, 4.3], [1.8, 4.0], [-1.4, 2.2], [1.9, 1.9]].map(([f, u]) => ({ at: L(f, u), r: [1.3, 1.0], h: 0.24 }))],
    });

    // The lion's pelt knotted at the hips, the first labour's prize, fur combed by hand.
    const pelt = [[-5.0, 3.0], [-1.0, 2.2], [3.0, 2.2], [5.4, 3.2], [6.8, 0.8], [8.0, -2.2, 'c'], [6.0, -2.0], [4.2, -3.6, 'c'], [2.6, -2.8], [0.6, -5.4, 'c'], [-1.4, -3.4], [-3.2, -5.2, 'c'], [-4.0, -3.0], [-6.6, -3.2, 'c'], [-6.2, 0.2]];
    blob(P(pelt), { round: 1.1, tone: 1.06, hatch: hatch + 80, shadow: 0.6, band: 0.5, creases: [{ pts: P([[-3.6, 2.0], [-3.8, -0.6], [-3.4, -3.8]]), w: 0.2, depth: 0.26 }, { pts: P([[0.0, 1.8], [0.6, -1.0], [0.6, -4.2]]), w: 0.2, depth: 0.26 }, { pts: P([[3.2, 1.8], [4.2, -0.4], [4.4, -2.4]]), w: 0.18, depth: 0.22 }] });
    fur(E, P(pelt.map((p) => p.slice(0, 2))), { n: 2200, angle: 95, len: 1.0, jitter: 14, v: 0.66, lit: 0.26, seed: 11, w: 0.03, flow: (x) => (x - 0.5) * 2 });
    // The lion's forepaw, hanging at the hip, and its tail.
    limb(P([[5.0, 2.6, 0.5], [7.6, 1.0, 0.44], [9.0, 2.4, 0.3], [9.2, 3.8, 0.14]]), { tone: 1.08, hatch: hatch + 40, shadow: 0.4, melt: 0 });
    strands(P([[9.0, 3.2], [9.3, 4.6]]), { n: 80, angle: 275, len: 1.1, jitter: 16, v: 0.66, spread: 0.3, seed: 15, w: 0.03 });
    limb(P([[-5.2, 2.0, 0.84], [-6.4, -1.2, 0.7], [-6.6, -3.4, 0.56]]), { tone: 1.18, hatch: hatch + 76, shadow: 0.5 });
    paw(E, L(-6.6, -3.8), 1.2, 95, { tone: 1.16 });

    // Club, behind the fist: a root-end cudgel thick with knots, swung back beyond his head.
    const club0 = [-5.2, 25.4], club1 = [-15.6, 34.4];
    const Cl = (t, n = 0) => { const x = club0[0] + (club1[0] - club0[0]) * t, y = club0[1] + (club1[1] - club0[1]) * t, l = Math.hypot(club1[0] - club0[0], club1[1] - club0[1]); return [x + ((club1[1] - club0[1]) / l) * n, y - ((club1[0] - club0[0]) / l) * n]; };
    limb(P([[...Cl(0), 0.46], [...Cl(0.2), 0.52], [...Cl(0.45, 0.2), 0.74], [...Cl(0.7, -0.14), 1.02], [...Cl(0.92, 0.1), 1.4], [...Cl(1.02), 1.1]]), {
      tone: 1.26, hatch: hatch + 34, shadow: 0.5, melt: 0, band: 0.5,
      creases: [{ pts: P([Cl(0.32, 0.2), Cl(0.6, -0.1), Cl(0.86, 0.3)]), w: 0.12, depth: 0.18 }, { pts: P([Cl(0.56, 0.6), Cl(0.74, 0.5), Cl(0.96, 0.76)]), w: 0.1, depth: 0.14 }, { pts: P([Cl(0.7, -0.8), Cl(0.86, -0.7), Cl(0.98, -0.9)]), w: 0.1, depth: 0.14 }],
      bumps: [{ at: L(...Cl(0.5, 0.56)), r: [0.5, 0.5], h: 0.4 }, { at: L(...Cl(0.66, -0.76)), r: [0.5, 0.5], h: 0.4 }, { at: L(...Cl(0.82, 0.9)), r: [0.56, 0.56], h: 0.44 }, { at: L(...Cl(0.92, -1.0)), r: [0.56, 0.56], h: 0.44 }, { at: L(...Cl(1.0, 0.5)), r: [0.5, 0.5], h: 0.4 }],
    });

    // Club arm: heaving shoulder through gamma, elbow high, the forearm thrust up to the fist.
    limb(P([[-5.6, 16.0, 2.5], [-7.4, 19.1, 2.0], [-9.4, 21.9, 1.46]]), {
      tone: 1.26, hatch: hatch + 58, shadow: 0.6, creases: [{ pts: P([[-7.8, 16.2], [-9.4, 19.0], [-10.4, 21.2]]), w: 0.14, depth: 0.2 }, { pts: P([[-4.4, 18.6], [-6.2, 20.8], [-8.0, 22.2]]), w: 0.14, depth: 0.2 }],
      bumps: [{ at: L(-6.0, 16.8), r: [1.9, 1.9], h: 0.6 }, { at: L(-7.6, 19.4), r: [1.1, 2.0], angle: hatch + 34, h: 0.4 }],
    });
    limb(P([[-9.4, 21.9, 1.4], [-8.5, 24.3, 1.5], [-7.9, 26.8, 0.96]]), {
      tone: 1.22, hatch: hatch + 80, shadow: 0.5, creases: [{ pts: P([[-9.6, 23.2], [-9.0, 25.0], [-8.6, 26.6]]), w: 0.12, depth: 0.18 }],
      bumps: [{ at: L(-9.4, 21.9), r: [0.8, 0.8], h: 0.3 }, { at: L(-8.6, 24.0), r: [1.0, 1.5], h: 0.32 }],
    });
    blob(P([[-9.2, 26.6], [-9.6, 28.0], [-8.8, 29.6], [-7.2, 29.8], [-6.0, 28.8], [-6.0, 27.2], [-7.2, 26.4]]), {
      round: 0.7, tone: 1.4, hatch: hatch + 30, shadow: 0.6,
      creases: [{ pts: P([[-8.6, 29.6], [-8.1, 28.4], [-7.0, 27.2]]), w: 0.08, depth: 0.14 }, { pts: P([[-7.9, 29.9], [-7.3, 28.7], [-6.2, 27.6]]), w: 0.08, depth: 0.14 }, { pts: P([[-9.2, 28.8], [-8.8, 27.8], [-7.8, 26.8]]), w: 0.08, depth: 0.14 }],
    });

    // The bough, with its leaves and three small golden apples.
    limb(P([[15.0, 4.2, 0.17], [16.0, 6.4, 0.2], [18.4, 9.2, 0.15], [21.6, 11.0, 0.05]]), { tone: 1.2, hatch: hatch + 30, shadow: 0.3, melt: 0 });
    const leaf = (f, u, a, l) => { const t = (a * Math.PI) / 180, c = Math.cos(t), n = Math.sin(t), Q = (x, y) => [f + c * x - n * y, u + n * x + c * y]; blob(P([[...Q(0, 0), 'c'], Q(l * 0.4, l * 0.26), [...Q(l, 0), 'c'], Q(l * 0.4, -l * 0.26)]), { round: 0.22, tone: 1.24, hatch: hatch + a, shadow: 0.3, band: 0.2, creases: [{ pts: P([Q(0.1, 0), Q(l * 0.5, 0), Q(l * 0.9, 0)]), w: 0.05, depth: 0.09 }] }); };
    for (const [f, u, a, l] of [[17.4, 8.1, 110, 2.1], [17.8, 8.6, 20, 2.3], [19.4, 9.9, 104, 2.2], [20.0, 10.2, 12, 2.2], [21.4, 10.9, 36, 2.0], [16.4, 6.9, 150, 1.8], [18.6, 9.3, -40, 1.8]]) leaf(f, u, a, l);
    for (const [f, u, r] of [[18.0, 7.2, 0.86], [20.4, 8.9, 0.8], [17.0, 10.6, 0.8]]) {
      limb(P([[f - 0.1, u + r, 0.05], [f - 0.3, u + r + 0.5, 0.05]]), { tone: 1, shadow: 0, melt: 0 });
      blob(P([[f - r, u], [f - r * 0.7, u + r * 0.74], [f, u + r * 0.86], [f + r * 0.7, u + r * 0.74], [f + r, u], [f + r * 0.6, u - r * 0.84], [f - r * 0.6, u - r * 0.84]]), { round: r * 0.86, tone: 1.5, warm: 0.84, hatch: hatch + 30, shadow: 0.4, creases: [{ pts: P([[f - r * 0.26, u + r * 0.72], [f, u + r * 0.5], [f + r * 0.26, u + r * 0.72]]), w: 0.06, depth: 0.14 }] });
    }

    // Bough arm, driving out from the dropped shoulder through mu and xi.
    limb(P([[4.6, 12.8, 2.3], [8.0, 10.8, 1.8], [11.2, 8.7, 1.32]]), {
      tone: 1.26, hatch: hatch + 30, shadow: 0.6, creases: [{ pts: P([[5.4, 10.0], [8.0, 8.8], [10.4, 7.6]]), w: 0.15, depth: 0.22 }, { pts: P([[6.4, 13.4], [9.0, 12.0], [11.8, 10.0]]), w: 0.12, depth: 0.14 }],
      bumps: [{ at: L(5.6, 12.6), r: [1.9, 1.8], h: 0.56 }, { at: L(8.2, 10.6), r: [2.0, 1.1], angle: hatch + 58, h: 0.38 }],
    });
    limb(P([[11.2, 8.7, 1.28], [13.4, 7.0, 1.24], [15.0, 6.2, 0.8]]), {
      tone: 1.22, hatch: hatch + 36, shadow: 0.5, creases: [{ pts: P([[11.4, 7.4], [13.0, 6.2], [14.6, 5.6]]), w: 0.12, depth: 0.18 }],
      bumps: [{ at: L(11.2, 8.7), r: [0.8, 0.8], h: 0.3 }, { at: L(12.8, 7.6), r: [1.4, 0.9], h: 0.3 }],
    });
    blob(P([[14.6, 7.2], [16.2, 7.6], [17.0, 6.4], [16.8, 5.0], [15.6, 4.6], [14.4, 5.2]]), {
      round: 0.6, tone: 1.4, hatch: hatch + 20, shadow: 0.55,
      creases: [{ pts: P([[15.0, 7.0], [15.9, 6.2], [16.8, 6.0]]), w: 0.07, depth: 0.13 }, { pts: P([[14.8, 6.3], [15.8, 5.6], [16.8, 5.4]]), w: 0.07, depth: 0.13 }, { pts: P([[14.8, 5.5], [15.6, 5.0], [16.3, 4.9]]), w: 0.07, depth: 0.13 }],
    });

    // Neck, a bull's, thrust toward the bough.
    limb(P([[1.6, 15.2, 2.9], [3.4, 17.6, 2.3], [4.2, 19.2, 2.0]]), { tone: 1.2, hatch: hatch + 70, shadow: 0.5, creases: [{ pts: P([[0.4, 17.0], [2.0, 18.6], [3.2, 20.0]]), w: 0.12, depth: 0.16 }] });

    // Head turned along the arm, the brow on Rasalgethi. Short curled hair and beard.
    const c = [5.2, 21.8], k = 1.86;
    const H = (f, u) => [c[0] + f * k, c[1] + u * k];
    const Q = (pts) => P(pts.map(([f, u, ...r]) => [...H(f, u), ...r]));
    blob(Q([[1.0, 1.5], [0.2, 2.2], [-1.0, 2.0], [-1.9, 0.9], [-1.9, -0.8], [-1.0, -1.7], [-0.2, -0.8], [0.2, 0.6]]), { round: 0.7, tone: 0.9, hatch: hatch + 70, shadow: 0.34, relief: 0.3, edge: 0.6 });
    blob(Q([[1.3, -1.0], [1.2, -1.8], [0.5, -2.4], [-0.3, -2.3], [-0.9, -1.8], [-0.6, -1.0], [0.4, -0.8]]), { round: 0.6, tone: 0.92, hatch: hatch + 10, shadow: 0.34, relief: 0.3, edge: 0.6 });
    blob(Q([[-1.2, -0.8], [-1.5, 0.5], [-0.8, 1.6], [0.4, 1.7], [1.2, 1.0], [1.45, 0.2], [1.75, -0.2], [1.35, -0.5], [1.35, -1.0], [1.1, -1.3], [0.7, -1.5], [0.0, -1.4], [-0.7, -1.2]]), {
      round: 1.5, tone: 1.42, hatch: hatch + 40, shadow: 0.55, spacing: 0.86,
      creases: [
        { pts: Q([[0.5, 0.32], [0.95, 0.42], [1.3, 0.24]]), w: 0.13, depth: 0.28 }, { pts: Q([[0.6, -0.02], [0.96, 0.06], [1.26, -0.04]]), w: 0.08, depth: 0.14 },
        { pts: Q([[0.9, -0.95], [1.2, -0.9]]), w: 0.07, depth: 0.14 }, { pts: Q([[1.3, -0.28], [1.5, -0.34], [1.4, -0.52]]), w: 0.05, depth: 0.1 },
      ],
      bumps: [{ at: H(1.32, -0.2), r: [0.5, 0.7], h: 0.24 }, { at: H(0.2, -0.3), r: [0.9, 0.7], h: 0.2 }],
    });
    line(Q([[0.7, 0.2], [0.98, 0.26], [1.2, 0.18]]), { w: 0.1, v: 0.95 });
    line(Q([[1.34, -0.1], [1.56, -0.3], [1.44, -0.52], [1.22, -0.5]]), { w: 0.07, v: 0.86 });
    line(Q([[0.8, -0.86], [1.05, -0.8], [1.3, -0.86]]), { w: 0.07, v: 0.8 });
    // Curls, each one a turn of the burin, on the scalp and the jaw.
    const curl = (f, u, r) => { const pts = []; for (let a = 0; a < 7.0; a += 0.7) { const q = r * (1 - a / 11); pts.push([f + Math.cos(a) * q, u + Math.sin(a) * q]); } line(Q(pts), { w: 0.075, v: 0.72 }); };
    for (const [f, u] of [[0.9, 1.5], [0.2, 1.9], [-0.5, 1.8], [-1.1, 1.3], [-1.5, 0.6], [-1.6, -0.2], [-1.3, -0.9], [0.5, 1.2], [-0.2, 1.3], [-0.8, 0.8], [-1.0, 0.1], [-0.8, -0.6]]) curl(f, u, 0.34);
    for (const [f, u] of [[-0.3, -1.5], [0.2, -1.6], [0.7, -1.6], [1.1, -1.5], [0.5, -2.0], [0.0, -2.1], [0.9, -2.0], [-0.5, -1.9]]) curl(f, u, 0.28);
  },
};
