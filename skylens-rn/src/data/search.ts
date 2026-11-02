// Offline object search over everything the app knows: names and designations through a word
// index with bounded edit distance, so "betelguese" finds Betelgeuse, and catalog numbers
// through sorted tables, so 118,217 HIP numbers cost a binary search rather than a scan.
import { ALL_BODIES, bodyName } from '../astronomy/core';
import { constellations, deepSky, genitiveOf, starMetaEntries, stars } from './catalog';

export type Category = 'Solar System' | 'Stars' | 'Constellations' | 'Deep Sky' | 'Moon';

interface Entry { id: string; name: string; aliases: string[]; category: Category; popularity: number }
interface Term { text: string; words: string[]; primary: boolean; display: string; entry: number }
export interface SearchResult { id: string; name: string; matchedAlias: string | null; category: Category; score: number; /** Replaces the catalog's type line. */ detail?: string }

const GREEK: Record<string, string> = {
  α: 'alpha', β: 'beta', γ: 'gamma', δ: 'delta', ε: 'epsilon', ζ: 'zeta', η: 'eta', θ: 'theta', ι: 'iota', κ: 'kappa', λ: 'lambda', μ: 'mu',
  ν: 'nu', ξ: 'xi', ο: 'omicron', π: 'pi', ρ: 'rho', σ: 'sigma', ς: 'sigma', τ: 'tau', υ: 'upsilon', φ: 'phi', χ: 'chi', ψ: 'psi', ω: 'omega',
};
const SUPERSCRIPTS: Record<string, string> = { '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9' };
const BAYER: Record<string, string> = {
  alp: 'alpha', alf: 'alpha', bet: 'beta', gam: 'gamma', del: 'delta', eps: 'epsilon', zet: 'zeta', the: 'theta', tet: 'theta', iot: 'iota',
  kap: 'kappa', lam: 'lambda', omi: 'omicron', sig: 'sigma', ups: 'upsilon', ome: 'omega',
};
const BODY_ALIASES: Record<string, string[]> = { sun: ['Sol'], moon: ['Luna'] };

/** "α Lyr" → "alpha lyr", "M 31" → "m31", "NGC224" → "ngc 224". */
export function normalize(raw: string): string {
  let s = '';
  for (const ch of raw.toLowerCase()) s += GREEK[ch] ?? SUPERSCRIPTS[ch] ?? ch;
  s = s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/-/g, ' ').replace(/[^a-z0-9 ]/g, '');
  let parts = s.split(' ').filter(Boolean);
  if (parts.length === 2 && (parts[0] === 'messier' || parts[0] === 'm') && /^\d+$/.test(parts[1])) parts = [`m${parts[1]}`];
  if (parts.length === 1) {
    for (const prefix of ['ngc', 'ic', 'hip', 'hd', 'hr']) {
      if (parts[0].startsWith(prefix)) {
        const tail = parts[0].slice(prefix.length);
        if (tail && /^\d+$/.test(tail)) { parts = [prefix, tail]; break; }
      }
    }
    if (parts[0].startsWith('messier') && /^\d+$/.test(parts[0].slice(7))) parts = [`m${parts[0].slice(7)}`];
  }
  if (parts.length >= 2 && BAYER[parts[0]]) parts[0] = BAYER[parts[0]];
  return parts.join(' ');
}

/** Damerau-Levenshtein distance, or null once it must exceed `limit`. */
export function editDistance(a: string, b: string, limit: number): number | null {
  if (Math.abs(a.length - b.length) > limit) return null;
  let prev2 = new Array<number>(b.length + 1).fill(0);
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let cur = prev.slice();
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i;
    let rowBest = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
      cur[j] = v;
      rowBest = Math.min(rowBest, v);
    }
    if (rowBest > limit) return null;
    [prev2, prev, cur] = [prev, cur, prev2];
  }
  const d = prev[b.length];
  return d <= limit ? d : null;
}

function buildEntries(): Entry[] {
  const entries: Entry[] = [];
  for (const b of ALL_BODIES) entries.push({ id: `body:${b}`, name: bodyName(b), aliases: BODY_ALIASES[b] ?? [], category: 'Solar System', popularity: 100 });
  for (const c of constellations) entries.push({ id: `con:${c.id}`, name: c.name, aliases: [c.id, c.genitive], category: 'Constellations', popularity: 60 });
  const t = stars();
  for (const [hip, m] of starMetaEntries()) {
    const i = t.indexByHip.get(hip);
    // A star outside the bundle is in the deep pack: only its name is worth a term here.
    if (i === undefined) {
      if (m.name) entries.push({ id: `star:${hip}`, name: m.name, aliases: [], category: 'Stars', popularity: 30 });
      continue;
    }
    const aliases: string[] = [];
    for (const d of [m.bayer, m.flamsteed]) {
      if (!d) continue;
      aliases.push(d);
      const space = d.indexOf(' ');
      const g = space > 0 ? genitiveOf(d.slice(space + 1)) : null;
      if (g) aliases.push(`${d.slice(0, space)} ${g}`);
    }
    entries.push({
      id: `star:${hip}`, name: m.name ?? m.bayer ?? m.flamsteed ?? `HIP ${hip}`, aliases, category: 'Stars',
      popularity: (m.name ? 40 : 0) + Math.max(0, 12 - t.mag[i]),
    });
  }
  for (const d of deepSky) {
    const aliases = [...d.designations];
    if (d.deepSky?.messier) aliases.push(`Messier ${d.deepSky.messier}`);
    const popularity = (d.designations.length ? 20 : 0) + (d.deepSky?.messier ? 30 : 0) + Math.max(0, 12 - (d.magnitude ?? 12));
    entries.push({ id: d.id, name: d.name, aliases, category: 'Deep Sky', popularity });
  }
  return entries;
}

interface Index {
  entries: Entry[];
  terms: Term[];
  /** Every distinct word, sorted, with the terms it appears in. */
  words: string[];
  postings: number[][];
  /** Words eligible for typo matching, by length. */
  fuzzy: Map<number, number[]>;
}

let index: Index | null = null;

function ensureIndex(): Index {
  if (index) return index;
  const entries = buildEntries();
  const terms: Term[] = [];
  entries.forEach((e, i) => {
    const name = normalize(e.name);
    terms.push({ text: name, words: name.split(' '), primary: true, display: e.name, entry: i });
    for (const a of e.aliases) {
      const text = normalize(a);
      if (text !== name) terms.push({ text, words: text.split(' '), primary: false, display: a, entry: i });
    }
  });
  terms.sort((a, b) => (a.text < b.text ? -1 : a.text > b.text ? 1 : 0));
  const byWord = new Map<string, number[]>();
  terms.forEach((t, i) => { for (const w of new Set(t.words)) { const list = byWord.get(w); if (list) list.push(i); else byWord.set(w, [i]); } });
  const words = [...byWord.keys()].sort();
  const postings = words.map((w) => byWord.get(w)!);
  const fuzzy = new Map<number, number[]>();
  words.forEach((w, i) => {
    if (w.length < 3 || !postings[i].some((k) => terms[k].primary || terms[k].text.length < 16)) return;
    const list = fuzzy.get(w.length);
    if (list) list.push(i); else fuzzy.set(w.length, [i]);
  });
  index = { entries, terms, words, postings, fuzzy };
  return index;
}

/** Builds the index ahead of the first keystroke. */
export const prepareSearch = () => { ensureIndex(); numbers(); };

// ---- Catalog numbers ----

export type NumberKind = 'hip' | 'hd' | 'hr';
interface NumberTable { keys: Uint32Array; hips: Uint32Array }

const extraRows: [number, number, number][] = [];
let deepHips: Uint32Array | null = null;
let tables: Record<NumberKind, NumberTable> | null = null;

/** Key and star in one number, because native sorting is far cheaper than a JS comparator. */
const PAIR = 2 ** 18;

function table(pairs: number[]): NumberTable {
  const sorted = Float64Array.from(pairs).sort();
  const keys = new Uint32Array(sorted.length), hips = new Uint32Array(sorted.length);
  for (let i = 0; i < sorted.length; i++) {
    keys[i] = Math.floor(sorted[i] / PAIR);
    hips[i] = sorted[i] - keys[i] * PAIR;
  }
  return { keys, hips };
}

function numbers() {
  if (tables) return tables;
  const t = stars();
  const base = deepHips?.length ?? 0;
  const hip = new Uint32Array(t.count + base);
  hip.set(t.hip, 0);
  if (deepHips) hip.set(deepHips, t.count);
  hip.sort();
  const hd: number[] = [], hr: number[] = [];
  for (const [h, m] of starMetaEntries()) {
    if (m.hd) hd.push(m.hd * PAIR + h);
    if (m.hr) hr.push(m.hr * PAIR + h);
  }
  for (const [h, r, d] of extraRows) {
    if (d) hd.push(d * PAIR + h);
    if (r) hr.push(r * PAIR + h);
  }
  tables = { hip: { keys: hip, hips: hip }, hd: table(hd), hr: table(hr) };
  return tables;
}

/** Adds what the deep pack knows. Until then, search covers the bundled catalog. */
export function installDeepSearch(hips: Uint32Array, extra: readonly (readonly [number, number, number, string | 0])[]) {
  deepHips = hips;
  extraRows.length = 0;
  for (const [h, r, d] of extra) extraRows.push([h, r, d]);
  tables = null;
}

export const deepSearchReady = () => deepHips !== null;

function lowerBound(a: Uint32Array, v: number) {
  let low = 0, high = a.length;
  while (low < high) { const mid = (low + high) >> 1; if (a[mid] < v) low = mid + 1; else high = mid; }
  return low;
}

/** Stars whose number is, or starts with, these digits, exact match first. */
export function numberMatches(kind: NumberKind, digits: string, limit: number): { hip: number; key: number }[] {
  const { keys, hips } = numbers()[kind];
  const out: { hip: number; key: number }[] = [];
  const n = Number(digits);
  if (!Number.isSafeInteger(n) || (digits.length > 1 && digits[0] === '0')) return out;
  for (let scale = 1; scale <= 1e7 && out.length < limit; scale *= 10) {
    const from = n * scale, to = (n + 1) * scale;
    for (let i = lowerBound(keys, from); i < keys.length && keys[i] < to && out.length < limit; i++) out.push({ hip: hips[i], key: keys[i] });
  }
  return out;
}

const NUMBER_LABEL: Record<NumberKind, string> = { hip: 'HIP', hd: 'HD', hr: 'HR' };

/** The name a bare catalog number should show. */
function starLabel(hip: number, entries: Map<string, Entry>) {
  return entries.get(`star:${hip}`)?.name ?? `HIP ${hip}`;
}

let entryById: Map<string, Entry> | null = null;

function searchNumber(kind: NumberKind, digits: string, limit: number, category?: Category): SearchResult[] {
  if (category && category !== 'Stars') return [];
  const { entries } = ensureIndex();
  entryById ??= new Map(entries.map((e) => [e.id, e]));
  const seen = new Set<number>();
  const out: SearchResult[] = [];
  for (const { hip, key } of numberMatches(kind, digits, limit)) {
    if (seen.has(hip)) continue;
    seen.add(hip);
    const exact = String(key) === digits;
    const name = starLabel(hip, entryById);
    const display = `${NUMBER_LABEL[kind]} ${key}`;
    out.push({ id: `star:${hip}`, name, matchedAlias: name === display ? null : display, category: 'Stars', score: exact ? 12 : 7 - Math.min(2, (String(key).length - digits.length) / 2) });
  }
  return out;
}

// ---- Search ----

function wordRange(words: string[], q: string): [number, number] {
  let low = 0, high = words.length;
  while (low < high) { const mid = (low + high) >> 1; if (words[mid] < q) low = mid + 1; else high = mid; }
  let end = low;
  while (end < words.length && words[end].startsWith(q)) end++;
  return [low, end];
}

/** Best first, empty for an empty query. */
export function search(query: string, limit = 40, category?: Category): SearchResult[] {
  const q = normalize(query);
  if (!q) return [];
  const number = q.match(/^(hip|hd|hr) (\d+)$/);
  if (number) return searchNumber(number[1] as NumberKind, number[2], limit, category);

  const { entries, terms, words, postings, fuzzy } = ensureIndex();
  const best = new Map<number, { score: number; alias: string | null }>();
  const consider = (t: Term, base: number) => {
    if (category && entries[t.entry].category !== category) return;
    const score = base + entries[t.entry].popularity / 100 + (t.primary ? 0.5 : 0);
    if (score > (best.get(t.entry)?.score ?? -1)) best.set(t.entry, { score, alias: t.primary ? null : t.display });
  };

  // The whole term, from its start.
  let low = 0, high = terms.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (terms[mid].text < q) low = mid + 1; else high = mid;
  }
  for (let i = low; i < terms.length && terms[i].text.startsWith(q); i++) {
    const t = terms[i];
    consider(t, t.text === q ? 10 : 7 - Math.min(2, (t.text.length - q.length) / 10));
  }

  const qWords = q.split(' ');
  if (qWords.length === 1) {
    // A later word of a longer name.
    const [from, to] = wordRange(words, q);
    for (let w = from; w < to; w++) {
      for (const k of postings[w]) {
        const t = terms[k];
        if (t.words.length > 1 && t.words.slice(1).some((x) => x.startsWith(q))) consider(t, 5);
      }
    }
    // A typo in any word.
    if (q.length >= 4) {
      const allowed = q.length >= 7 ? 2 : 1;
      for (let len = q.length - allowed; len <= q.length + allowed; len++) {
        for (const w of fuzzy.get(len) ?? []) {
          const d = editDistance(q, words[w], allowed);
          if (d === null) continue;
          for (const k of postings[w]) { const t = terms[k]; if (t.primary || t.text.length < 16) consider(t, 4 - d); }
        }
      }
    }
  } else {
    // Every word typed starts some word of the term, in any order.
    const [from, to] = wordRange(words, qWords[0]);
    for (let w = from; w < to; w++) {
      for (const k of postings[w]) {
        const t = terms[k];
        if (qWords.every((x) => t.words.some((y) => y.startsWith(x)))) consider(t, 6);
      }
    }
  }

  return [...best.entries()]
    .map(([k, v]) => ({ id: entries[k].id, name: entries[k].name, matchedAlias: v.alias, category: entries[k].category, score: v.score }))
    .sort((a, b) => (a.score !== b.score ? b.score - a.score : a.name.localeCompare(b.name)))
    .slice(0, limit);
}
