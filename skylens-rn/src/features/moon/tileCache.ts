// Reads high-resolution map tiles out of the pack as they're needed, and keeps only a few in
// memory. Device APIs are passed in, so it can be tested against the real pack. A tile that
// fails its checksum or can't be decoded is never retried: the map under it simply stays.
import { crc32 } from '../../data/catalogs/grid';
import { readTileDirectory, TILE_ENTRY, TILE_HEADER, TileDirectory, tileIndex, TileRef } from './moonData';

export interface TileSource<I> {
  read(offset: number, length: number): Promise<Uint8Array>;
  decode(bytes: Uint8Array): I | null;
  dispose(image: I): void;
  onReady(): void;
}

export class TileCache<I> {
  private directory: TileDirectory | null = null;
  private images = new Map<number, { image: I; used: number }>();
  private waiting: number[] = [];
  private failed = new Set<number>();
  private busy = false;
  private clock = 0;
  /** True once the pack can't be used at all. The base map then stands alone. */
  unavailable = false;

  constructor(private source: TileSource<I>, private capacity = 12) {}

  async open() {
    try {
      const head = await this.source.read(0, TILE_HEADER);
      const count = new DataView(head.buffer, head.byteOffset, head.byteLength).getUint32(8, true);
      this.directory = readTileDirectory(await this.source.read(0, TILE_HEADER + count * TILE_ENTRY));
      this.pump();
    } catch {
      this.unavailable = true;
    }
  }

  get loaded() { return this.images.size; }
  get failures() { return this.failed.size; }

  /** The tile if it's in memory, asking for it otherwise. Never waits. */
  get(t: TileRef): I | null {
    const i = tileIndex(t);
    const hit = this.images.get(i);
    if (hit) { hit.used = ++this.clock; return hit.image; }
    if (!this.unavailable && !this.failed.has(i) && !this.waiting.includes(i)) {
      // Newest first, because that's what's on screen now.
      this.waiting.unshift(i);
      this.waiting.length = Math.min(this.waiting.length, 8);
      this.pump();
    }
    return null;
  }

  private async pump() {
    if (this.busy || !this.directory) return;
    this.busy = true;
    while (this.waiting.length) {
      const i = this.waiting.shift()!;
      if (this.images.has(i)) continue;
      const d = this.directory;
      try {
        if (i >= d.count) throw new Error('No such tile');
        const bytes = await this.source.read(d.offsets[i], d.lengths[i]);
        if (crc32(bytes) !== d.crcs[i]) throw new Error('Tile checksum failed');
        const image = this.source.decode(bytes);
        if (!image) throw new Error('Tile could not be decoded');
        this.images.set(i, { image, used: ++this.clock });
        this.trim();
        this.source.onReady();
      } catch {
        this.failed.add(i);
      }
    }
    this.busy = false;
  }

  private trim() {
    while (this.images.size > this.capacity) {
      let oldest = -1, age = Infinity;
      for (const [k, v] of this.images) if (v.used < age) { oldest = k; age = v.used; }
      const dropped = this.images.get(oldest);
      this.images.delete(oldest);
      if (dropped) this.source.dispose(dropped.image);
    }
  }

  clear() {
    for (const v of this.images.values()) this.source.dispose(v.image);
    this.images.clear();
    this.waiting = [];
  }
}
