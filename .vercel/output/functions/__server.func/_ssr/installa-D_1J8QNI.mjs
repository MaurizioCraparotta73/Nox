import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { _ as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { n as Starfield, r as cn, t as Button } from "./starfield-Bem8dg_3.mjs";
import { a as Share, g as ArrowLeft, l as MonitorSmartphone, m as Download } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/installa-D_1J8QNI.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
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
function InstallPage() {
	const [info, setInfo] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [deferred, setDeferred] = (0, import_react.useState)(null);
	const [standalone, setStandalone] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		fetch("/api/mac-app?info=1").then((r) => r.json()).then(setInfo).catch(() => setInfo(null));
	}, []);
	(0, import_react.useEffect)(() => {
		const onPrompt = (event) => {
			event.preventDefault();
			setDeferred(event);
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative min-h-dvh overflow-x-hidden bg-background text-foreground",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Starfield, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative z-10 mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 py-6 sm:px-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/",
				className: "inline-flex h-11 w-fit items-center gap-2 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-4" }), "Nox"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col py-10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: "/mac-icon.png",
						alt: "",
						width: 80,
						height: 80,
						className: "size-20 rounded-xl outline outline-1 -outline-offset-1 outline-foreground/10"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-6 text-xs font-medium uppercase tracking-wider text-subtle",
						children: "MacBook · macOS 13+"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-2 font-display text-4xl tracking-tight",
						children: "Nox per Mac"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm leading-relaxed text-muted-foreground",
						children: "Pacchetto .app da trascinare in Applicazioni. Si apre in una finestra propria se hai Chrome, Brave o Edge."
					}),
					standalone ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 text-sm text-good",
						children: "Nox è già sul Dock di questo dispositivo."
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						className: "mt-6 w-full",
						onClick: onDownload,
						disabled: busy,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" }), busy ? "Preparazione…" : "Scarica Nox-Mac.zip"]
					}),
					error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-bad",
						children: error
					}) : null,
					info && !info.publicHost ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm text-warn",
						children: "Questo file punta all’anteprima. Scaricalo di nuovo dopo la pubblicazione, così l’app sul Mac apre l’indirizzo definitivo."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 text-xs text-subtle",
						children: ["Si collega a ", hostLabel]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
						className: "mt-8 list-none space-y-4 p-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Step, {
								n: "1",
								title: "Trascina in Applicazioni",
								children: "Scompatta lo zip. Nella cartella Nox trovi l’app e l’alias Applicazioni: trascina Nox sopra l’alias."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Step, {
								n: "2",
								title: "Apri la prima volta",
								children: "Clic destro su Nox → Apri → Apri. macOS avvisa perché il pacchetto non è firmato con un Developer ID Apple."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Step, {
								n: "3",
								title: "Finestra propria",
								children: "Con un browser Chromium, Nox parte senza barre. Altrimenti si apre in Safari: da lì File → Aggiungi al Dock."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-10 border-t border-border pt-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-medium uppercase tracking-wider text-subtle",
							children: "Senza scaricare"
						}), deferred ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => deferred.prompt(),
							className: cn("mt-3 flex h-11 w-full items-center gap-2 rounded-md px-3 text-left text-sm", "bg-muted hover:bg-muted/80"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MonitorSmartphone, { className: "size-4 text-subtle" }), "Installa dal browser"]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-3 flex items-start gap-2 text-sm leading-relaxed text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share, { className: "mt-0.5 size-4 shrink-0 text-subtle" }), "Safari 17 o successivo: File → Aggiungi al Dock. Resta nel Dock come un’app nativa."]
						})]
					})
				]
			})]
		})]
	});
}
function Step({ n, title, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		className: "flex gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-sm bg-muted text-xs tabular text-muted-foreground",
			children: n
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm font-medium",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-sm leading-relaxed text-muted-foreground",
			children
		})] })]
	});
}
var SplitComponent = InstallPage;
//#endregion
export { SplitComponent as component };
