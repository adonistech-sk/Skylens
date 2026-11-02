// The Serpent-Bearer, a big bearded healer planted wide, wrestling the snake across his hips. He
// is drawn upright in his own frame and leans east in the sky. Rasalhague is his head, kappa and
// Cebalrai his shoulders, Marfik his elbow, Yed his gripping hand and nu Oph the other. Zeta and
// Sabik mark the hips, psi the knee, rho the shin, theta and the last star his stride.
import { frame } from '../kit.mjs';
import { spline } from '../engrave.mjs';

export default {
  tier: 'extended',
  subject: 'The Serpent-Bearer',
  pixels: 1100,
  anchors: [['Rasalhague', 'head'], ['κ Oph', 'shoulder'], ['Cebalrai', 'shoulder'], ['γ Oph', 'upper arm'], ['Marfik', 'elbow'], ['Yed Prior', 'hand'], ['Yed Posterior', 'wrist'], ['ν Oph', 'hand'], ['ζ Oph', 'hip'], ['Sabik', 'hip'], ['φ Oph', 'thigh'], ['χ Oph', 'thigh'], ['ψ Oph', 'knee'], ['ρ Oph', 'shin'], ['θ Oph', 'shin'], [85423, 'ankle']],
  draw({ s, E }) {
    const { blob, limb, line, strands } = E;
    const L = frame([1.1, -3.9], s('Rasalhague'));
    const P = (pts) => pts.map(([f, u, ...rest]) => [...L(f, u), ...rest]);
    const hatch = L.angle;

    // The striding leg: long thigh, knee, a calf bulging over the shin to the last star.
    limb(P([[-3.8, -0.6, 3.2], [-6.2, -4.6, 2.7], [-8.8, -7.4, 1.9]]), {
      tone: 0.96, hatch: hatch + 46, shadow: 0, creases: [{ pts: P([[-3.2, -4.2], [-5.4, -6.8], [-7.6, -8.6]]), w: 0.2, depth: 0.28 }, { pts: P([[-7.0, -2.0], [-8.6, -4.0], [-9.8, -5.8]]), w: 0.16, depth: 0.2 }],
      bumps: [{ at: L(-5.8, -3.8), r: [1.6, 3.0], angle: hatch + 30, h: 0.5 }],
    });
    limb(P([[-8.8, -7.4, 1.74], [-10.9, -9.2, 1.86], [-12.5, -11.4, 1.3], [-13.5, -13.2, 0.9]]), {
      tone: 0.92, hatch: hatch + 46, shadow: 0.4, creases: [{ pts: P([[-9.4, -9.6], [-11.0, -11.0], [-12.4, -12.6]]), w: 0.14, depth: 0.2 }],
      bumps: [{ at: L(-8.8, -7.4), r: [1.0, 1.0], h: 0.34 }, { at: L(-11.0, -9.0), r: [1.0, 1.8], angle: hatch + 40, h: 0.34 }],
    });
    blob(P([[-12.8, -12.6], [-14.2, -12.8], [-14.5, -13.8], [-15.6, -14.4], [-17.2, -14.8], [-17.4, -15.5], [-15.2, -15.7], [-13.4, -15.2], [-12.5, -14.2]]), { round: 0.5, tone: 1.0, hatch: hatch + 10, shadow: 0.4, creases: [{ pts: P([[-16.6, -15.0], [-15.8, -14.9]]), w: 0.05, depth: 0.08 }, { pts: P([[-16.0, -15.2], [-15.2, -15.0]]), w: 0.05, depth: 0.08 }] });

    // The planted leg, straight down through phi, chi and psi, the shin past rho.
    limb(P([[4.3, -0.6, 3.3], [4.6, -4.6, 3.0], [4.0, -8.8, 2.0]]), {
      tone: 1.06, hatch: hatch + 74, shadow: 0.4, creases: [{ pts: P([[2.2, -3.8], [2.4, -6.4], [3.0, -8.6]]), w: 0.2, depth: 0.28 }, { pts: P([[6.8, -3.2], [6.6, -6.0], [5.8, -8.4]]), w: 0.16, depth: 0.22 }, { pts: P([[4.4, -4.0], [4.6, -6.2], [4.4, -7.8]]), w: 0.13, depth: 0.14 }],
      bumps: [{ at: L(4.8, -5.0), r: [1.6, 3.0], h: 0.5 }],
    });
    limb(P([[4.0, -8.8, 1.8], [3.7, -11.0, 1.9], [2.8, -14.0, 1.3], [2.1, -15.8, 0.92]]), {
      tone: 1.02, hatch: hatch + 80, shadow: 0.5, creases: [{ pts: P([[2.6, -10.6], [2.2, -12.6], [1.7, -14.8]]), w: 0.14, depth: 0.2 }, { pts: P([[5.0, -10.2], [4.8, -12.4], [3.6, -14.8]]), w: 0.14, depth: 0.18 }],
      bumps: [{ at: L(4.0, -8.9), r: [1.1, 1.1], h: 0.36 }, { at: L(3.9, -11.2), r: [1.2, 2.0], h: 0.3 }],
    });
    blob(P([[1.2, -15.4], [3.0, -15.6], [3.6, -16.6], [4.4, -17.4], [5.4, -18.0], [4.8, -18.6], [1.4, -18.5], [0.8, -17.0]]), { round: 0.5, tone: 1.06, hatch: hatch + 12, shadow: 0.4, creases: [{ pts: P([[4.4, -18.4], [3.9, -17.9]]), w: 0.05, depth: 0.08 }, { pts: P([[3.8, -18.4], [3.3, -17.9]]), w: 0.05, depth: 0.08 }] });

    // Torso, a wrestler's: wide shoulders set on the stars, the waist drawn in, muscle cut deep.
    blob(P([[-5.8, 22.2], [-3.0, 23.0], [1.2, 23.3], [5.2, 23.0], [8.2, 22.2], [8.8, 20.0], [7.6, 16.4], [5.9, 12.0], [4.7, 8.0], [5.2, 3.6], [5.8, 0.0], [0.2, -1.2], [-5.6, -0.2], [-5.0, 3.6], [-4.0, 8.0], [-4.5, 12.0], [-5.6, 16.4], [-6.8, 20.0]]), {
      round: 2.6, tone: 1.42, hatch: hatch + 32, shadow: 0.5, band: 0.9,
      creases: [
        { pts: P([[0.6, 22.0], [0.7, 17.6], [0.7, 14.8]]), w: 0.22, depth: 0.34 },
        { pts: P([[6.6, 19.2], [3.8, 16.2], [0.8, 15.6]]), w: 0.24, depth: 0.36 }, { pts: P([[-5.2, 19.2], [-2.6, 16.2], [0.6, 15.6]]), w: 0.24, depth: 0.36 },
        { pts: P([[0.7, 14.6], [0.7, 10.0], [0.6, 3.2]]), w: 0.16, depth: 0.26 },
        { pts: P([[-2.8, 13.4], [0.7, 12.9], [4.2, 13.4]]), w: 0.13, depth: 0.2 }, { pts: P([[-2.8, 10.8], [0.7, 10.2], [4.0, 10.8]]), w: 0.13, depth: 0.2 }, { pts: P([[-2.6, 7.8], [0.7, 7.4], [3.8, 7.8]]), w: 0.13, depth: 0.2 },
        { pts: P([[-3.6, 14.2], [-3.4, 9.6], [-2.2, 4.4]]), w: 0.16, depth: 0.22 }, { pts: P([[5.0, 14.2], [4.6, 9.6], [3.4, 4.4]]), w: 0.16, depth: 0.22 },
        { pts: P([[-5.2, 17.0], [-3.8, 12.6], [-3.6, 9.2]]), w: 0.12, depth: 0.14 }, { pts: P([[7.0, 17.0], [5.4, 12.6], [4.8, 9.2]]), w: 0.12, depth: 0.14 },
      ],
      bumps: [{ at: L(-2.2, 18.2), r: [3.0, 2.2], h: 0.66 }, { at: L(3.6, 18.2), r: [3.0, 2.2], h: 0.66 }, ...[[-1.2, 12], [2.4, 12], [-1.2, 9.3], [2.4, 9.3], [-1.1, 6.2], [2.3, 6.2]].map(([f, u]) => ({ at: L(f, u), r: [1.3, 1.0], h: 0.24 }))],
    });

    // The kilt, wrapped and tucked, its pleats falling to the thigh.
    blob(P([[-5.6, 3.0], [0.6, 2.4], [5.8, 3.0], [6.8, -0.8], [7.8, -4.2], [6.8, -5.0, 'c'], [5.4, -4.2], [3.6, -6.2, 'c'], [2.0, -4.8], [0.6, -7.0, 'c'], [-1.0, -5.2], [-3.4, -7.4, 'c'], [-4.6, -5.0], [-7.0, -6.4, 'c'], [-7.4, -3.2], [-6.2, -0.4]]), {
      round: 1.2, tone: 1.02, hatch: hatch + 84, shadow: 0.6, band: 0.6,
      creases: [
        { pts: P([[-4.4, 2.4], [-5.2, -1.4], [-6.0, -5.2]]), w: 0.2, depth: 0.28 }, { pts: P([[-2.2, 2.2], [-2.8, -2.0], [-3.4, -6.4]]), w: 0.2, depth: 0.28 }, { pts: P([[0.2, 2.0], [0.2, -2.2], [0.6, -6.0]]), w: 0.2, depth: 0.28 },
        { pts: P([[2.2, 2.0], [2.8, -1.6], [3.6, -5.4]]), w: 0.2, depth: 0.28 }, { pts: P([[4.4, 2.4], [5.2, -1.0], [6.2, -4.0]]), w: 0.18, depth: 0.24 },
      ],
      bumps: [{ at: L(-3.2, -2.4), r: [1.4, 3.0], h: 0.3 }, { at: L(3.8, -2.0), r: [1.4, 3.0], h: 0.3 }],
    });
    // Belt, the warm note.
    limb(P([[-4.9, 3.0, 0.34], [-3.2, 2.5, 0.42], [0.6, 2.2, 0.44], [4.2, 2.5, 0.42], [5.1, 3.0, 0.34]]), { tone: 1.26, warm: 0.6, flat: 0.5, hatch: hatch + 86, shadow: 0.44, melt: 0 });
    blob(P([[-0.1, 2.9], [1.3, 2.9], [1.3, 1.5], [-0.1, 1.5]]), { round: 0.3, tone: 1.5, warm: 0.8, shadow: 0.3 });

    // The serpent, slung across his thighs from hand to hand, the head rearing past the west hand.
    const snake = P([[-21.6, 18.0, 0.1], [-20.4, 15.6, 0.34], [-18.0, 14.0, 0.56], [-15.9, 10.9, 0.78], [-13.9, 8.4, 0.9], [-11.4, 3.6, 1.0], [-7.4, -1.8, 1.06], [-2.0, -5.2, 1.1], [3.6, -4.2, 1.1], [8.4, -0.6, 1.06], [11.2, 2.6, 1.0], [12.9, 5.2, 0.92], [14.8, 8.6, 0.84], [17.8, 10.2, 0.78], [20.2, 13.4, 0.7], [20.8, 16.4, 0.74]]);
    const path = spline(snake, false, 10);
    const N = (i) => { const a = path[Math.max(0, i - 1)], b = path[Math.min(path.length - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [-(b[1] - a[1]) / l, (b[0] - a[0]) / l, (b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
    const plates = [];
    for (let i = 3; i < path.length - 3; i += 2) { const [nx, ny, tx, ty] = N(i), [x, y, r] = path[i]; plates.push({ pts: [[x + nx * r * 0.96, y + ny * r * 0.96], [x + nx * r * 0.5 + tx * 0.1, y + ny * r * 0.5 + ty * 0.1]], w: 0.06, depth: 0.12 }); }
    limb(snake, { tone: 1.3, hatch: hatch + 20, shadow: 0.66, melt: 0, band: 0.5, creases: plates });
    for (let i = 4, along = 0; i < path.length - 6;) {
      const [nx, ny, tx, ty] = N(i), [x, y, r] = path[i], cx = x - nx * r * 0.26, cy = y - ny * r * 0.26, a = r * 0.66, b = r * 0.46;
      line([[cx - tx * a, cy - ty * a], [cx - nx * b, cy - ny * b], [cx + tx * a, cy + ty * a], [cx + nx * b, cy + ny * b], [cx - tx * a, cy - ty * a]], { w: 0.06, v: 0.72, taper: false });
      for (along = 0; along < r * 1.36 && i < path.length - 2; i++) along += Math.hypot(path[i + 1][0] - path[i][0], path[i + 1][1] - path[i][1]);
    }
    // Serpent's head, wedge-shaped, with a flicking tongue.
    const [hx, hy] = L(20.8, 16.8);
    limb(P([[21.0, 18.8, 0.09], [21.6, 20.6, 0.07], [22.2, 21.6, 0.03]]), { tone: 1.3, shadow: 0, melt: 0 });
    blob(P([[19.5, 16.2], [19.3, 17.6], [20.4, 18.9], [21.3, 19.4, 'c'], [21.9, 18.2], [22.3, 16.8], [21.6, 15.8]]), {
      round: 0.6, tone: 1.56, hatch: hatch + 70, shadow: 0.5,
      creases: [{ pts: P([[20.8, 19.0], [20.8, 18.0], [21.6, 16.6]]), w: 0.08, depth: 0.14 }, { pts: P([[20.0, 17.0], [20.6, 17.4], [20.9, 17.0]]), w: 0.08, depth: 0.18 }],
    });
    line([[hx - 0.32, hy + 0.34], [hx + 0.02, hy + 0.44], [hx + 0.28, hy + 0.34]], { w: 0.05, v: 0.1 });

    // Upper arm into a thick forearm, far arm first. West arm reaches down through Marfik.
    limb(P([[7.6, 20.6, 2.4], [10.0, 16.8, 1.82], [11.0, 12.2, 1.4]]), {
      tone: 1.16, hatch: hatch + 70, shadow: 0.55, creases: [{ pts: P([[7.2, 18.0], [8.4, 15.0], [9.8, 12.6]]), w: 0.16, depth: 0.24 }, { pts: P([[9.0, 19.2], [11.0, 17.0], [11.8, 14.2]]), w: 0.12, depth: 0.14 }],
      bumps: [{ at: L(8.6, 19.8), r: [1.8, 1.8], h: 0.56 }, { at: L(9.8, 15.8), r: [1.1, 2.0], angle: hatch + 20, h: 0.4 }],
    });
    limb(P([[11.0, 12.2, 1.36], [12.1, 9.6, 1.46], [12.7, 6.8, 0.96]]), {
      tone: 1.14, hatch: hatch + 80, shadow: 0.5, creases: [{ pts: P([[10.8, 10.6], [11.6, 8.6], [12.0, 7.0]]), w: 0.12, depth: 0.18 }],
      bumps: [{ at: L(11.0, 12.2), r: [0.8, 0.8], h: 0.3 }, { at: L(12.0, 10.0), r: [0.9, 1.6], h: 0.3 }],
    });
    // West fist, wrapped on the snake.
    blob(P([[11.5, 6.8], [13.8, 7.0], [14.5, 5.6], [14.3, 4.0], [12.8, 3.4], [11.2, 3.8], [10.9, 5.2]]), {
      round: 0.7, tone: 1.3, hatch: hatch + 30, shadow: 0.6,
      creases: [{ pts: P([[11.2, 5.9], [12.8, 6.0], [14.2, 5.5]]), w: 0.08, depth: 0.14 }, { pts: P([[11.1, 5.0], [12.7, 5.1], [14.3, 4.7]]), w: 0.08, depth: 0.14 }, { pts: P([[11.3, 4.2], [12.6, 4.2], [14.0, 3.9]]), w: 0.08, depth: 0.14 }],
    });
    // East arm, out and down to nu Oph.
    limb(P([[-5.2, 20.6, 2.4], [-8.4, 17.8, 1.86], [-11.4, 14.6, 1.4]]), {
      tone: 1.1, hatch: hatch - 40, shadow: 0.55, creases: [{ pts: P([[-7.0, 20.0], [-9.4, 18.0], [-12.0, 15.4]]), w: 0.13, depth: 0.16 }, { pts: P([[-5.2, 18.0], [-8.0, 15.8], [-10.0, 13.8]]), w: 0.15, depth: 0.22 }],
      bumps: [{ at: L(-6.6, 20.2), r: [1.8, 1.8], h: 0.56 }, { at: L(-8.8, 16.6), r: [2.0, 1.1], angle: hatch + 38, h: 0.38 }],
    });
    limb(P([[-11.4, 14.6, 1.34], [-13.0, 12.4, 1.42], [-13.9, 10.2, 0.92]]), {
      tone: 1.08, hatch: hatch - 56, shadow: 0.5, creases: [{ pts: P([[-11.0, 12.8], [-12.2, 11.0], [-12.9, 9.8]]), w: 0.12, depth: 0.18 }],
      bumps: [{ at: L(-11.4, 14.6), r: [0.8, 0.8], h: 0.3 }, { at: L(-12.8, 12.4), r: [0.9, 1.5], h: 0.3 }],
    });
    blob(P([[-12.6, 10.2], [-14.8, 10.2], [-15.6, 9.0], [-15.2, 7.4], [-13.8, 6.8], [-12.2, 7.2], [-11.9, 8.8]]), {
      round: 0.7, tone: 1.3, hatch: hatch - 20, shadow: 0.6,
      creases: [{ pts: P([[-12.2, 9.3], [-13.8, 9.2], [-15.2, 8.7]]), w: 0.08, depth: 0.14 }, { pts: P([[-12.1, 8.5], [-13.8, 8.3], [-15.3, 7.9]]), w: 0.08, depth: 0.14 }, { pts: P([[-12.4, 7.7], [-13.8, 7.5], [-15.0, 7.3]]), w: 0.08, depth: 0.14 }],
    });

    // Neck, heavy, with the cords showing.
    limb(P([[0.8, 22.2, 2.5], [0.5, 25.0, 2.1]]), { tone: 1.06, hatch: hatch + 88, shadow: 0.5, creases: [{ pts: P([[1.8, 22.6], [1.2, 24.2], [0.8, 25.4]]), w: 0.1, depth: 0.14 }] });

    // Head turned to the serpent, wide-browed. c is its centre on Rasalhague, k its scale.
    const c = [0.2, 27.8], k = 2.05;
    const H = (f, u) => [c[0] + f * k, c[1] + u * k];
    const Q = (pts) => P(pts.map(([f, u, ...r]) => [...H(f, u), ...r]));
    // Hair mass behind the head.
    blob(Q([[1.0, 1.4], [0.2, 2.1], [-1.2, 1.9], [-2.0, 0.9], [-2.1, -0.5], [-1.5, -1.6], [-0.8, -1.0], [-0.4, 0.2], [0.4, 0.9]]), { round: 0.7, tone: 0.86, hatch: hatch + 60, shadow: 0.34, relief: 0.3, edge: 0.6 });
    blob(Q([[-1.2, -0.8], [-1.5, 0.5], [-0.8, 1.6], [0.4, 1.7], [1.2, 1.0], [1.45, 0.2], [1.75, -0.2], [1.35, -0.5], [1.35, -1.0], [1.1, -1.3], [0.7, -1.85], [0.0, -1.9], [-0.7, -1.5]]), {
      round: 1.5, tone: 1.26, hatch: hatch + 40, shadow: 0.55, spacing: 0.86,
      creases: [
        { pts: Q([[0.5, 0.32], [0.95, 0.42], [1.3, 0.24]]), w: 0.13, depth: 0.28 }, { pts: Q([[0.6, -0.02], [0.96, 0.06], [1.26, -0.04]]), w: 0.08, depth: 0.14 },
        { pts: Q([[0.9, -0.95], [1.2, -0.9]]), w: 0.07, depth: 0.14 }, { pts: Q([[1.3, -0.28], [1.5, -0.34], [1.4, -0.52]]), w: 0.05, depth: 0.1 },
      ],
      bumps: [{ at: H(1.32, -0.2), r: [0.5, 0.7], h: 0.24 }, { at: H(0.2, -0.3), r: [0.9, 0.7], h: 0.2 }],
    });
    // Beard, lock by lock, and hair swept back.
    const beard = [[[0.6, -0.8], [0.5, -1.8], [0.9, -2.7]], [[0.9, -1.1], [1.1, -2.0], [1.3, -2.7]], [[0.2, -0.9], [-0.1, -1.9], [0.3, -2.8]], [[-0.3, -0.8], [-0.6, -1.6], [-0.4, -2.4]], [[1.2, -1.2], [1.3, -1.8], [1.6, -2.3]]];
    for (const pts of beard) { line(Q(pts), { w: 0.16, v: 0.72 }); line(Q(pts.map((p) => [p[0] + 0.1, p[1]])), { w: 0.06, v: 0.92 }); }
    const hair = [[[1.1, 1.5], [0.1, 2.0], [-1.2, 1.8], [-1.9, 0.9]], [[0.6, 1.7], [-0.6, 1.9], [-1.7, 1.1], [-2.0, 0.0]], [[0.1, 1.6], [-1.0, 1.4], [-1.7, 0.4], [-1.6, -0.9]], [[-0.4, 1.5], [-1.1, 0.9], [-1.3, -0.1], [-1.1, -1.1]], [[1.2, 1.2], [0.4, 2.2], [-0.9, 2.2]]];
    for (const pts of hair) { line(Q(pts), { w: 0.15, v: 0.66 }); line(Q(pts.map((p) => [p[0] + 0.08, p[1] - 0.08])), { w: 0.06, v: 0.9 }); }
    strands(Q([[0.4, -1.4], [1.1, -1.4]]), { n: 90, angle: -68, len: 1.0, jitter: 16, v: 0.7, spread: 0.2, seed: 8, w: 0.03 });
  },
};
