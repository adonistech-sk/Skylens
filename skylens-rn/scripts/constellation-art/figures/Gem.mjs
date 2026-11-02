// The Twins, side by side with a shoulder shared. Castor and Pollux are their heads, and each
// body runs south-west along its own line of stars to the feet at Tejat and Alhena. Castor holds
// a lyre, Pollux a spear, and the warm note is the lyre.
import { locks } from '../kit.mjs';

function twin(E, o) {
  const { blob, limb } = E;
  const { head, hipA, hipB, kneeA, kneeB, footA, footB, ankleA, ankleB, chest, shoulderA, shoulderB, tone } = o;
  const axis = Math.atan2(hipA[1] - head[1], hipA[0] - head[0]) * (180 / Math.PI);
  const hatch = axis + 62;
  // Back leg, then front leg.
  limb([[hipB[0], hipB[1], 1.3], [kneeB[0], kneeB[1], 0.92], [ankleB[0], ankleB[1], 0.56]], { tone: 0.88 * tone, hatch, shadow: 0.46, creases: [{ pts: [[hipB[0] + 0.6, hipB[1] + 0.6], [kneeB[0] + 0.5, kneeB[1] + 0.5]], w: 0.13, depth: 0.14 }], bumps: [{ at: kneeB, r: [0.6, 0.6], h: 0.18 }] });
  blob([[ankleB[0] - 0.5, ankleB[1] + 0.4], [ankleB[0] + 0.5, ankleB[1] - 0.4], [footB[0] + 0.5, footB[1] - 0.5], [footB[0] + 0.9, footB[1] + 0.2], [footB[0] - 0.3, footB[1] + 0.6]], { round: 0.4, tone: 0.96 * tone, shadow: 0.32 });
  limb([[hipA[0], hipA[1], 1.36], [kneeA[0], kneeA[1], 0.96], [ankleA[0], ankleA[1], 0.56]], { tone: 1.02 * tone, hatch, shadow: 0.5, creases: [{ pts: [[hipA[0] + 0.6, hipA[1] + 0.6], [kneeA[0] + 0.5, kneeA[1] + 0.5]], w: 0.13, depth: 0.14 }], bumps: [{ at: kneeA, r: [0.6, 0.6], h: 0.18 }] });
  blob([[ankleA[0] - 0.5, ankleA[1] + 0.4], [ankleA[0] + 0.5, ankleA[1] - 0.4], [footA[0] + 0.5, footA[1] - 0.5], [footA[0] + 0.9, footA[1] + 0.2], [footA[0] - 0.3, footA[1] + 0.6]], { round: 0.4, tone: 1.08 * tone, shadow: 0.34 });
  // Torso.
  const u = [(hipA[0] + hipB[0]) / 2 - chest[0], (hipA[1] + hipB[1]) / 2 - chest[1]];
  const l = Math.hypot(...u), side = [-u[1] / l, u[0] / l], dir = [u[0] / l, u[1] / l];
  const P = (a, b) => [chest[0] + dir[0] * a + side[0] * b, chest[1] + dir[1] * a + side[1] * b];
  blob([P(-2.6, 1.0), P(-2.8, 0.0), P(-2.6, -1.0), P(-1.4, -2.4), P(0.4, -2.2), P(2.0, -1.5), P(l * 0.9, -1.44), P(l + 0.8, -1.8), P(l + 1.0, 1.8), P(l * 0.9, 1.44), P(2.0, 1.5), P(0.4, 2.2), P(-1.4, 2.4)], {
    round: 1.9, tone: 1.1 * tone, hatch: axis + 32, shadow: 0.6,
    creases: [{ pts: [P(-0.8, 0), P(1.6, 0), P(l, 0)], w: 0.13, depth: 0.2 }, { pts: [P(0.8, -1.8), P(1.0, -0.6), P(0.8, 0)], w: 0.11, depth: 0.15 }, { pts: [P(0.8, 1.8), P(1.0, 0.6), P(0.8, 0)], w: 0.11, depth: 0.15 }, { pts: [P(2.0, -1.0), P(2.2, 0), P(2.0, 1.0)], w: 0.08, depth: 0.1 }, { pts: [P(3.0, -1.0), P(3.2, 0), P(3.0, 1.0)], w: 0.08, depth: 0.1 }],
    bumps: [{ at: P(0, -1.1), r: [1.1, 1.0], h: 0.3 }, { at: P(0, 1.1), r: [1.1, 1.0], h: 0.3 }],
  });
  // Short cloak at the hip.
  blob([P(l - 0.6, -1.9), P(l + 0.2, 0), P(l - 0.6, 1.9), P(l + 2.2, 2.2), P(l + 3.0, 0.8), P(l + 3.6, -0.6), P(l + 2.6, -1.6), P(l + 3.0, -2.4)], { round: 0.8, tone: 0.92 * tone, hatch: axis + 8, shadow: 0.4, warm: o.warm ?? 0, creases: [{ pts: [P(l, -1.0), P(l + 1.6, -0.8), P(l + 2.8, -1.2)], w: 0.13, depth: 0.16 }, { pts: [P(l, 0.6), P(l + 1.5, 0.6), P(l + 2.7, 0.8)], w: 0.13, depth: 0.16 }] });
  // Neck and head.
  limb([[...P(-2.6, 0), 0.74], [(P(-2.6, 0)[0] + head[0]) / 2, (P(-2.6, 0)[1] + head[1]) / 2, 0.6]], { tone: 1 * tone, shadow: 0.44 });
  blob([[head[0] - 1.25, head[1] + 0.3], [head[0] - 0.7, head[1] + 1.2], [head[0] + 0.5, head[1] + 1.4], [head[0] + 1.3, head[1] + 0.7], [head[0] + 1.4, head[1] - 0.4], [head[0] + 0.7, head[1] - 1.2], [head[0] - 0.4, head[1] - 1.3], [head[0] - 1.1, head[1] - 0.7]], {
    round: 1.0, tone: 1.14 * tone, hatch: axis + 14, shadow: 0.5, spacing: 0.86,
    creases: [{ pts: [[head[0] - 0.8, head[1]], [head[0] - 0.4, head[1] + 0.1], [head[0] - 0.1, head[1]]], w: 0.05, depth: 0.1 }, { pts: [[head[0] - 0.6, head[1] - 0.6], [head[0] - 0.2, head[1] - 0.6]], w: 0.04, depth: 0.08 }],
  });
  locks(E, [[[head[0] - 0.8, head[1] + 1.2], [head[0] + 0.6, head[1] + 2.0], [head[0] + 1.9, head[1] + 0.9]], [[head[0] - 0.1, head[1] + 1.6], [head[0] + 1.4, head[1] + 1.7], [head[0] + 2.0, head[1] + 0.1]], [[head[0] + 0.7, head[1] + 1.4], [head[0] + 1.8, head[1] + 0.6], [head[0] + 1.8, head[1] - 0.8]], [[head[0] - 0.9, head[1] + 0.9], [head[0] + 0.2, head[1] + 2.2], [head[0] + 1.6, head[1] + 2.0]]], { w: 0.1, v: 0.58 });
  return { P, shoulderA, shoulderB };
}

export default {
  pixels: 1500,
  anchors: [['Castor', 'head'], ['Pollux', 'head'], [34693, 'waist'], ['Mebsuta', 'knee'], ['Tejat', 'foot'], ['Wasat', 'waist'], ['Mekbuda', 'knee'], ['Alhena', 'foot'], ['Alzirr', 'foot']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const cas = s('Castor'), pol = s('Pollux'), tau = s(34693), mebs = s('Mebsuta'), tej = s('Tejat'), pro = s('Propus'), was = s('Wasat'), mek = s('Mekbuda'), alh = s('Alhena'), alz = s('Alzirr'), ups = s(36962), lam = s('λ Gem');

    // Castor, the northern twin.
    const c = twin(E, { head: cas, chest: [-4.8, 8.2], hipA: [tau[0] + 0.4, tau[1] - 0.2], hipB: [tau[0] + 0.4, tau[1] + 2.0], kneeA: [mebs[0], mebs[1] + 0.4], kneeB: [3.4, 6.2], ankleA: [tej[0] - 1.4, tej[1] + 0.6], ankleB: [8.0, 3.0], footA: tej, footB: [pro[0], pro[1] + 1.8], tone: 1 });
    // Pollux, the southern twin, standing nearer.
    const p = twin(E, { head: pol, chest: [-7.2, 2.2], hipA: [was[0] + 0.4, was[1] + 0.1], hipB: [was[0] + 0.2, was[1] - 2.2], kneeA: [mek[0], mek[1]], kneeB: [-0.6, -6.0], ankleA: [alh[0] - 1.8, alh[1] + 1.6], ankleB: [alz[0] - 1.6, alz[1] + 1.6], footA: alh, footB: alz, tone: 1.06 });

    // Castor's lyre, held out to the north.
    const ly = [-0.2, 12.4];
    limb([[ly[0] - 1.8, ly[1] + 2.4, 0.2], [ly[0] - 1.6, ly[1] + 0.2, 0.38], [ly[0], ly[1] - 1.6, 0.5], [ly[0] + 1.6, ly[1] + 0.2, 0.38], [ly[0] + 1.8, ly[1] + 2.4, 0.2]], { tone: 1.2, warm: 0.76, hatch: 80, shadow: 0.32 });
    limb([[ly[0] - 2.0, ly[1] + 2.5, 0.14], [ly[0] + 2.0, ly[1] + 2.5, 0.14]], { tone: 1.2, warm: 0.76, shadow: 0.24 });
    for (const dx of [-0.9, -0.3, 0.3, 0.9]) line([[ly[0] + dx * 0.6, ly[1] - 0.9], [ly[0] + dx, ly[1] + 2.4]], { w: 0.03, v: 0.7, warm: 0.5, taper: false });
    limb([[...c.P(-1.6, -2.0), 0.56], [-2.4, 10.9, 0.46], [ly[0] - 0.7, ly[1] - 0.8, 0.32]], { tone: 1.04, hatch: 34, shadow: 0.42 });

    // Their joined arms, Castor's around Pollux's shoulder.
    limb([[...c.P(-1.6, 2.0), 0.56], [-7.2, 5.8, 0.46], [-6.4, 3.6, 0.34]], { tone: 1.06, hatch: 18, shadow: 0.42 });

    // Pollux's spear, grounded by his foot, shaft past lambda.
    limb([[-13.0, 8.4, 0.05], [-7.0, -0.4, 0.09], [lam[0], lam[1], 0.09], [0.0, -12.6, 0.07]], { tone: 1.16, warm: 0.32, hatch: 20, shadow: 0.3, flat: 0.6 });
    blob([[-13.5, 9.6, 'c'], [-13.0, 8.3], [-12.1, 8.1], [-12.9, 7.5], [-14.0, 8.3]], { round: 0.25, tone: 1.3, warm: 0.7, shadow: 0.22 });
    limb([[...p.P(-1.6, -2.0), 0.58], [-5.6, 0.2, 0.46], [-6.6, -1.4, 0.34]], { tone: 1.08, hatch: 54, shadow: 0.42 });
    limb([[-5.9, -0.8, 0.46], [-6.6, -1.4, 0.48], [-7.2, -1.9, 0.26]], { tone: 1.12, shadow: 0.32 });
    if (pro[0]) return;
    blob;
  },
};
