// The Charioteer, driving east with the reins taut in one fist, the she-goat slung across his
// shoulders and her two kids riding in a sling at his side, as the old stories have them. The
// crest of his helmet reaches delta. Menkalinan is his shoulder, Capella the goat herself, Almaaz
// her dangling foreleg, the Haedi the two kids, Mahasim the rail of the car, Hassaleh its tail and
// Elnath the bottom of the wheel. The warm note is the hub of the wheel and the yoke.
import { frame, fur, hoof } from '../kit.mjs';

export default {
  tier: 'extended',
  subject: 'The Charioteer',
  pixels: 1100,
  anchors: [[28358, 'crest of the helmet'], ['Menkalinan', 'shoulder'], ['Capella', 'the she-goat'], ['Almaaz', "goat's foreleg"], ['Haedus', 'kid'], ['Saclateni', 'kid'], ['Mahasim', 'chariot rail'], ['Hassaleh', 'chariot tail'], ['Elnath', 'rim of the wheel']],
  draw({ s, E }) {
    const { blob, limb, line, strands } = E;
    const L = frame([-1.0, -4.0], s(28358), -1);
    const P = (pts) => pts.map(([f, u, ...rest]) => [...L(f, u), ...rest]);
    const hatch = L.angle;
    const elb = L.back(s('Elnath')), alm = L.back(s('Almaaz')), had = L.back(s('Haedus')), sac = L.back(s('Saclateni'));

    // Chariot pole, sweeping forward from under the car to the yoke.
    limb(P([[4.0, -6.2, 0.36], [11.0, -6.0, 0.32], [17.0, -3.8, 0.3], [20.4, -0.8, 0.26]]), { tone: 1.2, hatch: hatch + 80, shadow: 0, melt: 0, band: 0.2 });
    limb(P([[19.2, -2.6, 0.26], [20.4, -0.6, 0.34], [21.6, 1.4, 0.26]]), { tone: 1.4, warm: 0.72, hatch, shadow: 0.3, melt: 0 });

    // Far wheel behind the car, seen just past the near one.
    const wheel = (c, r, tone, warm) => {
      const pts = [];
      for (let i = 0; i <= 32; i++) { const t = (i / 32) * Math.PI * 2; pts.push([c[0] + Math.cos(t) * r, c[1] + Math.sin(t) * r, 0.34]); }
      limb(P(pts), { tone, hatch: hatch + 30, shadow: 0.4, melt: 0, band: 0.2 });
      for (let i = 0; i < 8; i++) {
        const t = (i / 8) * Math.PI * 2 + 0.2, q = [c[0] + Math.cos(t) * r, c[1] + Math.sin(t) * r];
        limb(P([[c[0] + Math.cos(t) * 0.5, c[1] + Math.sin(t) * 0.5, 0.2], [(c[0] + q[0]) / 2, (c[1] + q[1]) / 2, 0.15], [...q, 0.22]]), { tone: tone * 0.96, hatch: hatch + 60, shadow: 0.3, melt: 0, band: 0.16 });
      }
      blob(P([[c[0] - 0.8, c[1]], [c[0], c[1] + 0.8], [c[0] + 0.8, c[1]], [c[0], c[1] - 0.8]]), { round: 0.56, tone: tone * 1.2, warm, shadow: 0.4, creases: [{ pts: P([[c[0] - 0.3, c[1]], [c[0], c[1] + 0.3], [c[0] + 0.3, c[1]], [c[0], c[1] - 0.3], [c[0] - 0.3, c[1]]]), w: 0.05, depth: 0.1 }] });
    };
    const wc = [elb[0] + 0.5, elb[1] + 3.3];
    wheel([wc[0] + 2.0, wc[1] + 0.8], 3.5, 0.88, 0.3);

    // His legs, braced apart inside the car.
    limb(P([[-1.0, 1.6, 2.2], [-2.0, -2.0, 1.7], [-2.2, -4.4, 1.2]]), { tone: 0.92, hatch: hatch + 80, shadow: 0.3 });
    limb(P([[1.6, 1.6, 2.2], [3.0, -2.0, 1.7], [2.6, -4.4, 1.2]]), { tone: 0.96, hatch: hatch + 80, shadow: 0.3 });

    // Reins, three taut lines from the fist to the yoke.
    for (const [a, b] of [[[9.4, 6.0], [20.6, 0.4]], [[9.4, 6.2], [20.9, 1.0]], [[9.6, 5.8], [20.2, -0.2]]]) line(P([a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 0.16], b]), { w: 0.042, v: 0.8, taper: false });

    // Tunic, wind-pressed on the body, gathered at the belt.
    blob(P([[-3.6, 10.6], [-1.0, 11.8], [1.6, 11.8], [4.2, 10.4], [4.6, 8.4], [3.4, 5.8], [2.8, 3.6], [3.6, 1.2], [4.0, -1.8], [-3.8, -1.8], [-3.2, 1.2], [-2.8, 3.6], [-3.4, 5.8], [-4.2, 8.4]]), {
      round: 2.0, tone: 1.42, hatch: hatch + 68, shadow: 0.55, band: 0.7,
      creases: [
        { pts: P([[2.6, 10.6], [1.6, 7.6], [0.8, 4.6]]), w: 0.17, depth: 0.25 }, { pts: P([[-1.2, 10.8], [-0.8, 7.6], [-0.4, 4.6]]), w: 0.17, depth: 0.25 }, { pts: P([[3.8, 9.0], [2.6, 7.0], [2.0, 4.6]]), w: 0.14, depth: 0.2 }, { pts: P([[-3.0, 9.0], [-2.2, 7.0], [-1.8, 4.6]]), w: 0.14, depth: 0.2 },
        { pts: P([[-2.4, 2.8], [-2.6, 0.6], [-3.0, -1.6]]), w: 0.16, depth: 0.24 }, { pts: P([[-0.6, 2.8], [-0.8, 0.4], [-0.8, -1.6]]), w: 0.16, depth: 0.24 }, { pts: P([[1.0, 2.8], [1.2, 0.4], [1.2, -1.6]]), w: 0.16, depth: 0.24 }, { pts: P([[2.4, 2.8], [2.8, 0.6], [3.2, -1.6]]), w: 0.14, depth: 0.2 },
      ],
      bumps: [{ at: L(-1.2, 8.8), r: [1.8, 1.5], h: 0.4 }, { at: L(1.6, 8.8), r: [1.8, 1.5], h: 0.4 }],
    });
    limb(P([[-2.9, 3.6, 0.28], [0.0, 3.1, 0.32], [2.9, 3.6, 0.28]]), { tone: 1.36, hatch: hatch + 86, flat: 0.5, shadow: 0.4, melt: 0 });

    // The car: a light basket of bent wood, its front rail rising to Mahasim.
    const carTop = [[8.0, 3.8], [6.4, 2.2], [3.2, 0.4], [-1.4, -0.6], [-5.2, -1.4], [-7.4, -2.4]];
    blob(P([...carTop, [-8.0, -6.8, 'c'], [-3.4, -7.0], [3.2, -7.2], [8.8, -6.4, 'c'], [9.8, -2.2]]), {
      round: 1.5, tone: 1.3, hatch: hatch + 86, shadow: 0.62, band: 0.7, spacing: 0.9,
      creases: [
        { pts: P([[-6.8, -3.4], [-1.0, -2.2], [4.0, -1.4], [8.6, 0.8]]), w: 0.15, depth: 0.22 }, { pts: P([[-7.2, -5.8], [-1.0, -6.0], [4.0, -6.0], [8.6, -5.4]]), w: 0.15, depth: 0.22 },
        { pts: P([[6.8, 0.8], [6.4, -2.6], [7.0, -5.4]]), w: 0.13, depth: 0.2 }, { pts: P([[3.0, -1.0], [3.2, -3.4], [3.4, -5.8]]), w: 0.1, depth: 0.14 }, { pts: P([[-5.0, -2.6], [-5.2, -4.2], [-5.2, -5.8]]), w: 0.1, depth: 0.14 },
      ],
      bumps: [{ at: L(5.4, -3.4), r: [2.0, 1.8], h: 0.34 }],
    });
    // A scroll on the car's flank, cut by hand.
    line(P([[8.6, -1.6], [7.8, -0.8], [6.8, -1.2], [6.8, -2.4], [7.6, -2.8], [8.2, -2.2], [7.8, -1.7]]), { w: 0.07, v: 0.86 });
    line(P([[-3.2, -4.4], [-1.2, -3.4], [1.0, -3.8], [2.4, -5.0]]), { w: 0.07, v: 0.7 });
    limb(P(carTop.map((p) => [...p, 0.26])), { tone: 1.46, hatch: hatch + 80, shadow: 0.3, melt: 0, band: 0.2 });
    limb(P([[8.0, 3.8, 0.3], [8.8, 4.8, 0.2], [8.2, 5.4, 0.08]]), { tone: 1.4, shadow: 0, melt: 0 });

    wheel(wc, 3.5, 1.3, 0.8);

    // The kids' sling: a fold of cloth from his shoulder, two small heads looking out.
    limb(P([[-3.4, 9.6, 0.34], [-5.6, 6.0, 0.3], [-5.0, 3.0, 0.28]]), { tone: 1.2, hatch: hatch + 50, shadow: 0.34, melt: 0 });
    const kid = (at, d, tone) => {
      const K = (x, y) => [at[0] + x * d, at[1] + y];
      for (const [a, b] of [[[0.1, 0.6], [-0.3, 1.4]], [[0.5, 0.7], [0.5, 1.5]]]) limb(P([[...K(...a), 0.14], [...K(...b), 0.05]]), { tone: 1.3, hatch: hatch, shadow: 0.2, melt: 0 });
      blob(P([K(-0.5, 0.5), K(0.2, 0.9), K(0.8, 0.5), K(1.3, -0.1), K(1.5, -0.6), K(1.0, -0.8), K(0.2, -0.5), K(-0.5, -0.5)]), { round: 0.4, tone, hatch: hatch + 50, shadow: 0.44, band: 0.2 });
      blob(P([K(-0.5, 0.5), [...K(-1.3, 0.8), 'c'], K(-0.9, 0.1), K(-0.5, 0.0)]), { round: 0.14, tone, hatch, shadow: 0.3, band: 0.1 });
      line(P([K(0.5, 0.1), K(0.66, 0.16)]), { w: 0.07, v: 1 });
    };
    kid([had[0] + 0.4, had[1] + 0.4], 1, 1.5);
    kid([sac[0] + 0.3, sac[1] + 0.1], -1, 1.4);
    blob(P([[-3.0, 3.8], [-3.4, 2.6], [-4.8, 2.2], [-6.4, 2.0], [-7.8, 2.4], [-8.2, 1.2], [-7.2, -0.4], [-5.0, -1.2], [-3.0, -0.6], [-2.4, 1.4]]), {
      round: 0.9, tone: 1.26, hatch: hatch + 20, shadow: 0.6, band: 0.4,
      creases: [{ pts: P([[-7.4, 1.4], [-5.4, 1.0], [-3.2, 2.0]]), w: 0.13, depth: 0.2 }, { pts: P([[-7.0, 0.4], [-5.0, 0.0], [-3.0, 0.8]]), w: 0.13, depth: 0.2 }],
    });

    // Rein arm, thrust forward from Menkalinan.
    limb(P([[3.4, 9.2, 1.5], [5.4, 7.6, 1.2], [7.2, 6.0, 0.98]]), {
      tone: 1.3, hatch: hatch + 40, shadow: 0.6, creases: [{ pts: P([[3.4, 7.2], [5.2, 6.0], [6.8, 5.0]]), w: 0.11, depth: 0.16 }],
      bumps: [{ at: L(3.6, 9.2), r: [1.3, 1.3], h: 0.4 }],
    });
    limb(P([[7.2, 6.0, 0.94], [8.4, 6.6, 0.92], [9.4, 6.2, 0.56]]), { tone: 1.3, hatch: hatch + 10, shadow: 0.55, bumps: [{ at: L(7.2, 6.0), r: [0.6, 0.6], h: 0.24 }] });
    blob(P([[9.0, 7.0], [10.4, 7.0], [10.8, 6.0], [10.4, 5.2], [9.2, 5.2], [8.9, 6.0]]), {
      round: 0.46, tone: 1.46, hatch: hatch + 30, shadow: 0.55,
      creases: [{ pts: P([[9.2, 6.8], [9.9, 6.4], [10.7, 6.5]]), w: 0.05, depth: 0.09 }, { pts: P([[9.1, 6.1], [9.9, 5.9], [10.7, 5.9]]), w: 0.05, depth: 0.09 }],
    });

    // Neck, head and helmet. The goat comes last, across his far shoulder.
    limb(P([[0.2, 10.6, 1.4], [0.5, 12.2, 1.14]]), { tone: 1.2, hatch: hatch + 88, shadow: 0.5 });
    const c = [0.6, 14.0], k = 1.42;
    const H = (f, u) => [c[0] + f * k, c[1] + u * k];
    const Q = (pts) => P(pts.map(([f, u, ...r]) => [...H(f, u), ...r]));
    for (const pts of [[[-1.0, 0.4], [-1.9, 0.2], [-2.6, -0.8]], [[-1.0, 0.0], [-1.9, -0.4], [-2.4, -1.5]], [[-0.9, -0.5], [-1.5, -1.0], [-1.8, -1.9]]]) line(Q(pts), { w: 0.14, v: 0.74 });
    blob(Q([[-1.2, -0.8], [-1.5, 0.5], [-0.8, 1.6], [0.4, 1.7], [1.2, 1.0], [1.45, 0.2], [1.75, -0.2], [1.35, -0.5], [1.35, -1.0], [1.1, -1.4], [0.5, -1.75], [-0.2, -1.5], [-0.8, -1.2]]), {
      round: 1.2, tone: 1.56, hatch: hatch + 40, shadow: 0.55, spacing: 0.86,
      creases: [{ pts: Q([[0.5, 0.3], [0.95, 0.4], [1.3, 0.22]]), w: 0.1, depth: 0.22 }, { pts: Q([[0.9, -0.95], [1.22, -0.9]]), w: 0.06, depth: 0.12 }, { pts: Q([[1.3, -0.28], [1.5, -0.34], [1.4, -0.52]]), w: 0.05, depth: 0.1 }],
      bumps: [{ at: H(1.32, -0.2), r: [0.4, 0.6], h: 0.2 }],
    });
    line(Q([[0.72, 0.17], [0.98, 0.22], [1.2, 0.14]]), { w: 0.06, v: 1 });
    blob(Q([[1.42, 0.76], [0.6, 0.8], [-0.6, 0.66], [-1.56, 0.1], [-1.66, 0.9], [-1.1, 1.8], [0.0, 2.1], [1.0, 1.9], [1.5, 1.3]]), {
      round: 0.7, tone: 1.46, hatch: hatch + 14, shadow: 0.5, band: 0.3,
      creases: [{ pts: Q([[-1.5, 0.44], [0.0, 1.0], [1.46, 1.0]]), w: 0.1, depth: 0.16 }],
    });
    // Crest, the horsehair plume climbing to delta.
    limb(Q([[1.1, 1.7, 0.1], [0.5, 2.5, 0.14], [-0.3, 2.7, 0.14], [-1.3, 2.3, 0.08]]), { tone: 1.4, shadow: 0.3, melt: 0 });
    strands(Q([[0.9, 2.0], [0.3, 2.6], [-0.5, 2.7], [-1.3, 2.3]]), { n: 200, angle: 8, len: 1.7, jitter: 14, v: 0.74, spread: 0.2, seed: 13, w: 0.036 });

    // The she-goat, slung on his far shoulder, forelegs drawn down, rump by his neck.
    const hip = [-1.2, 11.0], chest = [-8.2, 8.4];
    limb(P([[alm[0] + 0.2, alm[1] + 2.6, 0.66], [alm[0] + 0.2, alm[1] + 0.2, 0.4], [alm[0] + 0.4, alm[1] - 1.0, 0.28]]), { tone: 1.2, hatch: hatch + 86, shadow: 0.45 });
    hoof(E, L(alm[0] + 0.4, alm[1] - 1.2), 0.6, hatch - 90 + 20 + 180 + 0, { tone: 1.2 });
    limb(P([[-8.8, 7.6, 0.6], [-9.2, 5.4, 0.36], [-9.0, 4.2, 0.26]]), { tone: 1.1, hatch: hatch + 86, shadow: 0.4 });
    const body = [[-0.6, 12.6], [-3.4, 12.6], [-6.8, 11.8], [-9.0, 11.0], [-10.0, 9.2], [-9.4, 7.0], [-7.2, 6.0], [-5.0, 6.0], [-2.6, 7.2], [-0.6, 8.6], [0.2, 10.8]];
    blob(P(body), {
      round: 1.5, tone: 1.46, hatch: hatch + 10, shadow: 0.66, band: 0.6,
      creases: [{ pts: P([[-7.8, 11.0], [-7.2, 9.0], [-7.6, 6.8]]), w: 0.16, depth: 0.24 }, { pts: P([[-3.2, 12.0], [-3.4, 10.0], [-3.0, 8.4]]), w: 0.14, depth: 0.2 }, { pts: P([[-5.2, 11.6], [-5.4, 9.4], [-5.2, 7.2]]), w: 0.1, depth: 0.12 }],
      bumps: [{ at: L(...chest), r: [1.5, 1.8], h: 0.4 }, { at: L(...hip), r: [1.5, 1.6], h: 0.4 }],
    });
    fur(E, P(body.map((p) => p.slice(0, 2))), { n: 1800, angle: 262, len: 0.95, jitter: 13, v: 0.7, lit: 0.26, seed: 19, w: 0.03, curl: 1 });
    // Shag at the belly.
    strands(P([[-8.6, 6.2], [-6.2, 5.8], [-3.4, 7.0], [-1.0, 8.0]]), { n: 170, angle: 266, len: 1.3, jitter: 10, v: 0.6, spread: 0.2, seed: 21, w: 0.03 });

    // Her head, thrown back, the long beard and the curved horns.
    limb(P([[-8.6, 10.2, 1.4], [-10.2, 11.2, 1.16], [-11.2, 12.0, 0.9]]), { tone: 1.36, hatch: hatch + 50, shadow: 0.44 });
    limb(P([[-10.8, 13.2, 0.3], [-11.6, 15.0, 0.26], [-13.4, 16.0, 0.16], [-15.0, 15.2, 0.03]]), { tone: 1.3, hatch: hatch + 40, shadow: 0.3, melt: 0 });
    limb(P([[-11.8, 13.0, 0.28], [-12.8, 14.2, 0.24], [-14.6, 14.4, 0.14], [-15.6, 13.4, 0.03]]), { tone: 1.14, hatch: hatch + 40, shadow: 0.3, melt: 0 });
    blob(P([[-10.0, 13.0], [-11.4, 13.6], [-12.6, 13.0], [-13.6, 11.8], [-14.8, 10.6], [-15.0, 9.8], [-14.2, 9.5], [-12.8, 10.0], [-11.4, 10.6], [-10.2, 11.4]]), {
      round: 0.8, tone: 1.6, hatch: hatch + 54, shadow: 0.55, band: 0.4,
      creases: [{ pts: P([[-14.9, 10.0], [-13.8, 10.3], [-12.8, 10.6]]), w: 0.06, depth: 0.1 }, { pts: P([[-14.5, 10.5], [-14.2, 10.3], [-14.2, 10.7]]), w: 0.05, depth: 0.09 }],
      bumps: [{ at: L(-12.2, 12.2), r: [0.5, 0.42], h: 0.16 }],
    });
    line(P([[-12.6, 12.0], [-12.2, 12.26], [-11.8, 12.2]]), { w: 0.07, v: 1 });
    blob(P([[-10.4, 13.0], [-9.4, 13.6], [-8.2, 13.6, 'c'], [-9.0, 12.6], [-10.2, 12.2]]), { round: 0.24, tone: 1.3, hatch: hatch + 10, shadow: 0.4, creases: [{ pts: P([[-10.0, 12.8], [-9.2, 13.0], [-8.6, 13.3]]), w: 0.05, depth: 0.08 }] });
    strands(P([[-13.8, 9.7], [-12.8, 9.9]]), { n: 110, angle: L.angle - 76, len: 2.1, jitter: 7, v: 0.84, spread: 0.1, seed: 23, w: 0.04 });

    // Goat arm: from the shoulder at Capella's side, up to hold her forelegs.
    limb(P([[-4.4, 7.2, 1.3], [-6.8, 5.6, 1.0], [alm[0] - 0.8, alm[1] + 0.8, 0.7]]), {
      tone: 1.34, hatch: hatch + 30, shadow: 0.55, creases: [{ pts: P([[-4.4, 5.4], [-6.0, 4.4], [-7.4, 4.4]]), w: 0.09, depth: 0.14 }],
      bumps: [{ at: L(-4.4, 7.2), r: [1.0, 1.0], h: 0.3 }],
    });
    blob(P([[alm[0] - 0.9, alm[1] + 1.4], [alm[0] + 0.3, alm[1] + 1.6], [alm[0] + 1.0, alm[1] + 0.8], [alm[0] + 0.7, alm[1] - 0.2], [alm[0] - 0.4, alm[1] - 0.3], [alm[0] - 1.2, alm[1] + 0.3]]), {
      round: 0.46, tone: 1.46, hatch: hatch + 30, shadow: 0.5,
      creases: [{ pts: P([[alm[0] - 0.6, alm[1] + 1.0], [alm[0] + 0.2, alm[1] + 0.9], [alm[0] + 1.0, alm[1] + 1.0]]), w: 0.05, depth: 0.09 }, { pts: P([[alm[0] - 0.8, alm[1] + 0.4], [alm[0] + 0.1, alm[1] + 0.3], [alm[0] + 0.9, alm[1] + 0.4]]), w: 0.05, depth: 0.09 }],
    });
  },
};
