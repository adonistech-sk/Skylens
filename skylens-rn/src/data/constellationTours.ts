// Guided constellation exploration. A tour is a list of catalog objects in a sensible order, and
// nothing else: it holds no coordinates, so every stop is placed by the same engine as everything
// else on the sky. Twelve constellations have written tours. The others are built from what
// lies inside their IAU boundary, and their words come from measured catalog values.
import { Equatorial, angleBetween, equatorialVector } from '../astronomy/core';
import { constellation, describeObject, object, starObject } from './catalog';
import { insideConstellation } from './related';

export interface TourStop {
  /** A catalog object. */
  id: string;
  /** Replaces the object's name when the stop is about something bigger, like the Belt. */
  title?: string;
  note: string;
  /** Field of view to arrive at, when the default would miss the point. */
  fov?: number;
}

export interface Tour { constellation: string; curated: boolean; stops: TourStop[] }

const CURATED: Record<string, TourStop[]> = {
  Ori: [
    { id: 'star:27989', note: 'Red supergiant marking the raised shoulder. Compare its colour with Rigel, diagonally across the figure.', fov: 28 },
    { id: 'star:25336', note: 'A hot blue giant on the other shoulder, much nearer to us than the belt stars.', fov: 28 },
    { id: 'star:26311', title: 'Orion’s Belt', note: 'Three hot blue stars in a nearly straight line. Follow them to the south-east to find Sirius, and to the north-west toward Aldebaran.', fov: 12 },
    { id: 'dso:M42', title: 'The Orion Nebula', note: 'The middle “star” of the sword is a glowing cloud where new stars are forming now. Binoculars show it as a soft haze.', fov: 8 },
    { id: 'star:24436', note: 'A blue supergiant, the brightest star of the figure. Its name means “foot”, from the hunter’s left foot in the old star tables.', fov: 24 },
  ],
  UMa: [
    { id: 'star:54061', title: 'Dubhe and the Pointers', note: 'Dubhe and Merak point almost straight at Polaris. Extend the line by about five times their separation.', fov: 34 },
    { id: 'star:65378', title: 'Mizar and Alcor', note: 'The bend in the tail. Good eyes split the pair, and a small telescope splits Mizar again.', fov: 12 },
    { id: 'dso:M81', title: 'Bode’s Galaxy', note: 'A large spiral about 12 million light-years away, a binocular target above the Bear’s shoulder.', fov: 12 },
    { id: 'dso:M101', title: 'The Pinwheel Galaxy', note: 'A broad face-on spiral above the end of the tail. It needs dark skies.', fov: 12 },
    { id: 'star:67301', note: 'The last star of the handle, moving apart from the rest of the Dipper’s group.', fov: 28 },
  ],
  UMi: [
    { id: 'star:11767', note: 'The North Star, at the end of the tail. Its altitude above your horizon is very nearly your latitude.', fov: 28 },
    { id: 'star:72607', note: 'An orange giant, the brighter of the two “Guardians of the Pole”.', fov: 22 },
    { id: 'star:75097', note: 'The second Guardian. In a dark sky, the four fainter stars between here and Polaris make a good test of sky quality.', fov: 22 },
  ],
  Cas: [
    { id: 'star:3179', note: 'An orange giant marking the Queen’s breast and the base of the W.', fov: 24 },
    { id: 'star:4427', note: 'The centre of the W, a hot star spinning so fast it sheds a disk of gas, and whose brightness changes without warning.', fov: 22 },
    { id: 'dso:M103', title: 'Open cluster M103', note: 'A small cluster of young stars just off Ruchbah, easy in binoculars.', fov: 10 },
    { id: 'dso:M52', title: 'Open cluster M52', note: 'A rich cluster west of the W, along the line from Schedar through Caph.', fov: 12 },
    { id: 'star:746', note: 'The end of the W, on the back of the throne.', fov: 22 },
  ],
  Sco: [
    { id: 'star:80763', note: 'The red heart of the Scorpion. Its name means “rival of Mars”, for its colour.', fov: 24 },
    { id: 'dso:M4', title: 'Globular cluster M4', note: 'One of the nearest globular clusters, just west of Antares and easy to find from it.', fov: 10 },
    { id: 'star:78820', note: 'Fine in the claws at the head of the figure, a multiple star system.', fov: 22 },
    { id: 'dso:M6', title: 'The Butterfly Cluster', note: 'A naked-eye open cluster above the sting.', fov: 10 },
    { id: 'dso:M7', title: 'Ptolemy’s Cluster', note: 'Described by Ptolemy about 130 CE, and larger and brighter than M6 close by.', fov: 10 },
    { id: 'star:85927', note: 'The sting, one of the brightest stars of the Milky Way in the northern summer and southern winter.', fov: 24 },
  ],
  Sgr: [
    { id: 'star:90185', note: 'The bottom of the Teapot and the brightest star of the figure.', fov: 26 },
    { id: 'dso:M8', title: 'The Lagoon Nebula', note: 'A glowing cloud with a young cluster inside, above the spout of the Teapot.', fov: 9 },
    { id: 'dso:M20', title: 'The Trifid Nebula', note: 'Just north of the Lagoon, cut into three lobes by dark dust.', fov: 8 },
    { id: 'dso:M22', title: 'Globular cluster M22', note: 'One of the brightest and nearest globular clusters, close to the top of the Teapot.', fov: 9 },
    { id: 'star:92855', note: 'The handle of the Teapot, on the Archer’s shoulder. The centre of the Galaxy lies west of here.', fov: 24 },
  ],
  Tau: [
    { id: 'star:21421', note: 'The Bull’s eye, an orange giant, which appears among the Hyades but lies less than half as far away.', fov: 18 },
    { id: 'star:20205', title: 'The Hyades', note: 'The V-shaped face of the Bull, the nearest bright open cluster.', fov: 12 },
    { id: 'dso:M45', title: 'The Pleiades', note: 'A young cluster easily seen with the naked eye. How many stars can you count?', fov: 7 },
    { id: 'star:25428', note: 'The tip of the northern horn, also marking the edge of Auriga.', fov: 22 },
    { id: 'dso:M1', title: 'The Crab Nebula', note: 'The remains of a star whose explosion was recorded in 1054. It needs a telescope.', fov: 8 },
  ],
  Leo: [
    { id: 'star:49669', note: 'The heart of the Lion, sitting almost on the ecliptic, so the Moon and planets often pass near it.', fov: 22 },
    { id: 'star:50583', title: 'Algieba', note: 'In the mane: a telescope shows a close pair of golden giant stars.', fov: 14 },
    { id: 'dso:M66', title: 'The Leo Triplet', note: 'Three galaxies, M65, M66 and NGC 3628, in one low-power telescope view under the hind leg.', fov: 8 },
    { id: 'star:57632', note: 'The Lion’s tail, about 36 light-years away.', fov: 22 },
  ],
  Cyg: [
    { id: 'star:102098', note: 'The Swan’s tail, and the top of the Northern Cross. One of the most luminous stars the eye can see.', fov: 26 },
    { id: 'star:100453', note: 'The Swan’s breast, the centre of the Cross, in a glowing region of hydrogen.', fov: 18 },
    { id: 'dso:M29', title: 'Open cluster M29', note: 'A small, compact cluster just south of Sadr.', fov: 8 },
    { id: 'star:95947', note: 'The beak. A small telescope shows a beautiful gold and blue pair.', fov: 12 },
    { id: 'star:102488', note: 'One wingtip of the Swan, along the Milky Way.', fov: 24 },
  ],
  And: [
    { id: 'star:677', note: 'Her head, and also a corner of the Great Square of Pegasus.', fov: 24 },
    { id: 'star:5447', note: 'A red giant marking her girdle, the jumping-off point for the Andromeda Galaxy.', fov: 22 },
    { id: 'dso:M31', title: 'The Andromeda Galaxy', note: 'Its light left about 2.5 million years ago. On a dark night it is visible to the naked eye as an elongated glow.', fov: 8 },
    { id: 'dso:M32', title: 'Satellite galaxy M32', note: 'A small companion of M31. Find it just to the south of the bright core.', fov: 5 },
    { id: 'star:9640', note: 'Her foot, a showpiece gold and blue double in a small telescope.', fov: 18 },
  ],
  Peg: [
    { id: 'star:113963', title: 'The Great Square', note: 'Markab marks one corner of the autumn’s great landmark. Count the stars you can see inside the Square.', fov: 34 },
    { id: 'star:113881', note: 'A red giant at the Square’s north-west corner, noticeably orange in binoculars.', fov: 24 },
    { id: 'star:107315', note: 'The nose of the Horse, an orange supergiant.', fov: 22 },
    { id: 'dso:M15', title: 'Globular cluster M15', note: 'A dense globular cluster just west of Enif, with a collapsed core.', fov: 8 },
  ],
  Gem: [
    { id: 'star:36850', note: 'The head of one twin. A small telescope splits it, and each part is itself a close pair.', fov: 16 },
    { id: 'star:37826', note: 'The head of the other twin, brighter and orange, with a known planet.', fov: 16 },
    { id: 'star:31681', note: 'At the foot of the Twins, and close to the ecliptic.', fov: 22 },
    { id: 'dso:M35', title: 'Open cluster M35', note: 'A large, rich cluster at Castor’s foot, easy in binoculars.', fov: 9 },
  ],
};

/** A walk from the brightest object, always to the nearest one not yet seen. */
function walk(ids: string[]): string[] {
  if (ids.length < 3) return ids;
  const at = (id: string): Equatorial | null => object(id)?.position ?? null;
  const left = ids.slice(1).filter((i) => at(i));
  const route = [ids[0]];
  while (left.length) {
    const here = at(route[route.length - 1])!;
    const v = equatorialVector(here.raHours, here.decDeg);
    left.sort((a, b) => {
      const pa = at(a)!, pb = at(b)!;
      return angleBetween(v, equatorialVector(pa.raHours, pa.decDeg)) - angleBetween(v, equatorialVector(pb.raHours, pb.decDeg));
    });
    route.push(left.shift()!);
  }
  return route;
}

const cache = new Map<string, Tour>();

/** The stops for a constellation, at most six when built from the catalog. */
export function tourFor(id: string): Tour | null {
  const hit = cache.get(id);
  if (hit) return hit;
  const c = constellation(id);
  if (!c) return null;
  const curated = CURATED[id];
  if (curated) {
    const tour = { constellation: id, curated: true, stops: curated };
    cache.set(id, tour);
    return tour;
  }
  const picks = insideConstellation(id, 6).map((r) => r.object.id);
  // A constellation with no named object still has the brightest stars of its figure.
  if (picks.length < 3) {
    const extra = [...new Set(c.lines.flat())].map((h) => starObject(h)).filter((s): s is NonNullable<typeof s> => s !== null)
      .sort((a, b) => (a.magnitude ?? 99) - (b.magnitude ?? 99)).map((s) => s.id).filter((s) => !picks.includes(s));
    picks.push(...extra.slice(0, 3 - picks.length));
  }
  const stops = walk(picks).map((stopId) => ({ id: stopId, note: describeObject(object(stopId)!) }));
  const tour = { constellation: id, curated: false, stops };
  cache.set(id, tour);
  return tour;
}
