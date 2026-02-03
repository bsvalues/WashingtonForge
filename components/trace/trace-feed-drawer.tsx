"use client";

import { useState, useEffect } from "react";
import {
  X,
  Search,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
  Shield,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { DrawerShell } from "@/components/material";
import { cn } from "@/lib/utils";
import {
  getTraceFeed,
  subscribeToTrace,
  type TraceEvent,
  type TraceEventType,
} from "@/lib/pilot/executor";
import { TraceDetailPanel } from "./trace-detail-panel";

interface TraceFeedDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TraceFeedDrawerInternalProps extends TraceFeedDrawerProps {
  onOpenDetail?: (correlationId: string) => void;
}

const EVENT_TYPE_CONFIG: Record<
  TraceEventType,
  { icon: typeof Zap; color: string; label: string }
> = {
  tool_invoked: {
    icon: Zap,
    color: "text-sky-400 bg-sky-500/10 border-sky-500/30",
    label: "Invoked",
  },
  tool_succeeded: {
    icon: CheckCircle,
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    label: "Succeeded",
  },
  tool_failed: {
    icon: XCircle,
    color: "text-red-400 bg-red-500/10 border-red-500/30",
    label: "Failed",
  },
  mode_switched: {
    icon: Zap,
    color: "text-violet-400 bg-violet-500/10 border-violet-500/30",
    label: "Mode Switch",
  },
  permission_denied: {
    icon: Shield,
    color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    label: "Denied",
  },
  policy_blocked: {
    icon: AlertTriangle,
    color: "text-red-400 bg-red-500/10 border-red-500/30",
    label: "Blocked",
  },
};

const ALL_EVENT_TYPES: TraceEventType[] = [
  "tool_invoked",
  "tool_succeeded",
  "tool_failed",
  "mode_switched",
  "permission_denied",
  "policy_blocked",
];

export function TraceFeedDrawer({ isOpen, onClose }: TraceFeedDrawerProps) {
  const [events, setEvents] = useState<TraceEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Set<TraceEventType>>(new Set(ALL_EVENT_TYPES));
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [detailCorrelationId, setDetailCorrelationId] = useState<string | null>(null);

  useEffect(() => {
    setEvents(getTraceFeed());
    const unsubscribe = subscribeToTrace(() => {
      setEvents(getTraceFeed());
    });
    return unsubscribe;
  }, []);

  const toggleFilter = (type: TraceEventType) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const clearFilters = () => {
    setActiveFilters(new Set(ALL_EVENT_TYPES));
    setSearchQuery("");
  };

  const copyCorrelationId = async (id: string) => {
    await navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredEvents = events.filter((e) => {
    const typeMatch = activeFilters.has(e.type);
    const queryMatch =
      searchQuery === "" ||
      e.toolId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.countyId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.correlationId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.inputSummary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.outputSummary?.toLowerCase().includes(searchQuery.toLowerCase());
    return typeMatch && queryMatch;
  });

  const formatTime = (ts: string) => {
    const date = new Date(ts);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const shortenId = (id: string) => id.slice(0, 12) + "...";

  if (!isOpen) return null;

  return (
    <DrawerShell
      strength="strong"
      className="border-border/30 fixed top-0 right-0 z-50 flex h-full w-[420px] flex-col border-l"
    >
      {/* Header */}
      <div className="border-border/30 border-b p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/20">
              <Shield className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <h2 className="text-foreground text-sm font-semibold">TerraTrace</h2>
              <p className="text-muted-foreground text-xs">Audit Feed</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-input/50 border-border/30 pl-9"
          />
        </div>

        {/* Filter Chips */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Filter className="text-muted-foreground h-3 w-3" />
          {ALL_EVENT_TYPES.map((type) => {
            const config = EVENT_TYPE_CONFIG[type];
            const isActive = activeFilters.has(type);
            return (
              <button
                key={type}
                onClick={() => toggleFilter(type)}
                className={cn(
                  "rounded-full border px-2 py-1 text-[10px] transition-all",
                  isActive
                    ? config.color
                    : "text-muted-foreground bg-muted/20 border-border/30 opacity-50"
                )}
              >
                {config.label}
              </button>
            );
          })}
          {(searchQuery || activeFilters.size < ALL_EVENT_TYPES.length) && (
            <button
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground ml-1 text-[10px] underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Events List */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-4">
          {filteredEvents.length === 0 ? (
            <div className="py-12 text-center">
              <Shield className="text-muted-foreground/30 mx-auto mb-3 h-10 w-10" />
              <p className="text-muted-foreground text-sm">No trace events yet.</p>
              <p className="text-muted-foreground/70 mt-1 text-xs">
                Execute a TerraPilot tool to see events.
              </p>
            </div>
          ) : (
            filteredEvents.map((event) => {
              const config = EVENT_TYPE_CONFIG[event.type];
              const Icon = config.icon;
              return (
                <div
                  key={event.id}
                  className={cn(
                    "rounded-lg border p-3 transition-all",
                    config.color.replace("text-", "").split(" ").slice(1).join(" ")
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
                        config.color.split(" ")[1]
                      )}
                    >
                      <Icon className={cn("h-3.5 w-3.5", config.color.split(" ")[0])} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn("text-xs font-medium", config.color.split(" ")[0])}>
                          {config.label}
                          {event.toolId && (
                            <span className="text-foreground ml-1">· {event.toolId}</span>
                          )}
                        </span>
                        <span className="text-muted-foreground shrink-0 text-[10px]">
                          {formatTime(event.ts)}
                        </span>
                      </div>

                      {(event.inputSummary || event.outputSummary) && (
                        <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                          {event.outputSummary || event.inputSummary}
                        </p>
                      )}

                      <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-3 text-[10px]">
                        <span>County: {event.countyId}</span>
                        {event.actor?.userId && <span>User: {event.actor.userId}</span>}
                        {event.risk && <span>Risk: {event.risk}</span>}
                        {event.reasonCode && <span>Reason: {event.reasonCode}</span>}
                        <button
                          onClick={() => setDetailCorrelationId(event.correlationId)}
                          className="hover:text-primary flex items-center gap-1 underline underline-offset-2 transition-colors"
                          title="View trace chain"
                        >
                          {shortenId(event.correlationId)}
                        </button>
                        <button
                          onClick={() => copyCorrelationId(event.correlationId)}
                          className="hover:text-foreground flex items-center gap-1 transition-colors"
                          title="Copy ID"
                        >
                          {copiedId === event.correlationId ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-border/30 border-t p-4">
        <div className="text-muted-foreground space-y-1 text-center text-[10px]">
          <p>Append-only trace (prototype). No PII. County-scoped.</p>
          <p className="text-muted-foreground/70">{filteredEvents.length} event(s) shown</p>
        </div>
      </div>

      {/* Trace Detail Panel */}
      <TraceDetailPanel
        isOpen={!!detailCorrelationId}
        onClose={() => setDetailCorrelationId(null)}
        correlationId={detailCorrelationId}
      />
    </DrawerShell>
  );
}
