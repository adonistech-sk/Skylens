// The Bird of Paradise, legless as the old voyagers believed it, flying east. Its neat group of
// stars makes the head and breast: Beta on the nape, Gamma at the throat, Delta on the breast, and
// Alpha at the root of the tail, where the long filmy plumes pour out behind it.
export default {
  tier: 'extended',
  subject: 'The Bird of Paradise',
  pixels: 1000,
  anchors: [['β Aps', 'nape'], ['γ Aps', 'throat'], [80047, 'breast'], ['α Aps', 'tail root']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const bet = s('β Aps'), gam = s('γ Aps'), del = s(80047), alp = s('α Aps');

    // The two wire tail streamers, thrown high, each closing on a little disc.
    limb([[3.4, -0.4, 0.13], [7.6, 3.0, 0.1], [12.4, 3.8, 0.09], [17.0, 6.4, 0.09], [18.6, 9.0, 0.09], [17.2, 10.6, 0.08], [15.4, 9.8, 0.07], [15.9, 8.4, 0.06]], { tone: 1.24, hatch: 10, shadow: 0.2, melt: 0, warm: 0.2 });
    limb([[3.6, -0.8, 0.13], [8.6, 0.8, 0.1], [13.6, -0.4, 0.09], [18.4, 0.4, 0.09], [20.6, 2.8, 0.09], [19.4, 4.6, 0.08], [17.6, 4.0, 0.07], [18.0, 2.6, 0.06]], { tone: 1.24, hatch: 10, shadow: 0.2, melt: 0, warm: 0.2 });

    // The plumes: a broad fall of long feathers, each with loose fine strokes running off it.
    const plume = (root, c1, c2, tip, w, tone) => {
      limb([[...root, w * 0.5], [...c1, w], [...c2, w * 0.82], [...tip, w * 0.06]], { flat: 0.4, tone, hatch: 70, shadow: 0.26, melt: 0, band: 0.3, creases: [{ pts: [root, c1, c2, tip], w: 0.05, depth: 0.05 }] });
    };
    const stream = (i, n) => {
      const t = i / (n - 1);
      const tipA = -158 * 0 + (-6 - t * 52), R = 15.2 - Math.abs(t - 0.5) * 3.6;
      const q = (tipA * Math.PI) / 180;
      const root = [2.4 + t * 0.4, -0.6 - t * 1.0];
      const tip = [root[0] + Math.cos(q) * R, root[1] + Math.sin(q) * R];
      const bow = 1.6 - t * 3.2;
      const c1 = [root[0] + (tip[0] - root[0]) * 0.34 - Math.sin(q) * bow, root[1] + (tip[1] - root[1]) * 0.34 + Math.cos(q) * bow];
      const c2 = [root[0] + (tip[0] - root[0]) * 0.7 - Math.sin(q) * bow * 0.7, root[1] + (tip[1] - root[1]) * 0.7 + Math.cos(q) * bow * 0.7];
      return { root, tip, c1, c2, q };
    };
    const N = 13;
    for (const i of [0, 12, 2, 10, 4, 8, 6, 1, 11, 3, 9, 5, 7]) {
      const p = stream(i, N);
      plume(p.root, p.c1, p.c2, p.tip, 0.48, 1.02 + (i % 3) * 0.06);
    }
    // Loose filaments off the ends, the filmy part of the plume.
    for (let i = 0; i < 44; i++) {
      const p = stream((i / 43) * 12, N), j = (k) => Math.sin(i * k) * 0.5;
      const from = [p.c2[0] + j(1.3), p.c2[1] + j(2.1)];
      const tip = [p.tip[0] + Math.cos(p.q) * (1.6 + j(0.7) * 3) + j(3.1) * 1.4, p.tip[1] + Math.sin(p.q) * (1.6 + j(0.7) * 3) + j(1.9) * 1.4];
      line([from, [(from[0] + tip[0]) / 2 + j(5.3) * 0.8, (from[1] + tip[1]) / 2 + j(4.1) * 0.8], tip], { w: 0.05, v: 0.5 });
    }

    // Far wing, lifted and swept.
    const f = [[2.2, 1.6, 9.8, 7.8], [1.8, 1.8, 8.8, 9.2], [1.4, 1.9, 7.4, 10.4], [1.0, 2.0, 5.8, 11.2], [0.6, 2.0, 4.0, 11.6], [0.2, 2.0, 2.2, 11.4], [-0.2, 2.0, 0.4, 10.8]];
    f.forEach(([x, y, tx, ty], i) => limb([[x, y, 0.2], [x + (tx - x) * 0.4, y + (ty - y) * 0.44, 0.58], [x + (tx - x) * 0.76, y + (ty - y) * 0.76, 0.52], [tx, ty, 0.06]], { flat: 0.38, tone: 0.98 + i * 0.03, hatch: 28, shadow: 0.34, melt: 0, band: 0.3, creases: [{ pts: [[x, y], [tx, ty]], w: 0.05, depth: 0.06 }] }));
    for (let i = 0; i < 8; i++) limb([[-0.4 + i * 0.42, 1.8, 0.16], [0.3 + i * 0.5, 3.2, 0.36], [0.8 + i * 0.6, 4.6, 0.05]], { flat: 0.38, tone: 1.14, hatch: 28, shadow: 0.3, melt: 0, band: 0.2 });

    // The body, close and full-breasted, narrowing to Alpha.
    blob([[gam[0] - 0.4, gam[1] - 0.2], [del[0] - 0.2, del[1] - 1.2], [0.8, -1.9], [alp[0], alp[1] - 0.8], [4.8, -0.9, 'c'], [alp[0], alp[1] + 0.8], [1.8, 1.5], [0.0, 2.1], [bet[0] + 0.4, bet[1] + 0.8]], {
      round: 1.0, tone: 1.14, hatch: 34, shadow: 0.5, band: 0.3,
      creases: [
        { pts: [[-1.0, 1.4], [-0.5, 0.5], [-0.8, -0.7]], w: 0.05, depth: 0.07 }, { pts: [[-0.1, 1.7], [0.3, 0.5], [0.0, -1.1]], w: 0.05, depth: 0.07 },
        { pts: [[0.8, 1.6], [1.2, 0.4], [0.9, -1.3]], w: 0.05, depth: 0.07 }, { pts: [[1.7, 1.2], [2.1, 0.2], [1.9, -1.2]], w: 0.05, depth: 0.07 },
        { pts: [[-1.6, 0.0], [-1.0, -0.4], [-0.2, -0.3], [0.8, -0.9]], w: 0.05, depth: 0.07 },
      ],
    });

    // Near wing, cast down and back across the plumes.
    const n = [[3.0, 0.0, 9.4, -9.6], [2.6, -0.1, 7.8, -10.4], [2.2, -0.2, 6.0, -11.0], [1.8, -0.3, 4.2, -11.2], [1.4, -0.4, 2.4, -11.0], [1.0, -0.5, 0.6, -10.4], [0.6, -0.5, -1.0, -9.6]];
    n.forEach(([x, y, tx, ty], i) => limb([[x, y, 0.2], [x + (tx - x) * 0.4, y + (ty - y) * 0.44, 0.62], [x + (tx - x) * 0.76, y + (ty - y) * 0.76, 0.56], [tx, ty, 0.06]], { flat: 0.38, tone: 1.08 + i * 0.03, hatch: 96, shadow: 0.38, melt: 0, band: 0.3, creases: [{ pts: [[x, y], [tx, ty]], w: 0.05, depth: 0.06 }] }));
    for (let i = 0; i < 9; i++) limb([[0.0 + i * 0.4, 0.2, 0.18], [0.1 + i * 0.5, -2.0, 0.42], [0.2 + i * 0.6, -3.8, 0.05]], { flat: 0.38, tone: 1.22, hatch: 96, shadow: 0.34, melt: 0, band: 0.2 });
    for (let i = 0; i < 8; i++) limb([[0.2 + i * 0.4, 0.3, 0.14], [0.3 + i * 0.44, -0.9, 0.3], [0.3 + i * 0.5, -1.7, 0.05]], { flat: 0.38, tone: 1.28, hatch: 96, shadow: 0.3, melt: 0, band: 0.2 });

    // The head with a velvet cap and a short down-curved bill, reaching west.
    limb([[-4.3, 1.5, 0.3], [-5.0, 1.4, 0.17], [-5.9, 0.9, 0.02]], { tone: 1.3, warm: 0.84, shadow: 0.1, flat: 0.6, melt: 0 });
    blob([[-1.0, -0.4], [gam[0] - 0.5, gam[1] - 0.1], [-2.6, 0.2], [-3.5, 0.6], [-4.3, 1.2], [-4.2, 1.8], [-3.2, 2.5], [-2.0, 2.5], [-0.9, 2.0], [-0.6, 1.0]], {
      round: 0.8, tone: 1.26, hatch: 16, shadow: 0.44, spacing: 0.86, band: 0.3,
      creases: [
        { pts: [[-4.1, 1.3], [-3.2, 1.2], [-2.4, 0.5], [-1.8, -0.4]], w: 0.06, depth: 0.09 },
        { pts: [[-2.4, 2.4], [-2.2, 1.8], [-1.4, 1.5], [-0.9, 1.6]], w: 0.05, depth: 0.07 },
      ],
    });
    limb([[-3.2, 1.72, 0.16], [-3.18, 1.72, 0.16]], { tone: 0.2, shadow: 0, melt: 0 });
  },
};
