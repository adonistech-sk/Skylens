import { useEffect, useState } from 'react';
import { eventsBetween, SkyEvent } from '../../astronomy/events';
import { useObserver } from '../../state/store';

const cache = new Map<string, SkyEvent[]>();
const DAY = 86_400_000;
export const eventById = new Map<string, SkyEvent>();

/** Events in a window, calculated once per place and cached. */
export function useEvents(startMs: number, days: number) {
  const observer = useObserver();
  const start = Math.floor(startMs / DAY) * DAY;
  const key = `${observer.latitude},${observer.longitude}|${start}|${days}`;
  const [events, setEvents] = useState<SkyEvent[] | null>(cache.get(key) ?? null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    const known = cache.get(key);
    if (known) { setEvents(known); return; }
    setEvents(null);
    eventsBetween(new Date(start), new Date(start + days * DAY), observer).then((list) => {
      cache.set(key, list);
      list.forEach((e) => eventById.set(e.id, e));
      if (!cancelled) setEvents(list);
    }).catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [key]);

  return { events, failed };
}
