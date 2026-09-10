import { createFileRoute } from "@tanstack/react-router";
import { buildMacAppZip, resolveAppTarget } from "@/lib/mac-app/bundle";

export const Route = createFileRoute("/api/mac-app")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const target = resolveAppTarget(request);
        if (new URL(request.url).searchParams.has("info")) {
          return Response.json(target);
        }
        const zip = buildMacAppZip(target.url);
        return new Response(Buffer.from(zip), {
          headers: {
            "content-type": "application/zip",
            "content-disposition": 'attachment; filename="Nox-Mac.zip"',
            "content-length": String(zip.byteLength),
            "cache-control": "no-store",
          },
        });
      },
    },
  },
});
