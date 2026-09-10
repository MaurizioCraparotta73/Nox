import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { DewRisk, Verdict } from "./types";

export function formatTime(date: Date | null) {
  if (!date) return "—";
  return format(date, "HH:mm", { locale: it });
}

export function formatDay(date: Date) {
  return format(date, "EEEE d MMMM", { locale: it });
}

export function formatShortDay(date: Date) {
  return format(date, "EEE d", { locale: it });
}

export function formatDuration(minutes: number) {
  if (minutes <= 0) return "assente";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

export function formatWindow(start: Date, end: Date) {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

export function verdictLabel(verdict: Verdict) {
  switch (verdict) {
    case "eccellente":
      return "Eccellente";
    case "buona":
      return "Buona";
    case "discreta":
      return "Discreta";
    case "scarsa":
      return "Scarsa";
    case "pessima":
      return "Pessima";
  }
}

export function dewLabel(risk: DewRisk) {
  switch (risk) {
    case "basso":
      return "Basso";
    case "moderato":
      return "Moderato";
    case "alto":
      return "Alto";
  }
}

export function windDirLabel(deg: number) {
  const dirs = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
  return dirs[Math.round(deg / 45) % 8]!;
}

export function elevationLabel(meters?: number) {
  if (meters == null) return null;
  return `${Math.round(meters).toLocaleString("it-IT")} m`;
}

export function scoreTone(score: number): "good" | "ok" | "warn" | "bad" {
  if (score >= 80) return "good";
  if (score >= 65) return "ok";
  if (score >= 45) return "warn";
  return "bad";
}

export function percent(n: number) {
  return `${Math.round(n)}%`;
}
