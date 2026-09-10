import { formatShortDay, percent, scoreTone, verdictLabel } from "@/lib/weather/format";
import type { NightForecast } from "@/lib/weather/types";
import { cn } from "@/lib/utils";

export function WeekStrip({
  nights,
  activeId,
  onSelect,
}: {
  nights: NightForecast[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <section>
      <h3 className="font-display text-xl">Sette notti</h3>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {nights.map((night) => {
          const tone = scoreTone(night.score);
          const active = night.id === activeId;
          return (
            <button
              key={night.id}
              type="button"
              onClick={() => onSelect(night.id)}
              className={cn(
                "surface surface-hover rounded-lg p-3 text-left transition-colors duration-150",
                active && "bg-muted",
              )}
            >
              <p className="text-xs capitalize text-subtle">{formatShortDay(night.eveningDate)}</p>
              <p className={cn("mt-2 font-display text-3xl tabular leading-none", `score-${tone}`)}>
                {Math.round(night.score)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{verdictLabel(night.verdict)}</p>
              <p className="mt-2 text-[0.6875rem] text-subtle">Luna {percent(night.moonIllumination * 100)}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
