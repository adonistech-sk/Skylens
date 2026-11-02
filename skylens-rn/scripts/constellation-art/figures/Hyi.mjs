// The Little Water Snake, a sea snake swimming the far south in long slow bends. Alpha is the head,
// the body runs down through Eta, Delta and Epsilon, swings out through Gamma and on to the flat
// paddle of the tail past Beta. The warm note is the forked tongue.
export default {
  tier: 'extended',
  subject: 'The Little Water Snake',
  pixels: 1000,
  anchors: [['α Hyi', 'head'], ['η² Hyi', 'neck'], ['δ Hyi', 'body'], ['ε Hyi', 'body'], ['γ Hyi', 'body'], ['β Hyi', 'tail']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const alp = s('α Hyi'), eta = s('η² Hyi'), del = s('δ Hyi'), eps = s('ε Hyi'), gam = s('γ Hyi'), bet = s('β Hyi');

    // The full spine, with its bends set between the stars.
    const spine = [
      [alp[0] - 0.2, alp[1] - 0.8, 0.52], [4.2, 7.0, 0.54], [5.2, 4.8, 0.58], [eta[0] + 0.5, eta[1], 0.64], [del[0], del[1], 0.7], [eps[0], eps[1], 0.76],
      [-5.6, 2.0, 0.8], [-8.0, 0.0, 0.82], [-8.2, -3.2, 0.8], [gam[0], gam[1], 0.76], [-3.4, -7.6, 0.7], [0.6, -7.0, 0.64], [3.0, -5.0, 0.56], [5.6, -4.8, 0.48], [7.6, -6.2, 0.4], [bet[0] + 0.4, bet[1], 0.36], [3.2, -10.2, 0.34],
    ];
    const P = [];
    for (let i = 0; i < spine.length - 1; i++) {
      const a = spine[Math.max(0, i - 1)], b = spine[i], c = spine[i + 1], d = spine[Math.min(spine.length - 1, i + 2)];
      for (let k = 0; k < 16; k++) {
        const t = k / 16, t2 = t * t, t3 = t2 * t;
        const f = (j) => 0.5 * (2 * b[j] + (c[j] - a[j]) * t + (2 * a[j] - 5 * b[j] + 4 * c[j] - d[j]) * t2 + (3 * b[j] - a[j] - 3 * c[j] + d[j]) * t3);
        P.push([f(0), f(1), b[2] + (c[2] - b[2]) * t]);
      }
    }
    P.push(spine[spine.length - 1]);

    // Paddle of the tail: a flat fin at the end, before the body lies over it.
    const end = P[P.length - 1];
    const fin = (x, y) => [end[0] + x, end[1] + y];
    blob([fin(1.0, 0.8), fin(-0.5, 0.92), fin(-1.9, 0.3), [...fin(-3.1, -1.5), 'c'], fin(-1.3, -1.2), fin(0.3, -0.9)], {
      round: 0.3, tone: 1.1, hatch: 40, shadow: 0.3, band: 0.22,
      creases: [{ pts: [fin(0.4, 0), fin(-2.8, -1.3)], w: 0.05, depth: 0.08 }, { pts: [fin(-0.2, 0.5), fin(-2.6, -0.9)], w: 0.04, depth: 0.07 }, { pts: [fin(-0.2, -0.5), fin(-2.5, -1.3)], w: 0.04, depth: 0.07 }],
    });

    // The body, printed in overlapping lengths so each bend shadows the next.
    const rings = [], belly = [];
    for (let i = 3; i < P.length - 3; i += 3) {
      const [x, y, r] = P[i], dx = P[i + 2][0] - P[i - 2][0], dy = P[i + 2][1] - P[i - 2][1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
      const bow = 0.22 * r;
      rings.push({ pts: [[x + nx * r * 0.96, y + ny * r * 0.96], [x + dx / l * bow, y + dy / l * bow], [x - nx * r * 0.96, y - ny * r * 0.96]], w: 0.032, depth: 0.05 });
      belly.push([x - nx * r * 0.36, y - ny * r * 0.36]);
    }
    const band = [];
    for (let i = 8; i < P.length - 8; i += 16) {
      const [x, y, r] = P[i], dx = P[i + 3][0] - P[i - 3][0], dy = P[i + 3][1] - P[i - 3][1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
      band.push({ pts: [[x + nx * r, y + ny * r], [x, y], [x - nx * r, y - ny * r]], w: 0.13, depth: 0.14 });
    }
    limb(P, { tone: 1.12, hatch: 76, shadow: 0.5, melt: 0, band: 0.36, creases: [...rings, ...band, { pts: belly, w: 0.05, depth: 0.08 }] });

    // The dark saddles of a banded sea snake, then the scale rings cut back across them.
    for (let i = 6; i < P.length - 14; i += 32) limb(P.slice(i, i + 14), { tone: 0.62, hatch: 18, shadow: 0, melt: 0, band: 0.3, spacing: 0.84 });
    for (const r of rings) line(r.pts, { w: 0.03, v: 0.42 });

    // Head, flat and wedge-shaped, looking north-east.
    const h = [alp[0] + 0.1, alp[1] + 0.2], d = [0.7, 0.72];
    const H = (u, v) => [h[0] + d[0] * u - d[1] * v, h[1] + d[1] * u + d[0] * v];
    limb([[...H(0.7, 0.04), 0.1], [...H(1.5, 0.1), 0.05], [...H(2.0, 0.36), 0.02]], { tone: 1.3, warm: 0.84, shadow: 0, flat: 0.6, melt: 0 });
    limb([[...H(1.5, 0.1), 0.05], [...H(2.06, -0.14), 0.02]], { tone: 1.3, warm: 0.84, shadow: 0, flat: 0.6, melt: 0 });
    blob([H(-1.4, 0.46), H(-1.0, 0.66), H(-0.3, 0.86), H(0.3, 0.76), H(0.86, 0.36), H(1.0, 0.0), H(0.86, -0.36), H(0.3, -0.76), H(-0.3, -0.86), H(-1.0, -0.66), H(-1.4, -0.46)], {
      round: 0.56, tone: 1.26, hatch: 20, shadow: 0.5, band: 0.3,
      creases: [
        { pts: [H(0.96, -0.1), H(0.3, -0.34), H(-0.5, -0.5)], w: 0.05, depth: 0.1 },
        { pts: [H(-1.0, 0), H(-0.2, 0.08), H(0.5, 0)], w: 0.04, depth: 0.06 },
        { pts: [H(-0.6, 0.6), H(-0.3, 0.3), H(-0.6, 0)], w: 0.04, depth: 0.06 },
      ],
    });
    const eye = H(0.14, 0.42);
    limb([[eye[0], eye[1], 0.15], [eye[0] + 0.01, eye[1], 0.15]], { tone: 1.3, shadow: 0.2, melt: 0 });
    limb([[eye[0], eye[1], 0.08], [eye[0] + 0.005, eye[1], 0.08]], { tone: 0.12, shadow: 0, melt: 0 });
  },
};
