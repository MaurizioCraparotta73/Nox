import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Download, MonitorSmartphone, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Starfield } from "@/components/starfield";
import { cn } from "@/lib/utils";

type TargetInfo = {
  url: string;
  publicHost: boolean;
  version: string;
  filename: string;
};

type BeforeInstall = Event & { prompt: () => Promise<void> };

async function downloadZip() {
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
}

export function InstallPage() {
  const [info, setInfo] = useState<TargetInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deferred, setDeferred] = useState<BeforeInstall | null>(null);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    fetch("/api/mac-app?info=1")
      .then((r) => r.json())
      .then(setInfo)
      .catch(() => setInfo(null));
  }, []);

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

  async function onDownload() {
    setBusy(true);
    setError(null);
    try {
      await downloadZip();
    } catch {
      setError("Download non riuscito. Riprova tra poco.");
    } finally {
      setBusy(false);
    }
  }

  const hostLabel = info ? info.url.replace(/^https?:\/\//, "") : "…";

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-background text-foreground">
      <Starfield />
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 py-6 sm:px-6">
        <Link
          to="/"
          className="inline-flex h-11 w-fit items-center gap-2 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Nox
        </Link>

        <div className="flex flex-col py-10">
          <img
            src="/mac-icon.png"
            alt=""
            width={80}
            height={80}
            className="size-20 rounded-xl outline outline-1 -outline-offset-1 outline-foreground/10"
          />
          <p className="mt-6 text-xs font-medium uppercase tracking-wider text-subtle">MacBook · macOS 13+</p>
          <h1 className="mt-2 font-display text-4xl tracking-tight">Nox per Mac</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Pacchetto .app da trascinare in Applicazioni. Si apre in una finestra propria se hai Chrome, Brave o
            Edge.
          </p>

          {standalone ? <p className="mt-4 text-sm text-good">Nox è già sul Dock di questo dispositivo.</p> : null}

          <Button className="mt-6 w-full" onClick={onDownload} disabled={busy}>
            <Download className="size-4" />
            {busy ? "Preparazione…" : "Scarica Nox-Mac.zip"}
          </Button>
          {error ? <p className="mt-2 text-sm text-bad">{error}</p> : null}

          {info && !info.publicHost ? (
            <p className="mt-3 text-sm text-warn">
              Questo file punta all’anteprima. Scaricalo di nuovo dopo la pubblicazione, così l’app sul Mac apre
              l’indirizzo definitivo.
            </p>
          ) : (
            <p className="mt-3 text-xs text-subtle">Si collega a {hostLabel}</p>
          )}

          <ol className="mt-8 list-none space-y-4 p-0">
            <Step n="1" title="Trascina in Applicazioni">
              Scompatta lo zip. Nella cartella Nox trovi l’app e l’alias Applicazioni: trascina Nox sopra
              l’alias.
            </Step>
            <Step n="2" title="Apri la prima volta">
              Clic destro su Nox → Apri → Apri. macOS avvisa perché il pacchetto non è firmato con un Developer ID
              Apple.
            </Step>
            <Step n="3" title="Finestra propria">
              Con un browser Chromium, Nox parte senza barre. Altrimenti si apre in Safari: da lì File → Aggiungi
              al Dock.
            </Step>
          </ol>

          <div className="mt-10 border-t border-border pt-6">
            <p className="text-xs font-medium uppercase tracking-wider text-subtle">Senza scaricare</p>
            {deferred ? (
              <button
                type="button"
                onClick={() => deferred.prompt()}
                className={cn(
                  "mt-3 flex h-11 w-full items-center gap-2 rounded-md px-3 text-left text-sm",
                  "bg-muted hover:bg-muted/80",
                )}
              >
                <MonitorSmartphone className="size-4 text-subtle" />
                Installa dal browser
              </button>
            ) : (
              <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                <Share className="mt-0.5 size-4 shrink-0 text-subtle" />
                Safari 17 o successivo: File → Aggiungi al Dock. Resta nel Dock come un’app nativa.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-sm bg-muted text-xs tabular text-muted-foreground">
        {n}
      </span>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{children}</p>
      </div>
    </li>
  );
}
