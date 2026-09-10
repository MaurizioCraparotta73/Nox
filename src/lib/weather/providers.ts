import type { WeatherRaw } from "./types";

const UA = "Nox/1.0 astrophotography-forecast";

type MetInstant = {
  air_temperature?: number;
  cloud_area_fraction?: number;
  cloud_area_fraction_high?: number;
  cloud_area_fraction_low?: number;
  cloud_area_fraction_medium?: number;
  dew_point_temperature?: number;
  fog_area_fraction?: number;
  relative_humidity?: number;
  wind_from_direction?: number;
  wind_speed?: number;
  wind_speed_of_gust?: number;
};

type MetEntry = {
  time: string;
  data: {
    instant: { details: MetInstant };
    next_1_hours?: {
      summary?: { symbol_code?: string };
      details?: { precipitation_amount?: number; probability_of_precipitation?: number };
    };
    next_6_hours?: {
      summary?: { symbol_code?: string };
      details?: { precipitation_amount?: number };
    };
  };
};

type SevenTimer = {
  init: string;
  dataseries: Array<{
    timepoint: number;
    cloudcover: number;
    seeing: number;
    transparency: number;
    rh2m: number;
    temp2m: number;
    prec_type: string;
    wind10m: { direction: string; speed: number };
  }>;
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function parseInitUtc(init: string) {
  const y = Number(init.slice(0, 4));
  const m = Number(init.slice(4, 6)) - 1;
  const d = Number(init.slice(6, 8));
  const h = Number(init.slice(8, 10));
  return Date.UTC(y, m, d, h);
}

async function fetchJson(url: string, init?: RequestInit, timeoutMs = 10000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function precipProb(entry: MetEntry) {
  const p = entry.data.next_1_hours?.details?.probability_of_precipitation;
  if (typeof p === "number") return p;
  const amt =
    entry.data.next_1_hours?.details?.precipitation_amount ??
    (entry.data.next_6_hours?.details?.precipitation_amount != null
      ? entry.data.next_6_hours.details.precipitation_amount / 6
      : 0);
  const symbol =
    entry.data.next_1_hours?.summary?.symbol_code ??
    entry.data.next_6_hours?.summary?.symbol_code ??
    "";
  if (amt > 0.5) return 88;
  if (amt > 0.1) return 64;
  if (amt > 0) return 38;
  if (/rain|shower|sleet|snow|thunder/.test(symbol)) return 32;
  return 8;
}

function precipAmt(entry: MetEntry) {
  if (entry.data.next_1_hours?.details?.precipitation_amount != null) {
    return entry.data.next_1_hours.details.precipitation_amount;
  }
  if (entry.data.next_6_hours?.details?.precipitation_amount != null) {
    return entry.data.next_6_hours.details.precipitation_amount / 6;
  }
  return 0;
}

function visibilityKm(details: MetInstant) {
  const fog = details.fog_area_fraction ?? 0;
  if (fog >= 60) return 0.8;
  if (fog >= 20) return 4;
  const rh = details.relative_humidity ?? 60;
  if (rh >= 95) return 8;
  if (rh >= 85) return 14;
  return 24;
}

type Sample = {
  time: Date;
  iso: string;
  temperature: number;
  humidity: number;
  dewPoint: number;
  precipProb: number;
  precipitation: number;
  cloud: number;
  cloudLow: number;
  cloudMid: number;
  cloudHigh: number;
  visibility: number;
  windSpeed: number;
  windGusts: number;
  windDir: number;
};

function toSample(entry: MetEntry): Sample {
  const d = entry.data.instant.details;
  const windMs = d.wind_speed ?? 0;
  const gustMs = d.wind_speed_of_gust ?? windMs * 1.25;
  const time = new Date(entry.time);
  return {
    time,
    iso: entry.time.replace(".000Z", "Z"),
    temperature: d.air_temperature ?? 0,
    humidity: d.relative_humidity ?? 60,
    dewPoint: d.dew_point_temperature ?? (d.air_temperature ?? 0) - 4,
    precipProb: precipProb(entry),
    precipitation: precipAmt(entry),
    cloud: d.cloud_area_fraction ?? 0,
    cloudLow: d.cloud_area_fraction_low ?? 0,
    cloudMid: d.cloud_area_fraction_medium ?? 0,
    cloudHigh: d.cloud_area_fraction_high ?? 0,
    visibility: visibilityKm(d) * 1000,
    windSpeed: windMs * 3.6,
    windGusts: gustMs * 3.6,
    windDir: d.wind_from_direction ?? 0,
  };
}

function expandHourly(samples: Sample[]): Sample[] {
  if (samples.length === 0) return [];
  const out: Sample[] = [];
  const start = samples[0]!.time.getTime();
  const end = samples[samples.length - 1]!.time.getTime();
  let j = 0;
  for (let t = start; t <= end; t += 3_600_000) {
    while (j < samples.length - 2 && samples[j + 1]!.time.getTime() <= t) j += 1;
    const a = samples[j]!;
    const b = samples[Math.min(j + 1, samples.length - 1)]!;
    const span = b.time.getTime() - a.time.getTime();
    const f = span <= 0 ? 0 : Math.min(1, Math.max(0, (t - a.time.getTime()) / span));
    const time = new Date(t);
    out.push({
      time,
      iso: time.toISOString(),
      temperature: lerp(a.temperature, b.temperature, f),
      humidity: lerp(a.humidity, b.humidity, f),
      dewPoint: lerp(a.dewPoint, b.dewPoint, f),
      precipProb: lerp(a.precipProb, b.precipProb, f),
      precipitation: lerp(a.precipitation, b.precipitation, f),
      cloud: lerp(a.cloud, b.cloud, f),
      cloudLow: lerp(a.cloudLow, b.cloudLow, f),
      cloudMid: lerp(a.cloudMid, b.cloudMid, f),
      cloudHigh: lerp(a.cloudHigh, b.cloudHigh, f),
      visibility: lerp(a.visibility, b.visibility, f),
      windSpeed: lerp(a.windSpeed, b.windSpeed, f),
      windGusts: lerp(a.windGusts, b.windGusts, f),
      windDir: a.windDir,
    });
  }
  return out;
}

function overlayAstro(times: string[], astro: SevenTimer | null) {
  const seeing: Array<number | null> = times.map(() => null);
  const transparency: Array<number | null> = times.map(() => null);
  if (!astro?.dataseries?.length) return { seeing, transparency };
  const origin = parseInitUtc(astro.init);
  const points = astro.dataseries.map((row) => ({
    t: origin + row.timepoint * 3_600_000,
    seeing: ((9 - row.seeing) / 8) * 100,
    transparency: ((9 - row.transparency) / 8) * 100,
  }));
  times.forEach((iso, i) => {
    const t = new Date(iso.endsWith("Z") ? iso : `${iso}Z`).getTime();
    let best = points[0]!;
    let dist = Math.abs(best.t - t);
    for (const p of points) {
      const d = Math.abs(p.t - t);
      if (d < dist) {
        best = p;
        dist = d;
      }
    }
    if (dist <= 2.6 * 3_600_000) {
      seeing[i] = best.seeing;
      transparency[i] = best.transparency;
    }
  });
  return { seeing, transparency };
}

async function loadMetNo(lat: number, lng: number): Promise<Sample[]> {
  const url = `https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=${lat}&lon=${lng}`;
  const data = (await fetchJson(url, { headers: { "User-Agent": UA, Accept: "application/json" } })) as {
    properties?: { timeseries?: MetEntry[] };
  };
  const series = data.properties?.timeseries ?? [];
  if (series.length < 8) throw new Error("Serie MET Norway incompleta");
  return expandHourly(series.map(toSample));
}

async function loadSevenTimer(lat: number, lng: number): Promise<SevenTimer | null> {
  try {
    const url = `https://www.7timer.info/bin/api.pl?lon=${lng}&lat=${lat}&product=astro&output=json`;
    return (await fetchJson(url, undefined, 8000)) as SevenTimer;
  } catch {
    return null;
  }
}

function samplesToRaw(samples: Sample[], astro: SevenTimer | null): WeatherRaw {
  const overlay = overlayAstro(
    samples.map((s) => s.iso),
    astro,
  );
  const start = samples[0]!.time;
  const end = samples[samples.length - 1]!.time;
  const days: string[] = [];
  for (let t = start.getTime(); t <= end.getTime() + 12 * 3_600_000; t += 86_400_000) {
    const d = new Date(t);
    const key = d.toISOString().slice(0, 10);
    if (!days.includes(key)) days.push(key);
  }
  return {
    timezone: "auto",
    hourly: {
      time: samples.map((s) => s.iso),
      temperature_2m: samples.map((s) => s.temperature),
      relative_humidity_2m: samples.map((s) => s.humidity),
      dew_point_2m: samples.map((s) => s.dewPoint),
      precipitation_probability: samples.map((s) => s.precipProb),
      precipitation: samples.map((s) => s.precipitation),
      weather_code: samples.map(() => 0),
      cloud_cover: samples.map((s) => s.cloud),
      cloud_cover_low: samples.map((s) => s.cloudLow),
      cloud_cover_mid: samples.map((s) => s.cloudMid),
      cloud_cover_high: samples.map((s) => s.cloudHigh),
      visibility: samples.map((s) => s.visibility),
      wind_speed_10m: samples.map((s) => s.windSpeed),
      wind_gusts_10m: samples.map((s) => s.windGusts),
      wind_direction_10m: samples.map((s) => s.windDir),
      is_day: samples.map((s) => (s.time.getUTCHours() >= 6 && s.time.getUTCHours() < 18 ? 1 : 0)),
      seeing: overlay.seeing,
      transparency: overlay.transparency,
    },
    daily: {
      time: days,
      sunrise: days.map(() => ""),
      sunset: days.map(() => ""),
      precipitation_sum: days.map(() => 0),
      precipitation_probability_max: days.map(() => 0),
      temperature_2m_min: days.map(() => 0),
      temperature_2m_max: days.map(() => 0),
      wind_speed_10m_max: days.map(() => 0),
    },
    aodByTime: {},
  };
}

const cache = new Map<string, { at: number; data: WeatherRaw }>();
const CACHE_MS = 10 * 60 * 1000;

export async function loadWeather(lat: number, lng: number): Promise<WeatherRaw> {
  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.data;
  const [met, astro] = await Promise.all([loadMetNo(lat, lng), loadSevenTimer(lat, lng)]);
  const data = samplesToRaw(met, astro);
  cache.set(key, { at: Date.now(), data });
  return data;
}
