import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/get-forecast-CRDUnynr.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var getForecast_createServerFn_handler = createServerRpc({
	id: "6a0d1adc9e7c5e1fb847e6b66038c4b01e05130b71c399ba5ae3f8c9edd425bd",
	name: "getForecast",
	filename: "src/lib/weather/get-forecast.ts"
}, (opts) => getForecast.__executeServer(opts));
var getForecast = createServerFn({ method: "POST" }).validator((input) => {
	if (!Number.isFinite(input.latitude) || !Number.isFinite(input.longitude)) throw new Error("Coordinate non valide");
	return {
		latitude: input.latitude,
		longitude: input.longitude
	};
}).handler(getForecast_createServerFn_handler, async ({ data }) => {
	const { loadWeather } = await import("./providers-DQgNlWgt.mjs");
	return loadWeather(data.latitude, data.longitude);
});
//#endregion
export { getForecast_createServerFn_handler };
