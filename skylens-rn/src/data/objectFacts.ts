// Type-specific facts for Object Detail. A fact appears only when its value is known or can
// be calculated: a missing value is left out, never filled in.
import { appearance, BodyId, moonPhase, Observer, position } from '../astronomy/core';
import { elongation, moonFacts } from '../astronomy/observing';
import { boundaryPolygons, polygonArea } from '../features/sky/grids';
import { formatDistanceAU } from '../state/format';
import { constellation, distanceLightYears, SkyObject, starObject } from './catalog';

export interface Fact { label: string; value: string }

const grouped = (n: number) => Math.round(n).toLocaleString('en-US');

/** Effective temperature from B-V, by Ballesteros 2012. */
export const temperatureFromColor = (bv: number) => 4600 * (1 / (0.92 * bv + 1.7) + 1 / (0.92 * bv + 0.62));

/** Absolute magnitude. Below 2 mas Hipparcos parallaxes are too uncertain to use. */
export const absoluteMagnitude = (apparent: number, parallaxMas: number | null) =>
  parallaxMas !== null && parallaxMas >= 2 ? apparent + 5 + 5 * Math.log10(parallaxMas / 1000) : null;

function luminosityClass(spectral: string): string | null {
  const t = spectral.toUpperCase();
  if (/I[AB]/.test(t)) return 'Supergiant';
  if (t.includes('III')) return 'Giant';
  if (t.includes('IV')) return 'Subgiant';
  if (t.includes('II')) return 'Bright giant';
  if (t.includes('V')) return 'Main sequence';
  return null;
}

export function starFacts(o: SkyObject): Fact[] {
  const s = o.star!;
  const out: Fact[] = [];
  if (s.spectralType) out.push({ label: 'Spectral type', value: s.spectralType });
  const kind = s.spectralType ? luminosityClass(s.spectralType) : null;
  if (kind) out.push({ label: 'Luminosity class', value: kind });
  if (s.colorIndex !== null) {
    out.push({ label: 'B−V colour index', value: s.colorIndex.toFixed(2) });
    if (s.colorIndex > -0.3 && s.colorIndex < 2) out.push({ label: 'Surface temperature', value: `About ${grouped(Math.round(temperatureFromColor(s.colorIndex) / 100) * 100)} K, from colour` });
  }
  if (s.parallaxMas !== null) out.push({ label: 'Parallax', value: `${s.parallaxMas.toFixed(2)} mas` });
  const absolute = o.magnitude !== null ? absoluteMagnitude(o.magnitude, s.parallaxMas) : null;
  if (absolute !== null) out.push({ label: 'Absolute magnitude', value: `${absolute < 0 ? '−' : ''}${Math.abs(absolute).toFixed(2)}` });
  const motion = Math.hypot(s.pmRA, s.pmDec);
  if (motion > 0) out.push({ label: 'Proper motion', value: `${grouped(motion)} mas a year` });
  out.push({ label: 'Hipparcos', value: `HIP ${s.hip}` });
  return out;
}

export function deepSkyFacts(o: SkyObject): Fact[] {
  const d = o.deepSky!;
  const out: Fact[] = [];
  if (d.messier) out.push({ label: 'Messier', value: `M${d.messier}` });
  if (d.ngc) out.push({ label: 'NGC or IC', value: d.ngc });
  if (d.majorAxis) out.push({ label: 'True size on the sky', value: `${d.majorAxis.toFixed(d.majorAxis < 10 ? 1 : 0)}′${d.minorAxis && d.minorAxis !== d.majorAxis ? ` × ${d.minorAxis.toFixed(d.minorAxis < 10 ? 1 : 0)}′` : ''}` });
  const ly = distanceLightYears(o);
  if (ly) out.push({ label: 'Distance', value: `${grouped(ly)} light-years` });
  return out;
}

export function bodyFacts(body: BodyId, date: Date, observer: Observer): Fact[] {
  const p = position(body, date, observer), a = appearance(body, date);
  const out: Fact[] = [{ label: 'Distance from Earth', value: formatDistanceAU(p.distanceAU) }];
  const lightMinutes = p.distanceAU * 8.3167;
  out.push({ label: 'Light travel time', value: lightMinutes < 1 ? `${(lightMinutes * 60).toFixed(1)} seconds` : lightMinutes < 90 ? `${lightMinutes.toFixed(1)} minutes` : `${(lightMinutes / 60).toFixed(1)} hours` });
  if (body !== 'sun' && body !== 'moon') out.push({ label: 'Distance from the Sun', value: `${a.heliocentricDistanceAU.toFixed(3)} AU` });
  const e = elongation(body, date);
  if (e !== null) out.push({ label: 'From the Sun on the sky', value: `${Math.abs(e).toFixed(1)}° ${e >= 0 ? 'east' : 'west'}` });
  if (body !== 'sun') out.push({ label: 'Phase angle', value: `${a.phaseAngle.toFixed(1)}°` });
  if (body === 'saturn') out.push({ label: 'Ring tilt', value: `${Math.abs(a.ringTilt).toFixed(1)}°` });
  if (body === 'moon') {
    const m = moonFacts(date), phase = moonPhase(date);
    out.unshift({ label: 'Phase', value: phase.name });
    out.push({ label: 'Age', value: `${m.ageDays.toFixed(1)} days since new` });
  }
  return out;
}

export function constellationFacts(o: SkyObject): Fact[] {
  const id = o.id.slice(4), c = constellation(id);
  if (!c) return [];
  const area = boundaryPolygons().filter((p) => p.id === id).reduce((sum, p) => sum + polygonArea(p), 0);
  const members = new Set(c.lines.flat());
  let brightest: SkyObject | null = null;
  for (const hip of members) {
    const s = starObject(hip);
    if (s?.magnitude !== null && s?.magnitude !== undefined && (!brightest || s.magnitude < brightest.magnitude!)) brightest = s;
  }
  const out: Fact[] = [{ label: 'Abbreviation', value: id }, { label: 'Genitive', value: c.genitive }];
  if (area > 0) out.push({ label: 'Area', value: `${grouped(area)} square degrees` });
  out.push({ label: 'Stars in the figure', value: String(members.size) });
  if (brightest) out.push({ label: 'Brightest star in the figure', value: brightest.name });
  return out;
}

export function factsFor(o: SkyObject, body: BodyId | null, date: Date, observer: Observer): Fact[] {
  if (body) return bodyFacts(body, date, observer);
  if (o.star) return starFacts(o);
  if (o.deepSky) return deepSkyFacts(o);
  if (o.type === 'constellation') return constellationFacts(o);
  return [];
}
