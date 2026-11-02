// The Engraver's Tools on the copper. The main burin is a bent-shank graver: Beta at the ferrule,
// Alpha on the steel, and the point at Delta, cutting a line into the plate. A second tool lies
// across it with Gamma on its handle. The warm note is the bright curl of copper at the point.
export default {
  tier: 'extended',
  subject: "The Engraver's Chisel",
  pixels: 1000,
  anchors: [['β Cae', 'ferrule'], ['α Cae', 'blade'], ['δ Cae', 'cutting point'], ['γ¹ Cae', 'second handle']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const alp = s('α Cae'), bet = s('β Cae'), del = s('δ Cae'), gam = s('γ¹ Cae');

    // The copper plate, tilted under the tools, with work already cut into it.
    const P = (u, v) => [-3.4 + u * 0.97 + v * 0.26, -9.4 + u * 0.1 + v * 0.97];
    blob([[...P(0, 0), 'c'], [...P(11.6, 0), 'c'], [...P(11.6, 6.6), 'c'], [...P(0, 6.6), 'c']], {
      round: 0.24, tone: 0.92, hatch: 12, shadow: 0, band: 0.2, spacing: 1.1,
    });
    // Burin work: flowing, swelling lines, as a plate carries them.
    const cut = (pts, w = 0.05) => line(pts, { w, v: 0.72 });
    for (let k = 0; k < 7; k++) cut([P(0.9, 1.0 + k * 0.5), P(2.6, 1.4 + k * 0.6), P(4.6, 1.0 + k * 0.72), P(6.4, 1.6 + k * 0.7)], 0.04 + (k % 2) * 0.012);
    const loop = [];
    for (let i = 0; i <= 26; i++) { const t = i / 26, q = t * 11, R = 0.2 + 1.5 * t; loop.push(P(8.2 + Math.cos(q) * R, 3.2 + Math.sin(q) * R)); }
    cut(loop, 0.05);

    // The second tool, lying across, handle on Gamma.
    const b0 = [gam[0] + 1.2, gam[1] - 0.86], b1 = [5.8, -3.6];
    const d = [b1[0] - b0[0], b1[1] - b0[1]], l = Math.hypot(...d), u = [d[0] / l, d[1] / l], n = [-u[1], u[0]];
    const S = (a, o = 0) => [b0[0] + u[0] * a + n[0] * o, b0[1] + u[1] * a + n[1] * o];
    blob([S(0, 0.34), S(l - 2.0, 0.36), [...S(l, 0.0), 'c'], S(l - 2.0, -0.36), S(0, -0.34)], { round: 0.14, tone: 1.1, hatch: 20, shadow: 0.5, band: 0.16, creases: [{ pts: [S(0.2, 0.05), S(l - 0.2, 0.0)], w: 0.05, depth: 0.1 }] });
    limb([[...S(-0.04), 0.46], [...S(0.2), 0.42], [...S(0.3), 0.5]], { tone: 1.26, warm: 0.3, hatch: 40, shadow: 0.34, melt: 0 });
    limb([[...S(0.1), 0.5], [...S(-0.8), 0.72], [...S(-1.8), 0.74], [...S(-2.4), 0.6], [...S(-3.0), 0.82], [...S(-3.6), 0.96], [...S(-4.2), 0.8], [...S(-4.6), 0.3]], { tone: 1.04, hatch: 34, shadow: 0.46, melt: 0, band: 0.2, creases: [{ pts: [S(-2.4, -0.6), S(-2.4, 0.6)], w: 0.05, depth: 0.1 }, { pts: [S(-0.6, -0.6), S(-3.4, -0.6)], w: 0.03, depth: 0.05 }, { pts: [S(-0.6, 0.2), S(-3.6, 0.2)], w: 0.03, depth: 0.05 }] });

    // The burin's steel: a lozenge shank with a long bevel, curved through Alpha to the point.
    const shank = [[bet[0], bet[1] - 0.1, 0.5], [(bet[0] + alp[0]) / 2 - 0.1, (bet[1] + alp[1]) / 2, 0.47], [alp[0], alp[1], 0.44], [1.5, -3.6, 0.36], [2.08, -4.5, 0.2], [del[0], del[1] + 0.04, 0.03]];
    limb(shank, { flat: 0.5, tone: 1.26, hatch: 88, shadow: 0.56, melt: 0, band: 0.14, spacing: 0.8, creases: [{ pts: shank.map((p) => [p[0], p[1]]), w: 0.05, depth: 0.14 }] });
    blob([[alp[0] + 0.1, alp[1] - 1.0], [1.72, -3.4], [del[0], del[1], 'c'], [1.2, -3.6], [alp[0] - 0.28, alp[1] - 1.2]], { round: 0.1, tone: 1.32, hatch: 64, shadow: 0.1, band: 0.1 });

    // The ferrule on Beta, then the mushroom handle held in the palm.
    const H = (t, o = 0) => [bet[0] - 0.09 * t + o, bet[1] + t];
    limb([[...H(-0.3), 0.54], [...H(0.0), 0.62], [...H(0.1), 0.52], [...H(0.45), 0.54], [...H(0.6), 0.66]], { tone: 1.3, warm: 0.3, hatch: 80, shadow: 0.42, melt: 0, band: 0.1 });
    limb([[...H(0.5), 0.56], [...H(1.2), 0.78], [...H(2.0), 0.94], [...H(2.5), 0.86], [...H(2.9), 1.12], [...H(3.6), 1.52], [...H(4.1), 1.52], [...H(4.45), 1.0], [...H(4.56), 0.5]], {
      tone: 1.14, hatch: 76, shadow: 0.54, melt: 0, band: 0.22,
      creases: [
        { pts: [H(2.55, -0.8), H(2.6, 0), H(2.55, 0.8)], w: 0.06, depth: 0.12 },
        { pts: [H(0.9, -0.3), H(2.2, -0.34)], w: 0.03, depth: 0.05 }, { pts: [H(0.9, 0.3), H(2.2, 0.34)], w: 0.03, depth: 0.05 },
        { pts: [H(3.0, -0.5), H(3.8, -0.8), H(4.2, -0.5)], w: 0.03, depth: 0.05 }, { pts: [H(3.0, 0.4), H(3.8, 0.7), H(4.2, 0.5)], w: 0.03, depth: 0.05 },
      ],
    });

    // The curl of copper rising from the point.
    limb([[del[0] + 0.1, del[1] - 0.05, 0.03], [del[0] + 0.5, del[1] + 0.08, 0.1], [del[0] + 1.0, del[1] + 0.5, 0.1], [del[0] + 0.86, del[1] + 1.0, 0.09], [del[0] + 0.34, del[1] + 0.84, 0.07], [del[0] + 0.5, del[1] + 0.44, 0.04]], { tone: 1.3, warm: 0.84, shadow: 0.16, melt: 0, band: 0.06 });
    cut([[del[0] - 0.02, del[1]], P(5.4, 3.86), P(4.6, 3.3)], 0.06);
  },
};
