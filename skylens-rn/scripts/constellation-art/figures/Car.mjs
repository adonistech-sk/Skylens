// The hull of the Argo, one of three plates that make one ship: Carina the hull, Vela the sail,
// Puppis the high stern, all drawn to a single plan laid out in this plane. She rows east under
// sail. Miaplacidus and Omega lie along the keel, Avior and Aspidiske on the planking, Theta and
// the Eta Carinae stars at the bow, Canopus on the blade of her steering oar, Gamma Velorum at the
// break of the stern deck, Nu Puppis on the stern post. The ram and the bosses are the warm note.
export default {
  tier: 'extended',
  subject: 'The Keel of the Argo',
  pixels: 1100,
  anchors: [['Canopus', 'steering oar'], ['Miaplacidus', 'keel'], ['Avior', 'planking'], ['Aspidiske', 'planking'], ['θ Car', 'bow'], ['ω Car', 'keel'], ['χ Car', 'planking'], ['γ² Vel', 'break of the stern deck'], ['Alsephina', 'gunwale'], ['ν Pup', 'stern post']],
  draw({ s, E }) {
    const { blob, limb, line } = E;

    // The sheer of the deck and the line of the keel. Both meet at the stern post.
    const S = [[-16.6, 4.8], [-12, 3.7], [-6, 4.1], [0, 5.2], [5.5, 6.9], [9.5, 9.4], [12.2, 12.9], [16, 13.8], [22, 13.6], [27, 12.4], [30.6, 10.2]];
    const K = [[-16.6, -6.6], [-14, -7.6], [-9, -9.8], [-4.5, -10.5], [0.7, -10.0], [10, -7.4], [19, -3.4], [26, 2.4], [30.6, 10.2]];
    const on = (list, x) => { for (let i = 1; i < list.length; i++) if (x <= list[i][0]) { const a = list[i - 1], b = list[i], t = (x - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * t; } return list[list.length - 1][1]; };
    const plank = (t, x0 = -16, x1 = 30.2, step = 3) => { const pts = []; for (let x = x0; x <= x1; x += step) pts.push([x, on(S, x) + (on(K, x) - on(S, x)) * t]); return pts; };

    // Stem post, rising from the ram and curling back over the bow.
    limb([[-16.6, -3.6, 0.7], [-17.6, 0.5, 0.66], [-18.6, 4.6, 0.56], [-19.0, 8.0, 0.46], [-18.2, 10.2, 0.38], [-16.6, 10.6, 0.3], [-15.8, 9.6, 0.24], [-16.5, 8.8, 0.17], [-17.0, 9.3, 0.1]], {
      tone: 1.1, warm: 0.5, hatch: 84, shadow: 0, melt: 0, flat: 0.7,
      creases: [{ pts: [[-17.6, 0.5], [-18.6, 4.6], [-19.0, 8.0], [-18.2, 10.2]], w: 0.12, depth: 0.14 }],
    });

    // The hull in one sweep, planked from stem to stern.
    blob([...S, ...K.slice().reverse().slice(1, -1)], {
      round: 3.4, tone: 1.08, hatch: 8, shadow: 0, band: 0.5, spacing: 0.9,
      creases: [0.12, 0.26, 0.4, 0.54, 0.68, 0.82].map((t) => ({ pts: plank(t), w: 0.1, depth: 0.15 })),
      bumps: [{ at: [3, -2], r: [13, 5], h: 0.7 }],
    });

    // Short butts in the planking, staggered from strake to strake.
    for (const [t, xs] of [[0.19, [-9, 3, 16]], [0.33, [-13, -2, 9, 21]], [0.47, [-7, 6, 18]], [0.61, [-11, 0, 12, 22]], [0.75, [-5, 8, 19]]]) {
      for (const x of xs) line([[x, on(S, x) + (on(K, x) - on(S, x)) * (t - 0.06)], [x + 0.1, on(S, x) + (on(K, x) - on(S, x)) * (t + 0.06)]], { w: 0.05, v: 0.6 });
    }

    // Heavy wales, full length.
    const wale = (t, r, tone) => limb(plank(t, -16.4, 30.2, 2.6).map(([x, y]) => [x, y, r]), { tone, warm: 0.3, hatch: 12, shadow: 0.42, melt: 0, flat: 0.6 });
    wale(0.03, 0.34, 1.2);
    wale(0.33, 0.24, 1.14);

    // The ram at the waterline, three bronze blades.
    blob([[-15.6, -3.6], [-18.6, -4.3], [-23.0, -5.8, 'c'], [-19.0, -6.9], [-15.6, -8.0]], {
      round: 0.9, tone: 1.22, warm: 0.76, hatch: 4, shadow: 0.5, band: 0.3,
      creases: [{ pts: [[-16.0, -5.0], [-19.0, -5.3], [-22.4, -5.8]], w: 0.1, depth: 0.14 }, { pts: [[-16.0, -6.4], [-19.0, -6.1], [-22.0, -5.9]], w: 0.1, depth: 0.14 }],
    });

    // The painted eye on the bow.
    blob([[-15.3, 0.6, 'c'], [-14.4, 1.3], [-13.4, 0.8], [-12.7, 0.5, 'c'], [-13.6, 0.0], [-14.5, 0.1]], { round: 0.26, tone: 1.34, warm: 0.5, hatch: 30, shadow: 0.34, band: 0.1 });
    limb([[-14.1, 0.66, 0.26], [-13.9, 0.66, 0.26]], { tone: 0.5, shadow: 0, melt: 0 });

    // Shields along the gunwale, slung outboard, each with a bronze boss.
    for (let i = 0, x = -13.6; x < 8.2; x += 2.28, i++) {
      const c = [x, on(S, x) - 0.72], r = 1.04, n = 12, ring = [];
      for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2; ring.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]); }
      blob(ring, { round: 0.5, tone: i % 2 ? 1.2 : 1.04, hatch: 30 + i * 12, shadow: 0.5, band: 0.18, creases: [{ pts: [[c[0] - 0.74, c[1]], [c[0], c[1] + 0.74], [c[0] + 0.74, c[1]], [c[0], c[1] - 0.74], [c[0] - 0.74, c[1]]], w: 0.04, depth: 0.06 }] });
      blob([[c[0] - 0.3, c[1]], [c[0], c[1] + 0.3], [c[0] + 0.3, c[1]], [c[0], c[1] - 0.3]], { round: 0.26, tone: 1.3, warm: 0.8, shadow: 0.34 });
    }

    // The bank of oars, each coming out of its own port, blades dipped together.
    for (let i = 0, x = -12.4; x < 15.2; x += 2.5, i++) {
      const y = on(S, x) + (on(K, x) - on(S, x)) * 0.46;
      const end = [x - 5.0, -16.4 + Math.sin(i * 1.3) * 0.2], dir = [end[0] - x, end[1] - y], l = Math.hypot(...dir), u = [dir[0] / l, dir[1] / l], n = [-u[1], u[0]];
      const P = (a, b) => [x + u[0] * a + n[0] * b, y + u[1] * a + n[1] * b];
      blob([P(l - 3.3, 0.14), P(l - 2.4, 0.48), P(l - 0.8, 0.54), [...P(l, 0.1), 'c'], [...P(l, -0.1), 'c'], P(l - 0.8, -0.54), P(l - 2.4, -0.48), P(l - 3.3, -0.14)], {
        round: 0.2, tone: 1.14, warm: 0.42, hatch: 40, shadow: 0.4, band: 0.1,
        creases: [{ pts: [P(l - 3.1, 0), P(l - 0.3, 0)], w: 0.05, depth: 0.08 }],
      });
      limb([[...P(-0.3, 0), 0.26], [...P(l * 0.5, 0), 0.18], [...P(l - 3.0, 0), 0.15]], { tone: 1.22, warm: 0.42, hatch: 40, shadow: 0.46, melt: 0, flat: 0.8 });
      limb([[...P(-0.5, 0), 0.4], [...P(0.1, 0), 0.4]], { tone: 1.24, warm: 0.76, shadow: 0.34, melt: 0, flat: 0.6 });
    }

    // The steering oar slung at the quarter. Its blade carries Canopus.
    limb([[26.9, 12.2, 0.24], [26.3, 7.0, 0.3], [25.6, 2.9, 0.26]], { tone: 1.22, warm: 0.44, hatch: 84, shadow: 0.5, melt: 0, flat: 0.8 });
    blob([[25.6, 3.6], [24.3, 2.2], [24.0, -1.0], [24.9, -3.6, 'c'], [26.5, -1.2], [26.6, 2.0]], {
      round: 0.7, tone: 1.18, warm: 0.42, hatch: 80, shadow: 0.5, band: 0.2,
      creases: [{ pts: [[25.5, 3.0], [25.3, 0.4], [24.95, -3.0]], w: 0.09, depth: 0.14 }],
    });
    limb([[25.4, 10.6, 0.44], [27.2, 10.2, 0.44]], { tone: 1.24, warm: 0.76, shadow: 0.42, melt: 0, flat: 0.6 });
  },
};
