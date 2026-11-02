// Table Mountain with its famous cloth of cloud. Alpha and Eta sit on the level rim of the summit,
// Gamma on the cliff of the front face, and Beta in the cloud that lies along the top and pours over
// the edge. The small ship in the bay is the warm note, as it was Lacaille's view from the Cape.
export default {
  tier: 'extended',
  subject: 'Table Mountain',
  pixels: 1000,
  anchors: [['α Men', 'summit rim'], ['η Men', 'summit rim'], ['γ Men', 'cliff'], ['β Men', 'cloud']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const rim = -0.3;

    // Far range behind.
    blob([[-16.0, -6.8, 'c'], [-14.4, -4.4], [-13.2, -4.8], [-10.8, -1.4], [-10.0, 0.6, 'c'], [-9.2, -1.2], [-7.6, -3.4], [8.0, -3.6], [8.8, -1.0], [10.2, 1.8, 'c'], [11.8, -1.4], [13.0, -3.6], [14.8, -5.4], [16.4, -6.8, 'c'], [16.4, -9.0, 'c'], [-16.0, -9.0, 'c']], {
      round: 0.8, tone: 0.92, hatch: 60, shadow: 0, band: 0.4,
      creases: [
        { pts: [[-10.0, 0.4], [-9.8, -1.6], [-10.2, -3.4], [-9.6, -6.0]], w: 0.09, depth: 0.14 }, { pts: [[-11.0, -2.0], [-11.6, -3.6], [-11.2, -5.8]], w: 0.07, depth: 0.12 },
        { pts: [[10.2, 1.6], [10.0, -0.8], [10.6, -3.0], [10.0, -6.0]], w: 0.09, depth: 0.14 }, { pts: [[11.4, -1.0], [11.8, -3.0], [11.4, -5.6]], w: 0.07, depth: 0.12 },
        { pts: [[8.9, -1.4], [8.6, -3.2], [9.0, -5.8]], w: 0.06, depth: 0.1 },
      ],
    });

    // The table itself: a cliff-faced block, level as a plank along the top.
    const strata = [], cracks = [];
    [-0.9, -1.5, -2.2, -3.0, -3.9].forEach((y, i) => strata.push({ pts: [[-7.4 - i * 0.26, y + 0.1], [-4.2, y - 0.1], [-0.4, y + 0.12], [3.8, y - 0.08], [7.0 + i * 0.26, y + 0.06]], w: 0.09, depth: 0.14 }));
    for (let i = 0; i < 26; i++) {
      const x = -7.0 + i * 0.56 + Math.sin(i * 2.3) * 0.14, top = i % 3 === 0 ? rim - 0.1 : -0.9 - (i % 4) * 0.5;
      cracks.push({ pts: [[x, top], [x + Math.sin(i * 1.7) * 0.2, top - 1.2], [x + Math.sin(i * 3.1) * 0.24, -3.2], [x + Math.sin(i * 0.9) * 0.4, -5.4 - (i % 3) * 0.4]], w: 0.05, depth: 0.1 });
    }
    blob([[-7.6, rim, 'c'], [-6.4, rim + 0.06], [0.0, rim + 0.14], [6.0, rim + 0.06], [7.2, rim, 'c'], [7.6, -1.4], [8.0, -3.4], [9.6, -5.8], [11.6, -8.0, 'c'], [-12.4, -8.0, 'c'], [-10.2, -5.6], [-8.4, -3.4], [-7.9, -1.4]], {
      round: 0.7, tone: 1.44, hatch: 84, shadow: 0.5, band: 0.3, creases: [...strata, ...cracks],
    });
    // The talus and the green of the lower slopes.
    const scrub = [];
    for (let i = 0; i < 30; i++) { const x = -11 + i * 0.76, y = -6.2 + Math.sin(i * 1.3) * 0.8 - Math.abs(x) * 0.02; scrub.push({ pts: [[x - 0.3, y - 0.1], [x, y + 0.2], [x + 0.3, y - 0.1]], w: 0.04, depth: 0.07 }); }
    blob([[-12.8, -8.1, 'c'], [-9.4, -5.8], [-5.4, -4.9], [-1.0, -5.4], [3.4, -4.7], [7.4, -5.2], [10.0, -6.2], [12.2, -8.1, 'c']], { round: 0.8, tone: 1.2, hatch: 22, shadow: 0.46, band: 0.3, creases: scrub });

    // The bay and a few long swells.
    blob([[-16.2, -8.0, 'c'], [16.6, -8.0, 'c'], [16.6, -10.4, 'c'], [-16.2, -10.4, 'c']], { round: 0.3, tone: 0.86, hatch: 2, shadow: 0.3, band: 0.14 });
    for (let k = 0; k < 4; k++) {
      for (let i = 0; i < 9 - k; i++) {
        const x = -15.6 + i * 3.7 + k * 1.3, y = -8.56 - k * 0.5;
        line([[x, y], [x + 0.7, y + 0.12], [x + 1.5, y], [x + 2.3, y + 0.1]], { w: 0.05, v: 0.62 });
      }
    }

    // A ship at anchor, small under the mountain.
    const sx = -5.0, sy = -8.1, Z = 1.5;
    blob([[sx - 1.0 * Z, sy + 0.34 * Z, 'c'], [sx + 1.0 * Z, sy + 0.46 * Z, 'c'], [sx + 0.7 * Z, sy - 0.1 * Z], [sx - 0.7 * Z, sy - 0.1 * Z]], { round: 0.1, tone: 2.6, hatch: 8, shadow: 0.2, band: 0.05 });
    for (const [dx0, h0] of [[-0.4, 1.3], [0.34, 1.6]]) {
      const dx = dx0 * Z, h = h0 * Z;
      line([[sx + dx, sy + 0.3], [sx + dx, sy + 0.3 + h]], { w: 0.05, v: 0.8, taper: false });
      blob([[sx + dx - 0.46, sy + 0.5 + h * 0.5, 'c'], [sx + dx + 0.46, sy + 0.5 + h * 0.5, 'c'], [sx + dx + 0.6, sy + 0.5, 'c'], [sx + dx - 0.6, sy + 0.5, 'c']], { round: 0.06, tone: 2.6, warm: 0.84, shadow: 0.1, band: 0.04 });
      blob([[sx + dx - 0.26, sy + 0.3 + h * 0.96, 'c'], [sx + dx + 0.26, sy + 0.3 + h * 0.96, 'c'], [sx + dx + 0.4, sy + 0.62 + h * 0.5, 'c'], [sx + dx - 0.4, sy + 0.62 + h * 0.5, 'c']], { round: 0.06, tone: 2.6, warm: 0.84, shadow: 0.1, band: 0.04 });
    }

    // The tablecloth: heaped billows along the top, spilling in long tongues over the edge.
    const puff = (x, y, rx, ry, tone = 1.2) => {
      blob([[x - rx, y], [x - rx * 0.74, y + ry * 0.72], [x - rx * 0.1, y + ry], [x + rx * 0.66, y + ry * 0.8], [x + rx, y + ry * 0.04], [x + rx * 0.72, y - ry * 0.7], [x, y - ry], [x - rx * 0.7, y - ry * 0.7]], {
        round: Math.min(rx, ry) * 0.86, tone, hatch: 150, shadow: 0.26, band: 0.3,
        creases: [{ pts: [[x - rx * 0.6, y + ry * 0.34], [x - rx * 0.1, y + ry * 0.54], [x + rx * 0.5, y + ry * 0.3]], w: 0.05, depth: 0.08 }],
      });
    };
    for (const [x, h] of [[-5.6, 0.8], [-3.6, 1.1], [-0.8, 1.26], [2.8, 1.1], [5.2, 0.8]]) {
      limb([[x + 0.1, rim + 0.2, 0.74], [x, rim - 0.9, 0.56], [x + 0.14, rim - 1.2 - h, 0.32], [x - 0.1, rim - 1.8 - h * 1.4, 0.06]], { tone: 1.6, hatch: 86, shadow: 0.34, melt: 0, band: 0.2, alpha: 0.9 });
    }
    for (const [x, y, rx, ry, t] of [[-5.8, 1.5, 2.0, 1.3, 1.08], [5.4, 1.5, 2.0, 1.3, 1.08], [-3.0, 2.7, 2.4, 1.6, 1.12], [3.0, 2.7, 2.5, 1.7, 1.14], [0.0, 3.5, 2.8, 1.9, 1.16], [-7.0, 0.6, 1.4, 0.9, 1.16], [7.0, 0.6, 1.4, 0.9, 1.16], [-4.8, 0.8, 1.9, 1.1, 1.22], [4.6, 0.8, 1.9, 1.1, 1.22], [-1.9, 1.3, 2.4, 1.4, 1.26], [1.9, 1.3, 2.4, 1.4, 1.26], [0, 0.56, 1.8, 0.86, 1.3]]) puff(x, y, rx, ry, t);
  },
};
