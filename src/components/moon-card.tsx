import { moonPhaseName } from "@/lib/weather/astro";
import { formatTime, percent } from "@/lib/weather/format";
import type { NightForecast } from "@/lib/weather/types";

export function MoonCard({ night }: { night: NightForecast }) {
  return (
    <section className="surface rise-in rise-in-3 flex h-full flex-col rounded-xl p-4 sm:p-5">
      <h3 className="font-display text-xl">Luna</h3>
      <div className="mt-5 flex items-center gap-5">
        <MoonDisc fraction={night.moonIllumination} phase={night.moonPhase} />
        <div>
          <p className="font-display text-2xl italic">{moonPhaseName(night.moonPhase)}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Illuminazione {percent(night.moonIllumination * 100)}
          </p>
        </div>
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs text-subtle">Sorge</dt>
          <dd className="mt-0.5 tabular">
            {night.moonAlwaysUp ? "Sempre visibile" : night.moonAlwaysDown ? "Non sorge" : formatTime(night.moonRise)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-subtle">Tramonta</dt>
          <dd className="mt-0.5 tabular">
            {night.moonAlwaysUp ? "Non tramonta" : night.moonAlwaysDown ? "Sempre sotto" : formatTime(night.moonSet)}
          </dd>
        </div>
      </dl>
      <p className="mt-auto pt-5 text-xs leading-relaxed text-muted-foreground">
        In modalità cielo profondo una Luna luminosa e alta riduce l’indice. Per il planetario pesa molto meno.
      </p>
    </section>
  );
}

function MoonDisc({ fraction, phase }: { fraction: number; phase: number }) {
  const waxing = phase < 0.5;
  const lit = Math.max(0, Math.min(1, fraction));

  return (
    <div
      className="relative size-20 shrink-0 overflow-hidden rounded-full bg-muted-foreground/35"
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 rounded-full bg-primary"
        style={{
          clipPath: waxing
            ? `inset(0 ${Math.max(0, (1 - lit) * 100)}% 0 0)`
            : `inset(0 0 0 ${Math.max(0, (1 - lit) * 100)}%)`,
        }}
      />
      <div className="absolute inset-0 rounded-full shadow-[inset_0_0_0_1px_rgb(255_255_255/0.2)]" />
    </div>
  );
}
