// The Chained Princess, arms spread between two rocks, gown streaming in the sea wind. Drawn
// upright in her own frame and laid onto the stars. Alpheratz is her head, as in the old tables,
// Mirach her girdle and Almach her foot. Mu, nu, phi and 51 And lie along the blown gown.
import { frame, locks } from '../kit.mjs';

const mu0 = (L, s) => L.back(s('μ And'))[0];
const mu1 = (L, s) => L.back(s('μ And'))[1];

export default {
  pixels: 1500,
  anchors: [['Alpheratz', 'head'], ['δ And', 'breast'], ['Mirach', 'girdle'], ['Almach', 'foot'], ['Nembus', 'hem of the gown'], [3693, 'wrist'], [116631, 'wrist'], ['μ And', 'gown'], [5434, 'gown']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const mir = s('Mirach'), alp = s('Alpheratz');
    // f runs across her, toward the north-west arm. u runs up to her head.
    const L = frame(mir, alp, -1);
    const P = (pts) => pts.map(([f, u, ...rest]) => [...L(f, u), ...rest]);
    const hatch = L.angle;
    const head = L.back(alp), alm = L.back(s('Almach')), nem = L.back(s('Nembus')), phi = L.back(s(5434)), nu = L.back(s(3881)), iot = L.back(s(116631)), zet = L.back(s(3693)), omi = L.back(s(113726)), eta = L.back(s(4463)), del = L.back(s('δ And'));

    // Her far leg, striding out toward 51 And, moulded under the gown.
    limb(P([[1.0, 0.0, 2.0], [4.4, -3.0, 1.7], [7.2, -5.6, 1.3], [9.4, -8.2, 0.9], [nem[0], nem[1] - 0.4, 0.62]]), { tone: 0.92, hatch: hatch + 50, shadow: 0, bumps: [{ at: L(5.6, -4.2), r: [1.1, 1.1], h: 0.24 }] });
    blob(P([[nem[0] - 0.8, nem[1]], [nem[0] + 0.6, nem[1]], [nem[0] + 0.8, nem[1] - 1.0], [nem[0] + 1.8, nem[1] - 1.8], [nem[0] + 1.3, nem[1] - 2.2], [nem[0] - 0.8, nem[1] - 1.6]]), { round: 0.4, tone: 1.1, shadow: 0.3 });

    // The gown, gathered at the girdle, split over both legs, its edge lifted by the sea wind.
    blob(P([[-2.4, 2.0], [-3.2, -3.2], [-2.2, -8.4], [alm[0] - 1.4, alm[1] + 2.4], [alm[0] + 2.2, alm[1] + 2.6], [2.8, -6.2], [4.2, -4.8], [7.0, -7.8, 'c'], [8.6, -5.4], [8.2, -3.0], [phi[0] - 1.0, phi[1] + 2.0, 'c'], [5.6, -0.8], [nu[0] - 1.6, nu[1] + 0.2], [3.4, 3.0], [1.8, 3.6], [0.0, 3.0]]), {
      round: 2.0, tone: 1.0, hatch: hatch + 70, shadow: 0.5, band: 1.0,
      creases: [
        { pts: P([[-1.0, 1.0], [-1.2, -4.0], [-0.6, -8.4], [alm[0] - 0.4, alm[1] + 3.0]]), w: 0.2, depth: 0.26 }, { pts: P([[0.2, 0.8], [1.0, -3.2], [1.4, -6.8], [alm[0] + 1.4, alm[1] + 3.0]]), w: 0.2, depth: 0.26 }, { pts: P([[-2.0, 0.8], [-2.4, -3.2], [-1.8, -6.8]]), w: 0.15, depth: 0.16 },
        { pts: P([[1.4, 1.4], [3.8, -1.2], [5.8, -3.6], [7.6, -6.0]]), w: 0.2, depth: 0.26 }, { pts: P([[2.0, 2.2], [4.6, 0.0], [6.8, -2.0], [8.0, -3.8]]), w: 0.18, depth: 0.22 },
      ],
      bumps: [{ at: L(-0.4, -5.0), r: [1.6, 3.4], h: 0.34 }, { at: L(3.2, -2.0), r: [2.0, 1.6], angle: -38, h: 0.3 }],
    });
    // Windblown sash through the star chain.
    limb(P([[2.2, 2.0, 0.36], [mu0(L, s), mu1(L, s), 0.3], [nu[0], nu[1], 0.26], [phi[0] - 1.0, phi[1] + 2.8, 0.2], [phi[0], phi[1], 0.14], [nem[0] + 2.2, nem[1] + 3.0, 0.05]]), { tone: 1.1, warm: 0.5, hatch: hatch + 20, shadow: 0.2, flat: 0.5, melt: 0 });
    // A foot below the hem.
    blob(P([[alm[0] - 0.5, alm[1] + 0.8], [alm[0] + 0.7, alm[1] + 0.8], [alm[0] + 0.9, alm[1] - 0.2], [alm[0] + 2.0, alm[1] - 0.8], [alm[0] + 1.6, alm[1] - 1.2], [alm[0] - 0.4, alm[1] - 0.9]]), { round: 0.4, tone: 1.14, shadow: 0.3 });

    // Torso, slight, turned a little toward the rising arm.
    blob(P([[-1.9, 11.2], [-0.4, 11.8], [1.8, 11.4], [2.5, 10.2], [2.1, 7.6], [1.7, 5.0], [2.0, 2.6], [-1.9, 2.4], [-1.9, 5.2], [-2.4, 8.2]]), {
      round: 1.9, tone: 1.14, hatch: hatch + 28, shadow: 0.58, band: 0.7,
      creases: [{ pts: P([[-1.5, 9.8], [-0.6, 8.6], [0.2, 9.2]]), w: 0.12, depth: 0.16 }, { pts: P([[1.8, 9.8], [1.0, 8.6], [0.2, 9.2]]), w: 0.12, depth: 0.16 }, { pts: P([[-0.1, 8.0], [0.0, 6.0], [0.1, 3.4]]), w: 0.1, depth: 0.1 }],
      bumps: [{ at: L(del[0], del[1] + 0.8), r: [1.0, 1.0], h: 0.32 }, { at: L(1.0, 9.0), r: [1.0, 1.0], h: 0.3 }],
    });
    // Cloth over the breast and shoulder.
    blob(P([[-2.2, 7.4], [-1.0, 9.0], [0.8, 8.8], [1.9, 7.0], [1.9, 5.0], [-1.9, 4.8]]), { round: 0.9, tone: 0.92, hatch: hatch + 64, shadow: 0.34, creases: [{ pts: P([[-1.4, 7.2], [-0.1, 5.4], [-0.3, 3.4]]), w: 0.14, depth: 0.18 }, { pts: P([[1.4, 7.0], [0.7, 5.2], [0.8, 3.4]]), w: 0.14, depth: 0.18 }] });
    // Girdle on Mirach.
    limb(P([[-2.3, 2.4, 0.26], [0, 1.6, 0.32], [2.4, 2.8, 0.26]]), { tone: 1.2, warm: 0.78, flat: 0.5, shadow: 0.3, melt: 0 });
    limb(P([[-0.3, 1.8, 0.15], [-0.5, -1.2, 0.12], [-0.2, -3.6, 0.05]]), { tone: 1.16, warm: 0.6, flat: 0.5, shadow: 0.2, melt: 0 });

    // Rising arm to iota. Falling arm to zeta.
    limb(P([[2.0, 11.0, 0.86], [5.8, 11.4, 0.66], [9.8, 11.5, 0.56], [iot[0] - 0.9, iot[1], 0.4]]), { tone: 1.1, hatch: hatch + 84, shadow: 0.48, bumps: [{ at: L(4.2, 11.3), r: [1.2, 0.5], h: 0.14 }] });
    blob(P([[iot[0] - 1.0, iot[1] + 0.4], [iot[0] + 0.5, iot[1] + 0.6], [iot[0] + 1.3, iot[1] + 0.9], [iot[0] + 1.5, iot[1] + 0.4], [iot[0] + 1.0, iot[1] - 0.2], [iot[0] + 1.2, iot[1] - 0.6], [iot[0], iot[1] - 0.6], [iot[0] - 1.0, iot[1] - 0.4]]), { round: 0.34, tone: 1.2, shadow: 0.28 });
    limb(P([[-2.1, 10.8, 0.84], [-4.8, 10.4, 0.64], [-6.8, 9.9, 0.52], [zet[0] + 0.8, zet[1], 0.38]]), { tone: 1.12, hatch: hatch + 84, shadow: 0.48, bumps: [{ at: L(-4.0, 10.6), r: [1.2, 0.5], h: 0.14 }] });
    blob(P([[zet[0] + 1.0, zet[1] + 0.4], [zet[0] - 0.5, zet[1] + 0.6], [zet[0] - 1.3, zet[1] + 0.8], [zet[0] - 1.5, zet[1] + 0.3], [zet[0] - 1.0, zet[1] - 0.2], [zet[0] - 1.2, zet[1] - 0.6], [zet[0], zet[1] - 0.6], [zet[0] + 1.0, zet[1] - 0.4]]), { round: 0.34, tone: 1.2, shadow: 0.28 });

    // Chains, link by link, to the rocks.
    const chain = (a, b, n) => {
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1), sag = Math.sin(Math.PI * t) * 0.9;
        const f = a[0] + (b[0] - a[0]) * t, u = a[1] + (b[1] - a[1]) * t - sag, df = (b[0] - a[0]) / (n * 2.5), du = (b[1] - a[1]) / (n * 2.5);
        line(P([[f - df, u - du], [f + du * 0.5, u - df * 0.5], [f + df, u + du], [f - du * 0.5, u + df * 0.5], [f - df, u - du]]), { w: 0.07, v: 0.64, warm: 0.86, taper: false });
      }
    };
    chain([iot[0] + 0.3, iot[1] - 0.2], [omi[0], omi[1]], 9);
    chain([zet[0] - 0.3, zet[1] - 0.2], [eta[0] - 0.4, eta[1] + 0.6], 5);
    for (const [c, d] of [[omi, 1], [[eta[0] - 0.4, eta[1] + 0.6], -1]]) {
      blob(P([[c[0] - 1.8 * d, c[1] - 2.0], [c[0] - 0.6 * d, c[1] + 0.8], [c[0] + 0.8 * d, c[1] + 1.2], [c[0] + 2.2 * d, c[1] - 0.6], [c[0] + 2.6 * d, c[1] - 3.0]]), { round: 0.7, tone: 0.74, hatch: hatch + 30, shadow: 0, creases: [{ pts: P([[c[0] - 0.8 * d, c[1] - 1.4], [c[0] + 0.4 * d, c[1] - 0.2], [c[0] + 1.4 * d, c[1] - 1.8]]), w: 0.14, depth: 0.2 }] });
    }

    // Neck and head, turned from the sea.
    limb(P([[0.1, 11.4, 0.54], [head[0] - 0.1, head[1] - 1.8, 0.46]]), { tone: 1.04, shadow: 0.44, hatch: hatch + 90 });
    blob(P([[head[0] - 1.05, head[1] - 0.5], [head[0] - 1.2, head[1] + 0.4], [head[0] - 0.6, head[1] + 1.3], [head[0] + 0.4, head[1] + 1.4], [head[0] + 1.05, head[1] + 0.8], [head[0] + 1.25, head[1] + 0.1], [head[0] + 1.6, head[1] - 0.3], [head[0] + 1.2, head[1] - 0.6], [head[0] + 1.15, head[1] - 1.0], [head[0] + 0.6, head[1] - 1.45], [head[0] - 0.3, head[1] - 1.4]]), {
      round: 0.9, tone: 1.22, hatch: hatch + 38, shadow: 0.5, spacing: 0.84,
      creases: [{ pts: P([[head[0] + 0.5, head[1] + 0.15], [head[0] + 0.85, head[1] + 0.05], [head[0] + 1.1, head[1] + 0.1]]), w: 0.05, depth: 0.1 }, { pts: P([[head[0] + 0.75, head[1] - 0.8], [head[0] + 1.05, head[1] - 0.75]]), w: 0.04, depth: 0.08 }],
    });
    locks(E, [
      P([[head[0] + 0.2, head[1] + 1.4], [head[0] - 1.6, head[1] + 1.8], [head[0] - 2.6, head[1] + 0.2], [head[0] - 3.0, head[1] - 2.4]]), P([[head[0] - 0.4, head[1] + 1.4], [head[0] - 1.8, head[1] + 1.0], [head[0] - 2.2, head[1] - 0.8], [head[0] - 2.2, head[1] - 3.0]]),
      P([[head[0] - 1.0, head[1] + 1.0], [head[0] - 1.6, head[1] - 0.2], [head[0] - 1.5, head[1] - 2.2]]), P([[head[0] + 0.6, head[1] + 1.4], [head[0] - 1.2, head[1] + 2.4], [head[0] - 3.2, head[1] + 1.2], [head[0] - 3.8, head[1] - 1.4]]),
    ], { w: 0.15, v: 0.5 });
    E.strands(P([[head[0] - 1.2, head[1] + 0.8], [head[0] - 2.8, head[1] - 0.6], [head[0] - 2.6, head[1] - 2.6]]), { n: 340, angle: (L.angle + 196), len: 1.8, jitter: 10, v: 0.5, spread: 0.7, seed: 61, curl: 0.5 });
  },
};
