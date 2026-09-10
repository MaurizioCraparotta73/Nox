import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { buildForecast, fetchWeather } from "@/lib/weather/api";
import { MILANO, useNoxStore } from "@/lib/weather/store";
import type { WeatherRaw } from "@/lib/weather/types";
import { CloudChart } from "@/components/cloud-chart";
import { FavoriteButton, LocationSearch } from "@/components/location-search";
import { InstallMacButton } from "@/components/install-mac";
import { MetricsGrid } from "@/components/metrics-grid";
import { MoonCard } from "@/components/moon-card";
import { NightTimeline } from "@/components/night-timeline";
import { ScoreHero } from "@/components/score-hero";
import { Starfield } from "@/components/starfield";
import { WeekStrip } from "@/components/week-strip";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function NoxApp({ initialRaw }: { initialRaw: WeatherRaw | null }) {
  const location = useNoxStore((s) => s.location);
  const mode = useNoxStore((s) => s.mode);
  const setMode = useNoxStore((s) => s.setMode);
  const hydrate = useNoxStore((s) => s.hydrate);
  const [hydrated, setHydrated] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
    setHydrated(true);
  }, [hydrate]);

  const sameAsDefault =
    Math.abs(location.latitude - MILANO.latitude) < 0.02 &&
    Math.abs(location.longitude - MILANO.longitude) < 0.02;

  const query = useQuery({
    queryKey: ["forecast", location.latitude, location.longitude],
    queryFn: () => fetchWeather(location),
    enabled: hydrated,
    initialData: sameAsDefault && initialRaw ? initialRaw : undefined,
  });

  const forecast = useMemo(() => {
    if (!query.data) return null;
    return buildForecast(query.data, location, mode);
  }, [query.data, location, mode]);

  useEffect(() => {
    setSelectedId(null);
  }, [location.latitude, location.longitude, mode]);

  const night = useMemo(() => {
    if (!forecast) return null;
    return forecast.nights.find((n) => n.id === selectedId) ?? forecast.activeNight;
  }, [forecast, selectedId]);

  const isTonight = Boolean(forecast && night && night.id === forecast.activeNight.id);

  return (
    <TooltipProvider>
      <div className="relative min-h-dvh overflow-x-hidden bg-background text-foreground">
        <Starfield />
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <p className="font-display text-3xl tracking-tight">Nox</p>
              <p className="text-sm text-muted-foreground">Previsioni per astrofotografia</p>
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <LocationSearch />
              <FavoriteButton />
              <InstallMacButton />
            </div>
            <ModeSwitch mode={mode} onChange={setMode} />
          </header>

          {!forecast && query.isLoading ? <LoadingState /> : null}

          {query.isError ? (
            <div className="surface rounded-xl p-6 text-center">
              <p className="font-display text-2xl">Previsioni non disponibili</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Controlla la connessione e riprova.
              </p>
              <Button className="mt-4" onClick={() => query.refetch()}>
                <RefreshCw className="size-4" />
                Riprova
              </Button>
            </div>
          ) : null}

          {forecast && night ? (
            <>
              <ScoreHero night={night} isTonight={isTonight} />
              <MetricsGrid night={night} />
              <NightTimeline night={night} />
              <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
                <CloudChart night={night} />
                <MoonCard night={night} />
              </div>
              <WeekStrip nights={forecast.nights} activeId={night.id} onSelect={setSelectedId} />
            </>
          ) : null}

          <footer className="pb-8 pt-2 text-xs leading-relaxed text-subtle">
            Indice Nox: nubi (basse, medie, alte), seeing da 7Timer e vento, trasparenza, Luna, rugiada e
            precipitazioni. Cielo profondo pesa Luna e trasparenza; planetario pesa il seeing. Dati MET Norway e
            7Timer. Non sostituisce l’osservazione dal campo.
          </footer>
        </div>
      </div>
    </TooltipProvider>
  );
}

function ModeSwitch({
  mode,
  onChange,
}: {
  mode: "dso" | "planetary";
  onChange: (mode: "dso" | "planetary") => void;
}) {
  return (
    <div className="grid h-11 grid-cols-2 rounded-md bg-card p-1 shadow-[var(--shadow-border)]">
      <button
        type="button"
        onClick={() => onChange("dso")}
        className={cn(
          "rounded-sm px-3 text-sm transition-colors duration-150",
          mode === "dso" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        Cielo profondo
      </button>
      <button
        type="button"
        onClick={() => onChange("planetary")}
        className={cn(
          "rounded-sm px-3 text-sm transition-colors duration-150",
          mode === "planetary" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        Planetario
      </button>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-64 rounded-xl" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-52 rounded-xl" />
    </div>
  );
}
