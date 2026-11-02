// The Ram, head down in a charge, hindquarters thrown high. Hamal sits at the root of the great
// curled horn, Sheratan on the bridge of the nose, Mesarthim at the muzzle and Bharani on the
// haunch. The fleece is built tuft by tuft, overlapped from the tail forward like roof tiles.
import { hoof, frame } from '../kit.mjs';

export default {
  tier: 'extended',
  subject: 'The Ram',
  pixels: 1100,
  anchors: [['Hamal', 'root of the horn'], ['Sheratan', 'bridge of the nose'], ['Mesarthim', 'muzzle'], ['Bharani', 'haunch']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const ham = s('Hamal'), mes = s('Mesarthim');

    // One lock of the fleece: a lobed tuft with its curl cut in.
    const tuft = (x, y, r, a, tone = 1) => {
      const t = (a * Math.PI) / 180, c = Math.cos(t), n = Math.sin(t);
      const Q = (u, v) => [x + (c * u - n * v) * r, y + (n * u + c * v) * r];
      blob([Q(-1.0, -0.2), Q(-0.7, 0.75), Q(0.1, 1.0), Q(0.85, 0.7), Q(1.08, 0.05), Q(0.75, -0.65), Q(-0.1, -0.95), Q(-0.8, -0.8)], {
        round: r * 0.62, tone, hatch: a + 66, shadow: 0.5, band: 0.32, spacing: 0.86,
        creases: [{ pts: [Q(-0.5, -0.45), Q(-0.55, 0.3), Q(0.05, 0.6), Q(0.6, 0.25), Q(0.35, -0.3), Q(-0.05, -0.2)], w: r * 0.09, depth: r * 0.16 }],
      });
    };

    // Far foreleg, thrown forward.
    limb([[-3.2, -1.0, 0.95], [-3.5, -3.6, 0.6], [-3.6, -4.9, 0.42], [-2.5, -6.2, 0.3], [-1.9, -7.2, 0.27]], { tone: 0.76, hatch: 92, shadow: 0.4, bumps: [{ at: [-3.6, -4.9], r: [0.46, 0.46], h: 0.16 }] });
    hoof(E, [-1.9, -7.25], 0.62, -62, { tone: 0.86, warm: 0.12 });
    // Far hind leg.
    limb([[-7.4, 1.0, 1.3], [-8.0, -1.4, 0.82], [-9.7, -2.9, 0.42], [-9.6, -4.8, 0.32], [-9.1, -6.1, 0.28]], { tone: 0.74, hatch: 76, shadow: 0.4, bumps: [{ at: [-9.7, -2.9], r: [0.46, 0.46], h: 0.16 }] });
    hoof(E, [-9.05, -6.2], 0.62, -74, { tone: 0.84, warm: 0.12 });

    // The short tail, flung up.
    limb([[-11.8, 5.8, 0.72], [-13.0, 6.5, 0.66], [-13.9, 7.5, 0.34], [-14.2, 8.2, 0.08]], { tone: 0.9, hatch: 40, shadow: 0.3, creases: [{ pts: [[-12.4, 6.6], [-13.2, 6.9], [-13.8, 7.6]], w: 0.08, depth: 0.12 }] });

    // Near foreleg: strong forearm, knee, then a slender cannon reaching for the ground.
    limb([[-1.4, -0.6, 1.2], [-0.8, -2.6, 0.82], [-0.5, -4.4, 0.5], [0.8, -5.8, 0.33], [1.8, -7.0, 0.3]], {
      tone: 1.02, hatch: 110, shadow: 0.5,
      creases: [{ pts: [[-1.5, -1.9], [-1.1, -3.2], [-0.8, -4.2]], w: 0.09, depth: 0.14 }],
      bumps: [{ at: [-0.5, -4.4], r: [0.54, 0.54], h: 0.2 }, { at: [1.5, -6.7], r: [0.3, 0.3], h: 0.1 }],
    });
    hoof(E, [1.85, -7.1], 0.72, -56);

    // Near hind leg: a heavy gaskin, the hock pushed back, driving off.
    limb([[-9.6, 2.0, 2.0], [-10.8, -0.6, 1.2], [-12.3, -2.5, 0.52], [-12.4, -4.5, 0.36], [-12.0, -6.2, 0.31]], {
      tone: 1.0, hatch: 70, shadow: 0.5,
      creases: [{ pts: [[-9.4, -0.2], [-10.6, -1.8], [-11.8, -2.8]], w: 0.1, depth: 0.14 }],
      bumps: [{ at: [-12.3, -2.5], r: [0.56, 0.56], h: 0.2 }, { at: [-12.1, -5.8], r: [0.3, 0.3], h: 0.1 }],
    });
    hoof(E, [-11.95, -6.3], 0.72, -78);

    // Under the fleece, a body to carry the shadow.
    blob([[0.8, 3.0], [-2.4, 5.0], [-6.0, 6.8], [-9.6, 7.6], [-11.8, 6.2], [-12.0, 3.2], [-10.0, 0.8], [-6.4, -0.4], [-3.0, -1.2], [-0.6, -1.0], [0.8, 0.6]], { round: 2.0, tone: 0.6, hatch: 22, shadow: 0.55 });

    // The fleece, tail first and rolling toward the neck, so each lock lies over the one behind.
    const edge = [[-13.0, 6.0], [-12.0, 7.4], [-9.8, 8.3], [-7.6, 8.0], [-5.0, 6.9], [-2.4, 5.6], [0.0, 4.4], [1.9, 3.0], [2.0, 1.2], [0.4, -0.2], [-1.2, -1.4], [-3.2, -1.8], [-6.2, -0.9], [-9.4, 0.5], [-11.6, 1.2], [-13.0, 3.4]];
    const within = (x, y) => { let c = false; for (let i = 0, j = edge.length - 1; i < edge.length; j = i++) { const a = edge[i], b = edge[j]; if ((a[1] > y) !== (b[1] > y) && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
    let col = 0;
    for (let x = -12.5; x < 2.0; x += 0.98, col++) {
      for (let y = 8.0 - (col % 2) * 0.55; y > -2.0; y -= 1.14) {
        // The lie of the wool changes across the body and the spacing wanders a little by hand.
        const px = x + 0.16 * Math.sin(y * 2.3 + col), py = y + 0.14 * Math.cos(x * 1.9 + col);
        if (!within(px, py)) continue;
        tuft(px, py, 0.74 + 0.08 * Math.sin(col * 1.7 + y), 205 + (py - 3) * 12 + 80 * Math.sin(col * 2.1 + y * 1.3), 1.02 + 0.16 * Math.max(0, (py - 2 - (px + 12) * -0.4) / 6));
      }
    }

    // Far horn, peeping over the brow.
    limb([[1.7, 1.3, 0.5], [2.9, 2.4, 0.5], [3.0, 3.8, 0.38], [1.9, 4.2, 0.2]], { tone: 0.8, warm: 0.34, hatch: 40, shadow: 0.4 });

    // Head, long Roman-nosed profile, driven down. f is toward the jaw, u down the face.
    const H = frame(ham, mes);
    const P = (pts) => pts.map(([f, u, ...rest]) => [...H(f, u), ...rest]);
    blob(P([[-0.9, -0.2], [-1.32, 1.5], [-1.3, 3.0], [-1.12, 4.2], [-1.02, 5.1], [-0.45, 5.9], [0.5, 5.9], [1.02, 5.2], [1.02, 4.3], [1.2, 3.2], [1.56, 2.0], [1.8, 0.7], [1.2, -0.5]]), {
      round: 0.8, tone: 1.56, hatch: H.angle + 74, shadow: 0.6, band: 0.5, spacing: 0.84,
      creases: [
        { pts: P([[-0.68, 1.15], [-0.22, 0.95], [0.26, 1.3]]), w: 0.13, depth: 0.28 },
        { pts: P([[-0.56, 1.72], [-0.12, 1.95], [0.25, 1.62]]), w: 0.06, depth: 0.1 },
        { pts: P([[0.92, 4.55], [0.3, 4.8], [-0.1, 5.4]]), w: 0.08, depth: 0.16 },
        { pts: P([[0.2, 5.75], [0.0, 5.2], [-0.42, 5.0]]), w: 0.06, depth: 0.12 },
        { pts: P([[-0.72, 2.4], [-0.1, 3.0], [0.1, 3.9]]), w: 0.09, depth: 0.13 },
        { pts: P([[1.1, 1.5], [0.72, 2.5], [0.74, 3.7]]), w: 0.09, depth: 0.13 },
      ],
      bumps: [{ at: H(-0.1, 1.45), r: [0.44, 0.34], h: 0.16 }, { at: H(-0.3, 5.0), r: [0.42, 0.42], h: 0.14 }, { at: H(0.8, 1.6), r: [0.7, 0.9], h: 0.2 }],
    });
    // A small beard of hair under the jaw.
    E.strands(P([[1.0, 4.4], [1.2, 3.4], [1.5, 2.2]]), { n: 46, angle: 240, len: 0.62, jitter: 12, v: 0.44, spread: 0.1, seed: 12, w: 0.024 });
    // The eye, a lit slot under a heavy brow.
    line(P([[-0.52, 1.5], [-0.2, 1.42], [0.14, 1.52]]), { w: 0.05, v: 0.95 });
    // Ear, laid back beneath the horn.
    blob(P([[0.9, -0.1], [1.9, -0.5], [2.9, -0.5, 'c'], [2.2, 0.3], [1.3, 0.6]]), { round: 0.3, tone: 1.02, hatch: H.angle + 20, shadow: 0.4, creases: [{ pts: P([[1.1, 0.1], [1.8, -0.1], [2.5, -0.35]]), w: 0.07, depth: 0.1 }] });

    // The great horn, wound once and a half around the ear, ribbed along its length.
    const horn = [[ham[0] + 0.3, ham[1] + 0.2, 0.74], [-0.2, 2.8, 0.9], [-2.4, 3.1, 0.9], [-3.9, 1.3, 0.78], [-3.3, -1.0, 0.64], [-1.2, -1.7, 0.5], [0.2, -0.5, 0.36], [-0.5, 0.9, 0.22], [-1.5, 0.4, 0.1]];
    const spine = [];
    for (let i = 0; i + 1 < horn.length; i++) for (let k = 0; k < 8; k++) { const t = k / 8; spine.push([horn[i][0] + (horn[i + 1][0] - horn[i][0]) * t, horn[i][1] + (horn[i + 1][1] - horn[i][1]) * t, horn[i][2] + (horn[i + 1][2] - horn[i][2]) * t]); }
    const ribs = [];
    for (let i = 2; i < spine.length - 5; i += 2) {
      const a = spine[i - 1], b = spine[i + 1], [x, y, r] = spine[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1]) / l, ny = (b[0] - a[0]) / l;
      ribs.push({ pts: [[x + nx * r * 0.95, y + ny * r * 0.95], [x + nx * r * 0.1 + (b[0] - a[0]) * 0.3, y + ny * r * 0.1 + (b[1] - a[1]) * 0.3], [x - nx * r * 0.95, y - ny * r * 0.95]], w: 0.045, depth: 0.08 });
    }
    limb(horn, { tone: 1.2, warm: 0.42, hatch: 30, shadow: 0.62, band: 0.3, creases: ribs, melt: 0 });
    line(horn.slice(0, 7).map(([x, y, r]) => [x - r * 0.35, y + r * 0.35]), { w: 0.03, v: 0.6, warm: 0.5 });
  },
};
