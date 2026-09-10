import { APP_ICON_ICNS } from "./icon-bytes";
import { buildZip, type ZipFile } from "./zip";

const VERSION = "1.0";

const text = (value: string) => new TextEncoder().encode(value.endsWith("\n") ? value : `${value}\n`);
const raw = (value: string) => new TextEncoder().encode(value);

function isLoopbackHost(host: string) {
  const h = host.replace(/^\[|\]$/g, "").split("%")[0]!.toLowerCase();
  return h === "localhost" || h === "127.0.0.1" || h === "0.0.0.0" || h === "::1" || h.endsWith(".local");
}

function hostnameOf(value: string) {
  return value.trim().replace(/^https?:\/\//, "").split("/")[0]!.split(",")[0]!.trim();
}

export type AppTarget = {
  url: string;
  publicHost: boolean;
  version: typeof VERSION;
  filename: "Nox-Mac.zip";
};

export function resolveAppTarget(request: Request): AppTarget {
  const published = hostnameOf(String(process.env.VITE_PUBLIC_HOSTNAME ?? ""));
  if (published && /^[a-z0-9.-]+(?::\d+)?$/i.test(published) && !isLoopbackHost(published.split(":")[0]!)) {
    return { url: `https://${published}`, publicHost: true, version: VERSION, filename: "Nox-Mac.zip" };
  }

  const forwarded = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwarded || request.headers.get("host") || new URL(request.url).host;
  const hostName = host.split(":")[0]!;
  const publicHost = !isLoopbackHost(hostName);
  const proto =
    request.headers.get("x-forwarded-proto") ||
    (publicHost ? "https" : new URL(request.url).protocol.replace(":", "")) ||
    "https";
  return {
    url: `${proto}://${host}`.replace(/\/$/, ""),
    publicHost,
    version: VERSION,
    filename: "Nox-Mac.zip",
  };
}

export function sanitizeAppUrl(url: string) {
  const parsed = new URL(url);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("unsupported url");
  }
  parsed.hash = "";
  parsed.username = "";
  parsed.password = "";
  const out = parsed.toString();
  return out.endsWith("/") && parsed.pathname === "/" ? out.slice(0, -1) : out;
}

function infoPlist() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key>
  <string>it</string>
  <key>CFBundleDisplayName</key>
  <string>Nox</string>
  <key>CFBundleExecutable</key>
  <string>Nox</string>
  <key>CFBundleGetInfoString</key>
  <string>Nox ${VERSION} — previsioni per astrofotografia</string>
  <key>CFBundleIconFile</key>
  <string>AppIcon</string>
  <key>CFBundleIconName</key>
  <string>AppIcon</string>
  <key>CFBundleIdentifier</key>
  <string>me.grok.nox</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>Nox</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>${VERSION}</string>
  <key>CFBundleVersion</key>
  <string>1</string>
  <key>LSApplicationCategoryType</key>
  <string>public.app-category.photography</string>
  <key>LSArchitecturePriority</key>
  <array>
    <string>arm64</string>
    <string>x86_64</string>
  </array>
  <key>LSMinimumSystemVersion</key>
  <string>13.0</string>
  <key>LSMultipleInstancesProhibited</key>
  <true/>
  <key>NSHighResolutionCapable</key>
  <true/>
  <key>NSRequiresAquaSystemAppearance</key>
  <false/>
</dict>
</plist>
`;
}

function launcher() {
  return `#!/bin/bash
set -u
DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$DIR/../Resources" && pwd)"
SUPPORT="$HOME/Library/Application Support/Nox"
SAVED="$SUPPORT/launch-url.txt"
URL="$(/usr/bin/sed -n '1p' "$ROOT/url.txt" | /usr/bin/tr -d '\\r')"

mkdir -p "$SUPPORT"

is_bad() {
  case "$1" in
    https://*[a-zA-Z0-9]*)
      case "$1" in
        *://127.0.0.1*|*://localhost*|*://0.0.0.0*|*://[::1]*) return 0 ;;
        *) return 1 ;;
      esac
      ;;
    *) return 0 ;;
  esac
}

if is_bad "$URL" && [ -f "$SAVED" ]; then
  URL="$(/usr/bin/sed -n '1p' "$SAVED" | /usr/bin/tr -d '\\r')"
fi

if is_bad "$URL"; then
  URL="$(/usr/bin/osascript -e 'try' -e 'text returned of (display dialog "Incolla l indirizzo pubblicato di Nox:" default answer "https://" with title "Nox" buttons {"Annulla","Apri"} default button "Apri")' -e 'on error' -e 'return ""' -e 'end try')"
  URL="$(printf '%s' "$URL" | /usr/bin/tr -d '\\r')"
fi

case "$URL" in
  https://*[a-zA-Z0-9]*)
    printf '%s\\n' "$URL" > "$SAVED"
    ;;
  *)
    /usr/bin/osascript -e 'display alert "Nox" message "Serve l indirizzo della versione pubblicata (https)." as critical'
    exit 1
    ;;
esac

find_browser() {
  local appname
  for appname in "Google Chrome" "Brave Browser" "Microsoft Edge" "Chromium" "Vivaldi" "Opera"; do
    if [ -d "/Applications/\${appname}.app" ]; then
      printf '%s\\n' "/Applications/\${appname}.app"
      return 0
    fi
    if [ -d "$HOME/Applications/\${appname}.app" ]; then
      printf '%s\\n' "$HOME/Applications/\${appname}.app"
      return 0
    fi
  done
  return 1
}

USER_DIR="$SUPPORT/browser"

if BROWSER="$(find_browser)"; then
  /usr/bin/open -na "$BROWSER" --args \\
    --user-data-dir="$USER_DIR" \\
    --app="$URL" \\
    --no-first-run \\
    --no-default-browser-check \\
    --disable-default-apps \\
    --window-size=1440,900
  exit 0
fi

/usr/bin/open "$URL"
`;
}

function instructionsHtml(url: string) {
  return `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Nox — installazione Mac</title>
  <style>
    :root { color-scheme: dark; }
    body {
      margin: 0; min-height: 100dvh; display: grid; place-items: center;
      font: 16px/1.5 ui-sans-serif, system-ui, -apple-system, sans-serif;
      background: #09090b; color: #ececef; padding: 32px 20px;
    }
    main { max-width: 36rem; }
    h1 { font-family: ui-serif, "Times New Roman", serif; font-size: 2rem; font-weight: 400; margin: 0 0 8px; }
    p { color: #9b9ba3; margin: 0 0 16px; }
    ol { margin: 0; padding-left: 1.2rem; color: #ececef; }
    li { margin: 0 0 10px; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.85em; color: #d4d8de; }
    .meta { margin-top: 28px; font-size: 13px; color: #6e6e76; }
  </style>
</head>
<body>
  <main>
    <h1>Installa Nox</h1>
    <p>Pacchetto per MacBook. Trascina l’app in Applicazioni e aprila dal Dock.</p>
    <ol>
      <li>Trascina <strong>Nox</strong> su <strong>Applicazioni</strong> (nella stessa cartella).</li>
      <li>Apri Applicazioni, clic destro su Nox → <strong>Apri</strong> → Apri. Solo la prima volta: macOS avvisa perché l’app non è firmata con un Developer ID Apple.</li>
      <li>Se Chrome, Brave o Edge sono installati, Nox si apre in una finestra propria, senza barre del browser.</li>
    </ol>
    <p class="meta">Se al primo avvio Nox chiede un indirizzo, incolla quello della versione pubblicata (https).</p>
  </main>
</body>
</html>
`;
}

function instructionsText(_url: string) {
  return `Nox ${VERSION} — previsioni per astrofotografia
Pacchetto per MacBook (Apple Silicon e Intel)

Installazione
1. Trascina Nox.app sull’alias Applicazioni.
2. Al primo avvio: clic destro su Nox → Apri → Apri.
   macOS avvisa perché l’app non è firmata con un Developer ID Apple.
3. Se compare una finestra, incolla l’indirizzo della versione pubblicata di Nox.
4. Con Chrome, Brave o Edge, Nox si apre in una finestra propria.

Senza questo file, da Safari 17 o successivo:
  File → Aggiungi al Dock
`;
}

export function buildMacAppZip(url: string) {
  const safe = sanitizeAppUrl(url);
  const root = "Nox";
  const app = `${root}/Nox.app/Contents`;
  const files: ZipFile[] = [
    { name: `${root}/Istruzioni.html`, data: text(instructionsHtml(safe)) },
    { name: `${root}/Istruzioni.txt`, data: text(instructionsText(safe)) },
    { name: `${root}/Applicazioni`, data: raw("/Applications"), symlink: true },
    { name: `${app}/Info.plist`, data: text(infoPlist()) },
    { name: `${app}/PkgInfo`, data: raw("APPL????") },
    { name: `${app}/MacOS/Nox`, data: text(launcher()), executable: true },
    { name: `${app}/Resources/AppIcon.icns`, data: new Uint8Array(APP_ICON_ICNS) },
    { name: `${app}/Resources/url.txt`, data: text(safe) },
  ];
  return buildZip(files);
}
