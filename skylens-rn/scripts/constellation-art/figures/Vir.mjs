// The Maiden, on the wing, flying west along the ecliptic with her gown streaming out behind her
// and the harvest held down in one hand. Zavijava is her chin and nu her brow. Zaniah sits at the
// shoulder, Porrima at her breast, and Minelauva and Vindemiatrix on the wing's leading edge. Heze
// is her hip, tau and Syrma the two knees under the gown, and the last stars her feet. The arm
// runs down through theta to Spica, the ear of wheat itself. The wheat is the warm note.
import { wing, coverts } from '../kit.mjs';

export default {
  tier: 'extended',
  subject: 'The Maiden',
  pixels: 1100,
  anchors: [['Zavijava', 'chin'], ['ν Vir', 'brow'], ['Zaniah', 'shoulder'], ['Porrima', 'breast'], ['Minelauva', 'leading edge of the wing'], ['Vindemiatrix', 'wing'], ['θ Vir', 'forearm'], ['Spica', 'ear of wheat'], ['Heze', 'hip'], ['τ Vir', 'knee'], ['Syrma', 'knee'], [72220, 'foot'], ['μ Vir', 'foot']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const min = s('Minelauva'), vin = s('Vindemiatrix'), spi = s('Spica'), foot1 = s(72220), foot2 = s('μ Vir');

    // Far wing, rising behind the near one.
    wing(E, [[12.2, 3.2], [11.8, 8.4], [12.6, 13.4], [11.8, 18.4], [9.6, 23.0]], [[5.0, 27.2, 1.7], [2.2, 27.0, 1.7], [-0.6, 26.2, 1.7], [-3.0, 24.8, 1.7], [-5.0, 22.8, 1.7], [-6.4, 20.4, 1.7], [-7.0, 17.6, 1.7], [-7.0, 14.6, 1.7], [-6.0, 11.6, 1.7], [-4.0, 9.0, 1.7], [-1.4, 7.0, 1.7]], { tone: 0.92 });
    coverts(E, [[12.2, 3.6], [11.8, 8.6], [12.4, 13.6], [11.6, 18.0]], 205, 5.4, 0.86, { n: 13, turn: -46, grow: 0.4, tone: 0.86 });

    // Far arm, stretched ahead, leading the flight.
    limb([[14.4, 0.8, 1.2], [18.2, -1.6, 0.94], [21.4, -2.8, 0.62]], { tone: 1.0, hatch: 24, shadow: 0.3, creases: [{ pts: [[16.2, -1.4], [18.4, -2.3], [20.6, -3.0]], w: 0.09, depth: 0.14 }], bumps: [{ at: [17.0, -0.8], r: [1.6, 0.6], angle: 28, h: 0.2 }] });
    blob([[21.2, -2.1], [22.4, -2.1], [24.4, -2.4, 'c'], [23.2, -2.7], [24.2, -3.2, 'c'], [22.8, -3.4], [21.2, -3.3]], { round: 0.26, tone: 1.2, hatch: 10, shadow: 0.3 });

    // Bare feet, trailing past the hems, toes pointed.
    limb([[-19.6, foot1[1] + 0.4, 0.74], [foot1[0] + 0.8, foot1[1] + 0.1, 0.6], [foot1[0] - 0.8, foot1[1] - 0.3, 0.32], [foot1[0] - 1.8, foot1[1] - 0.8, 0.08]], { tone: 1.1, hatch: 80, shadow: 0.3 });
    limb([[-19.4, foot2[1] + 0.2, 0.74], [foot2[0] + 0.3, foot2[1] + 0.1, 0.6], [foot2[0] - 1.3, foot2[1] - 0.3, 0.32], [foot2[0] - 2.4, foot2[1] - 0.8, 0.08]], { tone: 1.18, hatch: 80, shadow: 0.3 });

    // The gown: a single long sweep, close on the body, breaking into two streams over the legs.
    const gown = [[14.2, 2.4], [11.6, 2.5], [8.8, 1.7], [2.0, 1.0], [-4.0, 2.6], [-10.0, 3.8], [-15.6, 4.0], [-20.8, 5.2, 'c'], [-20.0, 3.0], [-21.4, 0.9, 'c'], [-16.6, 0.5], [-12.0, -1.2, 'c'], [-15.6, -3.0], [-20.4, -3.0, 'c'], [-19.6, -5.2], [-21.0, -7.8, 'c'], [-15.0, -7.5], [-8.0, -5.8], [-2.6, -4.6], [2.0, -4.0], [6.0, -4.6], [10.0, -4.4], [13.2, -2.6], [14.8, -0.4]];
    blob(gown, {
      round: 2.2, tone: 1.26, hatch: 8, shadow: 0.5, band: 0.8,
      creases: [
        { pts: [[8.4, 0.6], [2.0, -0.4], [-4.0, 0.8], [-11.0, 2.0], [-18.0, 2.8]], w: 0.2, depth: 0.3 }, { pts: [[6.6, -1.0], [0.6, -2.0], [-5.0, -1.4], [-11.0, -0.6]], w: 0.2, depth: 0.3 },
        { pts: [[6.4, -3.0], [0.4, -3.0], [-6.0, -3.2], [-12.0, -3.6], [-18.8, -4.4]], w: 0.2, depth: 0.3 }, { pts: [[-4.0, -3.8], [-10.0, -5.0], [-15.0, -6.2], [-20.0, -6.8]], w: 0.18, depth: 0.26 },
        { pts: [[-13.0, 3.0], [-16.0, 1.6], [-20.0, 1.4]], w: 0.16, depth: 0.22 }, 
        { pts: [[9.0, 1.4], [8.2, -1.0], [8.8, -4.0]], w: 0.14, depth: 0.2 }, { pts: [[10.6, 1.8], [12.0, -0.4], [12.4, -2.4]], w: 0.1, depth: 0.14 },
      ],
      bumps: [{ at: [11.0, -2.0], r: [2.2, 1.9], h: 0.74 }, { at: [-4.8, -0.6], r: [4.6, 2.8], h: 0.6 }, { at: [-11.4, 1.8], r: [3.0, 1.3], h: 0.4 }, { at: [-15.0, -5.4], r: [3.2, 1.2], h: 0.4 }],
    });
    // A twisted girdle high under the bust, its ends flying.
    limb([[8.8, 1.9, 0.26], [8.0, -1.0, 0.3], [8.6, -4.2, 0.26]], { tone: 1.4, hatch: 86, shadow: 0.34, melt: 0 });
    limb([[8.2, 1.8, 0.2], [5.0, 3.0, 0.17], [1.4, 2.6, 0.14], [-2.4, 4.4, 0.05]], { tone: 1.3, shadow: 0.2, melt: 0 });

    // Near wing, Minelauva and Vindemiatrix on its leading edge.
    const edge = [[10.0, 1.4], [min[0] + 0.8, min[1] + 0.4], [6.0, 7.6], [vin[0], vin[1]], [3.0, 15.6], [0.8, 20.2]];
    wing(E, edge, [[-3.0, 24.2, 1.9], [-6.4, 23.6, 1.9], [-9.4, 22.4, 1.9], [-12.2, 20.8, 1.9], [-14.6, 18.8, 1.9], [-16.4, 16.6, 1.9], [-17.6, 14.2, 1.9], [-18.2, 11.8, 1.9], [-18.2, 9.6, 1.9], [-17.2, 7.6, 1.9], [-15.6, 6.2, 1.8], [-13.4, 5.2, 1.7], [-10.8, 4.6, 1.6], [-8.0, 4.2, 1.5]], { tone: 1.32 });
    coverts(E, [[9.4, 2.4], [6.8, 6.4], [4.6, 11.0], [3.6, 15.6]], 196, 7.4, 1.0, { n: 14, turn: -34, grow: 0.34, tone: 1.26 });
    coverts(E, [[9.8, 2.2], [7.4, 6.2], [5.2, 10.8], [4.2, 15.0]], 188, 3.8, 0.8, { n: 15, turn: -30, grow: 0.2, tone: 1.38 });
    limb(edge.map((p, i) => [...p, [1.0, 0.76, 0.66, 0.56, 0.4, 0.1][i]]), { tone: 1.34, hatch: 70, shadow: 0.4, melt: 0.3, band: 0.3, creases: [{ pts: [[9.2, 2.4], [6.4, 7.0], [4.4, 12.0], [3.6, 15.0]], w: 0.07, depth: 0.1 }] });

    // Hair, streaming out on the wind behind the head.
    blob([[20.6, 7.0], [17.6, 7.4], [13.4, 6.4], [9.8, 6.6], [6.6, 5.6, 'c'], [10.2, 4.6], [13.6, 4.0], [17.0, 3.4], [20.0, 3.4]], { round: 0.9, tone: 1.2, hatch: 4, shadow: 0.5, band: 0.4, relief: 0.3, creases: [{ pts: [[19.0, 6.0], [14.4, 5.4], [9.0, 5.6]], w: 0.12, depth: 0.18 }, { pts: [[18.6, 4.6], [14.6, 4.6], [10.6, 4.8]], w: 0.1, depth: 0.14 }] });
    for (const pts of [[[20.8, 7.0], [16.6, 8.0], [12.0, 7.0], [7.4, 7.6]], [[20.0, 6.0], [15.6, 6.4], [11.0, 5.4], [5.4, 5.6]], [[19.8, 4.8], [15.8, 4.2], [11.0, 4.2], [7.4, 3.8]], [[20.4, 6.6], [16.0, 7.0], [12.4, 6.2], [9.0, 6.4]], [[20.0, 5.2], [16.0, 5.2], [12.0, 4.8], [8.6, 4.8]]]) { line(pts, { w: 0.13, v: 0.66 }); line(pts.map((p) => [p[0], p[1] - 0.12]), { w: 0.045, v: 0.9 }); }

    // Neck and head, chin lifted toward the west.
    limb([[14.2, 1.4, 1.5], [17.0, 2.4, 1.24], [19.6, 3.3, 1.1]], { tone: 1.3, hatch: 80, shadow: 0.5, creases: [{ pts: [[15.6, 0.8], [17.4, 1.4], [19.0, 2.2]], w: 0.09, depth: 0.12 }] });
    const c = [21.6, 4.9], k = 2.3;
    const Q = (pts) => pts.map(([f, u, ...r]) => [c[0] + f * k, c[1] + u * k, ...r]);
    blob(Q([[-1.05, -0.5], [-1.15, 0.4], [-0.6, 1.2], [0.3, 1.3], [0.9, 0.8], [1.1, 0.2], [1.4, -0.3], [1.05, -0.5], [1.0, -0.9], [0.5, -1.3], [-0.3, -1.25]]), {
      round: 1.5, tone: 1.56, hatch: 40, shadow: 0.55, spacing: 0.86,
      creases: [{ pts: Q([[0.34, 0.14], [0.7, 0.26], [1.0, 0.1]]), w: 0.1, depth: 0.2 }, { pts: Q([[0.72, -0.72], [0.98, -0.66]]), w: 0.05, depth: 0.1 }, { pts: Q([[0.96, -0.28], [1.2, -0.32], [1.1, -0.46]]), w: 0.05, depth: 0.08 }],
      bumps: [{ at: [c[0] + 0.6, c[1] - 1.0], r: [0.9, 0.7], h: 0.2 }],
    });
    line(Q([[0.48, 0.06], [0.72, 0.12], [0.94, 0.04]]), { w: 0.07, v: 1 });
    for (const pts of [[[0.86, 0.9], [0.2, 1.46], [-0.7, 1.3], [-1.3, 0.5]], [[0.5, 1.16], [-0.3, 1.2], [-1.0, 0.7], [-1.2, -0.2]], [[0.9, 0.7], [0.3, 1.0], [-0.3, 0.8], [-0.8, 0.2]], [[-0.1, 1.3], [-0.8, 1.0], [-1.1, 0.2], [-1.0, -0.8]]]) { line(Q(pts), { w: 0.14, v: 0.72 }); line(Q(pts.map((p) => [p[0], p[1] - 0.05])), { w: 0.05, v: 0.94 }); }
    // Fillet through the hair.
    limb(Q([[1.0, 0.66, 0.1], [0.3, 0.92, 0.12], [-0.7, 0.8, 0.1], [-1.14, 0.2, 0.08]]), { tone: 1.5, shadow: 0.24, melt: 0 });

    // The sheaf: stalks through the fist, the bearded ears fanned to Spica. Each grain by hand.
    const hand = [-0.6, -8.7];
    const ear = (a, l, far) => {
      const t = (a * Math.PI) / 180, dx = Math.cos(t), dy = Math.sin(t), nx = -dy, ny = dx;
      const b0 = [hand[0] - dx * 3.2, hand[1] - dy * 3.2], b1 = [hand[0] + dx * 1.5, hand[1] + dy * 1.5], tip = [b1[0] + dx * l, b1[1] + dy * l];
      line([b0, hand, b1], { w: 0.1, v: far ? 0.6 : 0.8, warm: 0.5, taper: false });
      for (let i = 0; i <= 8; i++) {
        const u = i / 8, x = b1[0] + dx * l * u, y = b1[1] + dy * l * u, r = 0.62 * (1 - u * 0.5);
        for (const side of [1, -1]) {
          const q = [x + nx * r * side * 0.74 + dx * 0.42, y + ny * r * side * 0.74 + dy * 0.42];
          limb([[x, y, r * 0.42], [q[0], q[1], r * 0.54], [q[0] + dx * 0.5, q[1] + dy * 0.5, 0.05]], { tone: far ? 1.3 : 1.6, warm: 0.76, shadow: 0.34, melt: 0, band: 0.1 });
          line([q, [q[0] + (dx + nx * side * 0.34) * 1.0, q[1] + (dy + ny * side * 0.34) * 1.0]], { w: 0.024, v: 0.46, warm: 0.7 });
        }
      }
      line([b1, tip], { w: 0.06, v: 0.9, warm: 0.7, taper: false });
    };
    const main = (Math.atan2(spi[1] - hand[1], spi[0] - hand[0]) * 180) / Math.PI;
    for (const [da, l, far] of [[-40, 4.2, true], [40, 4.2, true], [-20, 5.2, false], [20, 5.2, false], [0, 6.0, false]]) ear(main + da, l, far);

    // Near arm, shoulder over Zaniah's side, reaching down through theta with the sheaf.
    limb([[12.6, 0.2, 1.76], [8.8, -3.4, 1.42], [5.6, -5.4, 1.1]], {
      tone: 1.36, hatch: 54, shadow: 0.6, creases: [{ pts: [[10.8, -3.2], [8.4, -4.8], [6.4, -6.0]], w: 0.13, depth: 0.2 }],
      bumps: [{ at: [12.0, 0.0], r: [1.4, 1.2], h: 0.42 }, { at: [8.8, -3.2], r: [2.0, 0.9], angle: 42, h: 0.3 }],
    });
    limb([[5.6, -5.4, 1.06], [2.4, -5.7, 1.1], [0.3, -7.6, 0.66]], {
      tone: 1.36, hatch: 20, shadow: 0.55, creases: [{ pts: [[4.0, -6.2], [2.2, -6.5], [0.8, -7.6]], w: 0.09, depth: 0.14 }],
      bumps: [{ at: [5.6, -5.4], r: [0.7, 0.7], h: 0.24 }, { at: [3.2, -5.4], r: [1.4, 0.7], h: 0.24 }],
    });
    limb([[1.5, -7.0, 0.72], [0.8, -7.7, 0.72]], { tone: 1.5, warm: 0, shadow: 0.3, melt: 0, band: 0.14 });
    blob([[0.6, -7.2], [-0.8, -7.3], [-1.8, -8.1], [-1.9, -9.2], [-1.0, -9.9], [0.2, -9.6], [0.9, -8.5]], {
      round: 0.46, tone: 1.5, hatch: 30, shadow: 0.55,
      creases: [{ pts: [[-0.2, -7.3], [-0.9, -8.2], [-0.5, -9.7]], w: 0.05, depth: 0.09 }, { pts: [[-1.0, -7.5], [-1.5, -8.3], [-1.2, -9.5]], w: 0.05, depth: 0.09 }, { pts: [[0.4, -7.6], [-0.2, -8.4], [0.1, -9.4]], w: 0.05, depth: 0.09 }],
    });
  },
};
