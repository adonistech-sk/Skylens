// The Peacock in display. Its head is on the star Peacock, Beta at the thigh and Gamma under the
// forward foot, and the great train opens west across all the rest of the figure: Delta at its root,
// Lambda, Xi, Pi and Eta along the raised plumes, Zeta and Epsilon on the plumes that sweep the ground.
export default {
  tier: 'extended',
  subject: 'The Peacock',
  pixels: 1000,
  anchors: [['Peacock', 'head'], ['β Pav', 'thigh'], ['γ Pav', 'foot'], ['δ Pav', 'train root'], ['λ Pav', 'plume'], ['ξ Pav', 'plume'], ['π Pav', 'plume'], ['η Pav', 'plume'], ['ζ Pav', 'plume'], ['ε Pav', 'plume']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const pea = s('Peacock'), bet = s('β Pav'), gam = s('γ Pav');
    const O = [-5.4, 0.7];
    const P = (a, r) => [O[0] + Math.cos((a * Math.PI) / 180) * r, O[1] + Math.sin((a * Math.PI) / 180) * r];
    const ease = (t) => { const k = Math.max(0, Math.min(1, t)); return k * k * (3 - 2 * k); };
    const reach = (a) => 9.4 + 10.2 * ease((a + 68) / 56);
    const disc = (c, r, y = 1) => [0, 45, 90, 135, 180, 225, 270, 315].map((d) => [c[0] + Math.cos((d * Math.PI) / 180) * r, c[1] + Math.sin((d * Math.PI) / 180) * r * y]);

    const plume = (a, r, w, tone, eye) => {
      const h = a + 88;
      limb([[...P(a, 1.6), 0.08], [...P(a, r * 0.42), w * 0.36], [...P(a, r * 0.74), w * 0.72], [...P(a, r - eye * 0.2), w * 0.96], [...P(a, r + eye * 0.86), w * 0.5]], {
        flat: 0.4, tone, hatch: h, shadow: 0.38, melt: 0,
        creases: [{ pts: [P(a, 2.4), P(a, r - eye * 1.1)], w: 0.06, depth: 0.07 }],
      });
      // Loose barbs fraying off the vane, then the eye.
      for (const sd of [-1, 1]) for (let k = 0; k < 4; k++) {
        const r0 = r * (0.42 + k * 0.13);
        line([P(a + (sd * w * 22) / r0, r0), P(a + (sd * w * 42) / r0, r0 + 1.0)], { w: 0.035, v: 0.34 });
      }
      const c = P(a, r);
      blob(disc(c, eye), { round: eye * 0.5, tone: tone * 1.16, hatch: h, shadow: 0.22, edge: 0.8 });
      blob(disc(P(a, r - eye * 0.08), eye * 0.58), { round: eye * 0.3, tone: 0.42, hatch: h + 40, shadow: 0 });
      blob(disc(P(a, r - eye * 0.12), eye * 0.27), { round: eye * 0.2, tone: 1.3, warm: 0.62, hatch: h, shadow: 0 });
    };

    const tiers = [
      { k: 1, n: 25, w: 1.0, eye: 0.82, tone: 0.92, skew: 0 },
      { k: 0.76, n: 20, w: 0.92, eye: 0.72, tone: 1.0, skew: 3.5 },
      { k: 0.54, n: 15, w: 0.84, eye: 0.62, tone: 1.08, skew: -2 },
    ];
    for (const t of tiers) {
      for (let i = 0; i < t.n; i++) {
        const a = -66 + t.skew + ((i + 0.0) / (t.n - 1)) * 168;
        plume(a, reach(a) * t.k, t.w, t.tone, t.eye);
      }
    }
    // Short coverts at the root of the train.
    for (let i = 0; i < 12; i++) {
      const a = -66 + (i / 11) * 150;
      limb([[...P(a, 0.6), 0.2], [...P(a, 2.5), 0.5], [...P(a, 4.2), 0.42], [...P(a, 4.8), 0.1]], { flat: 0.4, tone: 1.12, hatch: a + 88, shadow: 0.36, melt: 0, creases: [{ pts: [P(a, 1.6), P(a, 4.3)], w: 0.05, depth: 0.06 }] });
    }

    // The far leg.
    limb([[-7.2, -0.6, 0.5], [-8.6, -3.0, 0.22], [-8.4, -5.2, 0.16]], { tone: 0.9, hatch: 80, shadow: 0.3 });
    for (const a of [[-1.5, -0.6], [-0.3, -0.8], [0.9, -0.5]]) line([[-8.4, -5.2], [-8.4 + a[0], -5.2 + a[1]]], { w: 0.1, v: 0.5 });

    // The body, full and low-chested, facing east.
    blob([[-9.0, 2.6], [-10.0, 0.8], [-9.6, -0.8], [-8.0, -1.8], [-5.8, -1.6], [-3.6, -0.6], [-2.6, 0.8], [-3.4, 2.4], [-5.4, 3.4], [-7.4, 3.5]], {
      round: 1.6, tone: 1.12, hatch: 40, shadow: 0.6,
      creases: [
        { pts: [[-8.8, 2.4], [-7.4, 1.8], [-5.8, 2.6], [-4.0, 2.2]], w: 0.09, depth: 0.1 },
        { pts: [[-9.4, 0.8], [-7.6, 0.6], [-5.8, 1.2], [-3.4, 0.8]], w: 0.09, depth: 0.1 },
        { pts: [[-9.0, -0.6], [-7.2, -0.7], [-5.4, -0.2], [-3.6, -0.1]], w: 0.09, depth: 0.1 },
      ],
      bumps: [{ at: [-7.8, 0.4], r: [1.4, 1.6], h: 0.3 }],
    });
    // The folded wing, barred.
    blob([[-7.4, 2.8], [-5.0, 3.0], [-2.8, 1.2], [-1.4, -0.2, 'c'], [-3.8, -0.6], [-6.0, 0.0], [-7.6, 1.4]], {
      round: 0.8, tone: 1.2, hatch: 150, shadow: 0.5,
      creases: [
        { pts: [[-6.8, 2.4], [-6.0, 1.2], [-5.6, 0.1]], w: 0.07, depth: 0.1 }, { pts: [[-5.6, 2.8], [-4.9, 1.5], [-4.5, -0.2]], w: 0.07, depth: 0.1 },
        { pts: [[-4.5, 2.5], [-3.9, 1.3], [-3.5, -0.3]], w: 0.07, depth: 0.1 }, { pts: [[-3.5, 1.8], [-3.0, 0.8], [-2.6, -0.2]], w: 0.07, depth: 0.1 },
      ],
    });

    // Near leg: thigh on Beta, a spur, and the foot down on Gamma.
    limb([[-7.6, 0.2, 0.86], [bet[0] - 0.1, bet[1] + 0.2, 0.56], [-9.6, -1.9, 0.24], [-10.8, -2.0, 0.17], [gam[0] + 0.3, gam[1], 0.16]], { tone: 1.06, hatch: 80, shadow: 0.4 });
    line([[-10.6, -2.1], [-10.1, -2.7]], { w: 0.1, v: 0.6 });
    for (const a of [[-1.7, -0.5], [-1.5, 0.5], [-0.4, -1.3], [1.0, -0.7]]) line([gam, [gam[0] + a[0] * 0.6, gam[1] + a[1] * 0.5 + 0.05], [gam[0] + a[0], gam[1] + a[1]]], { w: 0.12, v: 0.7 });

    // The neck: a slender rising S, scaled, into the small head.
    const neck = [[-8.5, 2.2], [-9.3, 4.0], [-8.9, 5.8], [-8.0, 7.2], [pea[0] - 0.1, pea[1] - 0.2]];
    limb([[...neck[0], 1.28], [...neck[1], 0.82], [...neck[2], 0.56], [...neck[3], 0.46], [...neck[4], 0.42]], {
      tone: 1.18, hatch: 12, shadow: 0.46,
      creases: [
        { pts: [[-10.0, 3.2], [-9.2, 3.5], [-8.4, 3.2]], w: 0.06, depth: 0.08 }, { pts: [[-9.9, 4.2], [-9.2, 4.5], [-8.5, 4.2]], w: 0.06, depth: 0.08 },
        { pts: [[-9.6, 5.2], [-9.0, 5.5], [-8.5, 5.2]], w: 0.06, depth: 0.08 }, { pts: [[-9.3, 6.1], [-8.7, 6.4], [-8.2, 6.1]], w: 0.06, depth: 0.08 },
      ],
    });
    // The crest: a fan of bare quills with a small bead at each tip.
    for (const [dx, dy] of [[-1.0, 1.5], [-0.5, 1.8], [0, 1.9], [0.5, 1.8], [1.0, 1.5]]) {
      line([[pea[0], pea[1] + 0.4], [pea[0] + dx, pea[1] + 0.4 + dy]], { w: 0.05, v: 0.7 });
      limb([[pea[0] + dx, pea[1] + 0.4 + dy, 0.15], [pea[0] + dx * 1.05, pea[1] + 0.4 + dy * 1.05, 0.15]], { tone: 1.25, shadow: 0.1, melt: 0 });
    }
    limb([[pea[0] - 0.55, pea[1] + 0.05, 0.2], [pea[0] - 1.0, pea[1] - 0.05, 0.12], [pea[0] - 1.65, pea[1] - 0.28, 0.02]], { tone: 1.28, warm: 0.8, shadow: 0.2, flat: 0.6, melt: 0 });
    blob([[pea[0] - 0.7, pea[1] - 0.1], [pea[0] - 0.4, pea[1] + 0.5], [pea[0] + 0.2, pea[1] + 0.68], [pea[0] + 0.7, pea[1] + 0.2], [pea[0] + 0.56, pea[1] - 0.46], [pea[0] - 0.1, pea[1] - 0.62]], {
      round: 0.4, tone: 1.24, hatch: 30, shadow: 0.4,
      creases: [{ pts: [[pea[0] - 0.42, pea[1] + 0.22], [pea[0] - 0.1, pea[1] + 0.32], [pea[0] + 0.3, pea[1] + 0.16]], w: 0.05, depth: 0.09 }],
    });
  },
};
