import { useEffect, useState } from 'react';
import { useStore } from '../state/store';
import { object, SkyObject } from './catalog';
import { ensureObject } from './catalogs/runtime';

export type ObjectState = { object: SkyObject | null; loading: boolean };

/** An object by ID. A star in the deep pack arrives a moment later, a wrong ID never does. */
export function useObject(id: string): ObjectState {
  const revision = useStore((s) => s.catalogRevision);
  const [, setLoaded] = useState(0);
  const [waiting, setWaiting] = useState(false);
  const known = object(id);
  useEffect(() => {
    if (known) return;
    let live = true;
    setWaiting(true);
    ensureObject(id).catch(() => null).then(() => {
      if (!live) return;
      setWaiting(false);
      setLoaded((n) => n + 1);
    });
    return () => { live = false; };
  }, [id, revision, !!known]);
  return { object: known, loading: !known && waiting };
}
