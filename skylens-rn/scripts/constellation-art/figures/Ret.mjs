// The Reticle: the brass cell of a telescope eyepiece, with fine wires strung across its opening.
// The rhomboid of wires runs exactly star to star, Alpha, Epsilon, Delta and Beta at its corners,
// as Lacaille's own rhomboid micrometer did. The slotted capstan screws carry the warm note.
export default {
  tier: 'extended',
  subject: 'The Reticle',
  pixels: 1000,
  anchors: [['α Ret', 'wire corner'], ['ε Ret', 'wire corner'], ['δ Ret', 'wire corner'], ['β Ret', 'wire corner']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const alp = s('α Ret'), eps = s('ε Ret'), del = s('δ Ret'), bet = s('β Ret');
    const c = [0.2, -0.1], R0 = 4.6, R1 = 5.5;
    const disc = (p, r, n = 48) => Array.from({ length: n }, (_, i) => [p[0] + Math.cos((i / n) * Math.PI * 2) * r, p[1] + Math.sin((i / n) * Math.PI * 2) * r]);
    const P = (deg, r) => [c[0] + Math.cos((deg * Math.PI) / 180) * r, c[1] + Math.sin((deg * Math.PI) / 180) * r];

    // The tube behind, seen in a quarter view, knurled at its end.
    const back = [c[0] + 2.1, c[1] - 2.1];
    const tube = (a, r, tone) => blob(disc(a, r), { round: 0.5, tone, hatch: 44, shadow: 0, band: 0.14 });
    limb([[...back, R1 * 0.84], [c[0] + 0.4, c[1] - 0.4, R1 * 0.96]], { tone: 1.14, hatch: 44, shadow: 0, melt: 0, band: 0.2 });
    tube(back, R1 * 0.86, 1.4);
    const knurl = [];
    for (let i = 0; i < 60; i++) { const q = -5 - 170 * (i / 59) * 0 + (i / 60) * 360, a = P(q, R1 * 0.82), off = [back[0] - c[0], back[1] - c[1]]; knurl.push([[a[0] + off[0], a[1] + off[1]], [a[0] + off[0] * 0.8, a[1] + off[1] * 0.8]]); }
    for (const [a, b] of knurl) if ((a[0] - back[0]) - (a[1] - back[1]) > 0.1) line([a, b], { w: 0.03, v: 0.6, taper: false });

    // The heavy ring of the cell.
    blob(disc(c, R1), { round: 0.7, tone: 1.9, hatch: 28, shadow: 0.56, band: 0.14 });

    // The dark field of the eyepiece.
    blob(disc(c, R0 + 0.14), { round: 0.2, tone: 0.5, hatch: 60, shadow: 0, band: 0.1 });
    blob(disc(c, R0), { round: 0.1, tone: 0.1, hatch: 60, shadow: 0, band: 0.1, edge: 0.3 });

    // The graduated circle on the ring, ten to the quarter.
    for (let i = 0; i < 80; i++) {
      const q = (i / 80) * 360, big = i % 10 === 0, mid = i % 5 === 0;
      line([P(q, R1 - 0.1), P(q, R1 - (big ? 0.66 : mid ? 0.46 : 0.26))], { w: big ? 0.05 : 0.024, v: 0.9, dark: true, taper: false });
    }
    line(disc(c, R0 + 0.17, 90).concat([disc(c, R0 + 0.17, 90)[0]]), { w: 0.03, v: 0.7, taper: false });

    // The field wires. Fine ones first: a light square grid under the main figure.
    const clip = (a, b) => {
      const d = [b[0] - a[0], b[1] - a[1]], f = [a[0] - c[0], a[1] - c[1]], A = d[0] ** 2 + d[1] ** 2, B = 2 * (f[0] * d[0] + f[1] * d[1]), C = f[0] ** 2 + f[1] ** 2 - R0 ** 2, q = Math.sqrt(B * B - 4 * A * C);
      const t0 = (-B - q) / (2 * A), t1 = (-B + q) / (2 * A);
      return [[a[0] + d[0] * t0, a[1] + d[1] * t0], [a[0] + d[0] * t1, a[1] + d[1] * t1]];
    };
    const wire = (a, b, w, v) => line(clip(a, b), { w, v, taper: false });
    wire([c[0] - 1, c[1]], [c[0] + 1, c[1]], 0.028, 0.56);
    wire([c[0], c[1] - 1], [c[0], c[1] + 1], 0.028, 0.56);

    // The rhomboid itself, heavier, star to star.
    for (const [a, b] of [[alp, eps], [eps, del], [del, bet], [bet, alp]]) line([a, b], { w: 0.07, v: 0.96, taper: false });
    line([alp, del], { w: 0.03, v: 0.76, taper: false });
    line([eps, bet], { w: 0.03, v: 0.76, taper: false });
    for (const p of [alp, eps, del, bet]) limb([[p[0], p[1], 0.11], [p[0] + 0.01, p[1], 0.11]], { tone: 1.6, shadow: 0, melt: 0 });

    // Four capstan screws through the ring, each with a slotted head outside it.
    for (const q of [45, 135, 225, 315]) {
      limb([[...P(q, R1 - 0.3), 0.25], [...P(q, R1 + 0.5), 0.25], [...P(q, R1 + 0.7), 0.44], [...P(q, R1 + 1.36), 0.44], [...P(q, R1 + 1.56), 0.28]], {
        tone: 1.5, hatch: q * -1 + 90, shadow: 0.4, melt: 0, band: 0.08,
        creases: [{ pts: [P(q - 3, R1 + 0.9), P(q - 3, R1 + 1.3)], w: 0.024, depth: 0.05 }, { pts: [P(q + 3, R1 + 0.9), P(q + 3, R1 + 1.3)], w: 0.024, depth: 0.05 }],
      });
      limb([[...P(q, R1 + 1.5), 0.3], [...P(q, R1 + 1.62), 0.24]], { tone: 1.5, warm: 0.84, shadow: 0.2, melt: 0 });
    }

    // A lock screw and its small flag at the top of the ring.
    limb([[...P(90, R1 - 0.3), 0.3], [...P(90, R1 + 0.5), 0.3], [...P(90, R1 + 0.86), 0.5], [...P(90, R1 + 1.2), 0.3]], { tone: 1.5, hatch: 84, shadow: 0.4, melt: 0, band: 0.08 });
  },
};
