// Dates are shown in the observing site's time zone, not the phone's.
import { timeZoneOffset } from '../astronomy/night';

const pad = (n: number) => String(n).padStart(2, '0');
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function local(date: Date, tz: string) {
  return new Date(date.getTime() + timeZoneOffset(date, tz));
}

export function formatTime(date: Date | null, tz: string, use24h = true): string {
  if (!date) return '—';
  const d = local(date, tz);
  const h = d.getUTCHours(), m = pad(d.getUTCMinutes());
  if (use24h) return `${pad(h)}:${m}`;
  return `${h % 12 || 12}:${m} ${h < 12 ? 'AM' : 'PM'}`;
}

/** "Tue, Apr 22" */
export function formatShortDate(date: Date, tz: string): string {
  const d = local(date, tz);
  return `${WEEKDAYS[d.getUTCDay()]}, ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

/** "Tue, Apr 22, 2025" */
export function formatLongDate(date: Date, tz: string): string {
  return `${formatShortDate(date, tz)}, ${local(date, tz).getUTCFullYear()}`;
}

export function dayAndMonth(date: Date, tz: string): { day: string; month: string } {
  const d = local(date, tz);
  return { day: String(d.getUTCDate()), month: MONTHS[d.getUTCMonth()].toUpperCase() };
}

export function monthKey(date: Date, tz: string): { year: number; month: number; name: string } {
  const d = local(date, tz);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth(), name: `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}` };
}

export function dayOfMonth(date: Date, tz: string): number { return local(date, tz).getUTCDate(); }

export const formatRA = (hours: number) => {
  let total = Math.round(hours * 3600) % 86_400;
  if (total < 0) total += 86_400;
  return `${Math.floor(total / 3600)}h ${pad(Math.floor((total % 3600) / 60))}m ${pad(total % 60)}s`;
};

export const formatDec = (deg: number) => {
  const total = Math.round(Math.abs(deg) * 3600);
  return `${deg < 0 ? '−' : '+'}${Math.floor(total / 3600)}° ${pad(Math.floor((total % 3600) / 60))}′ ${pad(total % 60)}″`;
};

export const formatDistanceLy = (ly: number) => {
  if (ly >= 1e9) return `${(ly / 1e9).toFixed(ly >= 1e10 ? 0 : 2).replace(/\.?0+$/, '')} billion light-years`;
  if (ly >= 1e6) return `${(ly / 1e6).toFixed(2).replace(/\.?0+$/, '')} million light-years`;
  if (ly >= 1000) return `${Math.round(ly).toLocaleString('en-US')} light-years`;
  return `${ly >= 100 ? Math.round(ly) : ly.toFixed(1)} light-years`;
};

export const formatDistanceAU = (au: number) => {
  const km = au * 149_597_870.7;
  if (km < 10_000_000) return `${Math.round(km).toLocaleString('en-US')} km`;
  return `${au.toFixed(2)} AU`;
};

/** "3.0° × 1.1°", or arcminutes for anything under a degree. */
export const formatSize = (major: number | null | undefined, minor: number | null | undefined) => {
  if (!major) return null;
  const f = (arcmin: number) => (major >= 60 ? `${(arcmin / 60).toFixed(1)}°` : `${arcmin.toFixed(arcmin < 10 ? 1 : 0)}′`);
  return minor && minor !== major ? `${f(major)} × ${f(minor)}` : f(major);
};

export const formatMagnitude = (m: number | null) => (m === null ? '—' : `${m < 0 ? '−' : ''}${Math.abs(m).toFixed(1)}`);
