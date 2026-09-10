import { Cloud, Droplets, Eye, Moon, Telescope, Wind } from "lucide-react";
import { dewLabel, percent, scoreTone } from "@/lib/weather/format";
import type { NightForecast } from "@/lib/weather/types";
import { mean } from "@/lib/weather/score";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function MetricsGrid({ night }: { night: NightForecast }) {
  const hours = night.astroHours.length >= 2 ? night.astroHours : night.hours;
  const avg = (pick: (h: (typeof hours)[number]) => number) => mean(hours.map(pick));

  const items = [
    {
      icon: Cloud,
      label: "Nubi",
      value: percent(avg((h) => h.cloud)),
      detail: `Basse ${Math.round(avg((h) => h.cloudLow))}% · medie ${Math.round(avg((h) => h.cloudMid))}% · alte ${Math.round(avg((h) => h.cloudHigh))}%`,
      score: avg((h) => h.scores.cloud),
      hint: "Le nubi basse sono le più penalizzanti per l’imaging. Cirri alti riducono il contrasto ma restano a volte utilizzabili.",
    },
    {
      icon: Telescope,
      label: "Seeing",
      value: scoreWord(avg((h) => h.scores.seeing)),
      detail: `Vento ${Math.round(avg((h) => h.windSpeed))} km/h`,
      score: avg((h) => h.scores.seeing),
      hint: "Stima della turbolenza da vento in quota, shear e instabilità (CAPE). Cruciale per il planetario e l’alta risoluzione.",
    },
    {
      icon: Eye,
      label: "Trasparenza",
      value: scoreWord(avg((h) => h.scores.transparency)),
      detail: `Umidità ${Math.round(avg((h) => h.humidity))}%`,
      score: avg((h) => h.scores.transparency),
      hint: "Umidità, visibilità e aerosol. Aria secca e pulita aumenta il contrasto del cielo profondo.",
    },
    {
      icon: Moon,
      label: "Luna",
      value: percent(night.moonIllumination * 100),
      detail: night.moonAlwaysDown ? "Sotto l’orizzonte" : "Illuminazione",
      score: avg((h) => h.scores.moon),
      hint: "Illuminazione e altezza della Luna. Una Luna alta e piena lava il fondo cielo per nebulose e galassie.",
    },
    {
      icon: Droplets,
      label: "Rugiada",
      value: dewLabel(night.dewRisk),
      detail: `${Math.round(night.minTemp)}°C min`,
      score: avg((h) => h.scores.dew),
      hint: "Quando la temperatura si avvicina al punto di rugiada ottiche e secondario si appannano. Utile una fascia anti-rugiada.",
    },
    {
      icon: Wind,
      label: "Vento",
      value: `${Math.round(night.maxWind)} km/h`,
      detail: "Massimo nella notte",
      score: avg((h) => h.scores.wind),
      hint: "Sopra i 20 km/h molte montature soffrono; oltre i 35 km/h le pose lunghe diventano difficili.",
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {items.map((item, i) => {
        const Icon = item.icon;
        const tone = scoreTone(item.score);
        return (
          <Tooltip key={item.label} content={item.hint}>
            <article
              className={cn(
                "surface surface-hover rise-in rounded-lg p-3",
                i === 0 && "rise-in-1",
                i === 1 && "rise-in-2",
                i === 2 && "rise-in-3",
                i === 3 && "rise-in-4",
                i === 4 && "rise-in-5",
              )}
            >
              <div className="flex items-center gap-2 text-subtle">
                <Icon className="size-3.5" />
                <p className="text-[0.6875rem] font-medium uppercase tracking-wider">{item.label}</p>
              </div>
              <p className={cn("mt-2 text-lg font-medium tabular", `score-${tone}`)}>{item.value}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.detail}</p>
            </article>
          </Tooltip>
        );
      })}
    </section>
  );
}

function scoreWord(score: number) {
  if (score >= 85) return "Ottimo";
  if (score >= 70) return "Buono";
  if (score >= 55) return "Discreto";
  if (score >= 40) return "Scarso";
  return "Pessimo";
}
