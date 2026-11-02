// Moves through a guided tour. Each step only asks the sky to fly to a catalog object, using the
// same Find in Sky request as search and detail, so a tour has no positions of its own.
import { tourFor } from '../../data/constellationTours';
import { ensureObject } from '../../data/catalogs/runtime';
import { getState, requestFocus, setTour } from '../../state/store';

function go(id: string, index: number) {
  const tour = tourFor(id);
  const stop = tour?.stops[index];
  if (!stop) return;
  setTour({ id, index });
  ensureObject(stop.id).then((o) => { if (o) requestFocus(stop.id, stop.fov); }).catch(() => {});
}

export function beginTour(id: string) { go(id, 0); }

/** Forward or back. Past the last stop, the tour ends on the whole constellation. */
export function stepTour(offset: number) {
  const t = getState().tour;
  if (!t) return;
  const next = t.index + offset;
  const stops = tourFor(t.id)?.stops.length ?? 0;
  if (next < 0) return;
  if (next >= stops) { endTour(true); return; }
  go(t.id, next);
}

export function endTour(showFigure = false) {
  const t = getState().tour;
  setTour(null);
  if (showFigure && t) requestFocus(`con:${t.id}`);
}
