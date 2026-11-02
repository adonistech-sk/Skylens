// The Water-Bearer, a young man with the bronze urn tipped on his shoulder and a long fall of water
// running from it down the sky. Sadalmelik and Sadalsuud are his shoulders. The little Y of the
// Water Jar is the urn itself, eta at its lip. Ancha is the hip, iota the top of the thigh, and mu
// and Albali the far hand, with a cloth blowing from it. The stream goes on through lambda and psi,
// then breaks into three to fall on the last stars. The warm note is the urn.
import { frame } from '../kit.mjs';

export default {
  tier: 'extended',
  subject: 'The Water-Bearer',
  pixels: 1100,
  anchors: [['Sadalmelik', 'shoulder'], ['Sadalsuud', 'shoulder'], ['Sadachbia', 'urn'], ['ζ¹ Aqr', 'neck of the urn'], ['η Aqr', 'lip of the urn'], ['π Aqr', 'handle of the urn'], ['Ancha', 'hip'], ['ι Aqr', 'thigh'], ['μ Aqr', 'wrist'], ['Albali', 'hand'], ['λ Aqr', 'stream'], ['ψ² Aqr', 'stream'], [114341, 'fall of water'], [115438, 'fall of water'], [116901, 'fall of water']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const lam = s('λ Aqr'), psi = s('ψ² Aqr'), a1 = s(114341), a2 = s(115438), a3 = s(116901), eta = s('η Aqr'), alb = s('Albali'), mu = s('μ Aqr');
    // f runs toward the urn, u up from the hips.
    const L = frame([3.2, -3.8], [11.9, 10.3], -1);
    const P = (pts) => pts.map(([f, u, ...rest]) => [...L(f, u), ...rest]);
    const hatch = L.angle;
    const anc = L.back(s('Ancha')), iot = L.back(s('ι Aqr')), hand = L.back(mu), mel = L.back(s('Sadalmelik')), sud = L.back(s('Sadalsuud'));

    // A stream as a rope of water: a bright core with waves running along its length.
    const stream = (pts, r0, r1, seed) => {
      const dense = [];
      for (let i = 0; i + 1 < pts.length; i++) for (let k = 0; k < 12; k++) { const t = k / 12, a = pts[i], b = pts[i + 1]; dense.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
      dense.push(pts[pts.length - 1]);
      limb(pts.map((p, i) => [p[0], p[1], r0 + (r1 - r0) * (i / (pts.length - 1))]), { tone: 1.2, hatch: 60, shadow: 0, melt: 0, band: 0.4, spacing: 0.84 });
      for (const [off, amp, v, w] of [[0.5, 0.2, 0.9, 0.06], [-0.4, 0.26, 0.76, 0.05], [0.05, 0.3, 1, 0.05]]) {
        const lineA = dense.map((p, i) => {
          const a = dense[Math.max(0, i - 1)], b = dense[Math.min(dense.length - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1]) / l, ny = (b[0] - a[0]) / l, r = r0 + (r1 - r0) * (i / (dense.length - 1));
          const q = off * r + amp * r * Math.sin(i * 0.8 + seed * off * 3);
          return [p[0] + nx * q, p[1] + ny * q];
        });
        line(lineA, { w, v, taper: false });
      }
    };
    // The curl of a wave where the water lands.
    const wave = (x, y, r, d, v = 0.9) => { const pts = []; for (let a = 0; a < 7.6; a += 0.6) { const q = r * (1 - a / 10); pts.push([x + d * Math.cos(a + 3.3) * q, y + Math.sin(a + 3.3) * q]); } line(pts, { w: 0.1, v }); line([[x - d * r * 2.4, y - r * 0.9], [x - d * r * 0.8, y - r * 1.1], [x + d * r * 1.0, y - r * 0.8], [x + d * r * 2.6, y - r * 1.1]], { w: 0.08, v: v * 0.8 }); };

    // Far leg, the weight on it. Long, straight, knee slightly locked.
    limb(P([[-1.8, -1.0, 2.9], [-2.6, -5.0, 2.6], [-3.2, -9.0, 1.76]]), {
      tone: 0.98, hatch: hatch + 84, shadow: 0, creases: [{ pts: P([[-3.8, -4.0], [-4.2, -6.6], [-4.4, -8.8]]), w: 0.17, depth: 0.24 }, { pts: P([[-0.6, -4.2], [-1.2, -6.6], [-1.8, -8.8]]), w: 0.15, depth: 0.2 }],
      bumps: [{ at: L(-2.4, -5.0), r: [1.4, 2.8], h: 0.46 }],
    });
    limb(P([[-3.2, -9.0, 1.6], [-3.5, -11.4, 1.7], [-3.9, -15.0, 1.08], [-4.1, -17.0, 0.82]]), {
      tone: 0.96, hatch: hatch + 86, shadow: 0.4, creases: [{ pts: P([[-2.2, -11.0], [-2.6, -13.0], [-3.2, -15.6]]), w: 0.13, depth: 0.2 }],
      bumps: [{ at: L(-3.2, -9.0), r: [1.0, 1.0], h: 0.34 }, { at: L(-3.6, -11.2), r: [1.1, 2.0], h: 0.3 }],
    });
    blob(P([[-5.0, -16.6], [-3.2, -16.8], [-2.6, -18.0], [-1.0, -18.8], [0.2, -19.4], [-0.2, -20.0], [-4.8, -19.8], [-5.4, -18.2]]), { round: 0.5, tone: 1.08, hatch: hatch + 10, shadow: 0.4, creases: [{ pts: P([[-0.8, -19.8], [-1.3, -19.2]]), w: 0.05, depth: 0.08 }, { pts: P([[-1.6, -19.8], [-2.1, -19.2]]), w: 0.05, depth: 0.08 }] });

    // Near leg, stepping out toward the water.
    limb(P([[2.2, -1.0, 3.0], [3.8, -5.0, 2.6], [5.0, -8.8, 1.8]]), {
      tone: 1.08, hatch: hatch + 72, shadow: 0.5, creases: [{ pts: P([[0.8, -4.2], [2.0, -6.8], [3.2, -8.8]]), w: 0.17, depth: 0.24 }, { pts: P([[6.0, -3.8], [6.2, -6.0], [6.2, -8.4]]), w: 0.15, depth: 0.2 }],
      bumps: [{ at: L(3.8, -5.0), r: [1.4, 2.8], angle: hatch + 20, h: 0.46 }],
    });
    limb(P([[5.0, -8.8, 1.62], [5.4, -11.2, 1.72], [5.4, -14.8, 1.08], [5.2, -16.6, 0.82]]), {
      tone: 1.06, hatch: hatch + 88, shadow: 0.5, creases: [{ pts: P([[4.0, -11.0], [4.2, -13.0], [4.4, -15.4]]), w: 0.13, depth: 0.2 }, { pts: P([[6.8, -10.6], [6.6, -12.8], [6.0, -15.2]]), w: 0.12, depth: 0.16 }],
      bumps: [{ at: L(5.0, -8.8), r: [1.1, 1.1], h: 0.36 }, { at: L(5.5, -11.0), r: [1.1, 2.0], h: 0.32 }],
    });
    blob(P([[4.2, -16.2], [6.0, -16.4], [6.6, -17.4], [8.2, -18.2], [9.6, -18.6], [9.4, -19.4], [4.4, -19.4], [3.8, -17.8]]), { round: 0.5, tone: 1.16, hatch: hatch + 10, shadow: 0.4, creases: [{ pts: P([[8.6, -19.2], [8.0, -18.6]]), w: 0.05, depth: 0.08 }, { pts: P([[7.8, -19.2], [7.2, -18.6]]), w: 0.05, depth: 0.08 }] });

    // Lean young torso, shoulders set on the two Sadal stars.
    blob(P([[sud[0] - 0.8, sud[1] + 0.4], [-2.4, 12.2], [1.0, 12.6], [4.2, 12.0], [mel[0] + 0.9, mel[1] + 0.4], [5.6, 9.2], [4.4, 6.4], [3.9, 4.0], [4.5, 1.6], [4.6, -0.6], [0.2, -1.8], [-4.2, -0.8], [-3.8, 1.6], [-3.2, 4.0], [-4.0, 6.4], [-5.4, 8.8]]), {
      round: 2.6, tone: 1.44, hatch: hatch + 30, shadow: 0.55, band: 0.9,
      creases: [
        { pts: P([[0.4, 11.6], [0.2, 8.6], [0.2, 6.8]]), w: 0.17, depth: 0.28 }, { pts: P([[4.4, 9.4], [2.4, 7.4], [0.2, 6.8]]), w: 0.2, depth: 0.3 }, { pts: P([[-3.8, 9.4], [-2.0, 7.4], [0.2, 6.8]]), w: 0.2, depth: 0.3 },
        { pts: P([[0.2, 6.6], [0.3, 4.2], [0.3, 1.4]]), w: 0.13, depth: 0.22 }, { pts: P([[-2.4, 5.6], [0.3, 5.3], [2.8, 5.6]]), w: 0.1, depth: 0.14 }, { pts: P([[-2.2, 3.8], [0.3, 3.6], [2.6, 3.8]]), w: 0.1, depth: 0.14 },
        { pts: P([[-3.0, 6.0], [-2.6, 3.4], [-2.8, 0.8]]), w: 0.13, depth: 0.17 }, { pts: P([[3.6, 6.0], [3.0, 3.4], [3.2, 0.8]]), w: 0.13, depth: 0.17 },
      ],
      bumps: [{ at: L(-2.2, 8.8), r: [2.4, 1.8], h: 0.5 }, { at: L(2.6, 8.8), r: [2.4, 1.8], h: 0.5 }, ...[[-1.2, 4.6], [1.6, 4.6], [-1.2, 2.8], [1.6, 2.8]].map(([f, u]) => ({ at: L(f, u), r: [1.1, 0.7], h: 0.18 }))],
    });

    // The wrap at his hips, knotted and folded, its corner falling.
    blob(P([[-4.2, 1.4], [-1.0, 1.0], [anc[0] + 0.4, anc[1] - 0.6], [5.2, 0.8], [6.8, -3.0], [8.0, -6.8, 'c'], [5.4, -6.0], [3.0, -7.6, 'c'], [0.8, -5.8], [-2.0, -7.2, 'c'], [-3.6, -5.2], [-6.4, -6.4, 'c'], [-5.6, -2.0]]), {
      round: 1.3, tone: 1.24, hatch: hatch + 76, shadow: 0.6, band: 0.6,
      creases: [
        { pts: P([[-3.2, 0.8], [-3.8, -2.2], [-5.0, -5.4]]), w: 0.2, depth: 0.28 }, { pts: P([[-1.2, 0.6], [-1.4, -2.6], [-1.8, -6.2]]), w: 0.2, depth: 0.28 }, { pts: P([[1.0, 0.6], [1.4, -2.4], [2.6, -6.6]]), w: 0.2, depth: 0.28 }, { pts: P([[3.2, 1.0], [4.0, -2.0], [5.4, -5.2]]), w: 0.2, depth: 0.28 },
        { pts: P([[-3.8, 0.6], [0.0, -0.2], [4.8, 0.4]]), w: 0.15, depth: 0.2 },
      ],
      bumps: [{ at: L(iot[0], iot[1] - 0.8), r: [2.2, 2.4], h: 0.3 }, { at: L(3.6, -2.4), r: [1.8, 2.4], h: 0.3 }],
    });

    // Far arm, flung straight out for balance from Sadalsuud, the open hand past mu on Albali.
    limb(P([[sud[0] + 0.2, sud[1] - 0.2, 1.72], [-8.6, 11.4, 1.4], [-11.2, 11.8, 1.08]]), {
      tone: 1.18, hatch: hatch + 80, shadow: 0.55, creases: [{ pts: P([[-5.2, 9.4], [-8.2, 10.0], [-11.0, 10.8]]), w: 0.12, depth: 0.18 }],
      bumps: [{ at: L(sud[0] - 0.4, sud[1]), r: [1.6, 1.5], h: 0.46 }, { at: L(-8.4, 11.4), r: [2.0, 0.9], h: 0.28 }],
    });
    limb(P([[-11.2, 11.8, 1.04], [-13.2, 12.4, 1.0], [hand[0], hand[1], 0.6]]), {
      tone: 1.16, hatch: hatch + 84, shadow: 0.5, creases: [{ pts: P([[-11.4, 10.9], [-13.0, 11.4], [-14.8, 11.8]]), w: 0.09, depth: 0.14 }],
      bumps: [{ at: L(-11.2, 11.8), r: [0.7, 0.7], h: 0.26 }, { at: L(-12.8, 12.2), r: [1.4, 0.7], h: 0.24 }],
    });
    blob([[alb[0] - 1.4, alb[1] + 0.9], [alb[0] + 0.2, alb[1] + 0.9], [alb[0] + 1.3, alb[1] + 1.1], [alb[0] + 3.0, alb[1] + 0.9, 'c'], [alb[0] + 1.6, alb[1] + 0.4], [alb[0] + 3.2, alb[1] - 0.1, 'c'], [alb[0] + 1.6, alb[1] - 0.3], [alb[0] + 2.8, alb[1] - 1.2, 'c'], [alb[0] + 1.2, alb[1] - 0.9], [alb[0] + 1.4, alb[1] - 1.9, 'c'], [alb[0] + 0.1, alb[1] - 1.1], [alb[0] - 1.4, alb[1] - 0.8]], { round: 0.3, tone: 1.46, hatch: 20, shadow: 0.5, band: 0.2 });

    // The water, fall by fall, drawn before the urn so it leaves the lip cleanly.
    const lip = [eta[0] - 0.2, eta[1] - 0.3];
    stream([lip, [eta[0] - 2.0, 5.2], [lam[0] + 0.6, 2.6], lam, [-9.8, -0.4], psi], 0.46, 0.92, 1.3);
    stream([psi, [-14.6, -3.6], [-13.8, -7.0], [-12.0, -10.0], a1], 0.78, 0.5, 2.1);
    stream([psi, [-15.6, -4.4], [-15.4, -8.0], [-14.4, -10.6], a2], 0.66, 0.44, 3.4);
    stream([psi, [-16.8, -3.6], [-18.0, -6.4], [-18.8, -8.6], a3], 0.62, 0.42, 4.2);
    // Where it lands: curling waves, a few flung drops.
    for (const [x, y, r, d] of [[a1[0] + 0.6, a1[1] - 1.0, 0.86, 1], [a1[0] - 2.6, a1[1] - 1.2, 0.74, -1], [a2[0] - 0.6, a2[1] - 1.4, 0.92, -1], [a3[0] - 0.4, a3[1] - 1.2, 0.8, 1], [a3[0] - 3.6, a3[1] - 0.8, 0.64, -1], [a2[0] - 3.4, a2[1] - 1.8, 0.7, 1], [a1[0] + 3.2, a1[1] - 1.6, 0.6, -1]]) wave(x, y, r, d);
    for (const [x, y, r] of [[a1[0] + 1.6, a1[1] + 1.2, 0.2], [a2[0] + 1.2, a2[1] + 1.0, 0.16], [a3[0] + 1.6, a3[1] + 0.6, 0.2], [a3[0] - 1.8, a3[1] + 1.8, 0.2], [a1[0] - 1.4, a1[1] + 1.4, 0.14], [a2[0] - 2.2, a2[1] + 0.8, 0.16]]) blob([[x, y + r * 1.8, 'c'], [x + r, y], [x, y - r], [x - r, y]], { round: r * 0.8, tone: 1.5, shadow: 0, band: 0.1 });

    // The urn, tipped from his shoulder, bronze: body, neck, flared lip, two loop handles.
    const axisA = [5.6, 10.4], lipC = [eta[0] + 0.1, eta[1] + 0.2];
    const len = Math.hypot(lipC[0] - axisA[0], lipC[1] - axisA[1]), ux = (lipC[0] - axisA[0]) / len, uy = (lipC[1] - axisA[1]) / len, nx = -uy, ny = ux;
    const U = (t, n) => [axisA[0] + ux * len * t + nx * n, axisA[1] + uy * len * t + ny * n];
    limb([U(0.5, -1.6).concat(0.2), U(0.72, -3.6).concat(0.22), U(0.9, -1.9).concat(0.2), U(0.86, -0.8).concat(0.16)], { tone: 1.3, warm: 0.5, hatch: 40, shadow: 0.3, melt: 0 });
    limb([U(0.5, 1.6).concat(0.2), U(0.76, 3.0).concat(0.22), U(0.9, 1.7).concat(0.2), U(0.86, 0.8).concat(0.16)], { tone: 1.4, warm: 0.5, hatch: 40, shadow: 0.3, melt: 0 });
    blob([U(0.0, 0.9), U(0.08, 2.0), U(0.26, 3.0), U(0.44, 2.9), U(0.62, 2.0), U(0.76, 0.96), U(0.88, 0.86), U(1.0, 1.4), U(1.03, 0.0), U(1.0, -1.4), U(0.88, -0.86), U(0.76, -0.96), U(0.62, -2.0), U(0.44, -2.9), U(0.26, -3.0), U(0.08, -2.0), U(0.0, -0.9)], {
      round: 1.6, tone: 1.56, warm: 0.46, hatch: 64, shadow: 0.62, band: 0.5, spacing: 0.86,
      creases: [
        { pts: [U(0.1, 2.2), U(0.13, 0), U(0.1, -2.2)], w: 0.09, depth: 0.14 }, { pts: [U(0.42, 2.9), U(0.46, 0), U(0.42, -2.9)], w: 0.09, depth: 0.14 }, { pts: [U(0.3, 3.0), U(0.34, 0), U(0.3, -3.0)], w: 0.06, depth: 0.09 },
        { pts: [U(0.66, 1.7), U(0.68, 0), U(0.66, -1.7)], w: 0.07, depth: 0.11 }, { pts: [U(0.93, 0.9), U(0.94, 0), U(0.93, -0.9)], w: 0.07, depth: 0.14 },
      ],
      bumps: [{ at: U(0.36, 1.2), r: [1.7, 1.0], angle: 8, h: 0.36 }],
    });
    // The wave cut round the urn's belly.
    line([U(0.38, 2.9), U(0.34, 2.1), U(0.39, 1.3), U(0.35, 0.5), U(0.4, -0.3), U(0.36, -1.1), U(0.4, -1.9), U(0.37, -2.8)], { w: 0.06, v: 0.9, warm: 0.7 });

    // Near arm: down from Sadalmelik, the elbow low, the forearm folded back up under the urn.
    limb(P([[mel[0], mel[1], 1.76], [6.4, 7.0, 1.36], [7.2, 3.6, 1.04]]), {
      tone: 1.36, hatch: hatch + 72, shadow: 0.6, creases: [{ pts: P([[4.0, 7.4], [5.0, 5.4], [6.0, 3.8]]), w: 0.12, depth: 0.18 }],
      bumps: [{ at: L(mel[0] + 0.4, mel[1] + 0.1), r: [1.6, 1.5], h: 0.46 }, { at: L(6.2, 7.0), r: [0.9, 1.7], h: 0.3 }],
    });
    limb(P([[7.2, 3.6, 1.0], [8.2, 4.6, 1.0], [8.0, 6.2, 0.62]]), { tone: 1.34, hatch: hatch + 30, shadow: 0.55, bumps: [{ at: L(7.2, 3.6), r: [0.7, 0.7], h: 0.26 }] });
    blob(P([[6.9, 6.1], [6.7, 7.3], [7.5, 8.1], [8.7, 7.9], [9.1, 6.9], [8.7, 5.9]]), {
      round: 0.4, tone: 1.46, hatch: hatch + 30, shadow: 0.5,
      creases: [{ pts: P([[7.1, 7.3], [7.9, 6.9], [9.0, 7.1]]), w: 0.05, depth: 0.09 }, { pts: P([[7.1, 6.6], [7.9, 6.3], [8.8, 6.4]]), w: 0.05, depth: 0.09 }],
    });

    // Neck and head, tipped down to watch the water fall.
    limb(P([[0.4, 11.8, 1.6], [0.8, 13.6, 1.36]]), { tone: 1.28, hatch: hatch + 88, shadow: 0.5 });
    const c = [1.0, 15.8], k = 1.7;
    const tip = 0.5, ct = Math.cos(tip), st = Math.sin(tip);
    const H = (f, u) => [c[0] + (f * ct + u * st) * k, c[1] + (-f * st + u * ct) * k];
    const Q = (pts) => P(pts.map(([f, u, ...r]) => [...H(f, u), ...r]));
    blob(Q([[-1.05, -0.5], [-1.15, 0.4], [-0.6, 1.2], [0.3, 1.3], [0.9, 0.8], [1.1, 0.2], [1.4, -0.3], [1.05, -0.5], [1.0, -0.9], [0.5, -1.3], [-0.3, -1.25]]), {
      round: 1.2, tone: 1.56, hatch: hatch + 40, shadow: 0.55, spacing: 0.86,
      creases: [{ pts: Q([[0.34, 0.14], [0.7, 0.26], [1.0, 0.1]]), w: 0.1, depth: 0.2 }, { pts: Q([[0.72, -0.72], [0.98, -0.66]]), w: 0.05, depth: 0.1 }, { pts: Q([[0.96, -0.28], [1.2, -0.32], [1.1, -0.46]]), w: 0.05, depth: 0.08 }],
    });
    line(Q([[0.48, 0.06], [0.72, 0.12], [0.94, 0.04]]), { w: 0.07, v: 1 });
    for (const pts of [[[0.9, 0.84], [0.1, 1.5], [-0.9, 1.3], [-1.5, 0.3]], [[0.5, 1.2], [-0.5, 1.3], [-1.3, 0.6], [-1.5, -0.6]], [[0.2, 1.3], [-0.6, 1.0], [-1.1, 0.2], [-1.3, -1.0]], [[-0.3, 1.2], [-0.9, 0.5], [-1.0, -0.4], [-0.9, -1.2]], [[0.9, 0.7], [0.3, 0.9], [-0.3, 0.7], [-0.6, 0.0]]]) { line(Q(pts), { w: 0.15, v: 0.72 }); line(Q(pts.map((p) => [p[0] + 0.04, p[1] - 0.05])), { w: 0.05, v: 0.94 }); }
  },
};
