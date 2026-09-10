import { createServerFn } from "@tanstack/react-start";

export const getForecast = createServerFn({ method: "POST" })
  .validator((input: { latitude: number; longitude: number }) => {
    if (!Number.isFinite(input.latitude) || !Number.isFinite(input.longitude)) {
      throw new Error("Coordinate non valide");
    }
    return {
      latitude: input.latitude,
      longitude: input.longitude,
    };
  })
  .handler(async ({ data }) => {
    const { loadWeather } = await import("./providers");
    return loadWeather(data.latitude, data.longitude);
  });
