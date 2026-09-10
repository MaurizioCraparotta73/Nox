/**
 * Compact solar/lunar geometry adapted from SunCalc (Vladimir Agafonkin, BSD).
 * Positions are topocentric-enough for weather scoring and night windows.
 */

const PI = Math.PI;
const rad = PI / 180;
const dayMs = 86_400_000;
const J1970 = 2_440_588;
const J2000 = 2_451_545;
const e = rad * 23.4397;

function toJulian(date: Date) {
  return date.valueOf() / dayMs - 0.5 + J1970;
}

function toDays(date: Date) {
  return toJulian(date) - J2000;
}

function rightAscension(l: number, b: number) {
  return Math.atan2(Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e), Math.cos(l));
}

function declination(l: number, b: number) {
  return Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l));
}

function azimuth(H: number, phi: number, dec: number) {
  return Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi));
}

function altitude(H: number, phi: number, dec: number) {
  return Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
}

function siderealTime(d: number, lw: number) {
  return rad * (280.16 + 360.9856235 * d) - lw;
}

function solarMeanAnomaly(d: number) {
  return rad * (357.5291 + 0.98560028 * d);
}

function eclipticLongitude(M: number) {
  const C = rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
  const P = rad * 102.9372;
  return M + C + P + PI;
}

function sunCoords(d: number) {
  const M = solarMeanAnomaly(d);
  const L = eclipticLongitude(M);
  return { dec: declination(L, 0), ra: rightAscension(L, 0) };
}

function moonCoords(d: number) {
  const L = rad * (218.316 + 13.176396 * d);
  const M = rad * (134.963 + 13.064993 * d);
  const F = rad * (93.272 + 13.22935 * d);
  const l = L + rad * 6.289 * Math.sin(M);
  const b = rad * 5.128 * Math.sin(F);
  const dist = 385001 - 20905 * Math.cos(M);
  return { ra: rightAscension(l, b), dec: declination(l, b), dist };
}

export function sunAltitude(date: Date, lat: number, lng: number) {
  const lw = rad * -lng;
  const phi = rad * lat;
  const d = toDays(date);
  const c = sunCoords(d);
  const H = siderealTime(d, lw) - c.ra;
  return (altitude(H, phi, c.dec) * 180) / PI;
}

export function sunAzimuth(date: Date, lat: number, lng: number) {
  const lw = rad * -lng;
  const phi = rad * lat;
  const d = toDays(date);
  const c = sunCoords(d);
  const H = siderealTime(d, lw) - c.ra;
  return ((azimuth(H, phi, c.dec) * 180) / PI + 180) % 360;
}

export function moonAltitude(date: Date, lat: number, lng: number) {
  const lw = rad * -lng;
  const phi = rad * lat;
  const d = toDays(date);
  const c = moonCoords(d);
  const H = siderealTime(d, lw) - c.ra;
  // parallax correction
  const alt = altitude(H, phi, c.dec);
  const pa = Math.asin(6371 / c.dist) * Math.cos(alt);
  return ((alt - pa) * 180) / PI;
}

export function moonIllumination(date: Date) {
  const d = toDays(date);
  const s = sunCoords(d);
  const m = moonCoords(d);
  const sdist = 149_598_000;
  const phi = Math.acos(
    Math.sin(s.dec) * Math.sin(m.dec) + Math.cos(s.dec) * Math.cos(m.dec) * Math.cos(s.ra - m.ra),
  );
  const inc = Math.atan2(sdist * Math.sin(phi), m.dist - sdist * Math.cos(phi));
  const angle = Math.atan2(
    Math.cos(s.dec) * Math.sin(s.ra - m.ra),
    Math.sin(s.dec) * Math.cos(m.dec) - Math.cos(s.dec) * Math.sin(m.dec) * Math.cos(s.ra - m.ra),
  );
  return {
    fraction: (1 + Math.cos(inc)) / 2,
    phase: 0.5 + (0.5 * inc * (angle < 0 ? -1 : 1)) / Math.PI,
    angle,
  };
}

export function interpolateCrossing(
  times: Date[],
  values: number[],
  threshold: number,
  direction: "down" | "up",
): Date | null {
  for (let i = 1; i < values.length; i++) {
    const a = values[i - 1]!;
    const b = values[i]!;
    const crossed = direction === "down" ? a >= threshold && b < threshold : a < threshold && b >= threshold;
    if (!crossed) continue;
    const span = b - a;
    const t = Math.abs(span) < 1e-6 ? 0 : (threshold - a) / span;
    const t0 = times[i - 1]!.getTime();
    const t1 = times[i]!.getTime();
    return new Date(t0 + t * (t1 - t0));
  }
  return null;
}

export function moonRiseSet(dayStart: Date, lat: number, lng: number) {
  const start = new Date(dayStart);
  start.setHours(0, 0, 0, 0);
  let rise: Date | null = null;
  let set: Date | null = null;
  let prev = moonAltitude(start, lat, lng);
  let upSamples = 0;
  const steps = 24 * 6;
  for (let i = 1; i <= steps; i++) {
    const t = new Date(start.getTime() + i * 10 * 60_000);
    const alt = moonAltitude(t, lat, lng);
    if (alt > 0) upSamples += 1;
    if (prev < 0 && alt >= 0 && !rise) rise = t;
    if (prev >= 0 && alt < 0 && !set) set = t;
    prev = alt;
  }
  const alwaysUp = !rise && !set && upSamples > steps / 2;
  const alwaysDown = !rise && !set && !alwaysUp;
  return { rise, set, alwaysUp, alwaysDown };
}

export function moonPhaseName(phase: number) {
  if (phase < 0.03 || phase >= 0.97) return "Luna nuova";
  if (phase < 0.22) return "Luna crescente";
  if (phase < 0.28) return "Primo quarto";
  if (phase < 0.47) return "Gibbosa crescente";
  if (phase < 0.53) return "Luna piena";
  if (phase < 0.72) return "Gibbosa calante";
  if (phase < 0.78) return "Ultimo quarto";
  return "Luna calante";
}
