import { useEffect, useState } from "react";
import { Download, MonitorSmartphone, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BeforeInstall = Event & { prompt: () => Promise<void> };

export function InstallMacButton() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deferred, setDeferred] = useState<BeforeInstall | null>(null);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstall);
    };
    const onInstalled = () => setStandalone(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if (window.matchMedia("(display-mode: standalone)").matches) setStandalone(true);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function downloadPackage() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/mac-app");
      if (!res.ok) throw new Error("download");
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = "Nox-Mac.zip";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(href);
    } catch {
      setError("Download non riuscito. Riprova tra poco.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label="Installa su Mac"
        title="Installa su Mac"
      >
        <Download className="size-4" />
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]">
          <button
            type="button"
            aria-label="Chiudi"
            className="absolute inset-0 bg-background/70"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-xl bg-card p-5 shadow-[var(--shadow-border)] rise-in sm:p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-subtle">MacBook Apple Silicon</p>
            <h2 className="mt-1 font-display text-2xl">Installa Nox</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Pacchetto .app da trascinare in Applicazioni. Si apre in una finestra propria se hai Chrome, Brave o Edge.
            </p>

            {standalone ? (
              <p className="mt-4 text-sm text-good">Nox è già installato su questo dispositivo.</p>
            ) : null}

            <Button className="mt-5 w-full" onClick={downloadPackage} disabled={busy}>
              <Download className="size-4" />
              {busy ? "Preparazione…" : "Scarica Nox-Mac.zip"}
            </Button>
            {error ? <p className="mt-2 text-xs text-bad">{error}</p> : null}

            <ol className="mt-5 space-y-2 text-sm text-muted-foreground">
              <li>1. Scompatta lo zip e trascina Nox in Applicazioni.</li>
              <li>2. Al primo avvio: clic destro → Apri → Apri.</li>
            </ol>

            <div className="mt-5 grid gap-2">
              <p className="text-xs font-medium uppercase tracking-wider text-subtle">Senza scaricare</p>
              {deferred ? (
                <button
                  type="button"
                  onClick={() => deferred.prompt()}
                  className={cn(
                    "flex h-11 items-center gap-2 rounded-md px-3 text-left text-sm",
                    "bg-muted hover:bg-muted/80",
                  )}
                >
                  <MonitorSmartphone className="size-4 text-subtle" />
                  Installa dal browser
                </button>
              ) : (
                <p className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Share className="mt-0.5 size-4 shrink-0 text-subtle" />
                  Safari 17+: File → Aggiungi al Dock. Resta nel Dock come un’app nativa.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
