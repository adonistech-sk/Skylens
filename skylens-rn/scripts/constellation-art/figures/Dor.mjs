// The Dolphinfish, the mahi-mahi, leaping: the bull's tall square forehead at Gamma, Alpha behind
// the gill, Zeta high on the flank under the long sail of the back fin, Beta at the narrow of the
// tail, and Delta and the unnamed star on the two lobes of the deep fork. The warm note is the eye.
import { frame } from '../kit.mjs';

export default {
  tier: 'extended',
  subject: 'The Dolphinfish',
  pixels: 1000,
  anchors: [['γ Dor', 'forehead'], ['α Dor', 'shoulder'], ['ζ Dor', 'flank'], ['β Dor', 'tail root'], ['δ Dor', 'tail'], [27890, 'tail']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const gam = s('γ Dor'), bet = s('β Dor'), del = s('δ Dor'), odd = s(27890);
    const L = frame(bet, gam, -1);
    // u runs tail to head, f toward the back.
    const T = (u, f) => L(f, u);
    const a = L.angle;

    // The two lobes of the tail, long, curved and fine-rayed.
    const lobe = (star, sign) => {
      const rel = L.back(star), tip = [rel[1] * 1.62, rel[0] * 1.62 - sign * 0.3], root = [0.4, sign * 0.14];
      const ou = [root[0] + (tip[0] - root[0]) * 0.54, root[1] + (tip[1] - root[1]) * 0.54 + sign * 0.46];
      const iu = [root[0] + (tip[0] - root[0]) * 0.46, root[1] + (tip[1] - root[1]) * 0.46 - sign * 0.62];
      const rays = [];
      for (let k = 1; k < 7; k++) { const q = k / 7; rays.push({ pts: [T(...root), T(ou[0] + (iu[0] - ou[0]) * q, ou[1] + (iu[1] - ou[1]) * q), T(tip[0] * (1 - q * 0.34), tip[1] * (1 - q * 0.34))], w: 0.05, depth: 0.08 }); }
      blob([T(0.7, sign * 0.34), T(...ou), [...T(...tip), 'c'], T(...iu), T(-0.3, 0)], { round: 0.5, tone: 1.08, hatch: a + 80, shadow: 0.4, band: 0.3, creases: rays });
    };
    lobe(odd, 1);
    lobe(del, -1);

    // The sail of the back fin, crown to tail, with free ray tips along the top.
    const back = [[1.2, 0.5], [2.4, 1.0], [4, 1.5], [6, 2.0], [8, 2.3], [10, 2.7], [12, 3.1], [13.4, 3.4]];
    const crest = [[1.2, 1.2], [2.2, 1.9], [3.6, 2.8], [5.0, 3.5], [6.6, 4.2], [8.2, 4.8], [9.8, 5.4], [11.2, 5.9], [12.4, 6.0], [13.2, 5.6], [13.8, 4.6]];
    const sail = [...back.map(([u, f]) => T(u, f - 0.2))];
    [...crest].reverse().forEach(([u, f], i, all) => {
      sail.push([...T(u, f), 'c']);
      if (i < all.length - 1) { const n = all[i + 1]; sail.push(T((u + n[0]) / 2 - 0.06, (f + n[1]) / 2 - 0.24)); }
    });
    blob(sail, {
      round: 0.34, tone: 1.08, hatch: a + 4, shadow: 0.42, band: 0.26,
      creases: crest.map(([u, f]) => ({ pts: [T(u - 1.2, f - 2.2 < 0.6 ? 0.6 : f - 2.1), T(u, f - 0.1)], w: 0.05, depth: 0.09 })),
    });

    // The low fin under the tail end.
    const under = [[6.6, -0.8], [5.2, -0.7], [3.8, -0.6], [2.4, -0.4], [1.3, -0.4]];
    blob([...under.map(([u, f]) => T(u, f + 0.14)), T(1.4, -1.0), T(2.4, -1.5), T(3.6, -1.9), T(4.8, -2.2), [...T(6.0, -2.5), 'c'], T(6.6, -1.6)], {
      round: 0.28, tone: 1.0, hatch: a + 4, shadow: 0.4, band: 0.26,
      creases: under.map(([u, f]) => ({ pts: [T(u, f - 0.1), T(u - 0.3, f - 1.3)], w: 0.045, depth: 0.08 })),
    });
    // The belly fin.
    blob([T(11.8, -1.1), T(11.0, -1.1), T(9.9, -2.0), [...T(9.0, -3.2), 'c'], T(10.6, -2.5), T(11.8, -1.8)], { round: 0.24, tone: 1.02, hatch: a + 8, shadow: 0.4, creases: [{ pts: [T(11.2, -1.2), T(9.5, -2.7)], w: 0.04, depth: 0.07 }] });

    // The body: slim, tapering hard to the tail, the head rising like a cliff.
    const outline = [T(-0.2, 0.3), T(2, 0.9), T(4, 1.5), T(6, 2.0), T(8, 2.35), T(10, 2.7), T(12, 3.15), T(13.6, 3.45), T(15, 3.2), T(15.9, 2.2), T(16.3, 1.0), T(16.2, 0.1), T(15.4, -0.6), T(14, -1.0), T(12, -1.25), T(10, -1.25), T(8, -1.05), T(6, -0.8), T(4, -0.6), T(2, -0.4), T(-0.2, -0.3)];
    const lateral = [];
    for (let n = 0; n < 3; n++) { const pts = []; for (let u = 1.2; u <= 12.2; u += 1.5) pts.push(T(u, 0.05 + (u / 16) * (0.6 + n * 1.0) - n * 0.3)); lateral.push({ pts, w: 0.05, depth: 0.07 }); }
    const scales = [];
    for (let u = 2.4; u < 12.6; u += 0.7) {
      for (let f = -0.9 - (u / 16); f < 3.4; f += 0.56) {
        const shift = Math.round(u / 0.7) % 2 ? 0.28 : 0, q = f + shift;
        const lim = 0.5 + u * 0.21;
        if (q > lim - 0.2 || q < -0.3 - u * 0.075) continue;
        const c = T(u, q);
        const d = T(u + 0.22, q + 0.2), e = T(u + 0.22, q - 0.2);
        scales.push({ pts: [d, c, e], w: 0.028, depth: 0.05 });
      }
    }
    blob(outline, { round: 1.1, tone: 1.14, hatch: a + 70, shadow: 0.56, band: 0.4, creases: [...lateral, ...scales], bumps: [{ at: T(13.2, 1.6), r: [1.6, 1.2], angle: -a, h: 0.2 }] });

    // The dark speckles of a living fish.
    for (const [u, f] of [[3.4, 0.3], [4.6, 0.8], [5.4, 0.1], [6.4, 1.1], [7.4, 0.4], [8.2, 1.5], [9.0, 0.7], [9.6, 1.8], [10.6, 0.3], [10.9, 1.2], [11.6, 2.2]]) {
      const c = T(u, f);
      limb([[c[0], c[1], 0.1], [c[0] + 0.02, c[1], 0.1]], { tone: 0.16, shadow: 0, melt: 0 });
    }

    // Gill cover, jaw.
    blob([T(12.9, 2.6), T(13.6, 2.0), T(13.5, 0.8), T(13.1, -0.2), T(13.5, -0.8), T(15.3, -0.6), T(16.2, 0.1), T(16.2, 1.4), T(15.3, 2.4), T(14.2, 2.8)], {
      round: 0.56, tone: 1.2, hatch: a + 44, shadow: 0.44, band: 0.3,
      creases: [{ pts: [T(14.1, 1.8), T(14.5, 0.8), T(14.1, -0.5)], w: 0.05, depth: 0.08 }, { pts: [T(16.1, 0.3), T(15.4, 0.34), T(15.0, 0.1)], w: 0.06, depth: 0.12 }],
    });
    line([T(16.25, 0.3), T(15.4, 0.3), T(14.9, 0.0)], { w: 0.07, v: 0.5, dark: true });

    // The pectoral, laid back along the flank.
    blob([T(13.0, 0.7), T(12.9, 0.1), T(12.0, -0.5), T(10.0, -0.7, ), T(8.9, -0.4, 'c'), T(10.6, 0.3), T(12.2, 0.8)], {
      round: 0.22, tone: 1.26, hatch: a + 8, shadow: 0.44, band: 0.2,
      creases: [{ pts: [T(12.8, 0.4), T(9.6, -0.42)], w: 0.04, depth: 0.08 }, { pts: [T(12.6, 0.1), T(10.6, -0.5)], w: 0.04, depth: 0.08 }, { pts: [T(12.6, 0.6), T(10.6, 0.1)], w: 0.04, depth: 0.08 }],
    });

    // Eye with a copper ring.
    const eye = T(15.0, 1.2);
    limb([[eye[0], eye[1], 0.32], [eye[0] + 0.01, eye[1], 0.32]], { tone: 1.3, warm: 0.74, shadow: 0.2, melt: 0 });
    limb([[eye[0], eye[1], 0.17], [eye[0] + 0.01, eye[1], 0.17]], { tone: 0.14, shadow: 0, melt: 0 });
    void gam;
  },
};
