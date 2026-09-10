import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { a as Share, c as Moon, d as LocateFixed, f as Eye, h as Cloud, i as Star, l as MonitorSmartphone, m as Download, o as Search, p as Droplets, r as Telescope, s as RefreshCw, t as Wind, u as MapPin } from "../_libs/lucide-react.mjs";
import { a as useNoxStore, i as locKey, n as Route$1, o as getForecast, r as MILANO } from "./router-C5g-BOp2.mjs";
import { n as QueryClientProvider, t as useQuery } from "../_libs/tanstack__react-query.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { n as format, t as it } from "../_libs/date-fns.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { a as CartesianGrid, i as Line, n as YAxis, o as ResponsiveContainer, r as XAxis, s as Tooltip, t as LineChart } from "../_libs/recharts+[...].mjs";
import { t as _e } from "../_libs/cmdk.mjs";
import { u as Slot } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { a as Trigger, i as Root3, n as Portal, r as Provider, t as Content2 } from "../_libs/@radix-ui/react-tooltip+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-Dv_B3XoN.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Compact solar/lunar geometry adapted from SunCalc (Vladimir Agafonkin, BSD).
* Positions are topocentric-enough for weather scoring and night windows.
*/
var PI = Math.PI;
var rad = PI / 180;
var dayMs = 864e5;
var J1970 = 2440588;
var J2000 = 2451545;
var e = rad * 23.4397;
function toJulian(date) {
	return date.valueOf() / dayMs - .5 + J1970;
}
function toDays(date) {
	return toJulian(date) - J2000;
}
function rightAscension(l, b) {
	return Math.atan2(Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e), Math.cos(l));
}
function declination(l, b) {
	return Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l));
}
function altitude(H, phi, dec) {
	return Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
}
function siderealTime(d, lw) {
	return rad * (280.16 + 360.9856235 * d) - lw;
}
function solarMeanAnomaly(d) {
	return rad * (357.5291 + .98560028 * d);
}
function eclipticLongitude(M) {
	const C = rad * (1.9148 * Math.sin(M) + .02 * Math.sin(2 * M) + 3e-4 * Math.sin(3 * M));
	const P = rad * 102.9372;
	return M + C + P + PI;
}
function sunCoords(d) {
	const L = eclipticLongitude(solarMeanAnomaly(d));
	return {
		dec: declination(L, 0),
		ra: rightAscension(L, 0)
	};
}
function moonCoords(d) {
	const L = rad * (218.316 + 13.176396 * d);
	const M = rad * (134.963 + 13.064993 * d);
	const F = rad * (93.272 + 13.22935 * d);
	const l = L + rad * 6.289 * Math.sin(M);
	const b = rad * 5.128 * Math.sin(F);
	const dist = 385001 - 20905 * Math.cos(M);
	return {
		ra: rightAscension(l, b),
		dec: declination(l, b),
		dist
	};
}
function sunAltitude(date, lat, lng) {
	const lw = rad * -lng;
	const phi = rad * lat;
	const d = toDays(date);
	const c = sunCoords(d);
	return altitude(siderealTime(d, lw) - c.ra, phi, c.dec) * 180 / PI;
}
function moonAltitude(date, lat, lng) {
	const lw = rad * -lng;
	const phi = rad * lat;
	const d = toDays(date);
	const c = moonCoords(d);
	const alt = altitude(siderealTime(d, lw) - c.ra, phi, c.dec);
	return (alt - Math.asin(6371 / c.dist) * Math.cos(alt)) * 180 / PI;
}
function moonIllumination(date) {
	const d = toDays(date);
	const s = sunCoords(d);
	const m = moonCoords(d);
	const sdist = 149598e3;
	const phi = Math.acos(Math.sin(s.dec) * Math.sin(m.dec) + Math.cos(s.dec) * Math.cos(m.dec) * Math.cos(s.ra - m.ra));
	const inc = Math.atan2(sdist * Math.sin(phi), m.dist - sdist * Math.cos(phi));
	const angle = Math.atan2(Math.cos(s.dec) * Math.sin(s.ra - m.ra), Math.sin(s.dec) * Math.cos(m.dec) - Math.cos(s.dec) * Math.sin(m.dec) * Math.cos(s.ra - m.ra));
	return {
		fraction: (1 + Math.cos(inc)) / 2,
		phase: .5 + .5 * inc * (angle < 0 ? -1 : 1) / Math.PI,
		angle
	};
}
function interpolateCrossing(times, values, threshold, direction) {
	for (let i = 1; i < values.length; i++) {
		const a = values[i - 1];
		const b = values[i];
		if (!(direction === "down" ? a >= threshold && b < threshold : a < threshold && b >= threshold)) continue;
		const span = b - a;
		const t = Math.abs(span) < 1e-6 ? 0 : (threshold - a) / span;
		const t0 = times[i - 1].getTime();
		const t1 = times[i].getTime();
		return new Date(t0 + t * (t1 - t0));
	}
	return null;
}
function moonRiseSet(dayStart, lat, lng) {
	const start = new Date(dayStart);
	start.setHours(0, 0, 0, 0);
	let rise = null;
	let set = null;
	let prev = moonAltitude(start, lat, lng);
	let upSamples = 0;
	const steps = 144;
	for (let i = 1; i <= steps; i++) {
		const t = new Date(start.getTime() + i * 10 * 6e4);
		const alt = moonAltitude(t, lat, lng);
		if (alt > 0) upSamples += 1;
		if (prev < 0 && alt >= 0 && !rise) rise = t;
		if (prev >= 0 && alt < 0 && !set) set = t;
		prev = alt;
	}
	const alwaysUp = !rise && !set && upSamples > steps / 2;
	return {
		rise,
		set,
		alwaysUp,
		alwaysDown: !rise && !set && !alwaysUp
	};
}
function moonPhaseName(phase) {
	if (phase < .03 || phase >= .97) return "Luna nuova";
	if (phase < .22) return "Luna crescente";
	if (phase < .28) return "Primo quarto";
	if (phase < .47) return "Gibbosa crescente";
	if (phase < .53) return "Luna piena";
	if (phase < .72) return "Gibbosa calante";
	if (phase < .78) return "Ultimo quarto";
	return "Luna calante";
}
function clamp(n, min = 0, max = 100) {
	return Math.min(max, Math.max(min, n));
}
function cloudScore(low, mid, high, total) {
	return clamp(100 - (.7 * (.5 * low + .32 * mid + .18 * high) + .3 * total));
}
function seeingScore(wind10, wind80, wind120, cape) {
	const shear = Math.abs((wind120 ?? wind80 ?? wind10) - wind10);
	const windPen = clamp(wind10 / 45 * 36);
	const shearPen = clamp(shear / 70 * 28);
	const capePen = clamp((cape ?? 0) / 900 * 32);
	return clamp(100 - windPen - shearPen - capePen);
}
function transparencyScore(humidity, visibilityKm, aod, vpd) {
	const humPen = clamp((humidity - 28) / 72 * 42);
	const visPen = clamp((24 - visibilityKm) / 24 * 26);
	const aodPen = aod == null ? 8 : clamp((aod - .04) / .45 * 32);
	const vpdBonus = vpd == null ? 0 : clamp((vpd - .4) * 8, 0, 10);
	return clamp(100 - humPen - visPen - aodPen + vpdBonus);
}
function moonScore(illumination, moonAlt) {
	if (moonAlt < -1) return 100;
	return clamp(100 - illumination * (.35 + .65 * (clamp(Math.sin(Math.max(moonAlt, 0) * Math.PI / 180) * 100, 0, 100) / 100)) * 100);
}
function dewScore(temperature, dewPoint) {
	const spread = temperature - dewPoint;
	if (spread >= 6) return 100;
	if (spread <= 0) return 8;
	return clamp(spread / 6 * 100);
}
function windMountScore(wind10, gusts) {
	const effective = Math.max(wind10, gusts * .72);
	if (effective <= 8) return 100;
	if (effective >= 42) return 6;
	return clamp(100 - (effective - 8) / 34 * 94);
}
function dewRiskFromScore(score) {
	if (score >= 70) return "basso";
	if (score >= 40) return "moderato";
	return "alto";
}
function scoreHour(input) {
	const cloud = cloudScore(input.cloudLow, input.cloudMid, input.cloudHigh, input.cloud);
	let seeing = seeingScore(input.wind10, input.wind80, input.wind120, input.cape);
	let transparency = transparencyScore(input.humidity, input.visibilityKm, input.aod, input.vpd);
	if (input.astroSeeing != null) seeing = clamp(.74 * input.astroSeeing + .26 * seeing);
	if (input.astroTransparency != null) transparency = clamp(.74 * input.astroTransparency + .26 * transparency);
	const moon = moonScore(input.moonIllumination, input.moonAlt);
	const dew = dewScore(input.temperature, input.dewPoint);
	const wind = windMountScore(input.wind10, input.windGusts);
	const weights = input.mode === "planetary" ? {
		cloud: .28,
		seeing: .36,
		transparency: .14,
		moon: .04,
		dew: .06,
		wind: .12
	} : {
		cloud: .36,
		seeing: .12,
		transparency: .2,
		moon: .2,
		dew: .06,
		wind: .06
	};
	let overall = cloud * weights.cloud + seeing * weights.seeing + transparency * weights.transparency + moon * weights.moon + dew * weights.dew + wind * weights.wind;
	if (input.precipitation > .05) overall *= .12;
	else if (input.precipProb >= 55) overall *= .35;
	else if (input.precipProb >= 35) overall *= .62;
	else if (input.precipProb >= 20) overall *= .82;
	if (input.sunAlt > -12) overall *= .55;
	else if (input.sunAlt > -18) overall *= .82;
	return {
		cloud,
		seeing,
		transparency,
		moon,
		dew,
		wind,
		overall: clamp(overall)
	};
}
function verdictFor(score) {
	if (score >= 85) return "eccellente";
	if (score >= 70) return "buona";
	if (score >= 55) return "discreta";
	if (score >= 40) return "scarsa";
	return "pessima";
}
function mean(values) {
	if (values.length === 0) return 0;
	return values.reduce((a, b) => a + b, 0) / values.length;
}
function num(arr, i, fallback = 0) {
	const v = arr?.[i];
	return v == null || Number.isNaN(v) ? fallback : v;
}
function numOrNull(arr, i) {
	const v = arr?.[i];
	return v == null || Number.isNaN(v) ? null : v;
}
var SUGGESTED_SITES = [
	{
		name: "Milano",
		admin: "Lombardia",
		country: "Italia",
		latitude: 45.4642,
		longitude: 9.19,
		elevation: 120
	},
	{
		name: "Asiago",
		admin: "Veneto · osservatorio",
		country: "Italia",
		latitude: 45.866,
		longitude: 11.526,
		elevation: 1046
	},
	{
		name: "Campo Imperatore",
		admin: "Abruzzo · cielo scuro",
		country: "Italia",
		latitude: 42.443,
		longitude: 13.558,
		elevation: 2130
	},
	{
		name: "Saint-Barthélemy",
		admin: "Valle d'Aosta",
		country: "Italia",
		latitude: 45.789,
		longitude: 7.477,
		elevation: 1675
	},
	{
		name: "Loiano",
		admin: "Emilia-Romagna · osservatorio",
		country: "Italia",
		latitude: 44.288,
		longitude: 11.333,
		elevation: 785
	},
	{
		name: "Serra la Nave",
		admin: "Etna · osservatorio",
		country: "Italia",
		latitude: 37.692,
		longitude: 14.974,
		elevation: 1735
	},
	{
		name: "Passo del Tonale",
		admin: "Trentino",
		country: "Italia",
		latitude: 46.261,
		longitude: 10.581,
		elevation: 1883
	},
	{
		name: "Castelgrande",
		admin: "Basilicata",
		country: "Italia",
		latitude: 40.784,
		longitude: 15.454,
		elevation: 1e3
	}
];
async function searchPlaces(query) {
	const q = query.trim();
	if (q.length < 2) return [];
	const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
	url.searchParams.set("name", q);
	url.searchParams.set("count", "7");
	url.searchParams.set("language", "it");
	url.searchParams.set("format", "json");
	const res = await fetch(url);
	if (!res.ok) throw new Error("Ricerca località non disponibile");
	return ((await res.json()).results ?? []).map((r) => ({
		name: r.name,
		admin: r.admin1 ?? "",
		country: r.country ?? "",
		latitude: r.latitude,
		longitude: r.longitude,
		elevation: r.elevation
	}));
}
async function reverseGeocode(latitude, longitude) {
	const url = new URL("https://geocoding-api.open-meteo.com/v1/reverse");
	url.searchParams.set("latitude", String(latitude));
	url.searchParams.set("longitude", String(longitude));
	url.searchParams.set("language", "it");
	url.searchParams.set("format", "json");
	try {
		const res = await fetch(url);
		if (res.ok) {
			const r = (await res.json()).results?.[0];
			if (r) return {
				name: r.name,
				admin: r.admin1 ?? "",
				country: r.country ?? "",
				latitude: r.latitude,
				longitude: r.longitude,
				elevation: r.elevation
			};
		}
	} catch {}
	return {
		name: "Posizione attuale",
		admin: `${latitude.toFixed(3)}°, ${longitude.toFixed(3)}°`,
		country: "",
		latitude,
		longitude
	};
}
async function fetchWeather(location) {
	return getForecast({ data: {
		latitude: location.latitude,
		longitude: location.longitude
	} });
}
function eveningKey(date) {
	const d = new Date(date);
	if (d.getHours() < 12) d.setDate(d.getDate() - 1);
	d.setHours(0, 0, 0, 0);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function findBestWindow(hours) {
	if (hours.length === 0) return null;
	const good = hours.map((h) => h.scores.overall >= 70);
	let best = null;
	let runStart = -1;
	const close = (endIdx) => {
		if (runStart < 0) return;
		const slice = hours.slice(runStart, endIdx + 1);
		const score = mean(slice.map((h) => h.scores.overall));
		const length = slice.length;
		const bestLen = best ? (best.end.getTime() - best.start.getTime()) / 36e5 + 1 : 0;
		if (!best || length > bestLen || length === bestLen && score > best.score) best = {
			start: slice[0].time,
			end: slice[slice.length - 1].time,
			score
		};
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
	return {
		start: slice[0].time,
		end: slice[slice.length - 1].time,
		score: bestAvg
	};
}
function buildForecast(raw, location, mode) {
	const { hourly, aodByTime } = raw;
	const hours = hourly.time.map((iso, i) => {
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
		const visibilityKm = num(hourly.visibility, i, 2e4) / 1e3;
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
			astroTransparency: numOrNull(hourly.transparency, i)
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
			scores
		};
	});
	const grouped = /* @__PURE__ */ new Map();
	for (const hour of hours) {
		const key = eveningKey(hour.time);
		const list = grouped.get(key) ?? [];
		list.push(hour);
		grouped.set(key, list);
	}
	const nights = [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([id, nightHours]) => {
		const eveningDate = /* @__PURE__ */ new Date(`${id}T18:00:00`);
		const times = nightHours.map((h) => h.time);
		const alts = nightHours.map((h) => h.sunAlt);
		const sunset = interpolateCrossing(times, alts, -.833, "down");
		const sunrise = interpolateCrossing(times, alts, -.833, "up");
		const windowHours = nightHours.filter((h) => {
			if (sunset && sunrise) return h.time >= sunset && h.time <= sunrise;
			return h.sunAlt < 0;
		});
		const useHours = windowHours.length >= 3 ? windowHours : nightHours.filter((h) => h.sunAlt < 0);
		const astroHours = useHours.filter((h) => h.sunAlt < -18);
		const scoreHours = astroHours.length >= 2 ? astroHours : useHours;
		const score = mean(scoreHours.map((h) => h.scores.overall));
		const mid = useHours[Math.floor(useHours.length / 2)] ?? nightHours[0];
		const moon = moonIllumination(mid.time);
		const moonTimes = moonRiseSet(eveningDate, location.latitude, location.longitude);
		const astroStart = interpolateCrossing(useHours.map((h) => h.time), useHours.map((h) => h.sunAlt), -18, "down");
		const astroEnd = interpolateCrossing(useHours.map((h) => h.time), useHours.map((h) => h.sunAlt), -18, "up");
		const astroDurationMin = astroStart && astroEnd ? Math.max(0, Math.round((astroEnd.getTime() - astroStart.getTime()) / 6e4)) : 0;
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
			precipRisk: useHours.length ? Math.max(...useHours.map((h) => h.precipProb)) : 0
		};
	}).filter((n) => n.hours.length > 0).slice(0, 7);
	const now = /* @__PURE__ */ new Date();
	const current = hours.reduce((best, h) => {
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
	const activeNight = inProgress ?? upcoming ?? nights[0];
	return {
		location,
		timezone: raw.timezone,
		fetchedAt: /* @__PURE__ */ new Date(),
		nights,
		current,
		activeNight
	};
}
function CloudChart({ night }) {
	const [mounted, setMounted] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => setMounted(true), []);
	const data = night.hours.map((h) => ({
		time: format(h.time, "HH:mm"),
		basse: Math.round(h.cloudLow),
		medie: Math.round(h.cloudMid),
		alte: Math.round(h.cloudHigh),
		totale: Math.round(h.cloud)
	}));
	if (data.length === 0) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "surface rise-in rise-in-3 rounded-xl p-4 sm:p-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-baseline justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "font-display text-xl",
				children: "Strati nuvolosi"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "flex gap-3 text-[0.6875rem] text-muted-foreground",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-1.5 rounded-full bg-cloud-low" }), " Basse"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-1.5 rounded-full bg-cloud-mid" }), " Medie"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-1.5 rounded-full bg-cloud-high" }), " Alte"]
					})
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 h-44 w-full",
			children: mounted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
				width: "100%",
				height: "100%",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LineChart, {
					data,
					margin: {
						top: 8,
						right: 8,
						left: -18,
						bottom: 0
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
							stroke: "rgba(255,255,255,0.05)",
							vertical: false
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
							dataKey: "time",
							tick: {
								fill: "#6e6e76",
								fontSize: 11
							},
							tickLine: false,
							axisLine: false,
							interval: "preserveStartEnd"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
							domain: [0, 100],
							tick: {
								fill: "#6e6e76",
								fontSize: 11
							},
							tickLine: false,
							axisLine: false,
							tickFormatter: (v) => `${v}%`
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
							contentStyle: {
								background: "#121216",
								border: "1px solid rgba(255,255,255,0.08)",
								borderRadius: 8,
								fontSize: 12
							},
							labelStyle: { color: "#ececef" },
							formatter: (value, name) => [`${value}%`, String(name)]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
							type: "monotone",
							dataKey: "basse",
							name: "Basse",
							stroke: "#8b919c",
							strokeWidth: 2,
							dot: false
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
							type: "monotone",
							dataKey: "medie",
							name: "Medie",
							stroke: "#b3b8c2",
							strokeWidth: 2,
							dot: false
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
							type: "monotone",
							dataKey: "alte",
							name: "Alte",
							stroke: "#d8dbe2",
							strokeWidth: 2,
							dot: false
						})
					]
				})
			}) : null
		})]
	});
}
function formatTime(date) {
	if (!date) return "—";
	return format(date, "HH:mm", { locale: it });
}
function formatDay(date) {
	return format(date, "EEEE d MMMM", { locale: it });
}
function formatShortDay(date) {
	return format(date, "EEE d", { locale: it });
}
function formatDuration(minutes) {
	if (minutes <= 0) return "assente";
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	if (h === 0) return `${m} min`;
	if (m === 0) return `${h} h`;
	return `${h} h ${m} min`;
}
function formatWindow(start, end) {
	return `${formatTime(start)} – ${formatTime(end)}`;
}
function verdictLabel(verdict) {
	switch (verdict) {
		case "eccellente": return "Eccellente";
		case "buona": return "Buona";
		case "discreta": return "Discreta";
		case "scarsa": return "Scarsa";
		case "pessima": return "Pessima";
	}
}
function dewLabel(risk) {
	switch (risk) {
		case "basso": return "Basso";
		case "moderato": return "Moderato";
		case "alto": return "Alto";
	}
}
function elevationLabel(meters) {
	if (meters == null) return null;
	return `${Math.round(meters).toLocaleString("it-IT")} m`;
}
function scoreTone(score) {
	if (score >= 80) return "good";
	if (score >= 65) return "ok";
	if (score >= 45) return "warn";
	return "bad";
}
function percent(n) {
	return `${Math.round(n)}%`;
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[background-color,box-shadow,transform,color,opacity] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40 active:not-disabled:scale-[0.96] [&_svg]:size-4 [&_svg]:shrink-0", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground hover:bg-primary/90",
			ghost: "text-foreground hover:bg-muted",
			outline: "bg-transparent text-foreground shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]",
			subtle: "bg-muted text-foreground hover:bg-muted/80"
		},
		size: {
			default: "h-11 px-4",
			sm: "h-9 px-3 text-sm",
			icon: "size-11",
			"icon-sm": "size-9"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
function Button({ className, variant, size, asChild = false, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		...props
	});
}
function LocationSearch() {
	const location = useNoxStore((s) => s.location);
	const favorites = useNoxStore((s) => s.favorites);
	const setLocation = useNoxStore((s) => s.setLocation);
	const [open, setOpen] = (0, import_react.useState)(false);
	const [query, setQuery] = (0, import_react.useState)("");
	const [results, setResults] = (0, import_react.useState)([]);
	const [searching, setSearching] = (0, import_react.useState)(false);
	const [locating, setLocating] = (0, import_react.useState)(false);
	const [geoError, setGeoError] = (0, import_react.useState)(null);
	const inputRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
				e.preventDefault();
				setOpen(true);
			}
			if (e.key === "Escape") setOpen(false);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);
	(0, import_react.useEffect)(() => {
		if (!open) return;
		const t = window.setTimeout(() => inputRef.current?.focus(), 30);
		return () => window.clearTimeout(t);
	}, [open]);
	(0, import_react.useEffect)(() => {
		if (!open) return;
		const q = query.trim();
		if (q.length < 2) {
			setResults([]);
			setSearching(false);
			return;
		}
		setSearching(true);
		const handle = window.setTimeout(() => {
			searchPlaces(q).then(setResults).catch(() => setResults([])).finally(() => setSearching(false));
		}, 220);
		return () => window.clearTimeout(handle);
	}, [query, open]);
	const isMac = (0, import_react.useMemo)(() => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform), []);
	function choose(place) {
		setLocation(place);
		setOpen(false);
		setQuery("");
	}
	async function locate() {
		setGeoError(null);
		if (!navigator.geolocation) {
			setGeoError("Geolocalizzazione non disponibile");
			return;
		}
		setLocating(true);
		navigator.geolocation.getCurrentPosition(async (pos) => {
			try {
				const place = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
				setLocation(place);
				setOpen(false);
			} catch {
				setGeoError("Impossibile determinare la località");
			} finally {
				setLocating(false);
			}
		}, () => {
			setLocating(false);
			setGeoError("Posizione non concessa");
		}, {
			enableHighAccuracy: false,
			timeout: 8e3
		});
	}
	const shown = query.trim().length >= 2 ? results : [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick: () => setOpen(true),
		className: cn("flex h-11 min-w-0 flex-1 items-center gap-2 rounded-md bg-card px-3 text-left", "shadow-[var(--shadow-border)] transition-[box-shadow] duration-150", "hover:shadow-[var(--shadow-border-hover)]"),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "size-4 shrink-0 text-subtle" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "min-w-0 flex-1 truncate text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-medium text-foreground",
					children: location.name
				}), location.admin ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-muted-foreground",
					children: [" · ", location.admin]
				}) : null]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("kbd", {
				className: "hidden rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[0.6875rem] text-subtle sm:inline",
				children: isMac ? "⌘K" : "Ctrl K"
			})
		]
	}), open ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			"aria-label": "Chiudi ricerca",
			className: "absolute inset-0 bg-background/70",
			onClick: () => setOpen(false)
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(_e, {
			shouldFilter: false,
			className: "relative z-10 w-full max-w-lg overflow-hidden rounded-xl bg-card shadow-[var(--shadow-border)] rise-in",
			label: "Cerca località",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 border-b border-border px-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "size-4 text-subtle" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e.Input, {
					ref: inputRef,
					value: query,
					onValueChange: setQuery,
					placeholder: "Cerca una località…",
					className: "h-12 w-full bg-transparent text-sm outline-none placeholder:text-subtle"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(_e.List, {
				className: "max-h-80 overflow-y-auto p-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: locate,
						className: "flex h-11 w-full items-center gap-2 rounded-md px-2 text-sm hover:bg-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LocateFixed, { className: "size-4 text-subtle" }), locating ? "Rilevamento in corso…" : "Usa la posizione attuale"]
					}),
					geoError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "px-2 py-1 text-xs text-bad",
						children: geoError
					}) : null,
					favorites.length > 0 && query.trim().length < 2 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Group, {
						title: "Preferiti",
						children: favorites.map((place) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlaceItem, {
							place,
							onSelect: choose,
							favorite: true
						}, locKey(place)))
					}) : null,
					query.trim().length < 2 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Group, {
						title: "Siti per astrofotografia",
						children: SUGGESTED_SITES.map((place) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlaceItem, {
							place,
							onSelect: choose
						}, locKey(place)))
					}) : null,
					searching ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "px-2 py-3 text-sm text-muted-foreground",
						children: "Ricerca…"
					}) : null,
					query.trim().length >= 2 && !searching && shown.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "px-2 py-3 text-sm text-muted-foreground",
						children: "Nessuna località trovata"
					}) : null,
					shown.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Group, {
						title: "Risultati",
						children: shown.map((place) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlaceItem, {
							place,
							onSelect: choose
						}, locKey(place)))
					}) : null
				]
			})]
		})]
	}) : null] });
}
function Group({ title, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(_e.Group, {
		className: "mt-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "px-2 pb-1 text-xs font-medium uppercase tracking-wider text-subtle",
			children: title
		}), children]
	});
}
function PlaceItem({ place, onSelect, favorite = false }) {
	const elev = elevationLabel(place.elevation);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(_e.Item, {
		value: `${place.name} ${place.admin}`,
		onSelect: () => onSelect(place),
		className: "flex h-11 cursor-pointer items-center gap-2 rounded-md px-2 text-sm data-[selected=true]:bg-muted",
		children: [
			favorite ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "size-4 fill-current text-foreground" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "size-4 text-subtle" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "min-w-0 flex-1 truncate",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-medium",
					children: place.name
				}), place.admin ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-muted-foreground",
					children: [" · ", place.admin]
				}) : null]
			}),
			elev ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-mono text-xs text-subtle tabular",
				children: elev
			}) : null
		]
	});
}
function FavoriteButton() {
	const location = useNoxStore((s) => s.location);
	const favorites = useNoxStore((s) => s.favorites);
	const toggleFavorite = useNoxStore((s) => s.toggleFavorite);
	const saved = favorites.some((f) => locKey(f) === locKey(location));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
		variant: "outline",
		size: "icon",
		onClick: () => toggleFavorite(location),
		"aria-label": saved ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti",
		title: saved ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: cn("size-4", saved && "fill-current") })
	});
}
function InstallMacButton() {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [deferred, setDeferred] = (0, import_react.useState)(null);
	const [standalone, setStandalone] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const onPrompt = (event) => {
			event.preventDefault();
			setDeferred(event);
		};
		const onInstalled = () => setStandalone(true);
		window.addEventListener("beforeinstallprompt", onPrompt);
		window.addEventListener("appinstalled", onInstalled);
		if (window.matchMedia("(display-mode: standalone)").matches) setStandalone(true);
		return () => {
			window.removeEventListener("beforeinstallprompt", onPrompt);
			window.removeEventListener("appinstalled", onInstalled);
		};
	}, []);
	(0, import_react.useEffect)(() => {
		if (!open) return;
		const onKey = (e) => {
			if (e.key === "Escape") setOpen(false);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open]);
	async function downloadPackage() {
		setBusy(true);
		setError(null);
		try {
			const res = await fetch("/api/mac-app");
			if (!res.ok) throw new Error("download");
			const blob = await res.blob();
			const href = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = href;
			link.download = "Nox-Mac.zip";
			document.body.appendChild(link);
			link.click();
			link.remove();
			URL.revokeObjectURL(href);
		} catch {
			setError("Download non riuscito. Riprova tra poco.");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
		variant: "outline",
		size: "icon",
		onClick: () => setOpen(true),
		"aria-label": "Installa su Mac",
		title: "Installa su Mac",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" })
	}), open ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			"aria-label": "Chiudi",
			className: "absolute inset-0 bg-background/70",
			onClick: () => setOpen(false)
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative z-10 w-full max-w-lg rounded-xl bg-card p-5 shadow-[var(--shadow-border)] rise-in sm:p-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium uppercase tracking-wider text-subtle",
					children: "MacBook Apple Silicon"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-1 font-display text-2xl",
					children: "Installa Nox"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm leading-relaxed text-muted-foreground",
					children: "Pacchetto .app da trascinare in Applicazioni. Si apre in una finestra propria se hai Chrome, Brave o Edge."
				}),
				standalone ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-sm text-good",
					children: "Nox è già installato su questo dispositivo."
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					className: "mt-5 w-full",
					onClick: downloadPackage,
					disabled: busy,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" }), busy ? "Preparazione…" : "Scarica Nox-Mac.zip"]
				}),
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-xs text-bad",
					children: error
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
					className: "mt-5 space-y-2 text-sm text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "1. Scompatta lo zip e trascina Nox in Applicazioni." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "2. Al primo avvio: clic destro → Apri → Apri." })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 grid gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-medium uppercase tracking-wider text-subtle",
						children: "Senza scaricare"
					}), deferred ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => deferred.prompt(),
						className: cn("flex h-11 items-center gap-2 rounded-md px-3 text-left text-sm", "bg-muted hover:bg-muted/80"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MonitorSmartphone, { className: "size-4 text-subtle" }), "Installa dal browser"]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "flex items-start gap-2 text-sm text-muted-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share, { className: "mt-0.5 size-4 shrink-0 text-subtle" }), "Safari 17+: File → Aggiungi al Dock. Resta nel Dock come un’app nativa."]
					})]
				})
			]
		})]
	}) : null] });
}
function TooltipProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Provider, {
		delayDuration: 280,
		skipDelayDuration: 80,
		children
	});
}
function Tooltip$1({ children, content, side = "top" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Root3, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trigger, {
		asChild: true,
		children
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Portal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content2, {
		side,
		sideOffset: 8,
		className: cn("z-50 max-w-64 rounded-md bg-card px-3 py-2 text-xs leading-relaxed text-muted-foreground", "shadow-[var(--shadow-border)]"),
		children: content
	}) })] });
}
function MetricsGrid({ night }) {
	const hours = night.astroHours.length >= 2 ? night.astroHours : night.hours;
	const avg = (pick) => mean(hours.map(pick));
	const items = [
		{
			icon: Cloud,
			label: "Nubi",
			value: percent(avg((h) => h.cloud)),
			detail: `Basse ${Math.round(avg((h) => h.cloudLow))}% · medie ${Math.round(avg((h) => h.cloudMid))}% · alte ${Math.round(avg((h) => h.cloudHigh))}%`,
			score: avg((h) => h.scores.cloud),
			hint: "Le nubi basse sono le più penalizzanti per l’imaging. Cirri alti riducono il contrasto ma restano a volte utilizzabili."
		},
		{
			icon: Telescope,
			label: "Seeing",
			value: scoreWord(avg((h) => h.scores.seeing)),
			detail: `Vento ${Math.round(avg((h) => h.windSpeed))} km/h`,
			score: avg((h) => h.scores.seeing),
			hint: "Stima della turbolenza da vento in quota, shear e instabilità (CAPE). Cruciale per il planetario e l’alta risoluzione."
		},
		{
			icon: Eye,
			label: "Trasparenza",
			value: scoreWord(avg((h) => h.scores.transparency)),
			detail: `Umidità ${Math.round(avg((h) => h.humidity))}%`,
			score: avg((h) => h.scores.transparency),
			hint: "Umidità, visibilità e aerosol. Aria secca e pulita aumenta il contrasto del cielo profondo."
		},
		{
			icon: Moon,
			label: "Luna",
			value: percent(night.moonIllumination * 100),
			detail: night.moonAlwaysDown ? "Sotto l’orizzonte" : "Illuminazione",
			score: avg((h) => h.scores.moon),
			hint: "Illuminazione e altezza della Luna. Una Luna alta e piena lava il fondo cielo per nebulose e galassie."
		},
		{
			icon: Droplets,
			label: "Rugiada",
			value: dewLabel(night.dewRisk),
			detail: `${Math.round(night.minTemp)}°C min`,
			score: avg((h) => h.scores.dew),
			hint: "Quando la temperatura si avvicina al punto di rugiada ottiche e secondario si appannano. Utile una fascia anti-rugiada."
		},
		{
			icon: Wind,
			label: "Vento",
			value: `${Math.round(night.maxWind)} km/h`,
			detail: "Massimo nella notte",
			score: avg((h) => h.scores.wind),
			hint: "Sopra i 20 km/h molte montature soffrono; oltre i 35 km/h le pose lunghe diventano difficili."
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6",
		children: items.map((item, i) => {
			const Icon = item.icon;
			const tone = scoreTone(item.score);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip$1, {
				content: item.hint,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: cn("surface surface-hover rise-in rounded-lg p-3", i === 0 && "rise-in-1", i === 1 && "rise-in-2", i === 2 && "rise-in-3", i === 3 && "rise-in-4", i === 4 && "rise-in-5"),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 text-subtle",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[0.6875rem] font-medium uppercase tracking-wider",
								children: item.label
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: cn("mt-2 text-lg font-medium tabular", `score-${tone}`),
							children: item.value
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-0.5 truncate text-xs text-muted-foreground",
							children: item.detail
						})
					]
				})
			}, item.label);
		})
	});
}
function scoreWord(score) {
	if (score >= 85) return "Ottimo";
	if (score >= 70) return "Buono";
	if (score >= 55) return "Discreto";
	if (score >= 40) return "Scarso";
	return "Pessimo";
}
function MoonCard({ night }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "surface rise-in rise-in-3 flex h-full flex-col rounded-xl p-4 sm:p-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "font-display text-xl",
				children: "Luna"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 flex items-center gap-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MoonDisc, {
					fraction: night.moonIllumination,
					phase: night.moonPhase
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-2xl italic",
					children: moonPhaseName(night.moonPhase)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: ["Illuminazione ", percent(night.moonIllumination * 100)]
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "mt-6 grid grid-cols-2 gap-3 text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
					className: "text-xs text-subtle",
					children: "Sorge"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
					className: "mt-0.5 tabular",
					children: night.moonAlwaysUp ? "Sempre visibile" : night.moonAlwaysDown ? "Non sorge" : formatTime(night.moonRise)
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
					className: "text-xs text-subtle",
					children: "Tramonta"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
					className: "mt-0.5 tabular",
					children: night.moonAlwaysUp ? "Non tramonta" : night.moonAlwaysDown ? "Sempre sotto" : formatTime(night.moonSet)
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-auto pt-5 text-xs leading-relaxed text-muted-foreground",
				children: "In modalità cielo profondo una Luna luminosa e alta riduce l’indice. Per il planetario pesa molto meno."
			})
		]
	});
}
function MoonDisc({ fraction, phase }) {
	const waxing = phase < .5;
	const lit = Math.max(0, Math.min(1, fraction));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative size-20 shrink-0 overflow-hidden rounded-full bg-muted-foreground/35",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute inset-0 rounded-full bg-primary",
			style: { clipPath: waxing ? `inset(0 ${Math.max(0, (1 - lit) * 100)}% 0 0)` : `inset(0 0 0 ${Math.max(0, (1 - lit) * 100)}%)` }
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 rounded-full shadow-[inset_0_0_0_1px_rgb(255_255_255/0.2)]" })]
	});
}
function NightTimeline({ night }) {
	const hours = night.hours;
	const [selected, setSelected] = (0, import_react.useState)(null);
	const now = Date.now();
	if (hours.length === 0) return null;
	const active = selected ?? hours.find((h) => Math.abs(h.time.getTime() - now) < 27e5) ?? null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "surface rise-in rise-in-2 rounded-xl p-4 sm:p-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-baseline justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "font-display text-xl",
					children: "Timeline della notte"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-subtle",
					children: "Ora per ora, dal tramonto all’alba"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "timeline-scroll mt-4 flex flex-nowrap gap-1 overflow-x-auto pb-2",
				children: hours.map((hour) => {
					const tone = scoreTone(hour.scores.overall);
					const isNow = Math.abs(hour.time.getTime() - now) < 18e5;
					const isSelected = active?.iso === hour.iso;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setSelected(hour),
						className: cn("flex w-11 shrink-0 flex-col items-center gap-1 rounded-md px-1 py-2 transition-colors duration-150", isSelected ? "bg-muted" : "hover:bg-muted/60"),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[0.6875rem] tabular text-subtle",
								children: formatTime(hour.time)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: cn("flex size-9 items-center justify-center rounded-md text-xs font-medium tabular", tone === "good" && "bg-good/15 text-good", tone === "ok" && "bg-ok/15 text-ok", tone === "warn" && "bg-warn/15 text-warn", tone === "bad" && "bg-bad/15 text-bad", isNow && "ring-1 ring-foreground/40"),
								children: Math.round(hour.scores.overall)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "h-8 w-1.5 overflow-hidden rounded-full bg-muted",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block w-full rounded-full bg-cloud-mid",
									style: { height: `${Math.max(6, hour.cloud)}%` }
								})
							})
						]
					}, hour.iso);
				})
			}),
			active ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid grid-cols-2 gap-3 rounded-lg bg-muted p-3 text-sm sm:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cell, {
						label: "Ora",
						value: formatTime(active.time)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cell, {
						label: "Indice",
						value: `${Math.round(active.scores.overall)}`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cell, {
						label: "Nubi",
						value: percent(active.cloud)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cell, {
						label: "Temp.",
						value: `${Math.round(active.temperature)}°C`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cell, {
						label: "Umidità",
						value: percent(active.humidity)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cell, {
						label: "Vento",
						value: `${Math.round(active.windSpeed)} km/h`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cell, {
						label: "Pioggia",
						value: `${Math.round(active.precipProb)}%`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cell, {
						label: "Sole / Luna",
						value: `${Math.round(active.sunAlt)}° / ${Math.round(active.moonAlt)}°`
					})
				]
			}) : null
		]
	});
}
function Cell({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-[0.6875rem] uppercase tracking-wider text-subtle",
		children: label
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mt-0.5 tabular text-foreground",
		children: value
	})] });
}
function ScoreHero({ night, isTonight }) {
	const tone = scoreTone(night.score);
	const score = Math.round(night.score);
	const r = 54;
	const c = 2 * Math.PI * r;
	const offset = c - score / 100 * c;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "surface rise-in rounded-xl p-5 sm:p-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-medium uppercase tracking-wider text-subtle",
				children: isTonight ? "Stasera" : "Prossima notte"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-1 font-display text-2xl text-foreground sm:text-3xl",
				children: formatDay(night.eveningDate)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative size-36 shrink-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
						viewBox: "0 0 128 128",
						className: "size-full -rotate-90",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
							cx: "64",
							cy: "64",
							r,
							fill: "none",
							stroke: "currentColor",
							strokeWidth: "6",
							className: "text-muted"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
							cx: "64",
							cy: "64",
							r,
							fill: "none",
							stroke: "currentColor",
							strokeWidth: "6",
							strokeLinecap: "round",
							strokeDasharray: c,
							strokeDashoffset: offset,
							className: cn("transition-[stroke-dashoffset] duration-500 ease-[var(--ease-out-soft)]", tone === "good" && "text-good", tone === "ok" && "text-ok", tone === "warn" && "text-warn", tone === "bad" && "text-bad")
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "absolute inset-0 flex flex-col items-center justify-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-display text-5xl leading-none tabular text-foreground",
							children: score
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-1 text-[0.6875rem] uppercase tracking-wider text-subtle",
							children: "indice"
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1 text-center sm:text-left",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: cn("font-display text-3xl italic", tone === "good" && "text-good", tone === "ok" && "text-ok", tone === "warn" && "text-warn", tone === "bad" && "text-bad"),
						children: verdictLabel(night.verdict)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
						className: "mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "Finestra migliore",
								children: night.bestWindow ? formatWindow(night.bestWindow.start, night.bestWindow.end) : "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "Buio astronomico",
								children: night.astroDurationMin > 0 ? `${formatDuration(night.astroDurationMin)} · ${formatTime(night.astroStart)}–${formatTime(night.astroEnd)}` : "Assente"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Row, {
								label: "Tramonto / alba",
								children: [
									formatTime(night.sunset),
									" – ",
									formatTime(night.sunrise)
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Row, {
								label: "Nubi medie",
								children: [Math.round(night.cloudAvg), "%"]
							})
						]
					})]
				})]
			})
		]
	});
}
function Row({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-0.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: "text-xs text-subtle",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: "tabular text-foreground",
			children
		})]
	});
}
function Starfield() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "starfield",
		"aria-hidden": "true"
	});
}
function WeekStrip({ nights, activeId, onSelect }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
		className: "font-display text-xl",
		children: "Sette notti"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7",
		children: nights.map((night) => {
			const tone = scoreTone(night.score);
			const active = night.id === activeId;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => onSelect(night.id),
				className: cn("surface surface-hover rounded-lg p-3 text-left transition-colors duration-150", active && "bg-muted"),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs capitalize text-subtle",
						children: formatShortDay(night.eveningDate)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: cn("mt-2 font-display text-3xl tabular leading-none", `score-${tone}`),
						children: Math.round(night.score)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-muted-foreground",
						children: verdictLabel(night.verdict)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-[0.6875rem] text-subtle",
						children: ["Luna ", percent(night.moonIllumination * 100)]
					})
				]
			}, night.id);
		})
	})] });
}
function Skeleton({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: cn("animate-pulse rounded-md bg-muted", className) });
}
function NoxApp({ initialRaw }) {
	const location = useNoxStore((s) => s.location);
	const mode = useNoxStore((s) => s.mode);
	const setMode = useNoxStore((s) => s.setMode);
	const hydrate = useNoxStore((s) => s.hydrate);
	const [hydrated, setHydrated] = (0, import_react.useState)(false);
	const [selectedId, setSelectedId] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		hydrate();
		setHydrated(true);
	}, [hydrate]);
	const sameAsDefault = Math.abs(location.latitude - MILANO.latitude) < .02 && Math.abs(location.longitude - MILANO.longitude) < .02;
	const query = useQuery({
		queryKey: [
			"forecast",
			location.latitude,
			location.longitude
		],
		queryFn: () => fetchWeather(location),
		enabled: hydrated,
		initialData: sameAsDefault && initialRaw ? initialRaw : void 0
	});
	const forecast = (0, import_react.useMemo)(() => {
		if (!query.data) return null;
		return buildForecast(query.data, location, mode);
	}, [
		query.data,
		location,
		mode
	]);
	(0, import_react.useEffect)(() => {
		setSelectedId(null);
	}, [
		location.latitude,
		location.longitude,
		mode
	]);
	const night = (0, import_react.useMemo)(() => {
		if (!forecast) return null;
		return forecast.nights.find((n) => n.id === selectedId) ?? forecast.activeNight;
	}, [forecast, selectedId]);
	const isTonight = Boolean(forecast && night && night.id === forecast.activeNight.id);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative min-h-dvh overflow-x-hidden bg-background text-foreground",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Starfield, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "flex flex-col gap-4 sm:flex-row sm:items-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-display text-3xl tracking-tight",
								children: "Nox"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted-foreground",
								children: "Previsioni per astrofotografia"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex min-w-0 flex-1 items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LocationSearch, {}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FavoriteButton, {}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InstallMacButton, {})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModeSwitch, {
							mode,
							onChange: setMode
						})
					]
				}),
				!forecast && query.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoadingState, {}) : null,
				query.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "surface rounded-xl p-6 text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-2xl",
							children: "Previsioni non disponibili"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-muted-foreground",
							children: "Controlla la connessione e riprova."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							className: "mt-4",
							onClick: () => query.refetch(),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "size-4" }), "Riprova"]
						})
					]
				}) : null,
				forecast && night ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScoreHero, {
						night,
						isTonight
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricsGrid, { night }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NightTimeline, { night }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-3 lg:grid-cols-[1.4fr_1fr]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CloudChart, { night }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MoonCard, { night })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WeekStrip, {
						nights: forecast.nights,
						activeId: night.id,
						onSelect: setSelectedId
					})
				] }) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
					className: "pb-8 pt-2 text-xs leading-relaxed text-subtle",
					children: "Indice Nox: nubi (basse, medie, alte), seeing da 7Timer e vento, trasparenza, Luna, rugiada e precipitazioni. Cielo profondo pesa Luna e trasparenza; planetario pesa il seeing. Dati MET Norway e 7Timer. Non sostituisce l’osservazione dal campo."
				})
			]
		})]
	}) });
}
function ModeSwitch({ mode, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid h-11 grid-cols-2 rounded-md bg-card p-1 shadow-[var(--shadow-border)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: () => onChange("dso"),
			className: cn("rounded-sm px-3 text-sm transition-colors duration-150", mode === "dso" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"),
			children: "Cielo profondo"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: () => onChange("planetary"),
			className: cn("rounded-sm px-3 text-sm transition-colors duration-150", mode === "planetary" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"),
			children: "Planetario"
		})]
	});
}
function LoadingState() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-64 rounded-xl" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6",
				children: Array.from({ length: 6 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-24 rounded-lg" }, i))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-52 rounded-xl" })
		]
	});
}
function Home() {
	const initialRaw = Route$1.useLoaderData();
	const [client] = (0, import_react.useState)(() => new QueryClient({ defaultOptions: { queries: {
		staleTime: 9e5,
		retry: 1,
		refetchOnWindowFocus: false
	} } }));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryClientProvider, {
		client,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NoxApp, { initialRaw })
	});
}
//#endregion
export { Home as component };
