// Observing lists, as plain functions over plain data. Items are canonical object IDs, so a
// catalog update can't orphan them, and a saved file is checked before it's trusted.

export interface ObjectList {
  id: string;
  name: string;
  items: string[];
  createdAt: number;
}

export const MAX_RECENTS = 12;
const MAX_NAME = 40;

export const cleanListName = (name: string) => name.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME);

export function createList(lists: ObjectList[], name: string, now: number): ObjectList[] {
  const clean = cleanListName(name);
  if (!clean) return lists;
  let n = lists.length + 1;
  while (lists.some((l) => l.id === `list-${now}-${n}`)) n++;
  return [...lists, { id: `list-${now}-${n}`, name: clean, items: [], createdAt: now }];
}

export const renameList = (lists: ObjectList[], id: string, name: string) => {
  const clean = cleanListName(name);
  return clean ? lists.map((l) => (l.id === id ? { ...l, name: clean } : l)) : lists;
};

export const deleteList = (lists: ObjectList[], id: string) => lists.filter((l) => l.id !== id);

export const addToList = (lists: ObjectList[], id: string, item: string) =>
  lists.map((l) => (l.id === id && !l.items.includes(item) ? { ...l, items: [...l.items, item] } : l));

export const removeFromList = (lists: ObjectList[], id: string, item: string) =>
  lists.map((l) => (l.id === id ? { ...l, items: l.items.filter((x) => x !== item) } : l));

/** Moves one item by an offset, stopping at either end. */
export function moved<T>(items: T[], item: T, offset: number): T[] {
  const from = items.indexOf(item);
  if (from < 0) return items;
  const to = Math.max(0, Math.min(items.length - 1, from + offset));
  if (to === from) return items;
  const out = items.slice();
  out.splice(from, 1);
  out.splice(to, 0, item);
  return out;
}

export const moveInList = (lists: ObjectList[], id: string, item: string, offset: number) =>
  lists.map((l) => (l.id === id ? { ...l, items: moved(l.items, item, offset) } : l));

/** The most recent first, no repeats. */
export const remembered = (recents: string[], id: string) => [id, ...recents.filter((r) => r !== id)].slice(0, MAX_RECENTS);

const isString = (v: unknown): v is string => typeof v === 'string';

/** Keeps whatever in a saved value is usable and drops the rest, rather than failing. */
export function sanitizeLists(saved: unknown): ObjectList[] {
  if (!Array.isArray(saved)) return [];
  const seen = new Set<string>();
  const out: ObjectList[] = [];
  for (const raw of saved) {
    const l = raw as Partial<ObjectList> | null;
    if (!l || !isString(l.id) || !isString(l.name) || !l.name.trim() || seen.has(l.id)) continue;
    seen.add(l.id);
    out.push({ id: l.id, name: l.name, items: Array.isArray(l.items) ? [...new Set(l.items.filter(isString))] : [], createdAt: typeof l.createdAt === 'number' ? l.createdAt : 0 });
  }
  return out;
}

export const allListItems = (lists: ObjectList[]) => lists.flatMap((l) => l.items);
