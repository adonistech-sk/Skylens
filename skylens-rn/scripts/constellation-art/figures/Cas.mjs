// The Queen on her throne. Drawn upright in her own frame, then laid onto the stars, so in a
// north-up view she hangs head-down from the pole, as she does in the real sky for half the
// year. Schedar is her breast, Gamma her waist, Ruchbah her knee, Segin her foot, and Caph sits
// on the back of the throne.
import { frame, locks } from '../kit.mjs';

export default {
  pixels: 1300,
  anchors: [['Schedar', 'breast'], [4427, 'waist'], ['Ruchbah', 'knee'], ['Segin', 'foot'], ['Caph', 'back of the throne']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const gam = s(4427), sch = s('Schedar');
    // f runs forward, the way she faces. u runs up her back toward the head.
    const L = frame(gam, sch);
    const P = (pts) => pts.map(([f, u, ...rest]) => [...L(f, u), ...rest]);
    const cap = L.back(s('Caph')), knee = L.back(s('Ruchbah')), foot = L.back(s('Segin'));
    const hatch = L.angle;

    // Throne: tall back, seat and legs, in warm wood.
    blob(P([[cap[0] - 0.6, 9.4], [cap[0] + 0.1, 9.9], [cap[0] + 0.7, 9.4], [cap[0] + 0.6, 4.0], [cap[0] + 0.7, -1.6], [cap[0] - 0.4, -1.8], [cap[0] - 0.5, 3.0]]), { round: 0.5, tone: 1.0, warm: 0.5, hatch: hatch + 88, shadow: 0, band: 0.4, creases: [{ pts: P([[cap[0] - 0.1, 8.4], [cap[0] + 0.05, 3.0], [cap[0] + 0.1, -1.0]]), w: 0.13, depth: 0.2 }, { pts: P([[cap[0] - 0.5, 6.4], [cap[0] + 0.6, 6.4]]), w: 0.07, depth: 0.1 }, { pts: P([[cap[0] - 0.5, 1.2], [cap[0] + 0.6, 1.2]]), w: 0.07, depth: 0.1 }] });
    limb(P([[cap[0] + 0.1, 10.0, 0.5], [cap[0] + 0.1, 10.9, 0.28], [cap[0] + 0.1, 11.4, 0.42]]), { tone: 1.1, warm: 0.74, hatch });
    limb(P([[cap[0] + 0.1, -1.6, 0.54], [cap[0] + 0.3, -4.0, 0.38], [cap[0] + 0.6, -6.6, 0.5]]), { tone: 0.84, warm: 0.4, hatch: hatch + 80 });
    limb(P([[2.2, -2.2, 0.5], [2.4, -4.4, 0.34], [2.2, -6.6, 0.46]]), { tone: 0.78, warm: 0.4, hatch: hatch + 80 });
    blob(P([[cap[0] + 0.6, -0.8], [cap[0] + 0.6, -2.4], [0.0, -2.6], [2.8, -2.4], [3.0, -1.2], [0, -0.8]]), { round: 0.6, tone: 0.98, warm: 0.42, hatch, shadow: 0.36, creases: [{ pts: P([[cap[0] + 0.8, -1.7], [0, -1.8], [2.8, -1.7]]), w: 0.09, depth: 0.13 }] });
    // Footstool.
    blob(P([[foot[0] - 1.5, foot[1] - 0.4], [foot[0] + 1.7, foot[1] - 0.4], [foot[0] + 1.6, foot[1] - 1.3], [foot[0] - 1.4, foot[1] - 1.3]]), { round: 0.4, tone: 0.92, warm: 0.5, hatch, shadow: 0.3 });

    // Gown: one sweep from the shoulders over the lap and down to the hem, cut by long folds.
    blob(P([[-1.7, 5.5], [-0.4, 6.1], [1.3, 5.8], [1.7, 3.6], [1.6, 1.4], [2.8, 0.1], [knee[0] + 0.9, knee[1] + 0.5], [knee[0] + 1.2, -2.8], [foot[0] + 1.2, -4.6], [foot[0] + 2.0, foot[1] + 0.1, 'c'], [foot[0] + 0.1, foot[1] + 0.9], [1.4, foot[1] + 0.2, 'c'], [1.7, -3.2], [0.6, -1.8], [-1.4, -1.5], [-2.3, 0.6], [-2.2, 3.4]]), {
      round: 1.5, tone: 1.02, hatch: hatch + 72, shadow: 0.62, band: 0.7,
      creases: [
        { pts: P([[-0.4, 1.6], [1.6, 0.0], [knee[0] + 0.4, knee[1] + 0.3]]), w: 0.16, depth: 0.22 }, { pts: P([[-1.0, 0.2], [1.2, -0.9], [knee[0] - 0.2, knee[1] - 0.2]]), w: 0.15, depth: 0.2 }, { pts: P([[knee[0] + 0.3, -1.6], [knee[0] + 0.5, -3.6], [foot[0] + 0.8, foot[1] + 0.4]]), w: 0.15, depth: 0.2 },
        { pts: P([[knee[0] - 0.6, -1.9], [knee[0] - 0.8, -3.8], [foot[0] - 0.8, foot[1] + 0.7]]), w: 0.15, depth: 0.2 }, { pts: P([[knee[0] + 0.9, -2.2], [foot[0] + 1.2, -4.0], [foot[0] + 1.6, foot[1] + 0.3]]), w: 0.12, depth: 0.16 }, { pts: P([[-1.8, 3.2], [-0.8, 1.4], [0.8, 0.8]]), w: 0.13, depth: 0.16 }, { pts: P([[0.2, 5.4], [0.4, 3.4], [0.6, 1.8]]), w: 0.12, depth: 0.13 },
      ],
      bumps: [{ at: L(0.4, 4.6), r: [1.2, 1.0], h: 0.3 }, { at: s('Ruchbah'), r: [1.2, 1.2], h: 0.3 }],
    });
    // Girdle at the waist.
    limb(P([[-2.0, 1.5, 0.22], [0, 1.2, 0.26], [1.6, 1.4, 0.22]]), { tone: 1.16, warm: 0.76, flat: 0.5, shadow: 0.28, melt: 0 });

    // Arm laid along the throne's side, hand resting on her knee.
    limb(P([[-1.2, 5.0, 0.62], [-0.6, 3.0, 0.5], [1.0, 1.9, 0.44], [2.4, 1.0, 0.3]]), { tone: 1.04, hatch: hatch + 30, shadow: 0.46 });
    // Arm raised, offering the palm branch.
    limb(P([[1.0, 5.4, 0.6], [2.8, 4.4, 0.48], [4.2, 5.4, 0.4], [4.9, 6.6, 0.28]]), { tone: 1.08, hatch: hatch + 60, shadow: 0.46 });
    limb(P([[5.0, 6.7, 0.3], [5.15, 7.0, 0.26]]), { tone: 1.14, shadow: 0.26 });
    const palm = P([[5.05, 6.3], [5.3, 8.4], [4.9, 10.4], [4.1, 12.0]]);
    limb(palm.map((p, i) => [...p, 0.09 - i * 0.015]), { tone: 1.14, warm: 0.58, shadow: 0, melt: 0 });
    for (let i = 1; i <= 9; i++) {
      const t = i / 10, u = 7.0 + t * 5.0, f = 5.15 - t * t * 1.05, l = 1.5 - t * 0.9;
      for (const side of [-1, 1]) line(P([[f, u], [f + side * l * 0.6, u + l * 0.25], [f + side * l, u + l * 0.8]]), { w: 0.07, v: 0.6, warm: 0.56 });
    }

    // Neck, head, hair and crown.
    limb(P([[0.1, 5.7, 0.52], [0.25, 6.7, 0.44]]), { tone: 1.02, shadow: 0.46, hatch: hatch + 90 });
    blob(P([[-0.75, 7.0], [-0.85, 7.9], [-0.3, 8.7], [0.6, 8.8], [1.2, 8.3], [1.4, 7.7], [1.7, 7.2], [1.35, 7.0], [1.3, 6.6], [0.8, 6.2], [0.0, 6.2]]), {
      round: 0.8, tone: 1.2, hatch: hatch + 40, shadow: 0.5, spacing: 0.84,
      creases: [{ pts: P([[0.75, 7.7], [1.05, 7.75], [1.3, 7.65]]), w: 0.05, depth: 0.1 }, { pts: P([[0.95, 6.75], [1.25, 6.8]]), w: 0.04, depth: 0.08 }],
    });
    locks(E, [P([[0.2, 8.8], [-0.9, 8.6], [-1.3, 7.2], [-1.2, 5.6]]), P([[-0.2, 8.7], [-1.4, 8.0], [-1.7, 6.2], [-1.5, 4.4]]), P([[-0.6, 8.3], [-1.9, 7.4], [-2.1, 5.2], [-1.8, 3.4]]), P([[0.6, 8.8], [-0.4, 9.1], [-1.4, 8.4]]), P([[-0.8, 7.6], [-1.2, 6.6], [-1.1, 5.2]])], { w: 0.1, v: 0.52 });
    limb(P([[-0.5, 8.7, 0.13], [0.3, 8.95, 0.15], [1.1, 8.7, 0.13]]), { tone: 1.3, warm: 0.84, shadow: 0.22, flat: 0.6, melt: 0 });
    for (const [f, h] of [[-0.45, 0.6], [0.05, 0.8], [0.55, 0.8], [1.05, 0.6]]) limb(P([[f, 8.9, 0.11], [f - 0.02, 8.9 + h, 0.03]]), { tone: 1.3, warm: 0.84, shadow: 0.16, flat: 0.6, melt: 0 });
  },
};
