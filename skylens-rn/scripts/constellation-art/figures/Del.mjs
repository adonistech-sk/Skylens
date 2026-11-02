// The Dolphin, leaping over the back of the summer Milky Way, seen in profile at the top of its
// arc. The diamond of Job's Coffin lies along the shoulder and the back, Aldulfin sits at the root
// of the tail, and the head dips east, the beak aimed back down at the water.
export default {
  tier: 'extended',
  subject: 'The Dolphin',
  pixels: 1100,
  anchors: [['Sualocin', 'back'], ['Rotanev', 'flank'], ['γ² Del', 'melon'], ['δ Del', 'shoulder'], ['Aldulfin', 'tail']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const ald = s('Aldulfin');

    // Far flipper, a dark shape past the belly.
    blob([[-1.2, -0.3], [-1.3, -1.1], [-1.9, -2.2], [-2.5, -2.9, 'c'], [-2.3, -1.9], [-2.1, -1.0], [-1.9, -0.5]], { round: 0.25, tone: 0.72, hatch: 70, shadow: 0, band: 0.16 });

    // Flukes, a level crescent seen slightly from above, the warm note along the trailing edge.
    blob([[ald[0] + 0.1, ald[1] - 0.2], [ald[0] + 0.9, ald[1] - 0.5], [ald[0] + 2.0, ald[1] - 0.4], [ald[0] + 2.9, ald[1] + 0.3, 'c'], [ald[0] + 2.2, ald[1] - 1.0], [ald[0] + 1.1, ald[1] - 1.6], [ald[0] + 0.3, ald[1] - 1.9, 'c'], [ald[0] - 0.4, ald[1] - 2.2], [ald[0] - 1.4, ald[1] - 2.3], [ald[0] - 2.5, ald[1] - 1.8, 'c'], [ald[0] - 1.5, ald[1] - 1.5], [ald[0] - 0.7, ald[1] - 0.9], [ald[0] - 0.3, ald[1] - 0.3]], {
      round: 0.34, tone: 1.02, hatch: 30, shadow: 0, band: 0.16,
      creases: [{ pts: [[ald[0] + 0.1, ald[1] - 0.5], [ald[0] + 1.1, ald[1] - 0.9], [ald[0] + 2.3, ald[1] - 0.5]], w: 0.05, depth: 0.08 }, { pts: [[ald[0] - 0.1, ald[1] - 0.8], [ald[0] - 0.8, ald[1] - 1.6], [ald[0] - 1.9, ald[1] - 1.75]], w: 0.05, depth: 0.08 }, { pts: [[ald[0] + 0.15, ald[1] - 0.3], [ald[0] + 0.2, ald[1] - 1.0], [ald[0] + 0.3, ald[1] - 1.7]], w: 0.04, depth: 0.06 }],
    });
    line([[ald[0] + 2.8, ald[1] + 0.2], [ald[0] + 2.1, ald[1] - 1.02], [ald[0] + 1.1, ald[1] - 1.6], [ald[0] + 0.32, ald[1] - 1.86]], { w: 0.03, v: 0.8, warm: 0.7 });
    line([[ald[0] + 0.28, ald[1] - 1.88], [ald[0] - 0.4, ald[1] - 2.18], [ald[0] - 1.4, ald[1] - 2.26], [ald[0] - 2.4, ald[1] - 1.82]], { w: 0.03, v: 0.8, warm: 0.7 });

    // Dorsal fin, swept back toward the tail, behind the body.
    blob([[0.3, 2.5], [1.0, 3.5], [2.2, 4.2, 'c'], [2.0, 3.2], [1.9, 2.2], [2.0, 1.4], [1.2, 1.3]], {
      round: 0.32, tone: 0.98, hatch: 60, shadow: 0, band: 0.18,
      creases: [{ pts: [[0.9, 2.2], [1.3, 2.9], [1.9, 3.6]], w: 0.05, depth: 0.08 }, { pts: [[1.4, 1.8], [1.6, 2.5], [1.9, 3.1]], w: 0.04, depth: 0.06 }],
    });

    // Body: tail stock up through the diamond and over to the head. A smooth tapered torpedo,
    // the form all in the long lines of the skin.
    limb([[ald[0] + 0.0, ald[1] - 0.1, 0.4], [ald[0] - 0.1, ald[1] + 1.2, 0.62], [1.5, -0.6, 0.98], [0.8, 0.5, 1.44], [-0.4, 1.2, 1.68], [-1.8, 1.3, 1.54], [-3.0, 0.9, 1.2], [-3.9, 0.3, 0.94]], {
      tone: 1.14, hatch: 40, shadow: 0.6, band: 0.3, melt: 0,
      creases: [
        // The line where the dark back meets the pale belly, sweeping the length of the animal.
        { pts: [[-3.8, -0.4], [-2.4, 0.1], [-0.9, 0.05], [0.4, -0.2], [1.4, -0.9], [1.7, -2.2]], w: 0.08, depth: 0.12 },
        // Two long muscle runs along the flank.
        { pts: [[-1.8, 2.1], [-0.2, 2.0], [1.0, 1.1], [1.8, -0.5]], w: 0.06, depth: 0.1 },
        { pts: [[-1.2, 1.2], [0.1, 1.2], [1.0, 0.5]], w: 0.05, depth: 0.08 },
      ],
      bumps: [{ at: [-0.3, 1.4], r: [1.4, 1.0], angle: -10, h: 0.2 }],
    });
    // Pale belly, a lighter tone along the underside.
    blob([[-3.7, -0.5], [-2.4, 0.0], [-0.9, -0.05], [0.4, -0.3], [1.3, -1.0], [1.55, -2.4], [1.62, -3.0], [1.1, -1.9], [0.5, -1.3], [-0.6, -0.65], [-2.0, -0.45], [-3.2, -0.5]], { round: 0.4, tone: 1.26, hatch: 8, shadow: 0, band: 0.1, edge: 0.3, spacing: 0.8 });

    // Near flipper, a curved blade from behind the head.
    blob([[-1.8, 0.5], [-1.4, 0.1], [-1.0, -0.6], [-0.9, -1.4], [-1.1, -2.1, 'c'], [-1.7, -1.4], [-2.3, -0.7], [-2.5, 0.1]], {
      round: 0.3, tone: 1.08, hatch: 76, shadow: 0.55, band: 0.14,
      creases: [{ pts: [[-1.9, 0.2], [-1.6, -0.5], [-1.2, -1.4]], w: 0.05, depth: 0.08 }],
    });

    // The head: bulging melon, a crease at the base of the beak, the long fine beak, a small eye.
    blob([[-2.8, 2.05], [-3.6, 1.95], [-4.4, 1.5], [-4.75, 0.9], [-5.2, 0.5], [-5.95, 0.0], [-6.55, -0.5], [-6.75, -0.8], [-6.45, -0.82], [-5.7, -0.5], [-4.9, -0.32], [-4.1, -0.34], [-3.2, -0.45], [-2.6, 0.4]], {
      round: 0.5, tone: 1.22, hatch: 22, shadow: 0.5, band: 0.2, spacing: 0.92,
      creases: [
        // The smile, the long mouth line running back under the eye.
        { pts: [[-6.72, -0.76], [-5.8, -0.26], [-4.9, -0.02], [-4.15, 0.12], [-3.8, 0.3]], w: 0.05, depth: 0.1 },
        // The crease where the melon meets the beak.
        { pts: [[-4.78, 0.72], [-4.7, 0.46], [-4.8, 0.1]], w: 0.06, depth: 0.14 },
      ],
      bumps: [{ at: [-3.8, 1.1], r: [0.9, 0.8], h: 0.22 }],
    });
    limb([[-3.42, 0.72, 0.05], [-3.6, 0.68, 0.13], [-3.82, 0.58, 0.04]], { tone: 0.5, shadow: 0.4, melt: 0, rim: 1, band: 0.05 });
    limb([[-3.62, 0.72, 0.042], [-3.63, 0.72, 0.04]], { tone: 1.6, shadow: 0, melt: 0, edge: 0 });
    // The blowhole on the crown.
    line([[-2.75, 2.5], [-2.55, 2.54], [-2.35, 2.5]], { w: 0.03, v: 0.8 });
  },
};
