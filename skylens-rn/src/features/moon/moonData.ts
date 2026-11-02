// The Moon Atlas's data, free of device APIs so it can be tested against the real files:
// the IAU feature catalog, elevation, and the map tile layout.
import { editDistance, normalize } from '../../data/search';

export interface LunarFeature {
  /** Canonical object ID, `lunar:<USGS feature ID>`. */
  id: string;
  name: string;
  code: string;
  lat: number;
  /** East positive, -180 to 180. */
  lon: number;
  /** Kilometres. */
  diameter: number;
  origin: string | null;
}

export const FEATURE_TYPES: Record<string, string> = {
  AA: 'Crater', AL: 'Albedo feature', CA: 'Crater chain', DO: 'Ridge', LC: 'Lake', LF: 'Landing site', ME: 'Sea', MO: 'Mountain', OC: 'Ocean', PA: 'Marsh', PL: 'Plain', PR: 'Promontory',
  RI: 'Rille', RU: 'Scarp', SF: 'Satellite crater', SI: 'Bay', ST: 'Station', VA: 'Valley',
};
export const featureType = (code: string) => FEATURE_TYPES[code] ?? 'Feature';

/** Parses the catalog file, biggest first. */
export function parseFeatures(text: string): LunarFeature[] {
  const rows = JSON.parse(text) as [string, string, number, number, number, string | 0, number][];
  return rows.map(([name, code, lat, lon, diameter, origin, id]) => ({ id: `lunar:${id}`, name, code, lat, lon, diameter, origin: origin || null }));
}

export const bytesToText = (b: Uint8Array) => {
  let text = '';
  for (let i = 0; i < b.length; i += 8192) text += String.fromCharCode(...b.subarray(i, i + 8192));
  return text;
};

export class FeatureIndex {
  byId = new Map<string, LunarFeature>();
  private named: { key: string; feature: LunarFeature }[];

  constructor(public features: LunarFeature[]) {
    for (const f of features) this.byId.set(f.id, f);
    this.named = features.map((f) => ({ key: normalize(f.name), feature: f })).sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  }

  /** Exact, then prefix, then any later word, then a near spelling. Bigger features first. */
  search(query: string, limit = 20): LunarFeature[] {
    const q = normalize(query);
    if (!q) return [];
    const scored = new Map<LunarFeature, number>();
    const give = (f: LunarFeature, base: number) => { const score = base + Math.min(1, f.diameter / 1000); if (score > (scored.get(f) ?? -1)) scored.set(f, score); };
    let low = 0, high = this.named.length;
    while (low < high) { const mid = (low + high) >> 1; if (this.named[mid].key < q) low = mid + 1; else high = mid; }
    for (let i = low; i < this.named.length && this.named[i].key.startsWith(q); i++) give(this.named[i].feature, this.named[i].key === q ? 10 : 6);
    if (scored.size < limit) {
      for (const { key, feature } of this.named) {
        if (key.split(' ').slice(1).some((w) => w.startsWith(q))) give(feature, 4);
        else if (q.length >= 4 && feature.code !== 'SF' && Math.abs(key.length - q.length) <= 2 && editDistance(q, key, q.length >= 7 ? 2 : 1) !== null) give(feature, 3);
      }
    }
    return [...scored.entries()].sort((a, b) => b[1] - a[1] || a[0].name.localeCompare(b[0].name)).slice(0, limit).map(([f]) => f);
  }
}

// ---- Elevation ----

export const DEM_WIDTH = 720, DEM_HEIGHT = 360;

export class Elevation {
  private grid: Int16Array;
  constructor(bytes: Uint8Array) {
    const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    this.grid = new Int16Array(DEM_WIDTH * DEM_HEIGHT);
    for (let i = 0; i < this.grid.length; i++) this.grid[i] = v.getInt16(i * 2, true);
  }

  /** Metres from the 1737.4 km reference sphere, by bilinear interpolation. */
  at(lat: number, lon: number): number {
    const x = (((lon + 180) / 360) * DEM_WIDTH + DEM_WIDTH - 0.5) % DEM_WIDTH, y = Math.max(0, Math.min(DEM_HEIGHT - 1.001, ((90 - lat) / 180) * DEM_HEIGHT - 0.5));
    const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
    const g = (a: number, b: number) => this.grid[b * DEM_WIDTH + (a % DEM_WIDTH)];
    return (g(x0, y0) * (1 - fx) + g(x0 + 1, y0) * fx) * (1 - fy) + (g(x0, y0 + 1) * (1 - fx) + g(x0 + 1, y0 + 1) * fx) * fy;
  }
}

// ---- Map tiles ----

export const TILE_SIZE = 512, TILE_GUTTER = 2;
export const LEVELS = [{ level: 1, cols: 8, rows: 4 }, { level: 2, cols: 16, rows: 8 }];

export interface TileRef { level: number; col: number; row: number }

export const tileIndex = (t: TileRef) => (t.level === 1 ? t.row * 8 + t.col : 32 + t.row * 16 + t.col);

/** Pixels per degree on the sphere from the base map, then each level. */
export const LEVEL_PPD = { 0: 2048 / 360, 1: 4096 / 360, 2: 8192 / 360 };

/** The finest level worth reading for this many screen pixels per surface degree. */
export function levelFor(pixelsPerDegree: number): 0 | 1 | 2 {
  if (pixelsPerDegree <= LEVEL_PPD[0] * 1.2) return 0;
  return pixelsPerDegree <= LEVEL_PPD[1] * 1.2 ? 1 : 2;
}

export function tileAt(level: 1 | 2, lat: number, lon: number): TileRef {
  const l = LEVELS[level - 1];
  return { level, col: Math.min(l.cols - 1, Math.floor(((lon + 180) / 360) * l.cols)), row: Math.min(l.rows - 1, Math.floor(((90 - lat) / 180) * l.rows)) };
}

/** The four tiles nearest a point: the one under it and its closest neighbours. */
export function tilesAround(level: 1 | 2, lat: number, lon: number): TileRef[] {
  const l = LEVELS[level - 1];
  const fx = ((lon + 180) / 360) * l.cols, fy = ((90 - lat) / 180) * l.rows;
  const col = Math.floor(fx), row = Math.min(l.rows - 1, Math.floor(fy));
  const nextCol = fx - col < 0.5 ? col - 1 : col + 1, nextRow = fy - row < 0.5 ? row - 1 : row + 1;
  const wrap = (c: number) => (c + l.cols) % l.cols;
  const out: TileRef[] = [{ level, col: wrap(col), row }, { level, col: wrap(nextCol), row }];
  if (nextRow >= 0 && nextRow < l.rows) out.push({ level, col: wrap(col), row: nextRow }, { level, col: wrap(nextCol), row: nextRow });
  return out;
}

/** Map bounds of a tile as u0, v0, u1, v1 across the whole globe. */
export function tileBounds(t: TileRef): [number, number, number, number] {
  const l = LEVELS[t.level - 1];
  return [t.col / l.cols, t.row / l.rows, (t.col + 1) / l.cols, (t.row + 1) / l.rows];
}

export interface TileDirectory { count: number; size: number; offsets: Uint32Array; lengths: Uint32Array; crcs: Uint32Array }

export const TILE_HEADER = 16, TILE_ENTRY = 12;

export function readTileDirectory(b: Uint8Array): TileDirectory {
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  if (String.fromCharCode(b[0], b[1], b[2], b[3]) !== 'SKM1') throw new Error('Not a tile pack');
  const count = v.getUint32(8, true);
  const d: TileDirectory = { count, size: v.getUint32(12, true), offsets: new Uint32Array(count), lengths: new Uint32Array(count), crcs: new Uint32Array(count) };
  for (let i = 0; i < count; i++) {
    d.offsets[i] = v.getUint32(TILE_HEADER + i * TILE_ENTRY, true);
    d.lengths[i] = v.getUint32(TILE_HEADER + i * TILE_ENTRY + 4, true);
    d.crcs[i] = v.getUint32(TILE_HEADER + i * TILE_ENTRY + 8, true);
  }
  return d;
}

/** Surface span of a view: pixels per degree at the sub-camera point of a sphere of radius 1. */
export function surfacePixelsPerDegree(distance: number, focal: number) {
  const nearest = Math.max(1e-3, distance - 1);
  return (focal / nearest) * (Math.PI / 180);
}
