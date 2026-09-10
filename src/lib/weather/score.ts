import type { DewRisk, HourScores, SessionMode, Verdict } from "./types";

function clamp(n: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, n));
}

export function cloudScore(low: number, mid: number, high: number, total: number) {
  const weighted = 0.5 * low + 0.32 * mid + 0.18 * high;
  const mix = 0.7 * weighted + 0.3 * total;
  return clamp(100 - mix);
}

export function seeingScore(wind10: number, wind80: number | null, wind120: number | null, cape: number | null) {
  const upper = wind120 ?? wind80 ?? wind10;
  const shear = Math.abs(upper - wind10);
  const windPen = clamp((wind10 / 45) * 36);
  const shearPen = clamp((shear / 70) * 28);
  const capePen = clamp(((cape ?? 0) / 900) * 32);
  return clamp(100 - windPen - shearPen - capePen);
}

export function transparencyScore(humidity: number, visibilityKm: number, aod: number | null, vpd: number | null) {
  const humPen = clamp(((humidity - 28) / 72) * 42);
  const visPen = clamp(((24 - visibilityKm) / 24) * 26);
  const aodPen = aod == null ? 8 : clamp(((aod - 0.04) / 0.45) * 32);
  const vpdBonus = vpd == null ? 0 : clamp((vpd - 0.4) * 8, 0, 10);
  return clamp(100 - humPen - visPen - aodPen + vpdBonus);
}

export function moonScore(illumination: number, moonAlt: number) {
  if (moonAlt < -1) return 100;
  const height = clamp(Math.sin((Math.max(moonAlt, 0) * Math.PI) / 180) * 100, 0, 100) / 100;
  const interference = illumination * (0.35 + 0.65 * height);
  return clamp(100 - interference * 100);
}

export function dewScore(temperature: number, dewPoint: number) {
  const spread = temperature - dewPoint;
  if (spread >= 6) return 100;
  if (spread <= 0) return 8;
  return clamp((spread / 6) * 100);
}

export function windMountScore(wind10: number, gusts: number) {
  const effective = Math.max(wind10, gusts * 0.72);
  if (effective <= 8) return 100;
  if (effective >= 42) return 6;
  return clamp(100 - ((effective - 8) / 34) * 94);
}

export function dewRiskFromScore(score: number): DewRisk {
  if (score >= 70) return "basso";
  if (score >= 40) return "moderato";
  return "alto";
}

export function scoreHour(input: {
  cloudLow: number;
  cloudMid: number;
  cloudHigh: number;
  cloud: number;
  wind10: number;
  wind80: number | null;
  wind120: number | null;
  cape: number | null;
  humidity: number;
  visibilityKm: number;
  aod: number | null;
  vpd: number | null;
  moonIllumination: number;
  moonAlt: number;
  temperature: number;
  dewPoint: number;
  windGusts: number;
  precipProb: number;
  precipitation: number;
  sunAlt: number;
  mode: SessionMode;
  astroSeeing?: number | null;
  astroTransparency?: number | null;
}): HourScores {
  const cloud = cloudScore(input.cloudLow, input.cloudMid, input.cloudHigh, input.cloud);
  let seeing = seeingScore(input.wind10, input.wind80, input.wind120, input.cape);
  let transparency = transparencyScore(input.humidity, input.visibilityKm, input.aod, input.vpd);
  if (input.astroSeeing != null) seeing = clamp(0.74 * input.astroSeeing + 0.26 * seeing);
  if (input.astroTransparency != null) {
    transparency = clamp(0.74 * input.astroTransparency + 0.26 * transparency);
  }
  const moon = moonScore(input.moonIllumination, input.moonAlt);
  const dew = dewScore(input.temperature, input.dewPoint);
  const wind = windMountScore(input.wind10, input.windGusts);

  const weights =
    input.mode === "planetary"
      ? { cloud: 0.28, seeing: 0.36, transparency: 0.14, moon: 0.04, dew: 0.06, wind: 0.12 }
      : { cloud: 0.36, seeing: 0.12, transparency: 0.2, moon: 0.2, dew: 0.06, wind: 0.06 };

  let overall =
    cloud * weights.cloud +
    seeing * weights.seeing +
    transparency * weights.transparency +
    moon * weights.moon +
    dew * weights.dew +
    wind * weights.wind;

  if (input.precipitation > 0.05) overall *= 0.12;
  else if (input.precipProb >= 55) overall *= 0.35;
  else if (input.precipProb >= 35) overall *= 0.62;
  else if (input.precipProb >= 20) overall *= 0.82;

  if (input.sunAlt > -12) overall *= 0.55;
  else if (input.sunAlt > -18) overall *= 0.82;

  return {
    cloud,
    seeing,
    transparency,
    moon,
    dew,
    wind,
    overall: clamp(overall),
  };
}

export function verdictFor(score: number): Verdict {
  if (score >= 85) return "eccellente";
  if (score >= 70) return "buona";
  if (score >= 55) return "discreta";
  if (score >= 40) return "scarsa";
  return "pessima";
}

export function mean(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}
