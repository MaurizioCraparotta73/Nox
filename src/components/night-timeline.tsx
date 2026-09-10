import { useState } from "react";
import { formatTime, percent, scoreTone } from "@/lib/weather/format";
import type { HourPoint, NightForecast } from "@/lib/weather/types";
import { cn } from "@/lib/utils";

export function NightTimeline({ night }: { night: NightForecast }) {
  const hours = night.hours;
  const [selected, setSelected] = useState<HourPoint | null>(null);
  const now = Date.now();

  if (hours.length === 0) return null;
  const active = selected ?? hours.find((h) => Math.abs(h.time.getTime() - now) < 45 * 60_000) ?? null;

  return (
    <section className="surface rise-in rise-in-2 rounded-xl p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-xl">Timeline della notte</h3>
        <p className="text-xs text-subtle">Ora per ora, dal tramonto all’alba</p>
      </div>

      <div className="timeline-scroll mt-4 flex flex-nowrap gap-1 overflow-x-auto pb-2">
        {hours.map((hour) => {
          const tone = scoreTone(hour.scores.overall);
          const isNow = Math.abs(hour.time.getTime() - now) < 30 * 60_000;
          const isSelected = active?.iso === hour.iso;
          return (
            <button
              key={hour.iso}
              type="button"
              onClick={() => setSelected(hour)}
              className={cn(
                "flex w-11 shrink-0 flex-col items-center gap-1 rounded-md px-1 py-2 transition-colors duration-150",
                isSelected ? "bg-muted" : "hover:bg-muted/60",
              )}
            >
              <span className="text-[0.6875rem] tabular text-subtle">{formatTime(hour.time)}</span>
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-md text-xs font-medium tabular",
                  tone === "good" && "bg-good/15 text-good",
                  tone === "ok" && "bg-ok/15 text-ok",
                  tone === "warn" && "bg-warn/15 text-warn",
                  tone === "bad" && "bg-bad/15 text-bad",
                  isNow && "ring-1 ring-foreground/40",
                )}
              >
                {Math.round(hour.scores.overall)}
              </span>
              <span className="h-8 w-1.5 overflow-hidden rounded-full bg-muted">
                <span
                  className="block w-full rounded-full bg-cloud-mid"
                  style={{ height: `${Math.max(6, hour.cloud)}%` }}
                />
              </span>
            </button>
          );
        })}
      </div>

      {active ? (
        <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-muted p-3 text-sm sm:grid-cols-4">
          <Cell label="Ora" value={formatTime(active.time)} />
          <Cell label="Indice" value={`${Math.round(active.scores.overall)}`} />
          <Cell label="Nubi" value={percent(active.cloud)} />
          <Cell label="Temp." value={`${Math.round(active.temperature)}°C`} />
          <Cell label="Umidità" value={percent(active.humidity)} />
          <Cell label="Vento" value={`${Math.round(active.windSpeed)} km/h`} />
          <Cell label="Pioggia" value={`${Math.round(active.precipProb)}%`} />
          <Cell
            label="Sole / Luna"
            value={`${Math.round(active.sunAlt)}° / ${Math.round(active.moonAlt)}°`}
          />
        </div>
      ) : null}
    </section>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[0.6875rem] uppercase tracking-wider text-subtle">{label}</p>
      <p className="mt-0.5 tabular text-foreground">{value}</p>
    </div>
  );
}
