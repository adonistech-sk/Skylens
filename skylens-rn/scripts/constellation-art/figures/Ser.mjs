// The Serpent, one long living line across the summer sky. It rears at the Crown with its jaws
// wide, Beta and Gamma on the head, Gudja and iota at the snout, then falls through Unukalhai and
// Yed Prior, swings behind the Serpent-Bearer's hands, and rises again through Sabik, nu Oph and
// eta Ser to the tip at Alya. Scales are cut along the back. The warm note is the forked tongue.
import { spline } from '../engrave.mjs';

export default {
  tier: 'extended',
  subject: 'The Serpent',
  pixels: 1100,
  anchors: [['β Ser', 'head'], ['γ Ser', 'jaw'], ['Gudja', 'snout'], ['ι Ser', 'upper lip'], ['δ Ser', 'neck'], ['Unukalhai', 'heart'], ['ε Ser', 'coil'], ['Yed Prior', 'coil'], ['Sabik', 'coil'], ['ξ Ser', 'belly'], ['ν Oph', 'coil'], ['η Ser', 'tail'], ['Alya', 'tail tip']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const bet = s('β Ser'), del = s('δ Ser'), unu = s('Unukalhai'), eps = s('ε Ser'), yed = s('Yed Prior'), sab = s('Sabik'), xi = s('ξ Ser'), nu = s('ν Oph'), tau = s('τ Oph'), eta = s('η Ser'), aly = s('Alya');

    // The body, from behind the head to the tail tip: a tapering line that swings through the stars.
    const body = [
      [bet[0] + 1.0, bet[1] - 2.0, 1.15], [del[0] + 0.7, del[1] + 0.8, 1.5], [unu[0] + 0.8, unu[1] + 0.8, 1.72], [eps[0] - 0.4, eps[1] - 0.2, 1.84],
      [11.2, -3.6, 1.9], [yed[0] + 0.2, yed[1] - 0.2, 1.92], [7.6, -12.0, 1.9], [3.2, -15.6, 1.9], [-0.8, -13.8, 1.86], [-3.8, -13.6, 1.82], [sab[0] + 0.2, sab[1] + 0.2, 1.76],
      [-9.6, -21.0, 1.62], [xi[0], xi[1] + 0.2, 1.5], [-16.2, -15.8, 1.36], [nu[0] - 0.2, nu[1] + 0.4, 1.22], [tau[0] - 0.8, tau[1] + 0.6, 1.1],
      [-23.0, -7.2, 0.96], [eta[0] - 1.4, eta[1] + 1.8, 0.82], [-28.4, -1.2, 0.64], [-31.0, 1.8, 0.42], [aly[0], aly[1], 0.2], [-35.4, 0.6, 0.04],
    ];
    body.forEach((p, i) => { p[2] *= i < 2 ? 0.66 : i < 4 ? 0.74 : 0.78; });
    const path = spline(body, false, 10);
    const N = (i) => { const a = path[Math.max(0, i - 1)], b = path[Math.min(path.length - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [-(b[1] - a[1]) / l, (b[0] - a[0]) / l, (b[0] - a[0]) / l, (b[1] - a[1]) / l]; };

    // Cross-cut belly plates on one side, a dark line along the flank.
    const plates = [];
    for (let i = 3; i < path.length - 4; i += 2) {
      const [nx, ny, tx, ty] = N(i), [x, y, r] = path[i];
      plates.push({ pts: [[x + nx * r * 0.96, y + ny * r * 0.96], [x + nx * r * 0.66 + tx * 0.16, y + ny * r * 0.66 + ty * 0.16], [x + nx * r * 0.32 + tx * 0.08, y + ny * r * 0.32 + ty * 0.08]], w: 0.075, depth: 0.15 });
    }
    limb(body, { tone: 1.12, hatch: 40, shadow: 0, band: 0.7, spacing: 1.0, melt: 0, creases: [...plates, { pts: path.filter((_, i) => i % 6 === 0).map((p, i) => { const k = i * 6, [nx, ny] = N(k); return [p[0] + nx * p[2] * 0.3, p[1] + ny * p[2] * 0.3]; }), w: 0.1, depth: 0.2 }] });

    // A chain of touching diamonds down the back, stepped by hand-set arc length, with a row of
    // small flank scales either side.
    let i = 6, along = 0;
    while (i < path.length - 14) {
      const [nx, ny, tx, ty] = N(i), [x, y, r] = path[i];
      const cx = x - nx * r * 0.3, cy = y - ny * r * 0.3, a = r * 0.62, b = r * 0.44;
      line([[cx - tx * a, cy - ty * a], [cx - nx * b, cy - ny * b], [cx + tx * a, cy + ty * a], [cx + nx * b, cy + ny * b], [cx - tx * a, cy - ty * a]], { w: 0.055, v: 0.62, taper: false });
      const ix = cx, iy = cy, c = 0.46;
      line([[ix - tx * a * c, iy - ty * a * c], [ix - nx * b * c, iy - ny * b * c], [ix + tx * a * c, iy + ty * a * c], [ix + nx * b * c, iy + ny * b * c], [ix - tx * a * c, iy - ty * a * c]], { w: 0.035, v: 0.34, taper: false });
      for (const side of [0.9, 0.2]) {
        const px = x - nx * r * side + tx * a * 0.9, py = y - ny * r * side + ty * a * 0.9;
        line([[px - tx * 0.3, py - ty * 0.3], [px + nx * 0.1, py + ny * 0.1], [px + tx * 0.3, py + ty * 0.3]], { w: 0.045, v: 0.42 });
      }
      const step = r * 1.26;
      for (along = 0; along < step && i < path.length - 2; i++) along += Math.hypot(path[i + 1][0] - path[i][0], path[i + 1][1] - path[i][1]);
    }

    // The inside of the gape, a dark membrane between the jaws, the throat at Beta.
    blob([[15.2, 12.6], [12.6, 13.2], [10.8, 13.5], [11.8, 15.0], [13.6, 16.6], [14.6, 17.6], [14.6, 15.0]], { round: 0.5, tone: 0.56, hatch: 40, shadow: 0.3, creases: [{ pts: [[14.5, 13.1], [13.4, 14.2], [13.5, 15.8]], w: 0.09, depth: 0.14 }, { pts: [[14.0, 12.9], [12.6, 13.7], [12.3, 14.5]], w: 0.08, depth: 0.12 }] });

    // Lower jaw, dropped wide. Gamma lies along it.
    blob([[15.0, 12.7], [13.2, 13.5], [11.2, 13.8], [9.6, 13.3, 'c'], [10.6, 12.2], [12.8, 11.4], [15.2, 10.6], [17.0, 10.8], [16.8, 12.2]], {
      round: 0.6, tone: 1.3, hatch: 12, shadow: 0.5, band: 0.5,
      creases: [{ pts: [[15.6, 12.2], [13.2, 12.6], [10.6, 12.9]], w: 0.09, depth: 0.15 }, { pts: [[15.8, 11.4], [13.4, 11.9], [11.4, 12.3]], w: 0.06, depth: 0.09 }],
    });
    // Tongue, the warm note, whipping out of the throat.
    limb([[14.2, 13.5, 0.15], [12.8, 14.8, 0.13], [11.0, 15.4, 0.12], [9.4, 16.8, 0.09]], { tone: 1.3, warm: 0.84, flat: 0.6, shadow: 0.2, melt: 0 });
    limb([[9.4, 16.8, 0.08], [8.8, 18.2, 0.03]], { tone: 1.3, warm: 0.84, flat: 0.6, shadow: 0, melt: 0 });
    limb([[9.4, 16.8, 0.08], [7.9, 17.0, 0.03]], { tone: 1.3, warm: 0.84, flat: 0.6, shadow: 0, melt: 0 });
    // Fangs, swung forward from the upper jaw.
    limb([[14.4, 17.2, 0.26], [13.3, 16.9, 0.16], [12.4, 16.1, 0.03]], { tone: 1.5, shadow: 0.2, melt: 0 });
    limb([[13.5, 15.6, 0.2], [12.7, 15.2, 0.12], [12.2, 14.5, 0.03]], { tone: 1.3, shadow: 0.2, melt: 0 });
    limb([[11.2, 13.6, 0.13], [11.1, 14.6, 0.03]], { tone: 1.3, shadow: 0.2, melt: 0 });

    // Upper jaw and skull, a broad viper's wedge thrown back: Beta at the hinge, Gudja under the
    // eye, iota at the snout.
    blob([[16.0, 10.9], [17.4, 12.3], [17.8, 14.2], [17.5, 16.0], [16.9, 17.6], [16.3, 18.8], [15.2, 19.0], [14.4, 18.2, 'c'], [14.5, 17.2], [13.3, 15.8], [13.2, 14.2], [14.2, 12.5]], {
      round: 1.0, tone: 1.46, hatch: 82, shadow: 0.62, band: 0.5, spacing: 0.86,
      creases: [
        { pts: [[14.6, 13.0], [14.5, 15.0], [15.2, 16.8], [15.1, 18.2]], w: 0.09, depth: 0.15 },
        { pts: [[14.7, 16.2], [15.6, 16.6], [16.6, 16.1]], w: 0.14, depth: 0.28 },
        { pts: [[16.8, 11.8], [16.2, 13.2], [16.6, 14.8]], w: 0.1, depth: 0.14 },
        { pts: [[15.8, 18.6], [15.6, 18.2], [15.9, 17.8]], w: 0.09, depth: 0.2 },
      ],
      bumps: [{ at: [15.7, 15.8], r: [0.6, 0.5], h: 0.2 }, { at: [16.0, 13.4], r: [1.1, 1.5], h: 0.3 }],
    });
    // The eye under its plate.
    line([[15.1, 15.8], [15.6, 15.92], [16.1, 15.7]], { w: 0.09, v: 1 });
    // Scales across the crown.
    for (const [x, y] of [[15.4, 12.2], [16.4, 12.8], [15.4, 13.6], [16.6, 14.0], [15.5, 14.8], [16.6, 15.2], [16.7, 16.9], [15.9, 17.3], [16.3, 11.5], [14.9, 11.6]]) {
      line([[x - 0.34, y - 0.1], [x, y + 0.26], [x + 0.34, y + 0.1], [x, y - 0.26], [x - 0.34, y - 0.1]], { w: 0.05, v: 0.56, taper: false });
    }
  },
};
