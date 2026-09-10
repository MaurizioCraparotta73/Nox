import { useEffect, useMemo, useRef, useState } from "react";
import { Command } from "cmdk";
import { LocateFixed, MapPin, Search, Star } from "lucide-react";
import { reverseGeocode, searchPlaces, SUGGESTED_SITES } from "@/lib/weather/api";
import { locKey, useNoxStore } from "@/lib/weather/store";
import { elevationLabel } from "@/lib/weather/format";
import type { GeoLocation } from "@/lib/weather/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LocationSearch() {
  const location = useNoxStore((s) => s.location);
  const favorites = useNoxStore((s) => s.favorites);
  const setLocation = useNoxStore((s) => s.setLocation);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoLocation[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const handle = window.setTimeout(() => {
      searchPlaces(q)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 220);
    return () => window.clearTimeout(handle);
  }, [query, open]);

  const isMac = useMemo(
    () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform),
    [],
  );

  function choose(place: GeoLocation) {
    setLocation(place);
    setOpen(false);
    setQuery("");
  }

  async function locate() {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError("Geolocalizzazione non disponibile");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const place = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          setLocation(place);
          setOpen(false);
        } catch {
          setGeoError("Impossibile determinare la località");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setGeoError("Posizione non concessa");
      },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }

  const shown = query.trim().length >= 2 ? results : [];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex h-11 min-w-0 flex-1 items-center gap-2 rounded-md bg-card px-3 text-left",
          "shadow-[var(--shadow-border)] transition-[box-shadow] duration-150",
          "hover:shadow-[var(--shadow-border-hover)]",
        )}
      >
        <Search className="size-4 shrink-0 text-subtle" />
        <span className="min-w-0 flex-1 truncate text-sm">
          <span className="font-medium text-foreground">{location.name}</span>
          {location.admin ? (
            <span className="text-muted-foreground"> · {location.admin}</span>
          ) : null}
        </span>
        <kbd className="hidden rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[0.6875rem] text-subtle sm:inline">
          {isMac ? "⌘K" : "Ctrl K"}
        </kbd>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]">
          <button
            type="button"
            aria-label="Chiudi ricerca"
            className="absolute inset-0 bg-background/70"
            onClick={() => setOpen(false)}
          />
          <Command
            shouldFilter={false}
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl bg-card shadow-[var(--shadow-border)] rise-in"
            label="Cerca località"
          >
            <div className="flex items-center gap-2 border-b border-border px-3">
              <Search className="size-4 text-subtle" />
              <Command.Input
                ref={inputRef}
                value={query}
                onValueChange={setQuery}
                placeholder="Cerca una località…"
                className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-subtle"
              />
            </div>
            <Command.List className="max-h-80 overflow-y-auto p-2">
              <button
                type="button"
                onClick={locate}
                className="flex h-11 w-full items-center gap-2 rounded-md px-2 text-sm hover:bg-muted"
              >
                <LocateFixed className="size-4 text-subtle" />
                {locating ? "Rilevamento in corso…" : "Usa la posizione attuale"}
              </button>
              {geoError ? <p className="px-2 py-1 text-xs text-bad">{geoError}</p> : null}

              {favorites.length > 0 && query.trim().length < 2 ? (
                <Group title="Preferiti">
                  {favorites.map((place) => (
                    <PlaceItem key={locKey(place)} place={place} onSelect={choose} favorite />
                  ))}
                </Group>
              ) : null}

              {query.trim().length < 2 ? (
                <Group title="Siti per astrofotografia">
                  {SUGGESTED_SITES.map((place) => (
                    <PlaceItem key={locKey(place)} place={place} onSelect={choose} />
                  ))}
                </Group>
              ) : null}

              {searching ? (
                <p className="px-2 py-3 text-sm text-muted-foreground">Ricerca…</p>
              ) : null}

              {query.trim().length >= 2 && !searching && shown.length === 0 ? (
                <p className="px-2 py-3 text-sm text-muted-foreground">Nessuna località trovata</p>
              ) : null}

              {shown.length > 0 ? (
                <Group title="Risultati">
                  {shown.map((place) => (
                    <PlaceItem key={locKey(place)} place={place} onSelect={choose} />
                  ))}
                </Group>
              ) : null}
            </Command.List>
          </Command>
        </div>
      ) : null}
    </>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Command.Group className="mt-2">
      <p className="px-2 pb-1 text-xs font-medium uppercase tracking-wider text-subtle">{title}</p>
      {children}
    </Command.Group>
  );
}

function PlaceItem({
  place,
  onSelect,
  favorite = false,
}: {
  place: GeoLocation;
  onSelect: (place: GeoLocation) => void;
  favorite?: boolean;
}) {
  const elev = elevationLabel(place.elevation);
  return (
    <Command.Item
      value={`${place.name} ${place.admin}`}
      onSelect={() => onSelect(place)}
      className="flex h-11 cursor-pointer items-center gap-2 rounded-md px-2 text-sm data-[selected=true]:bg-muted"
    >
      {favorite ? <Star className="size-4 fill-current text-foreground" /> : <MapPin className="size-4 text-subtle" />}
      <span className="min-w-0 flex-1 truncate">
        <span className="font-medium">{place.name}</span>
        {place.admin ? <span className="text-muted-foreground"> · {place.admin}</span> : null}
      </span>
      {elev ? <span className="font-mono text-xs text-subtle tabular">{elev}</span> : null}
    </Command.Item>
  );
}

export function FavoriteButton() {
  const location = useNoxStore((s) => s.location);
  const favorites = useNoxStore((s) => s.favorites);
  const toggleFavorite = useNoxStore((s) => s.toggleFavorite);
  const saved = favorites.some((f) => locKey(f) === locKey(location));
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => toggleFavorite(location)}
      aria-label={saved ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
      title={saved ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
    >
      <Star className={cn("size-4", saved && "fill-current")} />
    </Button>
  );
}
