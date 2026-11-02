// The constellation artwork register. This is data about illustrations and nothing else: the
// figures' lines live in the catalog, their star positions in the star table, and the printed
// plates in assets/constellation-art. A constellation with no record here simply has no
// illustration. Nothing stands in for a figure that hasn't been drawn.
import raw from './generated/constellationArt.json';

export interface ArtAnchor {
  hip: number;
  /** Where the star falls in the figure's plane, in degrees. Printed from the catalog. */
  x: number;
  y: number;
  /** The part of the figure this star marks. */
  part: string;
}

export interface ArtRecord {
  id: string;
  tier: 'priority' | 'extended';
  subject: string;
  /** Right ascension and declination of the plane's centre, degrees, J2000. */
  centre: [number, number];
  /** Left, bottom, right, top of the plate in plane degrees. */
  extent: [number, number, number, number];
  width: number;
  height: number;
  /** Degrees from the centre to the farthest part of the figure. */
  radius: number;
  anchors: ArtAnchor[];
  /** Every star of the figure's lines. The plate leans with these as they drift over time. */
  pins: number[];
  /** Outline loops as flat x, y lists in plane degrees. */
  contour: number[][];
  strokes: number;
  onFigure: { anchors: number; lineStars: number; lineTotal: number };
  bytes: number;
}

export const artRecords = raw as unknown as ArtRecord[];
const byId = new Map(artRecords.map((a) => [a.id, a]));
export const artRecord = (id: string) => byId.get(id) ?? null;
export const hasArtwork = (id: string) => byId.has(id);
