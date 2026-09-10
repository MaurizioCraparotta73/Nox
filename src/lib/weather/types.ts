export type SessionMode = "dso" | "planetary";

export type GeoLocation = {
  name: string;
  admin: string;
  country: string;
  latitude: number;
  longitude: number;
  elevation?: number;
};

export type Verdict = "eccellente" | "buona" | "discreta" | "scarsa" | "pessima";

export type DewRisk = "basso" | "moderato" | "alto";

export type HourScores = {
  cloud: number;
  seeing: number;
  transparency: number;
  moon: number;
  dew: number;
  wind: number;
  overall: number;
};

export type HourPoint = {
  time: Date;
  iso: string;
  temperature: number;
  humidity: number;
  dewPoint: number;
  precipProb: number;
  precipitation: number;
  weatherCode: number;
  cloud: number;
  cloudLow: number;
  cloudMid: number;
  cloudHigh: number;
  visibilityKm: number;
  windSpeed: number;
  windGusts: number;
  windDir: number;
  wind80: number | null;
  wind120: number | null;
  cape: number | null;
  vpd: number | null;
  aod: number | null;
  isDay: boolean;
  sunAlt: number;
  moonAlt: number;
  moonIllumination: number;
  moonPhase: number;
  scores: HourScores;
};

export type BestWindow = {
  start: Date;
  end: Date;
  score: number;
};

export type NightForecast = {
  id: string;
  eveningDate: Date;
  sunset: Date | null;
  sunrise: Date | null;
  astroStart: Date | null;
  astroEnd: Date | null;
  astroDurationMin: number;
  hours: HourPoint[];
  astroHours: HourPoint[];
  score: number;
  verdict: Verdict;
  bestWindow: BestWindow | null;
  moonIllumination: number;
  moonPhase: number;
  moonRise: Date | null;
  moonSet: Date | null;
  moonAlwaysUp: boolean;
  moonAlwaysDown: boolean;
  minTemp: number;
  maxWind: number;
  dewRisk: DewRisk;
  cloudAvg: number;
  precipRisk: number;
};

export type WeatherRaw = {
  timezone: string;
  hourly: {
    time: string[];
    temperature_2m: Array<number | null>;
    relative_humidity_2m: Array<number | null>;
    dew_point_2m: Array<number | null>;
    precipitation_probability: Array<number | null>;
    precipitation: Array<number | null>;
    weather_code: Array<number | null>;
    cloud_cover: Array<number | null>;
    cloud_cover_low: Array<number | null>;
    cloud_cover_mid: Array<number | null>;
    cloud_cover_high: Array<number | null>;
    visibility: Array<number | null>;
    wind_speed_10m: Array<number | null>;
    wind_gusts_10m: Array<number | null>;
    wind_direction_10m: Array<number | null>;
    cape?: Array<number | null>;
    vapour_pressure_deficit?: Array<number | null>;
    wind_speed_80m?: Array<number | null>;
    wind_speed_120m?: Array<number | null>;
    is_day: Array<number | null>;
    seeing?: Array<number | null>;
    transparency?: Array<number | null>;
  };
  daily: {
    time: string[];
    sunrise: string[];
    sunset: string[];
    precipitation_sum: Array<number | null>;
    precipitation_probability_max: Array<number | null>;
    temperature_2m_min: Array<number | null>;
    temperature_2m_max: Array<number | null>;
    wind_speed_10m_max: Array<number | null>;
  };
  aodByTime: Record<string, number>;
};

export type ForecastBundle = {
  location: GeoLocation;
  timezone: string;
  fetchedAt: Date;
  nights: NightForecast[];
  current: HourPoint | null;
  activeNight: NightForecast;
};
