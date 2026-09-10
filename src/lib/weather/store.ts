import { create } from "zustand";
import type { GeoLocation, SessionMode } from "./types";

export const MILANO: GeoLocation = {
  name: "Milano",
  admin: "Lombardia",
  country: "Italia",
  latitude: 45.4642,
  longitude: 9.19,
  elevation: 120,
};

const KEY = "nox-v1";

export function locKey(location: GeoLocation) {
  return `${location.latitude.toFixed(3)},${location.longitude.toFixed(3)}`;
}

type Persisted = {
  location: GeoLocation;
  favorites: GeoLocation[];
  mode: SessionMode;
};

function readStored(): Partial<Persisted> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<Persisted>;
  } catch {
    return {};
  }
}

function writeStored(state: Persisted) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(state));
}

type NoxState = Persisted & {
  setLocation: (location: GeoLocation) => void;
  setMode: (mode: SessionMode) => void;
  toggleFavorite: (location: GeoLocation) => void;
  hydrate: () => void;
};

export const useNoxStore = create<NoxState>((set, get) => ({
  location: MILANO,
  favorites: [],
  mode: "dso",
  setLocation: (location) => {
    set({ location });
    const s = get();
    writeStored({ location, favorites: s.favorites, mode: s.mode });
  },
  setMode: (mode) => {
    set({ mode });
    const s = get();
    writeStored({ location: s.location, favorites: s.favorites, mode });
  },
  toggleFavorite: (location) => {
    const key = locKey(location);
    const favorites = get().favorites.some((f) => locKey(f) === key)
      ? get().favorites.filter((f) => locKey(f) !== key)
      : [...get().favorites, location];
    set({ favorites });
    const s = get();
    writeStored({ location: s.location, favorites, mode: s.mode });
  },
  hydrate: () => {
    const parsed = readStored();
    set({
      location: parsed.location ?? MILANO,
      favorites: parsed.favorites ?? [],
      mode: parsed.mode === "planetary" ? "planetary" : "dso",
    });
  },
}));
