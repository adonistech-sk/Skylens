// Offline object search, ported from SkyCatalog/SearchIndex.swift: exact and prefix
// matching over names and designations, with bounded edit distance so "betelguese"
// finds Betelgeuse.
import { ALL_BODIES, bodyName } from '../astronomy/core';
import { constellations, deepSky, genitiveOf, starMetaEntries, stars } from './catalog';

export type Category = 'Solar System' | 'Stars' | 'Constellations' | 'Deep Sky';

interface Entry { id: string; name: string; aliases: string[]; category: Category; popularity: number }
interface Term { text: string; words: string[]; primary: boolean; display: string; entry: number }
export interface SearchResult { id: string; name: string; matchedAlias: string | null; category: Category; score: number }

const GREEK: Record<string, string> = {
  α: 'alpha', β: 'beta', γ: 'gamma', δ: 'delta', ε: 'epsilon', ζ: 'zeta', η: 'eta', θ: 'theta', ι: 'iota', κ: 'kappa', λ: 'lambda', μ: 'mu',
  ν: 'nu', ξ: 'xi', ο: 'omicron', π: 'pi', ρ: 'rho', σ: 'sigma', ς: 'sigma', τ: 'tau', υ: 'upsilon', φ: 'phi', χ: 'chi', ψ: 'psi', ω: 'omega',
};
const SUPERSCRIPTS: Record<string, string> = { '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9' };
const BAYER: Record<string, string> = {
  alp: 'alpha', alf: 'alpha', bet: 'beta', gam: 'gamma', del: 'delta', eps: 'epsilon', zet: 'zeta', the: 'theta', tet: 'theta', iot: 'iota',
  kap: 'kappa', lam: 'lambda', omi: 'omicron', sig: 'sigma', ups: 'upsilon', ome: 'omega',
};

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
  for (const b of ALL_BODIES) entries.push({ id: `body:${b}`, name: bodyName(b), aliases: [], category: 'Solar System', popularity: 100 });
  for (const c of constellations) entries.push({ id: `con:${c.id}`, name: c.name, aliases: [c.id, c.genitive], category: 'Constellations', popularity: 60 });
  const t = stars();
  for (const [hip, m] of starMetaEntries()) {
    const i = t.indexByHip.get(hip);
    if (i === undefined) continue;
    const aliases: string[] = [];
    for (const d of [m.bayer, m.flamsteed]) {
      if (!d) continue;
      aliases.push(d);
      const space = d.indexOf(' ');
      const g = space > 0 ? genitiveOf(d.slice(space + 1)) : null;
      if (g) aliases.push(`${d.slice(0, space)} ${g}`);
    }
    if (m.hr) aliases.push(`HR ${m.hr}`);
    if (m.hd) aliases.push(`HD ${m.hd}`);
    aliases.push(`HIP ${hip}`);
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

let index: { entries: Entry[]; terms: Term[] } | null = null;
function ensureIndex() {
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
  index = { entries, terms };
  return index;
}

/** Best first, empty for an empty query. */
export function search(query: string, limit = 40): SearchResult[] {
  const q = normalize(query);
  if (!q) return [];
  const { entries, terms } = ensureIndex();
  const best = new Map<number, { score: number; alias: string | null }>();
  const consider = (t: Term, base: number) => {
    const score = base + entries[t.entry].popularity / 100 + (t.primary ? 0.5 : 0);
    if (score > (best.get(t.entry)?.score ?? -1)) best.set(t.entry, { score, alias: t.primary ? null : t.display });
  };

  let low = 0, high = terms.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (terms[mid].text < q) low = mid + 1; else high = mid;
  }
  for (let i = low; i < terms.length && terms[i].text.startsWith(q); i++) {
    const t = terms[i];
    consider(t, t.text === q ? 10 : 7 - Math.min(2, (t.text.length - q.length) / 10));
  }

  const words = q.split(' ');
  for (const t of terms) {
    if (words.length === 1) {
      if (t.words.length > 1 && t.words.slice(1).some((w) => w.startsWith(q))) {
        consider(t, 5);
      } else if (q.length >= 4 && (t.primary || t.text.length < 16)) {
        const allowed = q.length >= 7 ? 2 : 1;
        for (const w of t.words) {
          if (Math.abs(w.length - q.length) > allowed) continue;
          const d = editDistance(q, w, allowed);
          if (d !== null) { consider(t, 4 - d); break; }
        }
      }
    } else if (words.every((w) => t.words.some((x) => x.startsWith(w)))) {
      consider(t, 6);
    }
  }

  return [...best.entries()]
    .map(([k, v]) => ({ id: entries[k].id, name: entries[k].name, matchedAlias: v.alias, category: entries[k].category, score: v.score }))
    .sort((a, b) => (a.score !== b.score ? b.score - a.score : a.name.localeCompare(b.name)))
    .slice(0, limit);
}
