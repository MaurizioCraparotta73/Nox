import { buildZip, type ZipFile } from "./zip";

const text = (value: string) => new TextEncoder().encode(value.endsWith("\n") ? value : `${value}\n`);

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
  <key>CFBundleIdentifier</key>
  <string>me.grok.nox</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>Nox</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>1.0</string>
  <key>CFBundleVersion</key>
  <string>1</string>
  <key>LSMinimumSystemVersion</key>
  <string>13.0</string>
  <key>LSArchitecturePriority</key>
  <array>
    <string>arm64</string>
    <string>x86_64</string>
  </array>
  <key>NSHighResolutionCapable</key>
  <true/>
  <key>NSRequiresAquaSystemAppearance</key>
  <false/>
</dict>
</plist>
`;
}

function launcher(url: string) {
  const safe = url.replace(/[^a-zA-Z0-9:/._?&=+\-]/g, "");
  return `#!/bin/bash
set -euo pipefail
URL="${safe}"

open_chrome_app() {
  local app="$1"
  /usr/bin/open -na "$app" --args --app="$URL" --new-window
}

if [ -d "/Applications/Google Chrome.app" ]; then
  open_chrome_app "Google Chrome"
elif [ -d "/Applications/Brave Browser.app" ]; then
  open_chrome_app "Brave Browser"
elif [ -d "/Applications/Microsoft Edge.app" ]; then
  open_chrome_app "Microsoft Edge"
elif [ -d "/Applications/Chromium.app" ]; then
  open_chrome_app "Chromium"
else
  /usr/bin/open "$URL"
fi
`;
}

function instructions(url: string) {
  return `Nox — previsioni per astrofotografia
Pacchetto per MacBook Apple Silicon

App online
${url}

Installazione
1. Fai doppio clic su questo archivio per scompattarlo.
2. Trascina Nox.app nella cartella Applicazioni.
3. Al primo avvio: clic destro su Nox → Apri → Apri.
   macOS avvisa perché l’app non è firmata con un Developer ID Apple.

Se Chrome, Brave o Edge sono installati, Nox si apre in una finestra propria.

Senza questo file, da Safari 17 o successivo:
File → Aggiungi al Dock
`;
}

export function publicAppUrl(request: Request) {
  const published = String(process.env.VITE_PUBLIC_HOSTNAME ?? "")
    .trim()
    .replace(/^https?:\/\//, "")
    .split("/")[0];
  if (published && /^[a-z0-9.-]+$/i.test(published) && published.includes(".")) {
    return `https://${published}`;
  }
  const forwarded = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwarded || new URL(request.url).host;
  const proto = request.headers.get("x-forwarded-proto") || new URL(request.url).protocol.replace(":", "") || "https";
  return `${proto}://${host}`.replace(/\/$/, "");
}

export function buildMacAppZip(url: string) {
  const root = "Nox-Mac";
  const app = `${root}/Nox.app/Contents`;
  const files: ZipFile[] = [
    { name: `${root}/ISTRUZIONI.txt`, data: text(instructions(url)) },
    { name: `${app}/Info.plist`, data: text(infoPlist()) },
    { name: `${app}/PkgInfo`, data: new TextEncoder().encode("APPL????") },
    { name: `${app}/MacOS/Nox`, data: text(launcher(url)), executable: true },
  ];
  return buildZip(files);
}
