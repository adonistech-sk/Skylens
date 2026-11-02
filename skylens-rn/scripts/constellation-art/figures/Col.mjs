// The Dove, Noah's dove flying east with the olive sprig. Delta is her breast, just behind the
// head, Wazn her shoulder, Phact the root of the raised wing, Epsilon on the fanned tail, and Eta
// the tip of the near wing thrown down in the stroke. Beak and sprig are the warm note.
import { coverts, feather, wing } from '../kit.mjs';

export default {
  tier: 'extended',
  subject: 'The Dove',
  pixels: 1100,
  anchors: [['δ Col', 'breast'], ['Wazn', 'shoulder'], ['Phact', 'back'], ['ε Col', 'tail'], ['η Col', 'wing tip']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const del = s('δ Col'), waz = s('Wazn'), pha = s('Phact'), eps = s('ε Col'), eta = s('η Col');

    // Far wing, raised to the north behind the body.
    wing(E, [[0.2, 2.2], [-1.4, 4.0], [-3.2, 6.4]], [[-4.6, 9.6, 0.6], [-2.8, 10.8, 0.62], [-0.8, 11.4, 0.64], [1.2, 11.2, 0.64], [2.9, 10.3, 0.62], [4.2, 8.9, 0.6], [4.8, 7.2, 0.58], [4.9, 5.6, 0.54]], { tone: 0.88, from: 1, to: 0.04, bend: 0.08 });
    coverts(E, [[0.4, 2.4], [-1.4, 4.2], [-3.0, 6.2]], 50, 2.1, 0.34, { n: 10, turn: -34, grow: 0.3, tone: 0.92 });

    // The tail, a fan to the west that takes in Phact's side and Epsilon.
    for (const [tip, w, t] of [[[8.0, 3.8], 0.56, 0.96], [[8.8, 2.8], 0.58, 1.0], [[9.2, 1.6], 0.6, 1.04], [[9.2, 0.4], 0.6, 1.06], [[8.9, -0.8], 0.58, 1.0], [[8.2, -1.9], 0.54, 0.94]]) {
      feather(E, [3.2, 1.1], tip, w, { bend: 0.05, tone: t, shadow: 0.4 });
    }

    // The body: full breast, slim toward the tail.
    blob([[del[0] - 1.6, del[1] + 1.1], [-5.0, 3.9], [-3.0, 3.6], [-0.6, 3.1], [pha[0] + 0.1, pha[1] + 0.3], [4.4, 1.6], [4.6, 0.6], [2.4, -0.5], [0, -1.4], [-2.6, -1.6], [-5.4, -0.9], [-7.2, 0.6], [del[0] - 1.6, del[1] - 0.2]], {
      round: 2.2, tone: 1.14, hatch: 14, shadow: 0, band: 0.5, spacing: 0.9,
      bumps: [{ at: [-4.6, 1.2], r: [2.6, 2.2], h: 0.6 }],
      creases: [{ pts: [[-5.4, -0.2], [-3.0, -0.9], [-0.4, -0.7]], w: 0.05, depth: 0.08 }],
    });
    // Small body feathers, breast and flank, laid like scales.
    for (let row = 0; row < 7; row++) {
      for (let i = 0; i < 12 - row; i++) {
        const x = -6.8 + i * 0.9 + (row % 2) * 0.45 + row * 0.5, y = 2.9 - row * 0.62 - Math.max(0, x - 0) * 0.08;
        if (y < -1.2 - (x > 0 ? -x * 0.3 : 0) || x > 3.8) continue;
        line([[x, y + 0.2], [x + 0.32, y + 0.14], [x + 0.46, y - 0.02], [x + 0.32, y - 0.16], [x, y - 0.22]], { w: 0.024, v: 0.5 });
      }
    }

    // Feet tucked up under the belly.
    line([[0.2, -1.2], [0.9, -1.9], [1.8, -2.0]], { w: 0.06, v: 0.7, warm: 0.5 });
    line([[0.9, -1.9], [1.2, -2.4]], { w: 0.04, v: 0.7, warm: 0.5 });

    // Near wing, swept down through the stroke, its longest primary reaching Eta.
    wing(E, [[1.4, 1.4], [-0.6, -0.2], [-1.7, -2.4], [-1.9, -4.2]], [[eta[0] - 0.3, eta[1] - 0.8, 0.66], [0.2, -7.4, 0.68], [1.8, -7.2, 0.7], [3.3, -6.5, 0.7], [4.6, -5.4, 0.68], [5.5, -4.0, 0.66], [5.9, -2.6, 0.62], [5.9, -1.3, 0.58], [5.5, -0.2, 0.54]], { tone: 1.08, from: 1, to: 0.04, bend: -0.07 });
    coverts(E, [[1.4, 1.4], [-0.2, 0.2], [-1.2, -1.8]], -24, 2.4, 0.4, { n: 11, turn: -58, grow: 0.34, tone: 1.14 });
    limb([[1.2, 1.5, 0.6], [waz[0] - 0.3, waz[1] + 0.1, 0.62], [-1.3, -0.8, 0.46], [-1.9, -3.0, 0.2]], { tone: 1.2, hatch: 46, shadow: 0.42 });

    // Neck and small head, looking ahead.
    limb([[-5.0, 2.0, 1.56], [-6.8, 3.5, 1.06], [-8.0, 4.8, 0.78]], { tone: 1.18, hatch: 40, shadow: 0.5 });
    blob([[-7.4, 4.5], [-7.2, 5.4], [-7.9, 6.0], [-8.8, 6.0], [-9.5, 5.5], [-9.76, 5.0], [-9.4, 4.6], [-8.8, 4.2], [-8.0, 4.0]], {
      round: 0.7, tone: 1.24, hatch: 30, shadow: 0.46, spacing: 0.84,
      creases: [{ pts: [[-9.4, 5.04], [-8.9, 4.86], [-8.5, 4.94]], w: 0.03, depth: 0.05 }],
    });
    // Beak with its soft cere.
    blob([[-9.5, 5.5], [-10.1, 5.34], [-11.0, 4.86, 'c'], [-10.1, 4.84], [-9.5, 4.8]], { round: 0.2, tone: 1.26, warm: 0.76, hatch: 16, shadow: 0.38, band: 0.1, creases: [{ pts: [[-9.6, 5.1], [-10.2, 5.04], [-10.9, 4.88]], w: 0.02, depth: 0.04 }] });
    blob([[-9.5, 5.56], [-9.2, 5.68], [-9.2, 5.3], [-9.5, 5.26]], { round: 0.12, tone: 1.3, warm: 0.4, shadow: 0.3 });
    // Eye.
    blob([[-8.86, 5.5], [-8.66, 5.7], [-8.46, 5.5], [-8.66, 5.3]], { round: 0.16, tone: 1.34, warm: 0.3, hatch: 20, shadow: 0.44, band: 0.08 });
    limb([[-8.68, 5.5, 0.09], [-8.64, 5.5, 0.09]], { tone: 0.3, shadow: 0, melt: 0 });

    // The olive sprig, held across the beak.
    const stem = [[-10.2, 4.9], [-11.6, 3.6], [-13.0, 2.9], [-14.8, 2.4]];
    limb(stem.map((p, i) => [p[0], p[1], 0.08 - i * 0.015]), { tone: 1.2, warm: 0.6, shadow: 0.24, melt: 0, flat: 0.7 });
    limb([[-10.2, 4.9, 0.05], [-9.7, 4.5, 0.05]], { tone: 1.2, warm: 0.6, shadow: 0.24, melt: 0, flat: 0.7 });
    for (const [x, y, a, l] of [[-11.2, 3.9, 110, 1.36], [-11.5, 3.6, -100, 1.36], [-12.3, 3.2, 96, 1.3], [-12.6, 3.0, -110, 1.3], [-13.4, 2.8, 80, 1.2], [-13.7, 2.7, -124, 1.2], [-14.7, 2.4, 190, 1.2]]) {
      const c = Math.cos((a * Math.PI) / 180), n = Math.sin((a * Math.PI) / 180), P = (u, v) => [x + c * u * l - n * v * 0.24, y + n * u * l + c * v * 0.24];
      blob([[...P(0, 0), 'c'], P(0.3, 1), P(0.6, 1), [...P(1, 0), 'c'], P(0.6, -1), P(0.3, -1)], { round: 0.14, tone: 1.14, warm: 0.56, hatch: 60, shadow: 0.3, band: 0.08, creases: [{ pts: [P(0.06, 0), P(0.5, 0.04), P(0.95, 0)], w: 0.02, depth: 0.04 }] });
    }
    // Two olives.
    for (const [x, y] of [[-12.0, 2.3], [-13.1, 3.8]]) blob([[x - 0.17, y], [x, y + 0.2], [x + 0.17, y], [x, y - 0.2]], { round: 0.16, tone: 1.24, warm: 0.76, shadow: 0.3 });
    if (eps[0]) return;
  },
};
