// The Sea Monster, the Ketos sent against Andromeda, great-headed and jawed like a hound, with a
// whale's flukes. Menkar, "the nostril", is his nose, the ring of Lambda, Mu, Xi and Nu fills the
// heavy skull, Mira rides the neck, Baten Kaitos, "the belly of the whale", the belly, and Diphda,
// the old "tail of the whale", the root of the tail, which lifts to its flukes on Iota.
import { spline } from '../engrave.mjs';
import { wing } from '../kit.mjs';

export default {
  tier: 'extended',
  subject: 'The Sea Monster',
  pixels: 1100,
  anchors: [['Menkar', 'nostril'], ['λ Cet', 'brow'], ['μ Cet', 'crown'], ['ξ² Cet', 'back of the skull'], ['ν Cet', 'cheek'], ['Kaffaljidhma', 'jaw'], ['δ Cet', 'throat'], ['Mira', 'neck'], ['Baten Kaitos', 'belly'], ['θ Cet', 'back'], ['η Cet', 'back'], ['τ Cet', 'belly'], ['Diphda', 'tail'], ['ι Cet', 'flukes']],
  draw({ s, E }) {
    const { blob, limb, line, strands } = E;
    const iot = s('ι Cet');
    const path = [[-5.0, 8.4, 4.0], [-5.4, 3.6, 4.2], [-3.0, -0.6, 4.3], [2.0, -5.8, 4.8], [8.6, -9.8, 5.5], [14.0, -11.0, 4.3], [18.8, -14.2, 3.1], [23.0, -14.6, 2.1], [26.0, -11.8, 1.4], [iot[0], iot[1] - 1.0, 0.9]];
    const pts = spline(path, false, 16);
    const lens = [0];
    for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const total = lens[lens.length - 1];
    const at = (d) => {
      let i = 1;
      while (i < pts.length - 1 && lens[i] < d) i++;
      const a = pts[i - 1], b = pts[i], t = (d - lens[i - 1]) / (lens[i] - lens[i - 1] || 1);
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, tx = (b[0] - a[0]) / l, ty = (b[1] - a[1]) / l;
      return { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t, r: a[2] + (b[2] - a[2]) * t, tx, ty, nx: -ty, ny: tx };
    };
    const off = (p, along, across) => [p.x + p.tx * along + p.nx * across, p.y + p.ty * along + p.ny * across];

    // Far flipper, a dark fan behind the body.
    wing(E, [[-2.6, -4.2], [-2.2, -5.0]], [[-5.6, -11.0, 0.86], [-3.4, -12.0, 0.9], [-1.2, -12.0, 0.9], [0.8, -11.2, 0.86]], { tone: 0.74, from: 1, to: 0, bend: 0.06 });

    // Flukes on Iota, two great lobes, ribbed.
    blob([[iot[0] - 0.7, iot[1] - 1.4], [iot[0] - 1.9, iot[1] + 0.2], [iot[0] - 4.0, iot[1] + 1.8], [iot[0] - 6.8, iot[1] + 4.6, 'c'], [iot[0] - 3.6, iot[1] + 4.2], [iot[0] - 1.6, iot[1] + 3.6], [iot[0] + 0.2, iot[1] + 2.4, 'c'], [iot[0] + 1.8, iot[1] + 3.4], [iot[0] + 3.8, iot[1] + 3.6], [iot[0] + 6.6, iot[1] + 3.2, 'c'], [iot[0] + 4.2, iot[1] + 1.6], [iot[0] + 2.2, iot[1] + 0.2], [iot[0] + 0.8, iot[1] - 1.4]], {
      round: 0.6, tone: 1.02, hatch: 40, shadow: 0, band: 0.34,
      creases: [{ pts: [[iot[0], iot[1] - 0.6], [iot[0] - 2.6, iot[1] + 1.8], [iot[0] - 5.2, iot[1] + 3.8]], w: 0.09, depth: 0.14 }, { pts: [[iot[0] - 0.4, iot[1] + 0.2], [iot[0] - 1.6, iot[1] + 2.2], [iot[0] - 2.6, iot[1] + 3.6]], w: 0.07, depth: 0.1 }, { pts: [[iot[0], iot[1] - 0.6], [iot[0] + 2.6, iot[1] + 1.6], [iot[0] + 5.2, iot[1] + 3.0]], w: 0.09, depth: 0.14 }, { pts: [[iot[0] + 0.4, iot[1] + 0.2], [iot[0] + 1.6, iot[1] + 2.0], [iot[0] + 2.6, iot[1] + 3.3]], w: 0.07, depth: 0.1 }],
    });

    // A saw of fins down the back, behind the body, tallest at the shoulders.
    for (let d = 5; d < total - 7;) {
      const p = at(d), h = 1.4 + p.r * 0.34, w = 0.9 + p.r * 0.14;
      const a = off(p, -w, p.r * 0.86), b = off(p, w, p.r * 0.86), tip = off(p, w * 1.7, p.r + h), mid = off(p, -w * 0.1, p.r + h * 0.56), mid2 = off(p, w * 1.0, p.r + h * 0.32);
      blob([a, mid, [...tip, 'c'], mid2, b], { round: 0.4, tone: 0.96, hatch: 60, shadow: 0, band: 0.26, creases: [{ pts: [off(p, 0, p.r * 0.96), off(p, w * 0.8, p.r + h * 0.5), off(p, w * 1.5, p.r + h * 0.9)], w: 0.07, depth: 0.1 }] });
      d += w * 2.3;
    }

    // The body: one long thick form running back from the skull.
    limb(path, { tone: 1.14, hatch: 26, shadow: 0.62, band: 2.6, melt: 0, spacing: 1.06 });

    // Pale throat and belly, cut with long pleats like a great whale's.
    for (const k of [-0.42, -0.58, -0.72, -0.84, -0.94]) {
      const run = [];
      for (let d = 1; d < total - 7; d += 2.2) { const p = at(d); run.push(off(p, 0, p.r * k)); }
      line(run, { w: 0.1, v: 0.5, dark: true });
      line(run.map((p) => [p[0] - 0.09, p[1] + 0.09]), { w: 0.03, v: 0.5 });
    }
    // Scales over the back, big at the shoulder, small on the tail.
    for (let d = 7, i = 0; d < total - 3; i++) {
      const p = at(d), z = 0.42 + p.r * 0.12;
      for (const [k, v] of [[0.72, 0.5], [0.5, 0.56], [0.28, 0.56], [0.06, 0.5], [-0.16, 0.42]]) {
        const sh = (i % 2) * z;
        line([off(p, sh + z, p.r * k + z * 0.74), off(p, sh + z * 1.7, p.r * k), off(p, sh + z, p.r * k - z * 0.74)], { w: 0.055, v: v * 0.66 });
      }
      d += z * 1.3;
    }

    // Near flipper, broad and webbed, its rays spreading from the shoulder.
    wing(E, [[-6.2, -1.2], [-6.8, -3.0]], [[-14.2, -8.2, 0.94], [-12.6, -9.6, 1.0], [-10.6, -10.6, 1.04], [-8.4, -11.0, 1.02], [-6.2, -10.8, 0.92]], { tone: 1.06, from: 1, to: 0, bend: 0.06 });
    limb([[-5.2, 0.2, 2.5], [-6.4, -2.0, 1.9], [-7.8, -4.4, 1.2]], { tone: 1.1, hatch: 60, shadow: 0.6, melt: 1.2, creases: [{ pts: [[-7.8, -0.6], [-8.2, -2.6], [-8.8, -4.0]], w: 0.13, depth: 0.2 }, { pts: [[-3.8, -1.4], [-5.0, -3.2], [-6.6, -5.0]], w: 0.12, depth: 0.16 }] });

    // Dark of the mouth, a long gape widening to the front.
    blob([[-7.0, 6.4], [-11.0, 6.0], [-16.4, 5.5], [-16.8, 2.8], [-11.0, 4.6], [-7.6, 5.6]], { round: 0.3, tone: 0.3, hatch: 20, shadow: 0, edge: 0 });

    // Lower jaw, long and straight, dropped open.
    blob([[-6.2, 6.8], [-8.0, 5.7], [-11.0, 4.7], [-14.0, 3.6], [-16.6, 2.7], [-17.9, 2.7, 'c'], [-17.5, 1.3], [-15.4, 0.6], [-12.4, 0.6], [-9.4, 1.5], [-6.0, 3.2]], {
      round: 0.9, tone: 1.3, hatch: 18, shadow: 0.55, band: 0.4,
      creases: [{ pts: [[-16.8, 2.1], [-13.8, 2.8], [-10.8, 3.8], [-8.0, 4.8]], w: 0.1, depth: 0.16 }, { pts: [[-15.2, 1.3], [-12.2, 1.6], [-9.0, 2.8]], w: 0.09, depth: 0.12 }],
    });
    for (const [x, y, l] of [[-17.2, 2.8, 1.9], [-15.9, 3.1, 1.0], [-14.8, 3.5, 1.3], [-13.6, 3.9, 0.8], [-12.5, 4.3, 1.1], [-11.3, 4.7, 0.7], [-10.2, 5.0, 0.6]]) {
      limb([[x - 0.2, y - 0.3, 0.27], [x - 0.04, y + l * 0.5, 0.16], [x + 0.2, y + l, 0.02]], { tone: 1.32, shadow: 0.25, melt: 0, band: 0.1 });
    }

    // The crest behind the skull, spines swept back from the crown.
    for (const [a, b, c] of [[[-11.2, 13.2], [-9.0, 15.2], [-5.8, 16.0]], [[-8.6, 13.4], [-6.4, 14.8], [-3.2, 15.0]], [[-6.6, 12.8], [-4.2, 13.6], [-1.4, 13.2]], [[-5.2, 11.2], [-3.0, 11.6], [-0.6, 10.8]]]) {
      blob([a, [b[0] - 0.1, b[1] + 0.6], [...c, 'c'], [b[0] + 0.5, b[1] - 0.6], [a[0] + 1.3, a[1] - 0.4]], { round: 0.36, tone: 1.02, hatch: 44, shadow: 0.5, band: 0.2, creases: [{ pts: [a, b, c], w: 0.08, depth: 0.12 }] });
    }

    // The nose horn, Lambda on it, the warm note.
    limb([[-12.2, 9.6, 0.86], [-13.6, 11.0, 0.62], [-14.6, 12.2, 0.32], [-15.0, 13.6, 0.03]], { tone: 1.16, warm: 0.42, hatch: 30, shadow: 0.5, melt: 0, band: 0.2, creases: [{ pts: [[-13.0, 9.6], [-12.8, 10.0], [-12.2, 10.4]], w: 0.06, depth: 0.1 }, { pts: [[-13.6, 10.3], [-13.3, 10.8], [-12.9, 11.1]], w: 0.06, depth: 0.1 }, { pts: [[-14.2, 11.1], [-13.9, 11.5], [-13.6, 11.7]], w: 0.05, depth: 0.08 }] });

    // Upper jaw and the great skull: a flat wedge, thick through the jaw, the snout run out long.
    blob([[-4.6, 11.0], [-7.0, 13.1], [-10.0, 13.5], [-12.0, 11.8], [-13.8, 9.9], [-15.8, 8.7], [-17.8, 8.0], [-18.7, 7.1], [-18.1, 5.7], [-16.2, 5.3], [-14.0, 5.7], [-11.0, 5.9], [-8.6, 6.2], [-6.4, 6.4], [-4.2, 8.4]], {
      round: 1.5, tone: 1.26, hatch: 34, shadow: 0.64, spacing: 0.9, band: 0.5,
      creases: [
        // The brow, a hard ledge slanting down to the snout.
        { pts: [[-7.8, 11.6], [-10.0, 11.0], [-12.4, 9.4]], w: 0.24, depth: 0.5 },
        { pts: [[-8.2, 9.4], [-9.8, 8.8], [-11.4, 8.9]], w: 0.09, depth: 0.12 },
        { pts: [[-13.6, 8.8], [-15.4, 7.9], [-17.4, 7.5]], w: 0.1, depth: 0.14 },
        // The snarl: lip drawn up over the long teeth.
        { pts: [[-18.0, 6.2], [-16.4, 6.15], [-14.4, 6.5], [-12.4, 6.6], [-10.4, 6.9], [-8.2, 7.1]], w: 0.12, depth: 0.18 },
        { pts: [[-13.6, 7.6], [-13.1, 7.1], [-12.9, 6.6]], w: 0.07, depth: 0.1 },
        { pts: [[-15.6, 7.4], [-15.4, 6.9], [-15.4, 6.5]], w: 0.07, depth: 0.1 },
        { pts: [[-7.8, 12.6], [-7.0, 10.2], [-7.2, 7.4]], w: 0.14, depth: 0.2 },
        { pts: [[-5.9, 11.8], [-5.2, 9.8], [-5.4, 7.6]], w: 0.1, depth: 0.14 },
      ],
      bumps: [{ at: [-9.8, 11.8], r: [2.6, 1.1], angle: -22, h: 0.5 }, { at: [-15.0, 7.5], r: [1.3, 0.8], h: 0.4 }, { at: [-8.6, 8.2], r: [2.2, 1.6], h: 0.4 }],
    });
    // Upper teeth, the tusks in front, uneven.
    for (const [x, y, l] of [[-17.5, 5.7, 2.1], [-16.1, 5.4, 1.0], [-14.9, 5.5, 1.6], [-13.8, 5.75, 0.8], [-12.7, 5.85, 1.1], [-11.5, 5.95, 0.7], [-10.4, 6.1, 0.8], [-9.3, 6.2, 0.5]]) {
      limb([[x + 0.14, y + 0.3, 0.27], [x + 0.06, y - l * 0.5, 0.16], [x + 0.28, y - l, 0.02]], { tone: 1.32, shadow: 0.25, melt: 0, band: 0.1 });
    }
    // Nostril on Menkar, a dark slit in a raised boss.
    limb([[-14.3, 7.0, 0.1], [-14.8, 6.86, 0.2], [-15.2, 6.5, 0.07]], { tone: 0.3, shadow: 0.4, melt: 0, band: 0.06 });
    // The eye, small and mean, sunk under the ledge of the brow, the iris a thin warm ring.
    limb([[-10.9, 9.7, 0.08], [-10.4, 9.9, 0.36], [-9.8, 10.2, 0.08]], { tone: 0.6, shadow: 0.42, melt: 0, rim: 1, band: 0.08 });
    limb([[-10.42, 9.93, 0.25], [-10.38, 9.93, 0.24]], { tone: 1.6, warm: 0.76, shadow: 0, melt: 0, edge: 0 });
    limb([[-10.4, 9.93, 0.12], [-10.38, 9.93, 0.12]], { tone: 0.05, shadow: 0, melt: 0, edge: 0 });
    // Barbels trailing from the chin.
    strands([[-17.2, 1.0], [-15.6, 0.5]], { n: 22, angle: 250, len: 2.2, jitter: 14, v: 0.6, spread: 0.2, seed: 5, curl: 2, w: 0.04 });
  },
};
