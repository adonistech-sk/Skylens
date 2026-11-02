// The Crab, seen from above with its head to the south and the great claws swung in to meet.
// The two Asses walk across the shell, iota marks the rear edge, and the pincer tips close on
// Acubens and Tarf, Acubens being the old word for the claw. The warm note is the claw tips.

const leg = (E, pts, tone) => {
  // Joint by joint, far end first, so each segment lies over the next and the joints read.
  for (let i = pts.length - 2; i >= 0; i--) {
    const a = pts[i], b = pts[i + 1], tip = i === pts.length - 2;
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, nx = -(b[1] - a[1]) * 0.07, ny = (b[0] - a[0]) * 0.07;
    E.limb([a, [mx + nx, my + ny, Math.max(a[2], b[2]) * 1.06], tip ? [b[0], b[1], 0.04] : b], {
      tone, hatch: (Math.atan2(-(b[1] - a[1]), b[0] - a[0]) * 180) / Math.PI + 80, shadow: 0.5, melt: 0, band: 0.3,
      creases: [{ pts: [[a[0] + (b[0] - a[0]) * 0.14, a[1] + (b[1] - a[1]) * 0.14], [mx + nx * 0.5, my + ny * 0.5], [a[0] + (b[0] - a[0]) * 0.86, a[1] + (b[1] - a[1]) * 0.86]], w: 0.07, depth: 0.1 }],
    });
  }
};

/** A pincer: the palm, a fixed finger and a moving finger, both toothed on the inner edge. */
const chela = (E, palm, fixed, moving, hatch, tone) => {
  E.blob(moving.outline, { round: 0.55, tone: tone * 1.1, hatch: hatch + 30, shadow: 0.5, band: 0.42, creases: moving.creases });
  E.blob(palm.outline, { round: 1.1, tone: tone * 1.16, hatch, shadow: 0.6, band: 0.5, creases: palm.creases, bumps: palm.bumps });
  for (const t of fixed) E.limb(t, { tone: 1.34, warm: 0.72, flat: 0.6, shadow: 0.2, melt: 0 });
};

export default {
  tier: 'extended',
  subject: 'The Crab',
  pixels: 1100,
  anchors: [['Asellus Borealis', 'shell'], ['Asellus Australis', 'shell'], ['ι Cnc', 'rear of the shell'], ['Acubens', 'claw tip'], ['Tarf', 'claw tip']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const acu = s('Acubens'), tarf = s('Tarf'), nor = s('Asellus Borealis'), sou = s('Asellus Australis');
    const M = (pts) => pts.map(([x, y, ...r]) => [-1.6 - x, y, ...r]);

    // Walking legs, fanned out and pointing to the south, rear pair first.
    for (const [pts, tone] of [
      [[[-7.0, 9.0, 0.66], [-10.8, 13.0, 0.62], [-15.4, 13.6, 0.46], [-19.6, 10.6, 0.3]], 0.94],
      [[[-9.0, 6.2, 0.72], [-14.0, 9.0, 0.68], [-19.0, 8.0, 0.5], [-22.4, 4.2, 0.3]], 0.98],
      [[[-9.8, 3.6, 0.74], [-15.2, 4.6, 0.7], [-19.8, 2.0, 0.52], [-22.2, -2.0, 0.3]], 1.02],
      [[[-9.6, 1.2, 0.72], [-14.2, 0.4, 0.66], [-17.8, -2.8, 0.5], [-19.0, -7.2, 0.3]], 1.04],
    ]) { leg(E, pts, tone); leg(E, M(pts), tone); }

    // Arms, each a heavy three-jointed reach out and round.
    for (const [a, b, c, d] of [
      [[-6.6, -1.8, 1.34], [-11.2, -2.6, 1.2], [-13.2, -3.6, 1.16], [-13.4, -6.6, 1.1]],
      [[4.8, -1.8, 1.34], [9.6, -2.6, 1.2], [12.0, -3.8, 1.2], [12.8, -7.0, 1.2]],
    ]) {
      limb([b, c, d], { tone: 1.04, hatch: 100, shadow: 0.5, melt: 0, bumps: [{ at: c, r: [0.8, 0.8], h: 0.24 }], creases: [{ pts: [[c[0] - 1, c[1] + 0.8], [c[0], c[1] + 0.1], [c[0] + 0.9, c[1] - 0.6]], w: 0.09, depth: 0.14 }] });
      limb([a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 0.4, 1.3], b], { tone: 1.1, hatch: 80, shadow: 0.55, melt: 0, creases: [{ pts: [[a[0], a[1] - 0.5], [(a[0] + b[0]) / 2, a[1] - 0.2], [b[0], b[1] - 0.3]], w: 0.09, depth: 0.14 }] });
    }

    // Left claw, closing on Acubens.
    chela(E,
      { outline: [[-11.4, -5.6], [-14.2, -6.0], [-15.2, -8.4], [-14.4, -11.0], [-11.6, -12.2], [-8.2, -11.6], [-5.6, -9.8], [acu[0] + 0.8, acu[1] - 0.6, 'c'], [-6.4, -8.2], [-8.4, -8.0, 'c'], [-8.6, -7.4], [-9.8, -7.0]],
        creases: [{ pts: [[-13.6, -7.0], [-12.2, -9.2], [-9.2, -10.2], [-6.2, -9.4]], w: 0.13, depth: 0.2 }, { pts: [[-14.0, -9.8], [-11.6, -11.0], [-8.8, -11.0]], w: 0.09, depth: 0.14 }, { pts: [[-11.0, -6.6], [-10.2, -8.0], [-9.4, -8.6]], w: 0.09, depth: 0.12 }],
        bumps: [{ at: [-12.0, -8.6], r: [2.0, 1.6], h: 0.5 }] },
      [[[-5.6, -8.0, 0.32], [acu[0] + 0.5, acu[1] - 0.2, 0.26], [acu[0], acu[1], 0.04]]],
      { outline: [[-11.6, -5.6], [-9.4, -4.6], [-6.8, -4.2], [-4.6, -4.8], [acu[0] - 0.2, acu[1] + 0.2, 'c'], [-6.2, -5.8], [-8.0, -6.2, 'c'], [-8.4, -5.9], [-9.8, -6.8]],
        creases: [{ pts: [[-10.4, -5.4], [-7.6, -4.9], [-5.2, -5.2]], w: 0.09, depth: 0.14 }] },
      28, 1);
    // Right claw, the bigger crusher, closing on Tarf.
    chela(E,
      { outline: [[10.4, -5.8], [13.6, -5.8], [15.0, -8.0], [14.8, -11.0], [12.4, -13.4], [9.0, -13.6], [6.8, -11.8], [tarf[0] - 0.6, tarf[1] - 0.4, 'c'], [7.4, -9.0], [8.6, -9.6, 'c'], [9.2, -8.8], [10.0, -8.2]],
        creases: [{ pts: [[13.6, -7.0], [12.8, -10.0], [10.6, -11.6], [8.0, -11.2]], w: 0.13, depth: 0.2 }, { pts: [[14.2, -10.4], [12.4, -12.4], [9.6, -12.8]], w: 0.09, depth: 0.14 }, { pts: [[10.8, -6.6], [10.4, -8.0], [9.6, -9.0]], w: 0.09, depth: 0.12 }],
        bumps: [{ at: [11.8, -9.2], r: [2.2, 2.0], h: 0.56 }] },
      [[[7.2, -10.2, 0.36], [tarf[0] - 0.1, tarf[1] - 0.6, 0.28], [tarf[0], tarf[1], 0.04]]],
      { outline: [[11.2, -5.4], [9.0, -4.6], [6.8, -5.2], [5.6, -6.8], [tarf[0] + 0.1, tarf[1] + 0.3, 'c'], [7.2, -7.6], [8.6, -8.2, 'c'], [9.2, -8.0], [10.4, -7.6]],
        creases: [{ pts: [[10.2, -5.8], [7.8, -5.6], [6.4, -6.8]], w: 0.09, depth: 0.14 }] },
      150, 1);
    // Teeth along the inner edges.
    for (const [x, y, dx, dy] of [[-7.4, -5.9, -0.1, -0.5], [-6.4, -5.8, -0.1, -0.5], [-7.2, -8.1, 0.1, 0.5], [-6.2, -8.0, 0.1, 0.5], [7.8, -7.6, 0.1, -0.5], [7.0, -7.4, 0.1, -0.5], [7.8, -9.7, -0.1, 0.5], [8.6, -9.8, -0.1, 0.5]]) {
      limb([[x, y, 0.16], [x + dx, y + dy, 0.03]], { tone: 1.3, warm: 0.5, shadow: 0, melt: 0, flat: 0.6 });
    }

    // Eyes on their stalks.
    for (const [x, sway] of [[-2.8, -0.5], [1.0, 0.4]]) {
      limb([[x, -3.0, 0.42], [x + sway * 0.5, -4.8, 0.32], [x + sway, -6.0, 0.3]], { tone: 1.1, hatch: 86, shadow: 0.4, melt: 0 });
      blob([[x + sway - 0.62, -6.1], [x + sway, -5.5], [x + sway + 0.62, -6.1], [x + sway, -6.8]], { round: 0.5, tone: 1.5, shadow: 0.3 });
    }

    // Shell, wider than long, its front edge cut into spines, the rear running up to iota.
    blob([
      [-2.2, -3.2], [-3.0, -3.9, 'c'], [-4.6, -3.0], [-5.8, -3.9, 'c'], [-7.0, -2.2], [-8.6, -2.6, 'c'], [-9.1, -0.6], [-10.5, -0.5, 'c'], [-10.3, 1.5], [-11.2, 2.2, 'c'], [-10.5, 4.0], [-10.8, 5.2, 'c'], [-9.2, 7.0],
      [-6.8, 9.4], [-4.0, 11.0], [-1.0, 11.9], [2.0, 11.0], [4.8, 9.4], [7.2, 7.0], [8.8, 5.2, 'c'], [8.5, 4.0], [9.2, 2.2, 'c'], [8.3, 1.5], [8.5, -0.5, 'c'], [7.1, -0.6], [6.6, -2.6, 'c'], [5.0, -2.2], [3.8, -3.9, 'c'], [2.6, -3.0], [1.0, -3.9, 'c'], [0.2, -3.2], [-1.0, -2.6],
    ], {
      round: 3.2, tone: 1.34, hatch: 8, shadow: 0.7, band: 0.8,
      creases: [
        // The H of the shell, the groove that frames the stomach.
        { pts: [[-7.0, 3.0], [-4.6, 4.8], [-3.2, 3.4], [-3.0, 0.8], [-4.4, -1.8]], w: 0.24, depth: 0.36 },
        { pts: [[5.4, 3.0], [3.0, 4.8], [1.6, 3.4], [1.4, 0.8], [2.8, -1.8]], w: 0.24, depth: 0.36 },
        { pts: [[-3.2, 3.6], [-0.8, 4.8], [1.6, 3.6]], w: 0.2, depth: 0.28 },
        { pts: [[-4.8, 5.2], [-3.4, 7.8], [-0.8, 8.8], [1.8, 7.8], [3.2, 5.2]], w: 0.18, depth: 0.26 },
        { pts: [[-0.8, -2.0], [-0.8, 0.8], [-0.8, 3.0]], w: 0.09, depth: 0.12 },
        { pts: [[-8.6, 0.8], [-6.6, 0.2], [-4.6, -1.4]], w: 0.12, depth: 0.18 }, { pts: [[7.0, 0.8], [5.0, 0.2], [3.0, -1.4]], w: 0.12, depth: 0.18 },
        { pts: [[-9.2, 4.6], [-7.6, 6.2], [-5.6, 8.8]], w: 0.13, depth: 0.2 }, { pts: [[7.6, 4.6], [6.0, 6.2], [4.0, 8.8]], w: 0.13, depth: 0.2 },
      ],
      bumps: [{ at: [-0.8, 1.0], r: [2.2, 2.6], h: 0.7 }, { at: [-0.8, 6.8], r: [3.0, 1.6], h: 0.5 }, { at: [-6.6, 3.4], r: [2.0, 2.0], h: 0.5 }, { at: [5.0, 3.4], r: [2.0, 2.0], h: 0.5 }, { at: [-7.0, -0.6], r: [1.4, 1.0], h: 0.3 }, { at: [5.4, -0.6], r: [1.4, 1.0], h: 0.3 }],
    });
    // Pimples of the shell, placed by hand.
    for (const [x, y, r] of [[nor[0] - 1.2, nor[1] - 2.6, 0.2], [sou[0] + 1.1, sou[1] + 1.0, 0.2], [-2.0, 0.0, 0.16], [0.4, -0.2, 0.16], [-6.6, 3.8, 0.22], [-7.6, 2.6, 0.16], [-5.4, 2.6, 0.16], [-7.0, 5.2, 0.16], [5.0, 3.8, 0.22], [6.0, 2.6, 0.16], [3.8, 2.6, 0.16], [5.4, 5.2, 0.16], [-2.6, 6.8, 0.18], [1.0, 6.8, 0.18], [-0.8, 7.4, 0.16], [-0.8, 6.0, 0.16], [-3.0, 9.6, 0.16], [1.4, 9.6, 0.16], [-0.8, 10.0, 0.14], [-5.8, 0.0, 0.14], [4.2, 0.0, 0.14]]) {
      line([[x - r * 0.5, y + r * 0.2], [x, y + r * 0.5], [x + r * 0.5, y + r * 0.1]], { w: 0.11, v: 0.62 });
    }
  },
};
