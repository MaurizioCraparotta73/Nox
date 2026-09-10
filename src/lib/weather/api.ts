import {
  interpolateCrossing,
  moonAltitude,
  moonIllumination,
  moonRiseSet,
  sunAltitude,
} from "./astro";
import { getForecast } from "./get-forecast";
import { dewRiskFromScore, mean, scoreHour, verdictFor } from "./score";
import type {
  ForecastBundle,
  GeoLocation,
  HourPoint,
  NightForecast,
  SessionMode,
  WeatherRaw,
} from "./types";

function num(arr: Array<number | null> | undefined, i: number, fallback = 0) {
  const v = arr?.[i];
  return v == null || Number.isNaN(v) ? fallback : v;
}

function numOrNull(arr: Array<number | null> | undefined, i: number) {
  const v = arr?.[i];
  return v == null || Number.isNaN(v) ? null : v;
}

export const SUGGESTED_SITES: GeoLocation[] = [
  { name: "Milano", admin: "Lombardia", country: "Italia", latitude: 45.4642, longitude: 9.19, elevation: 120 },
  { name: "Asiago", admin: "Veneto · osservatorio", country: "Italia", latitude: 45.866, longitude: 11.526, elevation: 1046 },
  { name: "Campo Imperatore", admin: "Abruzzo · cielo scuro", country: "Italia", latitude: 42.443, longitude: 13.558, elevation: 2130 },
  { name: "Saint-Barthélemy", admin: "Valle d'Aosta", country: "Italia", latitude: 45.789, longitude: 7.477, elevation: 1675 },
  { name: "Loiano", admin: "Emilia-Romagna · osservatorio", country: "Italia", latitude: 44.288, longitude: 11.333, elevation: 785 },
  { name: "Serra la Nave", admin: "Etna · osservatorio", country: "Italia", latitude: 37.692, longitude: 14.974, elevation: 1735 },
  { name: "Passo del Tonale", admin: "Trentino", country: "Italia", latitude: 46.261, longitude: 10.581, elevation: 1883 },
  { name: "Castelgrande", admin: "Basilicata", country: "Italia", latitude: 40.784, longitude: 15.454, elevation: 1000 },
];

export async function searchPlaces(query: string): Promise<GeoLocation[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", q);
  url.searchParams.set("count", "7");
  url.searchParams.set("language", "it");
  url.searchParams.set("format", "json");
  const res = await fetch(url);
  if (!res.ok) throw new Error("Ricerca località non disponibile");
  const data = (await res.json()) as {
    results?: Array<{
      name: string;
      latitude: number;
      longitude: number;
      elevation?: number;
      admin1?: string;
      country?: string;
    }>;
  };
  return (data.results ?? []).map((r) => ({
    name: r.name,
    admin: r.admin1 ?? "",
    country: r.country ?? "",
    latitude: r.latitude,
    longitude: r.longitude,
    elevation: r.elevation,
  }));
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<GeoLocation> {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/reverse");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("language", "it");
  url.searchParams.set("format", "json");
  try {
    const res = await fetch(url);
    if (res.ok) {
      const data = (await res.json()) as {
        results?: Array<{
          name: string;
          latitude: number;
          longitude: number;
          elevation?: number;
          admin1?: string;
          country?: string;
        }>;
      };
      const r = data.results?.[0];
      if (r) {
        return {
          name: r.name,
          admin: r.admin1 ?? "",
          country: r.country ?? "",
          latitude: r.latitude,
          longitude: r.longitude,
          elevation: r.elevation,
        };
      }
    }
  } catch {
    /* fall through */
  }
  return {
    name: "Posizione attuale",
    admin: `${latitude.toFixed(3)}°, ${longitude.toFixed(3)}°`,
    country: "",
    latitude,
    longitude,
  };
}

export async function fetchWeather(location: GeoLocation): Promise<WeatherRaw> {
  return getForecast({
    data: { latitude: location.latitude, longitude: location.longitude },
  });
}

function eveningKey(date: Date) {
  const d = new Date(date);
  if (d.getHours() < 12) d.setDate(d.getDate() - 1);
  d.setHours(0, 0, 0, 0);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function findBestWindow(hours: HourPoint[]): NightForecast["bestWindow"] {
  if (hours.length === 0) return null;
  const good = hours.map((h) => h.scores.overall >= 70);
  let best: NightForecast["bestWindow"] = null;
  let runStart = -1;
  const close = (endIdx: number) => {
    if (runStart < 0) return;
    const slice = hours.slice(runStart, endIdx + 1);
    const score = mean(slice.map((h) => h.scores.overall));
    const length = slice.length;
    const bestLen = best ? (best.end.getTime() - best.start.getTime()) / 3_600_000 + 1 : 0;
    if (!best || length > bestLen || (length === bestLen && score > best.score)) {
      best = { start: slice[0]!.time, end: slice[slice.length - 1]!.time, score };
    }
  };
  hours.forEach((_, i) => {
    if (good[i]) {
      if (runStart < 0) runStart = i;
    } else {
      close(i - 1);
      runStart = -1;
    }
  });
  close(hours.length - 1);

  if (best) return best;

  let bestAvg = -1;
  let bestI = 0;
  const window = Math.min(3, hours.length);
  for (let i = 0; i + window <= hours.length; i++) {
    const avg = mean(hours.slice(i, i + window).map((h) => h.scores.overall));
    if (avg > bestAvg) {
      bestAvg = avg;
      bestI = i;
    }
  }
  const slice = hours.slice(bestI, bestI + window);
  return { start: slice[0]!.time, end: slice[slice.length - 1]!.time, score: bestAvg };
}

export function buildForecast(raw: WeatherRaw, location: GeoLocation, mode: SessionMode): ForecastBundle {
  const { hourly, aodByTime } = raw;
  const hours: HourPoint[] = hourly.time.map((iso, i) => {
    const stamp = iso.endsWith("Z") || iso.includes("+") ? iso : `${iso}Z`;
    const time = new Date(stamp);
    const moon = moonIllumination(time);
    const temperature = num(hourly.temperature_2m, i);
    const humidity = num(hourly.relative_humidity_2m, i);
    const dewPoint = num(hourly.dew_point_2m, i);
    const precipProb = num(hourly.precipitation_probability, i);
    const precipitation = num(hourly.precipitation, i);
    const cloud = num(hourly.cloud_cover, i);
    const cloudLow = num(hourly.cloud_cover_low, i);
    const cloudMid = num(hourly.cloud_cover_mid, i);
    const cloudHigh = num(hourly.cloud_cover_high, i);
    const visibilityKm = num(hourly.visibility, i, 20000) / 1000;
    const windSpeed = num(hourly.wind_speed_10m, i);
    const windGusts = num(hourly.wind_gusts_10m, i);
    const windDir = num(hourly.wind_direction_10m, i);
    const wind80 = numOrNull(hourly.wind_speed_80m, i);
    const wind120 = numOrNull(hourly.wind_speed_120m, i);
    const cape = numOrNull(hourly.cape, i);
    const vpd = numOrNull(hourly.vapour_pressure_deficit, i);
    const aod = aodByTime[iso] ?? null;
    const sunAlt = sunAltitude(time, location.latitude, location.longitude);
    const moonAlt = moonAltitude(time, location.latitude, location.longitude);
    const scores = scoreHour({
      cloudLow,
      cloudMid,
      cloudHigh,
      cloud,
      wind10: windSpeed,
      wind80,
      wind120,
      cape,
      humidity,
      visibilityKm,
      aod,
      vpd,
      moonIllumination: moon.fraction,
      moonAlt,
      temperature,
      dewPoint,
      windGusts,
      precipProb,
      precipitation,
      sunAlt,
      mode,
      astroSeeing: numOrNull(hourly.seeing, i),
      astroTransparency: numOrNull(hourly.transparency, i),
    });
    return {
      time,
      iso,
      temperature,
      humidity,
      dewPoint,
      precipProb,
      precipitation,
      weatherCode: num(hourly.weather_code, i),
      cloud,
      cloudLow,
      cloudMid,
      cloudHigh,
      visibilityKm,
      windSpeed,
      windGusts,
      windDir,
      wind80,
      wind120,
      cape,
      vpd,
      aod,
      isDay: sunAlt > 0,
      sunAlt,
      moonAlt,
      moonIllumination: moon.fraction,
      moonPhase: moon.phase,
      scores,
    };
  });

  const grouped = new Map<string, HourPoint[]>();
  for (const hour of hours) {
    const key = eveningKey(hour.time);
    const list = grouped.get(key) ?? [];
    list.push(hour);
    grouped.set(key, list);
  }

  const nights: NightForecast[] = [...grouped.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, nightHours]) => {
      const eveningDate = new Date(`${id}T18:00:00`);
      const times = nightHours.map((h) => h.time);
      const alts = nightHours.map((h) => h.sunAlt);
      const sunset = interpolateCrossing(times, alts, -0.833, "down");
      const sunrise = interpolateCrossing(times, alts, -0.833, "up");
      const windowHours = nightHours.filter((h) => {
        if (sunset && sunrise) return h.time >= sunset && h.time <= sunrise;
        return h.sunAlt < 0;
      });
      const useHours = windowHours.length >= 3 ? windowHours : nightHours.filter((h) => h.sunAlt < 0);
      const astroHours = useHours.filter((h) => h.sunAlt < -18);
      const scoreHours = astroHours.length >= 2 ? astroHours : useHours;
      const score = mean(scoreHours.map((h) => h.scores.overall));
      const mid = useHours[Math.floor(useHours.length / 2)] ?? nightHours[0]!;
      const moon = moonIllumination(mid.time);
      const moonTimes = moonRiseSet(eveningDate, location.latitude, location.longitude);
      const astroStart = interpolateCrossing(
        useHours.map((h) => h.time),
        useHours.map((h) => h.sunAlt),
        -18,
        "down",
      );
      const astroEnd = interpolateCrossing(
        useHours.map((h) => h.time),
        useHours.map((h) => h.sunAlt),
        -18,
        "up",
      );
      const astroDurationMin =
        astroStart && astroEnd ? Math.max(0, Math.round((astroEnd.getTime() - astroStart.getTime()) / 60_000)) : 0;
      const dewAvg = mean(useHours.map((h) => h.scores.dew));
      return {
        id,
        eveningDate,
        sunset,
        sunrise,
        astroStart,
        astroEnd,
        astroDurationMin,
        hours: useHours,
        astroHours,
        score,
        verdict: verdictFor(score),
        bestWindow: findBestWindow(scoreHours),
        moonIllumination: moon.fraction,
        moonPhase: moon.phase,
        moonRise: moonTimes.rise,
        moonSet: moonTimes.set,
        moonAlwaysUp: moonTimes.alwaysUp,
        moonAlwaysDown: moonTimes.alwaysDown,
        minTemp: useHours.length ? Math.min(...useHours.map((h) => h.temperature)) : mid.temperature,
        maxWind: useHours.length ? Math.max(...useHours.map((h) => h.windSpeed)) : mid.windSpeed,
        dewRisk: dewRiskFromScore(dewAvg),
        cloudAvg: mean(useHours.map((h) => h.cloud)),
        precipRisk: useHours.length ? Math.max(...useHours.map((h) => h.precipProb)) : 0,
      };
    })
    .filter((n) => n.hours.length > 0)
    .slice(0, 7);

  const now = new Date();
  const current =
    hours.reduce<HourPoint | null>((best, h) => {
      if (h.time.getTime() > now.getTime()) return best;
      if (!best || h.time.getTime() > best.time.getTime()) return h;
      return best;
    }, null) ?? hours[0] ?? null;

  const inProgress = nights.find((n) => {
    const start = n.sunset ?? n.hours[0]?.time;
    const end = n.sunrise ?? n.hours[n.hours.length - 1]?.time;
    return start && end && now >= start && now <= end;
  });
  const upcoming = nights.find((n) => {
    const start = n.sunset ?? n.hours[0]?.time;
    return start && start > now;
  });
  const activeNight = inProgress ?? upcoming ?? nights[0]!;

  return {
    location,
    timezone: raw.timezone,
    fetchedAt: new Date(),
    nights,
    current,
    activeNight,
  };
}
