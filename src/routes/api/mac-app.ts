import { createFileRoute } from "@tanstack/react-router";
import { buildMacAppZip, publicAppUrl } from "@/lib/mac-app/bundle";

export const Route = createFileRoute("/api/mac-app")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const url = publicAppUrl(request);
        const zip = buildMacAppZip(url);
        return new Response(Buffer.from(zip), {
          headers: {
            "content-type": "application/zip",
            "content-disposition": 'attachment; filename="Nox-Mac.zip"',
            "cache-control": "no-store",
          },
        });
      },
    },
  },
});
