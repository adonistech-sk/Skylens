// The Pendulum Clock, a long-case clock. Iota, Eta and Zeta lie on the rim of its dial, Mu on the
// driving weight, Beta on the pendulum's bob seen through the glazed trunk. Lone Alpha, far to the
// north-east, is the brass winding key on its ribbon, tied to the hood. The key is the warm note.
export default {
  tier: 'extended',
  subject: 'The Pendulum Clock',
  pixels: 1000,
  anchors: [['α Hor', 'winding key'], ['ι Hor', 'dial rim'], ['η Hor', 'dial rim'], ['ζ Hor', 'dial rim'], ['μ Hor', 'weight'], ['β Hor', 'pendulum bob']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const alp = s('α Hor'), mu = s('μ Hor'), bet = s('β Hor');
    const D = [1.38, 1.5], R = 2.92;
    const cx = D[0], base = -14.4;
    const box = (x0, y0, x1, y1, o = {}) => blob([[x0, y0, 'c'], [x1, y0, 'c'], [x1, y1, 'c'], [x0, y1, 'c']], { round: 0.3, band: 0.24, hatch: 84, shadow: 0.4, ...o });
    const disc = (c, r, n = 12) => Array.from({ length: n }, (_, i) => [c[0] + Math.cos((i / n) * Math.PI * 2) * r, c[1] + Math.sin((i / n) * Math.PI * 2) * r]);

    // The ribbon, in a long loose S from the hood's corner finial out to the key.
    const a = [cx - 4.2, 5.8];
    const rib = [[...a, 0.14], [-5.4, 8.8, 0.18], [-8.2, 7.6, 0.2], [-9.6, 5.8, 0.18], [-11.6, 6.4, 0.18], [-11.8, 8.4, 0.16], [alp[0] + 0.24, alp[1] - 1.3, 0.12]];
    limb(rib, { flat: 0.4, tone: 1.2, hatch: 40, shadow: 0.2, melt: 0, band: 0.1, creases: [{ pts: rib.map((p) => [p[0], p[1]]), w: 0.03, depth: 0.04 }] });
    limb(rib.map((p) => [p[0] + 0.1, p[1] + 0.3, p[2] * 0.5]), { flat: 0.3, tone: 0.92, hatch: 40, shadow: 0, melt: 0, band: 0.08 });

    // The key: a clover bow on Alpha, a barrel and a square bit.
    const K = [alp[0] - 0.12, alp[1]];
    const bow = (c, r) => blob(disc(c, r), { round: r * 0.5, tone: 1.3, warm: 0.84, hatch: 30, shadow: 0.24, band: 0.08 });
    bow([K[0] + 0.52, K[1] - 0.42], 0.56);
    bow([K[0] - 0.52, K[1] - 0.42], 0.56);
    bow([K[0], K[1] + 0.42], 0.58);
    blob(disc(K, 0.26), { round: 0.1, tone: 0.3, shadow: 0, band: 0.04 });
    limb([[K[0], K[1] + 0.9, 0.16], [K[0] + 0.04, K[1] + 1.2, 0.26], [K[0] + 0.08, K[1] + 1.46, 0.15], [K[0] + 0.2, K[1] + 3.0, 0.15]], { tone: 1.28, warm: 0.84, hatch: 80, shadow: 0.24, melt: 0, band: 0.06 });
    box(K[0] + 0.04, K[1] + 2.44, K[0] + 0.86, K[1] + 3.0, { tone: 1.28, warm: 0.84, round: 0.08, band: 0.05 });

    // Plinth and base.
    box(cx - 4.9, base, cx + 4.9, base + 0.7, { tone: 1.16, round: 0.2, hatch: 6 });
    box(cx - 4.3, base + 0.7, cx + 4.3, -11.0, {
      tone: 1.08, round: 0.5, hatch: 86,
      creases: [{ pts: [[cx - 3.5, base + 1.3], [cx + 3.5, base + 1.3], [cx + 3.5, -11.7], [cx - 3.5, -11.7], [cx - 3.5, base + 1.3]], w: 0.05, depth: 0.1 }],
    });
    for (const dx of [-3.3, 3.3]) { const t = [[cx + dx, base + 1.4], [cx + dx * 0.5, -11.9]]; line(t, { w: 0.03, v: 0.34 }); }
    box(cx - 4.6, -11.1, cx + 4.6, -10.5, { tone: 1.24, round: 0.16, hatch: 6 });

    // The trunk, in dark wood, with the long glazed door.
    box(cx - 3.3, -10.5, cx + 3.3, -1.7, { tone: 1.06, round: 0.5, hatch: 86, creases: [{ pts: [[cx - 2.9, -10.2], [cx - 2.9, -2.2]], w: 0.05, depth: 0.08 }, { pts: [[cx + 2.9, -10.2], [cx + 2.9, -2.2]], w: 0.05, depth: 0.08 }] });
    box(cx - 2.56, -10.0, cx + 2.56, -2.1, { tone: 0.14, round: 0.1, hatch: 80, shadow: 0, band: 0.08 });

    // The second weight, behind, and its cord.
    limb([[cx + 1.7, -2.1, 0.03], [cx + 1.7, -3.2, 0.03]], { tone: 1.1, shadow: 0, melt: 0 });
    limb([[cx + 1.7, -3.2, 0.2], [cx + 1.7, -3.4, 0.5], [cx + 1.7, -5.5, 0.5], [cx + 1.7, -5.8, 0.24]], { tone: 1.08, hatch: 84, shadow: 0, melt: 0, band: 0.14, creases: [{ pts: [[cx + 1.3, -3.6], [cx + 2.1, -3.6]], w: 0.03, depth: 0.06 }, { pts: [[cx + 1.3, -5.3], [cx + 2.1, -5.3]], w: 0.03, depth: 0.06 }] });

    // The pendulum, caught at the end of its swing, its bob on Beta.
    const pivot = [cx + 0.34, -1.8];
    limb([[...pivot, 0.05], [bet[0] + 0.03, bet[1] + 0.8, 0.05]], { tone: 1.26, hatch: 84, shadow: 0, melt: 0 });
    blob(disc(bet, 0.9, 14), {
      round: 0.42, tone: 1.3, warm: 0.28, hatch: 40, shadow: 0, band: 0.1,
      creases: [{ pts: [[bet[0] - 0.56, bet[1] + 0.12], [bet[0] - 0.12, bet[1] + 0.54]], w: 0.04, depth: 0.06 }],
    });
    // The driving weight on Mu.
    limb([[mu[0], -2.1, 0.03], [mu[0], mu[1] + 1.5, 0.03]], { tone: 1.1, shadow: 0, melt: 0 });
    limb([[mu[0], mu[1] + 1.6, 0.14], [mu[0], mu[1] + 1.4, 0.56], [mu[0], mu[1] - 1.2, 0.56], [mu[0], mu[1] - 1.56, 0.22], [mu[0], mu[1] - 1.8, 0.1]], {
      tone: 1.26, hatch: 84, shadow: 0.3, melt: 0, band: 0.14,
      creases: [{ pts: [[mu[0] - 0.5, mu[1] + 1.16], [mu[0] + 0.5, mu[1] + 1.16]], w: 0.03, depth: 0.06 }, { pts: [[mu[0] - 0.5, mu[1] - 0.96], [mu[0] + 0.5, mu[1] - 0.96]], w: 0.03, depth: 0.06 }],
    });
    // The window: its glazing bars and a slant of reflected light.
    for (const y of [-4.7, -7.3]) limb([[cx - 2.56, y, 0.07], [cx + 2.56, y, 0.07]], { tone: 1.1, hatch: 6, shadow: 0.1, melt: 0 });
    line([[cx - 2.2, -3.2], [cx - 1.2, -2.4]], { w: 0.05, v: 0.3 });
    line([[cx - 2.3, -4.6], [cx - 0.4, -2.3]], { w: 0.06, v: 0.26 });

    // Hood: the case that frames the dial, under a swan-neck pediment.
    box(cx - 3.9, -1.9, cx + 3.9, -1.2, { tone: 1.24, round: 0.16, hatch: 6 });
    box(cx - 3.8, -1.2, cx + 3.8, 5.0, { tone: 1.1, round: 0.5, hatch: 86, creases: [{ pts: [[cx - 3.5, -1.0], [cx - 3.5, 4.8]], w: 0.05, depth: 0.08 }, { pts: [[cx + 3.5, -1.0], [cx + 3.5, 4.8]], w: 0.05, depth: 0.08 }] });
    box(cx - 4.1, 4.9, cx + 4.1, 5.5, { tone: 1.26, round: 0.16, hatch: 6 });
    for (const sg of [-1, 1]) {
      limb([[cx + sg * 3.9, 5.5, 0.3], [cx + sg * 3.0, 6.7, 0.32], [cx + sg * 1.7, 7.5, 0.3], [cx + sg * 0.9, 7.4, 0.24], [cx + sg * 0.9, 6.9, 0.2], [cx + sg * 1.24, 6.84, 0.14]], { tone: 1.2, hatch: 40, shadow: 0.34, melt: 0, band: 0.1 });
      limb([[cx + sg * 4.1, 5.5, 0.16], [cx + sg * 4.1, 5.74, 0.26], [cx + sg * 4.1, 6.0, 0.12], [cx + sg * 4.1, 6.5, 0.18], [cx + sg * 4.1, 6.74, 0.03]], { tone: 1.3, shadow: 0.2, melt: 0 });
    }
    limb([[cx, 5.5, 0.26], [cx, 6.0, 0.14], [cx, 6.4, 0.3], [cx, 7.0, 0.1], [cx, 7.5, 0.22], [cx, 7.76, 0.03]], { tone: 1.3, shadow: 0.2, melt: 0 });

    // The dial plate, with engraved spandrels, then the chapter ring on the stars.
    box(cx - 3.3, -1.45, cx + 3.3, 4.55, { tone: 1.9, round: 0.14, hatch: 12, band: 0.1 });
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const c = [cx + sx * 2.76, 1.55 + sy * 2.5];
      for (const k of [0.5, 0.8]) line([[c[0], c[1] - sy * k], [c[0] - sx * k * 0.3, c[1] - sy * k * 0.3], [c[0] - sx * k, c[1]]], { w: 0.03, v: 0.5 });
    }
    blob(disc(D, R + 0.16, 28), { round: 1.6, tone: 2.6, hatch: 20, shadow: 0.4, band: 0.1, spacing: 0.8 });
    blob(disc(D, R - 0.66, 28), { round: 0.1, tone: 1.3, hatch: 40, shadow: 0.1, band: 0.1 });
    for (let i = 0; i < 60; i++) {
      const q = (i / 60) * Math.PI * 2, big = i % 5 === 0;
      line([[D[0] + Math.sin(q) * (R - 0.04), D[1] + Math.cos(q) * (R - 0.04)], [D[0] + Math.sin(q) * (R - (big ? 0.52 : 0.2)), D[1] + Math.cos(q) * (R - (big ? 0.52 : 0.2))]], { w: big ? 0.09 : 0.03, v: 0.6, dark: true, taper: false });
    }
    // The hands, a fine spade pair, and the arbor.
    const hand = (ang, len, w) => {
      const q = (ang * Math.PI) / 180, u = [Math.sin(q), Math.cos(q)], n = [-u[1], u[0]], P = (t, o = 0) => [D[0] + u[0] * t + n[0] * o, D[1] + u[1] * t + n[1] * o];
      blob([P(-0.2, 0.05), P(len * 0.56, 0.05), P(len * 0.62, w), P(len * 0.8, 0.08), [...P(len, 0), 'c'], P(len * 0.8, -0.08), P(len * 0.62, -w), P(len * 0.56, -0.05), P(-0.2, -0.05)], { round: 0.06, tone: 1.3, hatch: 40, shadow: 0.34, band: 0.05 });
    };
    hand(-52, 1.46, 0.2);
    hand(38, 2.2, 0.16);
    limb([[D[0], D[1], 0.18], [D[0] + 0.01, D[1], 0.18]], { tone: 1.3, shadow: 0.2, melt: 0 });
  },
};
