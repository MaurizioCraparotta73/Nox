import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { NightForecast } from "@/lib/weather/types";

export function CloudChart({ night }: { night: NightForecast }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const data = night.hours.map((h) => ({
    time: format(h.time, "HH:mm"),
    basse: Math.round(h.cloudLow),
    medie: Math.round(h.cloudMid),
    alte: Math.round(h.cloudHigh),
    totale: Math.round(h.cloud),
  }));

  if (data.length === 0) return null;

  return (
    <section className="surface rise-in rise-in-3 rounded-xl p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-xl">Strati nuvolosi</h3>
        <ul className="flex gap-3 text-[0.6875rem] text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-cloud-low" /> Basse
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-cloud-mid" /> Medie
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-cloud-high" /> Alte
          </li>
        </ul>
      </div>
      <div className="mt-4 h-44 w-full">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fill: "#6e6e76", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "#6e6e76", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <RechartsTooltip
              contentStyle={{
                background: "#121216",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "#ececef" }}
              formatter={(value, name) => [`${value}%`, String(name)]}
            />
            <Line type="monotone" dataKey="basse" name="Basse" stroke="#8b919c" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="medie" name="Medie" stroke="#b3b8c2" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="alte" name="Alte" stroke="#d8dbe2" strokeWidth={2} dot={false} />
          </LineChart>
          </ResponsiveContainer>
        ) : null}
      </div>
    </section>
  );
}
