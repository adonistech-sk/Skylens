// The Archer, a centaur drawing his bow toward the Scorpion's heart. The bow runs through the
// three Kaus stars, the arrow's point is Alnasl, Nunki sits on the drawn shoulder, and the horse
// body runs east through Ascella to Terebellum. A rippling cape takes the warm note.
import { hoof, locks } from '../kit.mjs';

export default {
  pixels: 1500,
  anchors: [['Kaus Borealis', 'bow'], ['Kaus Media', 'bow'], ['Kaus Australis', 'bow'], ['Alnasl', 'arrow point'], ['Nunki', 'shoulder'], ['Ascella', 'chest of the horse'], ['Albaldah', 'head'], ['Terebellum', 'rump'], ['Arkab Prior', 'hoof'], ['η Sgr', 'hoof'], ['ι Sgr', 'hoof']],
  draw({ s, E }) {
    const { blob, limb, line, strands } = E;
    const kb = s('Kaus Borealis'), km = s('Kaus Media'), ka = s('Kaus Australis'), aln = s('Alnasl'), nun = s('Nunki'), asc = s('Ascella'), ark = s('Arkab Prior'), ruk = s('Rukbat'), eta = s('η Sgr'), iot = s('ι Sgr'), the = s('θ¹ Sgr'), ter = s('Terebellum'), alb = s('Albaldah');

    // Far hind leg and far foreleg.
    limb([[-8.6, -4.4, 2.1], [-7.6, -8.8, 1.3], [-8.4, -11.0, 0.96], [-8.0, -14.0, 0.62]], { tone: 0.7, hatch: 84, shadow: 0.5 });
    hoof(E, [-8.0, -14.2], 1.0, -96, { tone: 0.84 });
    limb([[2.4, -5.6, 1.7], [5.6, -7.6, 1.08], [7.0, -9.2, 0.74], [eta[0] - 0.6, eta[1] - 0.8, 0.54]], { tone: 0.78, hatch: 126, shadow: 0.5 });
    hoof(E, [eta[0] - 0.5, eta[1] - 0.9], 0.96, -36, { tone: 0.88 });

    // Tail streaming east.
    strands([[-14.2, 0.8], [-16.2, -1.0], [-17.4, -3.6], [-17.0, -7.0]], { n: 720, angle: 262, len: 1.9, jitter: 13, v: 0.56, spread: 0.46, seed: 21 });
    limb([[-12.8, 1.4, 0.7], [-15.0, 0.4, 0.64], [-16.6, -1.8, 0.5], [-17.2, -5.0, 0.2]], { tone: 0.95, hatch: 66, shadow: 0.4 });

    // Near hind leg down to iota, with a strong gaskin.
    limb([[-10.8, -2.6, 3.0], [the[0] + 1.2, the[1] + 0.6, 1.92], [-11.2, -11.6, 1.2], [-10.2, -13.4, 0.86], [iot[0] + 0.1, iot[1] + 0.2, 0.6]], {
      tone: 1, hatch: 74, shadow: 0.6, creases: [{ pts: [[-13.4, -5.6], [-12.4, -9.4], [-11.8, -11.6]], w: 0.2, depth: 0.32 }, { pts: [[-8.8, -5.2], [-9.2, -8.4], [-10.2, -11.2]], w: 0.2, depth: 0.28 }],
      bumps: [{ at: [-10.8, -5.0], r: [2.0, 2.6], h: 0.5 }, { at: [-11.0, -12.0], r: [0.8, 0.8], h: 0.24 }],
    });
    hoof(E, [iot[0] + 0.1, iot[1]], 1.12, -98);

    // The horse's body.
    blob([[-14.0, 1.2], [-11.6, 3.0], [-7.6, 2.6], [-3.4, 1.2], [0.4, 0.8], [3.6, -1.0], [4.4, -3.6], [3.2, -6.4], [0.2, -6.8], [-4.2, -5.8], [-8.2, -5.8], [-12.0, -5.2], [-14.2, -2.2]], {
      round: 3.7, tone: 1.04, hatch: 16, shadow: 0.68,
      creases: [{ pts: [[-4.8, 0.8], [-5.8, -2.6], [-4.6, -5.4]], w: 0.26, depth: 0.32 }, { pts: [[0.8, -1.0], [-0.6, -3.4], [0.2, -6.4]], w: 0.24, depth: 0.3 }, { pts: [[-9.2, 2.2], [-9.8, -0.6], [-8.6, -5.2]], w: 0.24, depth: 0.3 }],
      bumps: [{ at: [-11.4, -1.0], r: [3.0, 3.2], h: 0.66 }, { at: [1.0, -3.2], r: [2.6, 2.6], h: 0.56 }],
    });

    // Near foreleg, lifted through Rukbat to Arkab.
    limb([[0.0, -5.4, 2.0], [asc[0] - 2.4, -8.8, 1.32], [ruk[0] + 0.1, ruk[1] + 0.2, 0.96], [-3.6, -15.0, 0.7], [ark[0] - 0.1, ark[1] + 0.8, 0.52]], {
      tone: 1.04, hatch: 96, shadow: 0.6, creases: [{ pts: [[-2.2, -7.8], [-3.6, -11.0], [-4.2, -13.2]], w: 0.16, depth: 0.22 }],
      bumps: [{ at: [ruk[0] + 0.1, ruk[1] + 0.1], r: [0.76, 0.76], h: 0.2 }],
    });
    hoof(E, [ark[0] - 0.1, ark[1] + 0.8], 1.04, -92);

    // Cape thrown behind him, the warm note.
    blob([[0.8, 4.0], [-1.0, 3.2], [-4.0, 3.2], [-7.0, 3.6], [-10.6, 5.2, 'c'], [-8.8, 6.4], [-6.0, 6.0], [-4.4, 7.0], [-1.8, 7.8], [0.6, 7.6]], {
      round: 1.0, tone: 0.92, warm: 0.5, hatch: 12, shadow: 0.42,
      creases: [{ pts: [[0.2, 5.2], [-3.4, 4.6], [-8.4, 5.2]], w: 0.2, depth: 0.28 }, { pts: [[-0.4, 6.6], [-3.0, 6.2], [-5.6, 5.4]], w: 0.18, depth: 0.22 }],
    });

    // Man's torso rising from the withers.
    blob([[-1.8, 0.2], [-1.6, 2.6], [-1.8, 4.4], [-1.0, 5.6], [1.8, 6.0], [3.8, 4.8], [4.0, 2.8], [3.6, 0.4], [3.4, -2.0], [0.4, -1.8]], {
      round: 2.0, tone: 1.1, hatch: 34, shadow: 0.66,
      creases: [{ pts: [[1.2, 5.2], [1.0, 3.0], [0.9, 1.0]], w: 0.14, depth: 0.22 }, { pts: [[3.6, 3.2], [2.0, 2.6], [1.0, 2.8]], w: 0.14, depth: 0.2 }, { pts: [[-1.4, 3.4], [-0.2, 2.6], [0.8, 2.8]], w: 0.14, depth: 0.2 }, { pts: [[-0.6, 0.8], [0.8, 0.9], [2.6, 0.4]], w: 0.1, depth: 0.14 }, { pts: [[-0.6, -0.4], [0.8, -0.4], [2.6, -0.8]], w: 0.1, depth: 0.14 }],
      bumps: [{ at: [2.4, 3.6], r: [1.2, 1.0], h: 0.3 }, { at: [-0.2, 3.6], r: [1.2, 1.0], h: 0.3 }],
    });

    // Bow through the real Kaus stars.
    limb([[kb[0] - 1.8, kb[1] + 3.8, 0.1], [kb[0], kb[1], 0.2], [km[0], km[1], 0.3], [ka[0], ka[1], 0.2], [ka[0] - 2.0, ka[1] - 3.2, 0.1]], { tone: 1.14, warm: 0.6, hatch: 86, shadow: 0.32 });
    line([[kb[0] - 1.8, kb[1] + 3.8], [-0.2, 3.6], [ka[0] - 2.0, ka[1] - 3.2]], { w: 0.04, v: 0.74, taper: false });
    // The arrow, nocked at the drawing hand, pointing to Alnasl.
    line([[-0.8, 3.2], [aln[0], aln[1]]], { w: 0.075, v: 0.92, warm: 0.3, taper: false });
    limb([[aln[0] - 1.1, aln[1] + 0.3, 0.22], [aln[0], aln[1], 0.03]], { tone: 1.24, warm: 0.76, shadow: 0.2, flat: 0.6 });

    // Bow arm, reaching to the middle of the bow.
    limb([[3.0, 4.8, 1.06], [5.0, 2.0, 0.9], [6.8, 0.0, 0.72], [km[0] - 0.8, km[1] + 0.8, 0.5]], { tone: 1.06, hatch: 58, shadow: 0.55, bumps: [{ at: [4.4, 3.0], r: [0.9, 0.6], angle: -52, h: 0.2 }] });
    limb([[km[0] - 0.9, km[1] + 0.9, 0.5], [km[0] - 0.2, km[1] + 0.2, 0.54], [km[0] + 0.3, km[1] - 0.2, 0.3]], { tone: 1.1, shadow: 0.35, creases: [{ pts: [[km[0] - 0.7, km[1] - 0.2], [km[0], km[1] + 0.8]], w: 0.06, depth: 0.08 }] });
    // Drawing arm, elbow back past Nunki.
    limb([[-0.6, 5.0, 1.0], [-3.4, 4.2, 0.82], [-5.2, 3.8, 0.66]], { tone: 1.08, hatch: 18, shadow: 0.55, bumps: [{ at: [-2.4, 4.6], r: [1.0, 0.6], h: 0.2 }] });
    limb([[-5.2, 3.8, 0.64], [-3.0, 3.4, 0.56], [-0.8, 3.2, 0.4]], { tone: 1.1, hatch: 30, shadow: 0.45 });

    // Neck, head, wreath.
    limb([[1.0, 5.6, 0.72], [0.9, 6.7, 0.6]], { tone: 1, shadow: 0.5 });
    blob([[-0.2, 7.0], [-0.3, 8.0], [0.3, 8.9], [1.3, 9.2], [2.1, 8.8], [2.5, 8.1], [2.9, 7.6], [2.5, 7.3], [2.4, 6.8], [2.0, 6.3], [1.2, 6.2], [0.3, 6.4]], {
      round: 0.8, tone: 1.14, hatch: 36, shadow: 0.55, spacing: 0.84,
      creases: [{ pts: [[1.5, 7.9], [2.0, 7.95], [2.4, 7.8]], w: 0.05, depth: 0.1 }, { pts: [[1.8, 6.8], [2.2, 6.9]], w: 0.04, depth: 0.08 }],
    });
    locks(E, [[[1.6, 9.2], [0.2, 9.4], [-0.7, 8.4]], [[1.1, 9.4], [-0.4, 9.2], [-1.1, 7.8]], [[0.5, 8.9], [-0.6, 8.0], [-0.8, 6.8]], [[-0.1, 8.1], [-0.5, 7.2], [-0.3, 6.4]]], { w: 0.11, v: 0.56 });
    limb([[-0.4, 7.7, 0.08], [0.6, 8.6, 0.09], [1.9, 8.9, 0.08]], { tone: 1.2, warm: 0.8, shadow: 0.15, flat: 0.6 });
    strands([[1.6, 6.3], [2.2, 6.5]], { n: 40, angle: 262, len: 0.5, jitter: 18, v: 0.7, spread: 0.08, seed: 23, w: 0.025 });
    if (alb[0] && ter[0] && nun[0]) return;
  },
};
