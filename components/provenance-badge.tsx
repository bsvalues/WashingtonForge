"use client";

import { useEffect, useState } from "react";
import { Database, DatabaseZap, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Provenance {
  mode: "live" | "simulated";
  geo: boolean;
  app: boolean;
  redis: boolean;
  parcelCount: number;
  checkedAt: string;
}

interface ProvenanceBadgeProps {
  className?: string;
  /** Show the parcel count next to the label (live mode only). */
  showCount?: boolean;
}

/**
 * ProvenanceBadge — answers "is this REAL or SIMULATED data?" (F2/F4).
 *
 * Fetches /api/health and renders a compact, unambiguous badge:
 *  - LIVE DATA (green) when the parcel fabric is reachable in Postgres
 *  - SIMULATED (amber) when serving demo data
 *
 * The badge is the single source of truth for data provenance in the UI.
 */
export function ProvenanceBadge({ className, showCount = true }: ProvenanceBadgeProps) {
  const [state, setState] = useState<{
    status: "loading" | "ready" | "error";
    data: Provenance | null;
  }>({
    status: "loading",
    data: null,
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        if (!res.ok) throw new Error("health failed");
        const data = (await res.json()) as Provenance;
        if (!cancelled) setState({ status: "ready", data });
      } catch {
        if (!cancelled) setState({ status: "error", data: null });
      }
    }
    load();
    // Refresh periodically so a DB that comes online is reflected.
    const id = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (state.status === "loading") {
    return (
      <span
        className={cn(
          "text-muted-foreground inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium",
          className
        )}
      >
        <Loader2 className="h-3 w-3 animate-spin" />
        Checking data source…
      </span>
    );
  }

  const live = state.data?.mode === "live";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide",
        live
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
          : "border-amber-400/30 bg-amber-400/10 text-amber-300",
        className
      )}
      title={
        live
          ? `Live PostGIS data · ${state.data?.parcelCount.toLocaleString()} parcels`
          : "Simulated demo data — no database connected"
      }
    >
      {live ? <DatabaseZap className="h-3 w-3" /> : <Database className="h-3 w-3" />}
      {live ? "LIVE DATA" : "SIMULATED"}
      {live && showCount && state.data?.parcelCount ? (
        <span className="font-mono font-normal text-emerald-200/80">
          {state.data.parcelCount.toLocaleString()}
        </span>
      ) : null}
    </span>
  );
}
