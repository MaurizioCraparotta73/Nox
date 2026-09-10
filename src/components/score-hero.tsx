import { formatDay, formatDuration, formatTime, formatWindow, scoreTone, verdictLabel } from "@/lib/weather/format";
import type { NightForecast } from "@/lib/weather/types";
import { cn } from "@/lib/utils";

export function ScoreHero({ night, isTonight }: { night: NightForecast; isTonight: boolean }) {
  const tone = scoreTone(night.score);
  const score = Math.round(night.score);
  const r = 54;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;

  return (
    <section className="surface rise-in rounded-xl p-5 sm:p-6">
      <p className="text-xs font-medium uppercase tracking-wider text-subtle">
        {isTonight ? "Stasera" : "Prossima notte"}
      </p>
      <h2 className="mt-1 font-display text-2xl text-foreground sm:text-3xl">{formatDay(night.eveningDate)}</h2>

      <div className="mt-6 flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-8">
        <div className="relative size-36 shrink-0">
          <svg viewBox="0 0 128 128" className="size-full -rotate-90">
            <circle cx="64" cy="64" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-muted" />
            <circle
              cx="64"
              cy="64"
              r={r}
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={offset}
              className={cn(
                "transition-[stroke-dashoffset] duration-500 ease-[var(--ease-out-soft)]",
                tone === "good" && "text-good",
                tone === "ok" && "text-ok",
                tone === "warn" && "text-warn",
                tone === "bad" && "text-bad",
              )}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-5xl leading-none tabular text-foreground">{score}</span>
            <span className="mt-1 text-[0.6875rem] uppercase tracking-wider text-subtle">indice</span>
          </div>
        </div>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p
            className={cn(
              "font-display text-3xl italic",
              tone === "good" && "text-good",
              tone === "ok" && "text-ok",
              tone === "warn" && "text-warn",
              tone === "bad" && "text-bad",
            )}
          >
            {verdictLabel(night.verdict)}
          </p>
          <dl className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <Row label="Finestra migliore">
              {night.bestWindow ? formatWindow(night.bestWindow.start, night.bestWindow.end) : "—"}
            </Row>
            <Row label="Buio astronomico">
              {night.astroDurationMin > 0
                ? `${formatDuration(night.astroDurationMin)} · ${formatTime(night.astroStart)}–${formatTime(night.astroEnd)}`
                : "Assente"}
            </Row>
            <Row label="Tramonto / alba">
              {formatTime(night.sunset)} – {formatTime(night.sunrise)}
            </Row>
            <Row label="Nubi medie">{Math.round(night.cloudAvg)}%</Row>
          </dl>
        </div>
      </div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-subtle">{label}</dt>
      <dd className="tabular text-foreground">{children}</dd>
    </div>
  );
}
