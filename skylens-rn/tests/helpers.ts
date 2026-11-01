import fs from 'node:fs';
import path from 'node:path';
import { PackStorage, StarRow } from '../src/data/catalogs/deepPack';
import { PACK_RECORD, packRecordsOffset } from '../src/data/catalogs/grid';

export const PACK_FILE = path.join(__dirname, '../assets/catalogs/hip-deep-v1.db');

let rows: Map<number, StarRow> | null = null;

/** Every star in the real pack file. */
export function readPackRows(): Map<number, StarRow> {
  if (rows) return rows;
  const b = fs.readFileSync(PACK_FILE);
  rows = new Map();
  const at = packRecordsOffset();
  const n = b.readUInt32LE(8);
  for (let i = 0; i < n; i++) {
    const o = at + i * PACK_RECORD;
    const hip = b.readUInt32LE(o), c = b.readInt16LE(o + 26);
    rows.set(hip, { hip, ra: b.readFloatLE(o + 4), dec: b.readFloatLE(o + 8), pmRA: b.readFloatLE(o + 12), pmDec: b.readFloatLE(o + 16), parallax: b.readFloatLE(o + 20), mag: b.readInt16LE(o + 24) / 100, bv: c === -32768 ? NaN : c / 1000 });
  }
  return rows;
}

/** Reads the real file, as a device does, optionally through a fault. */
export function fileStorage(file = PACK_FILE, tamper?: (bytes: Buffer, offset: number) => void, log?: { reads: number }): PackStorage {
  const whole = fs.readFileSync(file);
  return {
    read: async (offset, length) => {
      if (log) log.reads++;
      const bytes = Buffer.from(whole.subarray(offset, offset + length));
      tamper?.(bytes, offset);
      return new Uint8Array(bytes);
    },
  };
}

export const settled = async (test: () => boolean, tries = 4000) => {
  for (let i = 0; i < tries && !test(); i++) await new Promise((r) => setTimeout(r, 0));
};
