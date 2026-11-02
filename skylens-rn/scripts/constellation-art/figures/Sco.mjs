// The Scorpion: claws reaching north-west past Acrab and Fang, Antares at the heart, the jointed
// tail curling through the real stars to the sting at Shaula.

const segment = (E, a, b, ra, rb, o = {}) => E.limb([[a[0], a[1], ra], [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, Math.max(ra, rb) * 1.08], [b[0], b[1], rb]], { hatch: 40, shadow: 0.58, ...o });

export default {
  pixels: 1500,
  anchors: [['Antares', 'heart'], ['Acrab', 'claw'], ['Dschubba', 'head'], ['Fang', 'claw'], ['Alniyat', 'thorax'], ['Paikauhale', 'abdomen'], ['Larawag', 'tail'], ['Xamidimura', 'tail'], [82729, 'tail'], [84143, 'tail'], ['Sargas', 'tail'], [87073, 'tail'], ['κ Sco', 'tail'], ['Shaula', 'sting']],
  draw({ s, E }) {
    const { blob, limb } = E;
    const ant = s('Antares'), pai = s('Paikauhale'), lar = s('Larawag'), xam = s('Xamidimura'), z2 = s(82729), eta = s(84143), sar = s('Sargas'), iot = s(87073), kap = s('κ Sco'), sha = s('Shaula'), dsc = s('Dschubba'), acr = s('Acrab'), fan = s('Fang'), aln = s('Alniyat');

    // Walking legs, drawn first so the body lies over them.
    const leg = (pts, r = 0.34) => limb(pts.map((p, i) => [p[0], p[1], r * (1 - (i / pts.length) * 0.7)]), { tone: 0.8, hatch: 20, shadow: 0.4 });
    leg([[8.2, 11.0], [6.6, 14.4], [3.6, 15.4], [1.4, 18.4]]);
    leg([[6.6, 10.4], [4.2, 12.6], [0.6, 12.6], [-2.2, 14.8]]);
    leg([[4.6, 9.6], [1.6, 10.0], [-1.6, 8.6], [-5.0, 9.8]]);
    leg([[3.2, 8.2], [0.8, 7.4], [-2.2, 5.0], [-5.6, 5.0]]);
    leg([[11.0, 4.4], [12.0, 1.6], [9.8, -0.6], [10.2, -3.8]]);
    leg([[9.2, 4.0], [8.6, 1.0], [6.2, -0.8], [6.0, -4.4]]);
    leg([[7.2, 4.0], [6.0, 2.0], [3.6, 0.8], [2.4, -2.4]]);
    leg([[5.6, 3.8], [4.2, 2.8], [1.6, 2.8], [-0.2, 1.0]]);

    // The tail, segment by segment, each ending on a real star.
    segment(E, sha, kap, 0.52, 0.8, { tone: 1 });
    segment(E, kap, iot, 0.84, 0.98, { tone: 1 });
    segment(E, iot, sar, 1.0, 1.12, { tone: 1 });
    segment(E, sar, eta, 1.14, 1.24, { tone: 1.02 });
    segment(E, eta, z2, 1.26, 1.36, { tone: 1.02 });
    segment(E, z2, xam, 1.38, 1.46, { tone: 1.04 });
    segment(E, xam, lar, 1.48, 1.6, { tone: 1.05 });
    segment(E, lar, pai, 1.62, 1.86, { tone: 1.06 });

    // Sting: a poison bulb and a curved point, with copper at the tip.
    limb([[sha[0] + 0.2, sha[1] - 0.1, 0.6], [-8.0, -2.8, 0.74], [-7.2, -1.6, 0.46], [-7.6, -0.2, 0.2], [-8.8, 0.8, 0.05]], { tone: 1.16, warm: 0.7, hatch: 66, shadow: 0.45 });

    // Abdomen plates up to the heart.
    segment(E, pai, ant, 1.9, 2.3, { tone: 1.08 });
    segment(E, ant, aln, 2.3, 2.7, { tone: 1.1, creases: [{ pts: [[ant[0] - 1.8, ant[1] - 0.2], [ant[0] + 0.6, ant[1] + 2.2]], w: 0.14, depth: 0.2 }] });

    // Head shield.
    blob([[6.0, 10.8], [8.8, 12.6], [11.2, 12.4], [13.2, 10.8], [13.6, 8.4], [12.2, 6.2], [9.6, 5.0], [6.8, 5.4], [5.0, 7.6]], {
      round: 2.2, tone: 1.14, hatch: 32, shadow: 0.64,
      creases: [{ pts: [[7.0, 9.8], [9.4, 8.4], [12.6, 7.6]], w: 0.16, depth: 0.22 }, { pts: [[9.2, 12.0], [9.8, 8.6], [9.0, 5.8]], w: 0.14, depth: 0.2 }, { pts: [[5.8, 8.2], [8.4, 6.8], [11.0, 5.8]], w: 0.14, depth: 0.16 }],
      bumps: [{ at: [dsc[0] + 0.2, dsc[1]], r: [1.4, 1.2], h: 0.3 }],
    });

    // Claw toward Acrab: arm, then the pincer fingers.
    limb([[10.4, 12.0, 1.0], [10.0, acr[1] - 0.2, 0.86], [11.6, 15.4, 0.8], [13.6, 16.4, 0.74]], { tone: 1.06, hatch: 26, shadow: 0.55 });
    blob([[12.6, 15.8], [14.4, 15.2], [16.4, 16.2], [18.4, 18.6], [19.6, 21.0, 'c'], [17.2, 19.4], [15.9, 18.8], [16.6, 21.0], [17.0, 23.0, 'c'], [14.6, 21.0], [13.2, 18.6]], {
      round: 1.1, tone: 1.12, hatch: 52, shadow: 0.52, creases: [{ pts: [[14.0, 16.4], [15.0, 17.6], [15.9, 18.7]], w: 0.14, depth: 0.2 }],
    });
    // Claw toward Fang and beyond.
    limb([[12.4, 8.6, 1.0], [14.0, 7.4, 0.86], [15.4, 8.0, 0.8], [17.2, 8.6, 0.76]], { tone: 1.02, hatch: 14, shadow: 0.55 });
    blob([[16.2, 7.8], [17.8, 7.2], [20.0, 7.2], [22.6, 8.0], [24.6, 8.6, 'c'], [22.0, 9.4], [20.6, 9.5], [22.4, 10.8], [23.8, 12.4, 'c'], [20.6, 11.8], [18.2, 10.6]], {
      round: 1.1, tone: 1.08, hatch: 42, shadow: 0.5, creases: [{ pts: [[17.8, 8.6], [19.2, 9.2], [20.6, 9.5]], w: 0.14, depth: 0.2 }],
    });
    limb([[fan[0] - 0.2, fan[1] + 1.0, 0.12], [fan[0] + 0.2, fan[1] + 0.2, 0.06]], { tone: 0.2, shadow: 0 });
  },
};
