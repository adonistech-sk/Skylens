// Reads the deep star pack one sky cell at a time. Tiles load off the frame, a few at a
// time, and the cache is bounded, so no zoom or pan can make memory grow without limit.
// A pack that can't be read is a state to report, never a crash: the bundled stars carry on.
import { Vec3 } from '../../astronomy/core';
import { CELL_COUNT, crc32, GRID_SIDE, PACK_DIRECTORY_ENTRY, PACK_HEADER, PACK_MAGIC, PACK_RECORD, PACK_VERSION, packExtraOffset, packIndexBytes, packIndexOffset, packRecordsOffset } from './grid';

/** Where a pack's bytes come from, so one reader serves the file system, a CDN or a test. */
export interface PackStorage {
  read(offset: number, length: number): Promise<Uint8Array>;
  close?(): void;
}

export interface StarRow { hip: number; ra: number; dec: number; pmRA: number; pmDec: number; parallax: number; mag: number; bv: number }

export interface StarTile {
  cell: number;
  count: number;
  hip: Uint32Array;
  ra: Float32Array;
  dec: Float32Array;
  pmRA: Float32Array;
  pmDec: Float32Array;
  parallax: Float32Array;
  /** Faintest last within a tile. */
  mag: Float32Array;
  bv: Float32Array;
  /** Unit vectors at `years`, three numbers per star. */
  xyz: Float32Array;
  years: number;
  lastUsed: number;
}

export type PackStatus = 'closed' | 'opening' | 'ready' | 'failed';

/** Star numbers in the pack, for finding one without reading the rest. */
export interface PackIndex {
  /** Sorted. */
  hips: Uint32Array;
  /** The sky cell of each entry in hips. */
  cells: Uint16Array;
  /** [hip, hr, hd, spectral] for bundled stars whose designations stayed out of the bundle. */
  extra: [number, number, number, string | 0][];
}

export interface DeepPackOptions {
  /** Stars kept decoded. Older tiles are dropped past this. */
  maxLoadedStars?: number;
  tilesPerTick?: number;
  onChange?: () => void;
  direction: (ra: number, dec: number, pmRA: number, pmDec: number, years: number) => Vec3;
}

const view = (b: Uint8Array) => new DataView(b.buffer, b.byteOffset, b.byteLength);

function decode(bytes: Uint8Array, cell: number, years: number, direction: DeepPackOptions['direction']): StarTile {
  const count = bytes.length / PACK_RECORD;
  const v = view(bytes);
  const t: StarTile = {
    cell, count, hip: new Uint32Array(count), ra: new Float32Array(count), dec: new Float32Array(count), pmRA: new Float32Array(count), pmDec: new Float32Array(count),
    parallax: new Float32Array(count), mag: new Float32Array(count), bv: new Float32Array(count), xyz: new Float32Array(count * 3), years, lastUsed: 0,
  };
  for (let i = 0; i < count; i++) {
    const o = i * PACK_RECORD;
    t.hip[i] = v.getUint32(o, true);
    t.ra[i] = v.getFloat32(o + 4, true);
    t.dec[i] = v.getFloat32(o + 8, true);
    t.pmRA[i] = v.getFloat32(o + 12, true);
    t.pmDec[i] = v.getFloat32(o + 16, true);
    t.parallax[i] = v.getFloat32(o + 20, true);
    t.mag[i] = v.getInt16(o + 24, true) / 100;
    const c = v.getInt16(o + 26, true);
    t.bv[i] = c === -32768 ? NaN : c / 1000;
  }
  placeTile(t, years, direction);
  return t;
}

/** Moves a tile's stars to an epoch. */
export function placeTile(t: StarTile, years: number, direction: DeepPackOptions['direction']) {
  for (let i = 0; i < t.count; i++) {
    const p = direction(t.ra[i], t.dec[i], t.pmRA[i], t.pmDec[i], years);
    t.xyz[i * 3] = p[0]; t.xyz[i * 3 + 1] = p[1]; t.xyz[i * 3 + 2] = p[2];
  }
  t.years = years;
}

export class DeepPack {
  status: PackStatus = 'closed';
  failure: string | null = null;
  stars = 0;
  /** Reads that failed their checksum. Those cells stay empty rather than wrong. */
  badTiles = 0;

  private storage: PackStorage | null = null;
  private extraBytes = 0;
  private indexRead: Promise<PackIndex | null> | null = null;
  private firstRow = new Uint32Array(CELL_COUNT + 1);
  private fastestMas = new Float32Array(CELL_COUNT);
  private crc = new Uint32Array(CELL_COUNT);
  private tiles = new Map<number, StarTile>();
  private queue: number[] = [];
  private queued = new Set<number>();
  private failedCells = new Set<number>();
  private pumping = false;
  private clock = 0;
  private years = 0;
  private loaded = 0;
  private maxLoaded: number;
  private tilesPerTick: number;

  constructor(private open: () => Promise<PackStorage>, private options: DeepPackOptions) {
    this.maxLoaded = options.maxLoadedStars ?? 50_000;
    this.tilesPerTick = options.tilesPerTick ?? 4;
  }

  get loadedStars() { return this.loaded; }
  get loadedTiles() { return this.tiles.size; }
  /** Fastest proper motion in a cell, milliarcseconds a year. */
  fastest(cell: number) { return this.fastestMas[cell]; }

  async start(): Promise<void> {
    if (this.status !== 'closed') return;
    this.status = 'opening';
    try {
      this.storage = await this.open();
      const head = await this.storage.read(0, packRecordsOffset());
      const v = view(head);
      const magic = String.fromCharCode(head[0], head[1], head[2], head[3]);
      if (magic !== PACK_MAGIC) throw new Error(`Not a star pack: ${magic}`);
      if (v.getUint32(4, true) !== PACK_VERSION) throw new Error('Pack version does not match this build');
      if (v.getUint32(12, true) !== CELL_COUNT || v.getUint32(16, true) !== GRID_SIDE || v.getUint32(20, true) !== PACK_RECORD) throw new Error('Pack layout does not match this build');
      this.stars = v.getUint32(8, true);
      this.extraBytes = v.getUint32(24, true);
      for (let c = 0; c <= CELL_COUNT; c++) {
        const at = PACK_HEADER + c * PACK_DIRECTORY_ENTRY;
        this.firstRow[c] = v.getUint32(at, true);
        if (c < CELL_COUNT) { this.fastestMas[c] = v.getFloat32(at + 4, true); this.crc[c] = v.getUint32(at + 8, true); }
      }
      this.status = 'ready';
    } catch (e) {
      this.status = 'failed';
      this.failure = e instanceof Error ? e.message : String(e);
    }
    this.options.onChange?.();
    this.pump();
  }

  /** The tile for a cell if it is already decoded. Never waits. */
  tile(cell: number): StarTile | undefined {
    const t = this.tiles.get(cell);
    if (t) t.lastUsed = ++this.clock;
    return t;
  }

  /**
   * Asks for the cells in view. The list replaces any earlier one, so a fast pan doesn't
   * spend time on sky that has already left the screen.
   */
  want(cells: ArrayLike<number>, count: number, years: number) {
    if (this.status === 'failed') return;
    if (this.status === 'closed') void this.start();
    this.years = years;
    this.queue = [];
    this.queued.clear();
    for (let i = 0; i < count; i++) {
      const c = cells[i];
      const known = this.tiles.get(c);
      if (known) { known.lastUsed = ++this.clock; continue; }
      if (this.failedCells.has(c) || this.queued.has(c)) continue;
      this.queue.push(c);
      this.queued.add(c);
    }
    this.pump();
  }

  private async pump() {
    if (this.pumping || this.status !== 'ready' || !this.queue.length) return;
    this.pumping = true;
    while (this.queue.length && this.status === 'ready') {
      for (const cell of this.queue.splice(0, this.tilesPerTick)) {
        this.queued.delete(cell);
        await this.load(cell);
      }
      this.evict();
      this.options.onChange?.();
      await new Promise((r) => setTimeout(r, 0));
    }
    this.pumping = false;
  }

  private async load(cell: number) {
    const from = this.firstRow[cell], to = this.firstRow[cell + 1];
    if (to <= from) { this.tiles.set(cell, decode(new Uint8Array(0), cell, this.years, this.options.direction)); return; }
    try {
      const bytes = await this.storage!.read(packRecordsOffset() + from * PACK_RECORD, (to - from) * PACK_RECORD);
      if (crc32(bytes) !== this.crc[cell]) throw new Error('checksum');
      const t = decode(bytes, cell, this.years, this.options.direction);
      t.lastUsed = ++this.clock;
      this.tiles.set(cell, t);
      this.loaded += t.count;
    } catch {
      this.failedCells.add(cell);
      this.badTiles++;
    }
  }

  private evict() {
    if (this.loaded <= this.maxLoaded) return;
    const oldest = [...this.tiles.values()].sort((a, b) => a.lastUsed - b.lastUsed);
    for (const t of oldest) {
      if (this.loaded <= this.maxLoaded) break;
      this.tiles.delete(t.cell);
      this.loaded -= t.count;
    }
  }

  /** The star numbers, read once. Null if the pack can't be used. */
  index(): Promise<PackIndex | null> {
    this.indexRead ??= this.readIndex().catch(() => { this.indexRead = null; return null; });
    return this.indexRead;
  }

  private async readIndex(): Promise<PackIndex | null> {
    if (this.status === 'closed') await this.start();
    if (this.status !== 'ready' || !this.storage) return null;
    const bytes = await this.storage.read(packIndexOffset(this.stars), packIndexBytes(this.stars));
    const v = view(bytes);
    const hips = new Uint32Array(this.stars), cells = new Uint16Array(this.stars);
    for (let i = 0; i < this.stars; i++) {
      hips[i] = v.getUint32(i * 4, true);
      cells[i] = v.getUint16(this.stars * 4 + i * 2, true);
    }
    let extra: PackIndex['extra'] = [];
    if (this.extraBytes) {
      const raw = await this.storage.read(packExtraOffset(this.stars), this.extraBytes);
      // Pure ASCII, as a test holds it to be, so no decoder is needed.
      let text = '';
      for (let i = 0; i < raw.length; i += 8192) text += String.fromCharCode(...raw.subarray(i, i + 8192));
      extra = JSON.parse(text);
    }
    return { hips, cells, extra };
  }

  /** Reads stars by number, wherever they are, through the tiles that hold them. */
  async find(hips: Set<number>): Promise<StarRow[]> {
    const index = await this.index();
    if (!index) return [];
    const out: StarRow[] = [];
    const cells = new Map<number, Set<number>>();
    for (const hip of hips) {
      let low = 0, high = index.hips.length - 1;
      while (low < high) { const mid = (low + high) >> 1; if (index.hips[mid] < hip) low = mid + 1; else high = mid; }
      if (index.hips[low] !== hip) continue;
      const cell = index.cells[low];
      if (!cells.has(cell)) cells.set(cell, new Set());
      cells.get(cell)!.add(hip);
    }
    for (const [cell, wanted] of cells) {
      let t = this.tiles.get(cell);
      if (!t) { await this.load(cell); t = this.tiles.get(cell); this.evict(); }
      if (!t) continue;
      for (let i = 0; i < t.count; i++) if (wanted.has(t.hip[i])) out.push(rowOfTile(t, i));
    }
    return out;
  }

  close() {
    this.storage?.close?.();
    this.storage = null;
    this.status = 'closed';
    this.tiles.clear();
    this.loaded = 0;
    this.queue = [];
    this.queued.clear();
    this.indexRead = null;
  }
}

export const rowOfTile = (t: StarTile, i: number): StarRow => ({ hip: t.hip[i], ra: t.ra[i], dec: t.dec[i], pmRA: t.pmRA[i], pmDec: t.pmDec[i], parallax: t.parallax[i], mag: t.mag[i], bv: t.bv[i] });
