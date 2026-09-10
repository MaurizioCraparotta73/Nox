import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { NoxApp } from "@/components/nox-app";
import { getForecast } from "@/lib/weather/get-forecast";
import { MILANO } from "@/lib/weather/store";

export const Route = createFileRoute("/")({
  loader: async () => {
    try {
      return await getForecast({
        data: { latitude: MILANO.latitude, longitude: MILANO.longitude },
      });
    } catch {
      return null;
    }
  },
  component: Home,
});

function Home() {
  const initialRaw = Route.useLoaderData();
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      <NoxApp initialRaw={initialRaw} />
    </QueryClientProvider>
  );
}
