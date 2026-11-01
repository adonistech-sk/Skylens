// Ported from ObservingKit/Events.swift and AstronomyCore/Phenomena.swift. Every date
// is solved from the ephemeris; meteor showers come from the IMO Working List's solar
// longitudes, entered once in the Swift source, with the date solved here.
import { altitude, angleBetween, appearance, Astronomy, BodyId, bodyName, engineBody, engineObserver, equatorialVector, geocentricDirection, j2000ToHorizon, moonPhase, mul, Observer, position, vectorHorizontal } from './core';
import { riseTransitSet } from './night';

export type EventKind = 'moonPhase' | 'eclipse' | 'meteorShower' | 'opposition' | 'elongation' | 'conjunction' | 'season';
export type Visibility = { kind: 'visible' | 'notVisible'; note: string } | { kind: 'general' };

export interface SkyEvent {
  id: string;
  kind: EventKind;
  title: string;
  date: Date;
  endDate: Date | null;
  subtitle: string;
  detail: string;
  source: string;
  visibility: Visibility;
  bodies: BodyId[];
  isSignificant: boolean;
}

const CALCULATED = 'Calculated from the ephemeris';

interface Shower { code: string; name: string; lon: number; zhr: number; ra: number; dec: number; parent: string | null }
export const METEOR_SHOWERS: Shower[] = [
  { code: 'QUA', name: 'Quadrantids', lon: 283.16, zhr: 110, ra: 15.34, dec: 49.7, parent: 'Asteroid 2003 EH1' },
  { code: 'LYR', name: 'Lyrids', lon: 32.32, zhr: 18, ra: 18.1, dec: 33.3, parent: 'Comet Thatcher' },
  { code: 'ETA', name: 'Eta Aquariids', lon: 45.5, zhr: 50, ra: 22.53, dec: -1.1, parent: 'Comet Halley' },
  { code: 'SDA', name: 'Southern Delta Aquariids', lon: 127, zhr: 25, ra: 22.67, dec: -16.4, parent: null },
  { code: 'PER', name: 'Perseids', lon: 140, zhr: 100, ra: 3.22, dec: 58.1, parent: 'Comet Swift–Tuttle' },
  { code: 'ORI', name: 'Orionids', lon: 208, zhr: 20, ra: 6.37, dec: 15.9, parent: 'Comet Halley' },
  { code: 'LEO', name: 'Leonids', lon: 235.27, zhr: 15, ra: 10.15, dec: 21.8, parent: 'Comet Tempel–Tuttle' },
  { code: 'GEM', name: 'Geminids', lon: 262.2, zhr: 150, ra: 7.49, dec: 32.3, parent: 'Asteroid 3200 Phaethon' },
  { code: 'URS', name: 'Ursids', lon: 270.7, zhr: 10, ra: 14.47, dec: 75.3, parent: 'Comet Tuttle' },
];

const QUARTERS = ['New Moon', 'First Quarter', 'Full Moon', 'Last Quarter'];
const QUARTER_TEXT = [
  "The Moon is lost in the Sun's glare. Dark skies make this the best time for faint objects.",
  'Half lit and high at sunset. Crater detail is strong along the terminator.',
  'Fully lit and up all night. It is beautiful, and it drowns out faint objects.',
  'Half lit, rising around midnight and leaving the evening sky dark.',
];
const seconds = (d: Date) => Math.floor(d.getTime() / 1000);

function moonPhases(start: Date, end: Date): SkyEvent[] {
  const out: SkyEvent[] = [];
  let q = Astronomy.SearchMoonQuarter(start);
  while (q.time.date <= end) {
    const date = q.time.date;
    const illum = Math.round(moonPhase(date).illuminatedFraction * 100);
    out.push({
      id: `moon-${q.quarter}-${seconds(date)}`, kind: 'moonPhase', title: QUARTERS[q.quarter], date, endDate: null,
      subtitle: `The Moon at ${illum}% illumination`, detail: QUARTER_TEXT[q.quarter], source: CALCULATED, visibility: { kind: 'general' },
      bodies: ['moon'], isSignificant: q.quarter === 0 || q.quarter === 2,
    });
    q = Astronomy.NextMoonQuarter(q);
  }
  return out;
}

const KIND_NAME: Record<string, string> = { penumbral: 'Penumbral', partial: 'Partial', annular: 'Annular', total: 'Total' };

function eclipses(start: Date, end: Date, observer: Observer): SkyEvent[] {
  const out: SkyEvent[] = [];
  let e = Astronomy.SearchLunarEclipse(start);
  while (e.peak.date <= end) {
    const peak = e.peak.date;
    const alt = position('moon', peak, observer).apparent.altitude;
    const detail = e.kind === 'total'
      ? `The Moon passes fully into Earth's shadow and can turn copper-red. Totality lasts about ${Math.round(e.sd_total * 2)} minutes.`
      : e.kind === 'partial' ? `Up to ${Math.round(e.obscuration * 100)}% of the Moon enters Earth's dark shadow.`
        : "The Moon crosses only Earth's faint outer shadow, so the dimming is subtle and easy to miss.";
    const span = e.sd_penum * 60_000;
    out.push({
      id: `lunar-${seconds(peak)}`, kind: 'eclipse', title: `${KIND_NAME[e.kind]} Lunar Eclipse`,
      date: new Date(peak.getTime() - span), endDate: new Date(peak.getTime() + span),
      subtitle: alt > 0 ? `Moon ${Math.round(alt)}° high at the peak` : 'Moon below your horizon at the peak', detail, source: CALCULATED,
      visibility: alt > 0 ? { kind: 'visible', note: `The Moon stands ${Math.round(alt)}° high at the peak.` } : { kind: 'notVisible', note: 'The Moon is below your horizon at the peak.' },
      bodies: ['moon'], isSignificant: e.kind !== 'penumbral',
    });
    e = Astronomy.NextLunarEclipse(e.peak);
  }

  const localPeaks: number[] = [];
  let l = Astronomy.SearchLocalSolarEclipse(start, engineObserver(observer));
  while (l.peak.time.date <= end) {
    const visible = Math.max(l.partial_begin.altitude, l.peak.altitude, l.partial_end.altitude) > 0;
    if (visible) {
      const peak = l.peak.time.date;
      localPeaks.push(peak.getTime());
      const percent = Math.round(l.obscuration * 100);
      const verdict = l.peak.altitude > 0 ? `The Sun stands ${Math.round(l.peak.altitude)}° high at the peak.`
        : l.partial_begin.altitude > 0 ? 'It begins before sunset, but the Sun sets before the peak.'
          : 'The Sun rises while the eclipse is already under way, after the peak.';
      out.push({
        id: `solar-local-${seconds(peak)}`, kind: 'eclipse', title: `${KIND_NAME[l.kind]} Solar Eclipse`,
        date: l.partial_begin.time.date, endDate: l.partial_end.time.date, subtitle: `Up to ${percent}% of the Sun covered`,
        detail: `Up to ${percent}% of the Sun's disc is covered from your location. Use certified eye protection at all times unless you are inside the path of totality during totality.`,
        source: CALCULATED, visibility: { kind: 'visible', note: verdict }, bodies: ['sun', 'moon'], isSignificant: true,
      });
    }
    l = Astronomy.NextLocalSolarEclipse(l.peak.time, engineObserver(observer));
  }

  let g = Astronomy.SearchGlobalSolarEclipse(start);
  while (g.peak.date <= end) {
    if ((g.kind === 'total' || g.kind === 'annular') && !localPeaks.some((p) => Math.abs(p - g.peak.date.getTime()) < 6 * 3_600_000)) {
      out.push({
        id: `solar-global-${seconds(g.peak.date)}`, kind: 'eclipse', title: `${KIND_NAME[g.kind]} Solar Eclipse`, date: g.peak.date, endDate: null,
        subtitle: 'Not visible from your location', detail: 'Visible along a narrow path elsewhere on Earth.', source: CALCULATED,
        visibility: { kind: 'notVisible', note: 'Not visible from your location.' }, bodies: ['sun', 'moon'], isSignificant: false,
      });
    }
    g = Astronomy.NextGlobalSolarEclipse(g.peak);
  }
  return out;
}

function seasons(start: Date, end: Date): SkyEvent[] {
  const out: SkyEvent[] = [];
  for (let y = start.getUTCFullYear(); y <= end.getUTCFullYear(); y++) {
    const s = Astronomy.Seasons(y);
    const list: [string, Date, boolean][] = [
      ['March Equinox', s.mar_equinox.date, true], ['June Solstice', s.jun_solstice.date, false],
      ['September Equinox', s.sep_equinox.date, true], ['December Solstice', s.dec_solstice.date, false],
    ];
    for (const [title, date, equinox] of list) {
      if (date < start || date > end) continue;
      out.push({
        id: `season-${seconds(date)}`, kind: 'season', title, date, endDate: null,
        subtitle: equinox ? 'Day and night nearly equal' : 'The Sun at its farthest from the equator',
        detail: equinox ? 'Day and night are nearly equal, as the Sun crosses the celestial equator.' : 'The Sun reaches its farthest point from the celestial equator.',
        source: CALCULATED, visibility: { kind: 'general' }, bodies: ['sun'], isSignificant: false,
      });
    }
  }
  return out;
}

function oppositions(start: Date, end: Date, observer: Observer): SkyEvent[] {
  const out: SkyEvent[] = [];
  for (const body of ['mars', 'jupiter', 'saturn', 'uranus', 'neptune'] as BodyId[]) {
    let cursor = start;
    for (;;) {
      const t = Astronomy.SearchRelativeLongitude(engineBody(body), 0, cursor);
      if (t.date > end) break;
      const mag = appearance(body, t.date).magnitude;
      const peak = riseTransitSet({ body }, new Date(t.date.getTime() - 43_200_000), observer).transitAltitude;
      out.push({
        id: `opp-${body}-${seconds(t.date)}`, kind: 'opposition', title: `${bodyName(body)} at Opposition`, date: t.date, endDate: null,
        subtitle: 'At its brightest for the year',
        detail: `Earth passes between ${bodyName(body)} and the Sun, so the planet is at its brightest for the year, near magnitude ${mag.toFixed(1)}, rising at sunset.`,
        source: CALCULATED,
        visibility: (peak ?? -90) > 0 ? { kind: 'visible', note: `Up all night, reaching about ${Math.round(peak ?? 0)}° high.` } : { kind: 'notVisible', note: `${bodyName(body)} stays below your horizon.` },
        bodies: [body], isSignificant: body !== 'neptune' && body !== 'uranus',
      });
      cursor = new Date(t.date.getTime() + 30 * 86_400_000);
    }
  }
  return out;
}

function elongations(start: Date, end: Date): SkyEvent[] {
  const out: SkyEvent[] = [];
  for (const body of ['mercury', 'venus'] as BodyId[]) {
    let cursor = start;
    for (;;) {
      const e = Astronomy.SearchMaxElongation(engineBody(body), cursor);
      if (e.time.date > end) break;
      const evening = e.visibility === 'evening';
      out.push({
        id: `elong-${body}-${seconds(e.time.date)}`, kind: 'elongation', title: `${bodyName(body)} at Greatest ${evening ? 'Evening' : 'Morning'} Elongation`,
        date: e.time.date, endDate: null, subtitle: `${e.elongation.toFixed(1)}° from the Sun`,
        detail: `${bodyName(body)} stands ${e.elongation.toFixed(1)}° from the Sun, its best ${evening ? 'evening' : 'morning'} showing of this apparition.`,
        source: CALCULATED, visibility: { kind: 'general' }, bodies: [body], isSignificant: body === 'venus',
      });
      cursor = new Date(e.time.date.getTime() + 5 * 86_400_000);
    }
  }
  return out;
}

function goldenMinimum(low: number, high: number, f: (ms: number) => number): [number, number] {
  const ratio = 0.61803398875;
  let a = low, b = high, c = b - ratio * (b - a), d = a + ratio * (b - a), fc = f(c), fd = f(d);
  while (b - a > 60_000) {
    if (fc < fd) { b = d; d = c; fd = fc; c = b - ratio * (b - a); fc = f(c); }
    else { a = c; c = d; fc = fd; d = a + ratio * (b - a); fd = f(d); }
  }
  const t = (a + b) / 2;
  return [t, f(t)];
}

/** Local minima of geocentric separation below `threshold` degrees. */
function conjunctionsOf(first: BodyId, second: BodyId, start: Date, end: Date, threshold: number) {
  const separation = (ms: number) => {
    const d = new Date(ms);
    return angleBetween(geocentricDirection(first, d), geocentricDirection(second, d));
  };
  const moon = first === 'moon' || second === 'moon';
  // The Swift scan steps 3 hours for the Moon. Half a day keeps this fast on Hermes,
  // and the wider gate below still catches the minimum, which golden section refines.
  const step = (moon ? 0.5 : 1) * 86_400_000;
  const gate = threshold + (moon ? 5 : 2);
  const out: { date: Date; separation: number }[] = [];
  let a = start.getTime(), b = a + step, c = b + step;
  let sa = separation(a), sb = separation(b);
  const limit = end.getTime();
  while (c <= limit) {
    const sc = separation(c);
    if (sb <= sa && sb <= sc && sb < gate) {
      const [t, min] = goldenMinimum(a, c, separation);
      if (min < threshold) out.push({ date: new Date(t), separation: min });
    }
    a = b; b = c; sa = sb; sb = sc; c += step;
  }
  return out;
}

function skyVisibility(body: BodyId, date: Date, observer: Observer): Visibility {
  let best: number | null = null;
  for (let h = -12; h <= 12; h++) {
    const t = new Date(date.getTime() + h * 3_600_000);
    if (altitude('sun', t, observer) >= -6) continue;
    const a = altitude(body, t, observer);
    if (a > (best ?? 5)) best = a;
  }
  return best !== null ? { kind: 'visible', note: `Reaches about ${Math.round(best)}° high in the dark sky.` } : { kind: 'notVisible', note: 'Below your horizon while the sky is dark.' };
}

function conjunctions(start: Date, end: Date, observer: Observer): SkyEvent[] {
  const bright: BodyId[] = ['mercury', 'venus', 'mars', 'jupiter', 'saturn'];
  const out: SkyEvent[] = [];
  const add = (a: BodyId, b: BodyId, threshold: number, significant: (s: number) => boolean) => {
    for (const c of conjunctionsOf(a, b, start, end, threshold)) {
      const target = a === 'moon' ? b : a;
      const elongation = angleBetween(geocentricDirection(target, c.date), geocentricDirection('sun', c.date));
      out.push({
        id: `conj-${a}-${b}-${seconds(c.date)}`, kind: 'conjunction', title: `${bodyName(a)} – ${bodyName(b)} Conjunction`, date: c.date, endDate: null,
        subtitle: `${c.separation.toFixed(1)}° apart at closest approach`,
        detail: `The two appear ${c.separation.toFixed(1)}° apart. For scale, the full Moon is about half a degree wide.`, source: CALCULATED,
        visibility: elongation > 12 ? skyVisibility(target, c.date, observer) : { kind: 'notVisible', note: 'Too close to the Sun to see.' },
        bodies: [a, b], isSignificant: significant(c.separation),
      });
    }
  };
  bright.forEach((a, i) => bright.slice(i + 1).forEach((b) => add(a, b, 2.5, (s) => s < 1)));
  for (const p of ['venus', 'mars', 'jupiter', 'saturn'] as BodyId[]) add('moon', p, 3, () => false);
  return out;
}

function meteorShowers(start: Date, end: Date, observer: Observer): SkyEvent[] {
  const out: SkyEvent[] = [];
  for (const s of METEOR_SHOWERS) {
    let cursor = start;
    for (;;) {
      const t = Astronomy.SearchSunLongitude(s.lon, cursor, 366);
      if (!t || t.date > end) break;
      const peak = t.date;
      const illum = moonPhase(peak).illuminatedFraction;
      const radiant = equatorialVector(s.ra, s.dec);
      let best = -90;
      for (let h = -12; h < 12; h += 2) {
        best = Math.max(best, vectorHorizontal(mul(j2000ToHorizon(new Date(peak.getTime() + h * 3_600_000), observer), radiant)).altitude);
      }
      const moonNote = illum > 0.6 ? ` A bright Moon (${Math.round(illum * 100)}% lit) will hide the fainter meteors.` : illum < 0.25 ? ' The Moon is out of the way, which is favourable.' : '';
      out.push({
        id: `shower-${s.code}-${seconds(peak)}`, kind: 'meteorShower', title: `${s.name} Peak`, date: peak, endDate: null,
        subtitle: `Up to ${s.zhr} meteors an hour in ideal skies`,
        detail: `Up to about ${s.zhr} meteors an hour under ideal dark skies.${s.parent ? ` Its source is ${s.parent}.` : ''}${moonNote} Real rates vary and are usually lower.`,
        source: 'From the IMO Meteor Shower Working List',
        visibility: best > 10 ? { kind: 'visible', note: `The radiant reaches about ${Math.round(best)}° high. Best after midnight.` } : { kind: 'notVisible', note: 'The radiant stays too low from your latitude.' },
        bodies: [], isSignificant: s.zhr >= 50,
      });
      cursor = new Date(peak.getTime() + 300 * 86_400_000);
    }
  }
  return out;
}

const pause = () => new Promise<void>((r) => setTimeout(r, 0));

/** Every supported event in a window, date ordered. Yields between searches so the UI keeps moving. */
export async function eventsBetween(start: Date, end: Date, observer: Observer, onStep?: (done: number, total: number) => void): Promise<SkyEvent[]> {
  const steps: (() => SkyEvent[])[] = [
    () => moonPhases(start, end), () => meteorShowers(start, end, observer), () => eclipses(start, end, observer), () => seasons(start, end),
    () => oppositions(start, end, observer), () => elongations(start, end), () => conjunctions(start, end, observer),
  ];
  const out: SkyEvent[] = [];
  for (let i = 0; i < steps.length; i++) {
    out.push(...steps[i]());
    onStep?.(i + 1, steps.length);
    await pause();
  }
  return out.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/** The same calculation without yielding, for tests. */
export function eventsBetweenSync(start: Date, end: Date, observer: Observer): SkyEvent[] {
  return [
    ...moonPhases(start, end), ...meteorShowers(start, end, observer), ...eclipses(start, end, observer), ...seasons(start, end),
    ...oppositions(start, end, observer), ...elongations(start, end), ...conjunctions(start, end, observer),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());
}

