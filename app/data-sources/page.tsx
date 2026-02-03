"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { loadCountyDataFreshness } from "@/lib/api";
import type { CountyDataFreshness, OverlayStatus, UpdateLane } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { Database, Search, ArrowUpDown } from "lucide-react";

function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad" | "info";
}) {
  const cls =
    tone === "good"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : tone === "warn"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
        : tone === "bad"
          ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
          : tone === "info"
            ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
            : "border-border/50 bg-muted/30 text-muted-foreground";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {children}
    </span>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  const safe = Math.max(0, Math.min(100, pct));
  return (
    <div className="w-full">
      <div className="bg-muted/30 h-2 w-full rounded-full">
        <div
          className={cn(
            "h-2 rounded-full transition-all",
            safe === 100 ? "bg-emerald-500/60" : safe >= 95 ? "bg-primary/60" : "bg-amber-500/60"
          )}
          style={{ width: `${safe}%` }}
        />
      </div>
      <div className="text-muted-foreground mt-1 text-xs">{safe.toFixed(0)}%</div>
    </div>
  );
}

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function overlayTone(status: OverlayStatus): "neutral" | "good" | "warn" | "bad" {
  switch (status) {
    case "current":
      return "good";
    case "stale":
      return "warn";
    case "none":
      return "neutral";
    case "error":
      return "bad";
  }
}

function laneLabel(lane: UpdateLane) {
  switch (lane) {
    case "A_live_sync":
      return "Lane A — Live Sync";
    case "B_scheduled_snapshot":
      return "Lane B — Scheduled Snapshot";
    case "C_zero_it_upload":
      return "Lane C — Zero-IT Upload";
  }
}

export default function DataSourcesPage() {
  const [rows, setRows] = useState<CountyDataFreshness[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<OverlayStatus | "all">("all");
  const [lane, setLane] = useState<UpdateLane | "all">("all");
  const [sort, setSort] = useState<"county" | "baseline" | "status" | "lastUpdate" | "lane">(
    "county"
  );
  const [dir, setDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await loadCountyDataFreshness();
      setRows(data);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    let r = rows.slice();

    if (q.trim()) {
      const s = q.trim().toLowerCase();
      r = r.filter(
        (x) => x.countyName.toLowerCase().includes(s) || x.countyId.toLowerCase().includes(s)
      );
    }
    if (status !== "all") r = r.filter((x) => x.overlayStatus === status);
    if (lane !== "all") r = r.filter((x) => x.updateLane === lane);

    const cmpStr = (a: string, b: string) => a.localeCompare(b);
    const cmpNum = (a: number, b: number) => a - b;
    const cmpDate = (a?: string | null, b?: string | null) =>
      (a ? new Date(a).getTime() : 0) - (b ? new Date(b).getTime() : 0);

    r.sort((a, b) => {
      let c = 0;
      if (sort === "county") c = cmpStr(a.countyName, b.countyName);
      if (sort === "baseline") c = cmpNum(a.baselineCoveragePct, b.baselineCoveragePct);
      if (sort === "status") c = cmpStr(a.overlayStatus, b.overlayStatus);
      if (sort === "lane") c = cmpStr(a.updateLane, b.updateLane);
      if (sort === "lastUpdate") c = cmpDate(a.lastOverlayUpdateAt, b.lastOverlayUpdateAt);
      return dir === "asc" ? c : -c;
    });

    return r;
  }, [rows, q, status, lane, sort, dir]);

  return (
    <AppShell user={{ name: "Demo User", role: "Assessor", county: "Benton County" }}>
      <div className="mx-auto max-w-7xl p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-3">
            <div className="bg-primary/20 border-primary/40 flex h-10 w-10 items-center justify-center rounded-lg border">
              <Database className="text-primary h-5 w-5" />
            </div>
            <div>
              <h1 className="text-foreground text-2xl font-semibold">Data Sources & Freshness</h1>
              <p className="text-muted-foreground text-sm">
                Statewide baseline coverage + per-county overlays. Everything is labeled so
                simulated and official data are never confused.
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="tf-glass mb-4 rounded-xl p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search county..."
                className="border-border/50 bg-input text-foreground focus:border-primary/50 focus:ring-primary/30 w-full rounded-lg border px-9 py-2 text-sm outline-none focus:ring-1"
              />
            </div>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as OverlayStatus | "all")}
              className="border-border/50 bg-input text-foreground focus:border-primary/50 rounded-lg border px-3 py-2 text-sm outline-none"
            >
              <option value="all">Overlay status: All</option>
              <option value="current">Current</option>
              <option value="stale">Stale</option>
              <option value="none">None</option>
              <option value="error">Error</option>
            </select>

            <select
              value={lane}
              onChange={(e) => setLane(e.target.value as UpdateLane | "all")}
              className="border-border/50 bg-input text-foreground focus:border-primary/50 rounded-lg border px-3 py-2 text-sm outline-none"
            >
              <option value="all">Update lane: All</option>
              <option value="A_live_sync">Lane A — Live Sync</option>
              <option value="B_scheduled_snapshot">Lane B — Scheduled Snapshot</option>
              <option value="C_zero_it_upload">Lane C — Zero-IT Upload</option>
            </select>

            <div className="flex items-center gap-2">
              <select
                value={sort}
                onChange={(e) =>
                  setSort(
                    e.target.value as "county" | "baseline" | "status" | "lane" | "lastUpdate"
                  )
                }
                className="border-border/50 bg-input text-foreground focus:border-primary/50 w-full rounded-lg border px-3 py-2 text-sm outline-none"
              >
                <option value="county">Sort: County</option>
                <option value="baseline">Sort: Baseline coverage</option>
                <option value="status">Sort: Overlay status</option>
                <option value="lane">Sort: Update lane</option>
                <option value="lastUpdate">Sort: Last update</option>
              </select>

              <button
                type="button"
                onClick={() => setDir((d) => (d === "asc" ? "desc" : "asc"))}
                className="border-border/50 bg-secondary/50 text-foreground hover:bg-secondary/70 rounded-lg border p-2 text-sm transition-colors"
              >
                <ArrowUpDown className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <Badge tone="info">Public Baseline</Badge>
            <Badge tone="neutral">County Overlay</Badge>
            <Badge tone="warn">Stale</Badge>
            <Badge tone="good">Current</Badge>
            <Badge tone="bad">Error</Badge>
            <span className="text-muted-foreground ml-auto">
              {loading ? "Loading..." : `${filtered.length} counties`}
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="tf-glass overflow-hidden rounded-xl">
          <div className="border-border/30 text-muted-foreground grid grid-cols-12 gap-3 border-b px-4 py-3 text-xs font-medium">
            <div className="col-span-3">County</div>
            <div className="col-span-2">Baseline coverage</div>
            <div className="col-span-2">Overlay status</div>
            <div className="col-span-3">Last overlay update</div>
            <div className="col-span-2">Update lane</div>
          </div>

          {loading ? (
            <div className="text-muted-foreground px-4 py-10 text-center text-sm">
              Loading county freshness...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-muted-foreground px-4 py-10 text-center text-sm">
              No counties match filters.
            </div>
          ) : (
            <div className="divide-border/20 divide-y">
              {filtered.map((x) => (
                <div
                  key={x.countyId}
                  className="hover:bg-muted/10 grid grid-cols-12 gap-3 px-4 py-4 transition-colors"
                >
                  <div className="col-span-3">
                    <div className="text-foreground text-sm font-medium">{x.countyName}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Badge tone="info">{x.baselineSourceLabel}</Badge>
                      {x.overlaySourceLabel ? (
                        <Badge tone="neutral">{x.overlaySourceLabel}</Badge>
                      ) : (
                        <Badge tone="neutral">No overlay</Badge>
                      )}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <ProgressBar pct={x.baselineCoveragePct} />
                  </div>

                  <div className="col-span-2 flex items-start pt-1">
                    <Badge tone={overlayTone(x.overlayStatus)}>
                      {x.overlayStatus.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="col-span-3">
                    <div className="text-foreground text-sm">
                      {formatDate(x.lastOverlayUpdateAt)}
                    </div>
                    <div className="text-muted-foreground mt-1 text-xs">
                      {x.overlayStatus === "stale" && x.stalenessNote
                        ? x.stalenessNote
                        : x.overlayStatus === "none"
                          ? "Using baseline only."
                          : x.overlayStatus === "current"
                            ? "Overlay supersedes baseline."
                            : x.overlayStatus === "error"
                              ? x.stalenessNote || "Overlay feed failing."
                              : ""}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <div className="text-foreground text-sm">{laneLabel(x.updateLane)}</div>
                    <div className="text-muted-foreground mt-1 text-xs">{x.updateLaneDetail}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer notes */}
        <div className="tf-glass text-muted-foreground mt-5 rounded-xl p-4 text-xs">
          <div className="text-foreground mb-2 font-medium">Provenance Rules</div>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Every dataset is labeled: Public Baseline / County Overlay / Synthetic / Simulated.
            </li>
            <li>Overlay never mutates baseline; it supersedes it per county and is versioned.</li>
            <li>Any simulated outputs must show a SIMULATED label in UI and exports.</li>
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
