// Where the sky panel rests. Pure, so a flick can be tested without a finger.

export type Detent = 'collapsed' | 'half' | 'full';

export interface Stops { collapsed: number; half: number; full: number }

const ORDER: Detent[] = ['full', 'half', 'collapsed'];

/** Distance from the top of the screen to the panel's top edge at each rest. */
export function panelStops(height: number, topInset: number, handleTop: number): Stops {
  return { collapsed: handleTop, half: Math.round(height * 0.46), full: topInset + 10 };
}

/** A real flick moves one stop that way. Otherwise the nearest stop wins. */
export function restingDetent(top: number, velocity: number, stops: Stops): Detent {
  const nearest = ORDER.reduce((best, d) => (Math.abs(stops[d] - top) < Math.abs(stops[best] - top) ? d : best), 'half' as Detent);
  if (Math.abs(velocity) < 500) return nearest;
  if (velocity < 0) return ORDER.find((d, i) => stops[d] < top - 1 && (i === ORDER.length - 1 || stops[ORDER[i + 1]] >= top - 1)) ?? 'full';
  return [...ORDER].reverse().find((d, i, list) => stops[d] > top + 1 && (i === list.length - 1 || stops[list[i + 1]] <= top + 1)) ?? 'collapsed';
}

export const clampTop = (top: number, stops: Stops) => Math.min(stops.collapsed, Math.max(stops.full, top));
