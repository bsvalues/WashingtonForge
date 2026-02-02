"use client";

import { useState, useEffect } from "react";
import { X, Search, Copy, Check, AlertTriangle, CheckCircle, XCircle, Zap, Shield, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getTraceFeed, subscribeToTrace, type TraceEvent, type TraceEventType } from "@/lib/pilot/executor";
import { TraceDetailPanel } from "./trace-detail-panel";

interface TraceFeedDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TraceFeedDrawerInternalProps extends TraceFeedDrawerProps {
  onOpenDetail?: (correlationId: string) => void;
}

const EVENT_TYPE_CONFIG: Record<TraceEventType, { icon: typeof Zap; color: string; label: string }> = {
  tool_invoked: { icon: Zap, color: "text-sky-400 bg-sky-500/10 border-sky-500/30", label: "Invoked" },
  tool_succeeded: { icon: CheckCircle, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30", label: "Succeeded" },
  tool_failed: { icon: XCircle, color: "text-red-400 bg-red-500/10 border-red-500/30", label: "Failed" },
  mode_switched: { icon: Zap, color: "text-violet-400 bg-violet-500/10 border-violet-500/30", label: "Mode Switch" },
  permission_denied: { icon: Shield, color: "text-amber-400 bg-amber-500/10 border-amber-500/30", label: "Denied" },
  policy_blocked: { icon: AlertTriangle, color: "text-red-400 bg-red-500/10 border-red-500/30", label: "Blocked" },
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
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const shortenId = (id: string) => id.slice(0, 12) + "...";

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-[420px] z-50 glass-panel border-l border-border/30 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">TerraTrace</h2>
              <p className="text-xs text-muted-foreground">Audit Feed</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-input/50 border-border/30"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <Filter className="w-3 h-3 text-muted-foreground" />
          {ALL_EVENT_TYPES.map((type) => {
            const config = EVENT_TYPE_CONFIG[type];
            const isActive = activeFilters.has(type);
            return (
              <button
                key={type}
                onClick={() => toggleFilter(type)}
                className={cn(
                  "text-[10px] px-2 py-1 rounded-full border transition-all",
                  isActive ? config.color : "text-muted-foreground bg-muted/20 border-border/30 opacity-50"
                )}
              >
                {config.label}
              </button>
            );
          })}
          {(searchQuery || activeFilters.size < ALL_EVENT_TYPES.length) && (
            <button
              onClick={clearFilters}
              className="text-[10px] text-muted-foreground hover:text-foreground underline ml-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Events List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No trace events yet.</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Execute a TerraPilot tool to see events.</p>
            </div>
          ) : (
            filteredEvents.map((event) => {
              const config = EVENT_TYPE_CONFIG[event.type];
              const Icon = config.icon;
              return (
                <div
                  key={event.id}
                  className={cn(
                    "p-3 rounded-lg border transition-all",
                    config.color.replace("text-", "").split(" ").slice(1).join(" ")
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("w-6 h-6 rounded-md flex items-center justify-center shrink-0", config.color.split(" ")[1])}>
                      <Icon className={cn("w-3.5 h-3.5", config.color.split(" ")[0])} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn("text-xs font-medium", config.color.split(" ")[0])}>
                          {config.label}
                          {event.toolId && <span className="text-foreground ml-1">· {event.toolId}</span>}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0">{formatTime(event.ts)}</span>
                      </div>

                      {(event.inputSummary || event.outputSummary) && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {event.outputSummary || event.inputSummary}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground flex-wrap">
                        <span>County: {event.countyId}</span>
                        {event.actor?.userId && <span>User: {event.actor.userId}</span>}
                        {event.risk && <span>Risk: {event.risk}</span>}
                        {event.reasonCode && <span>Reason: {event.reasonCode}</span>}
                        <button
                          onClick={() => setDetailCorrelationId(event.correlationId)}
                          className="flex items-center gap-1 hover:text-primary transition-colors underline underline-offset-2"
                          title="View trace chain"
                        >
                          {shortenId(event.correlationId)}
                        </button>
                        <button
                          onClick={() => copyCorrelationId(event.correlationId)}
                          className="flex items-center gap-1 hover:text-foreground transition-colors"
                          title="Copy ID"
                        >
                          {copiedId === event.correlationId ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Copy className="w-3 h-3" />
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
      <div className="p-4 border-t border-border/30">
        <div className="text-[10px] text-muted-foreground text-center space-y-1">
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
    </div>
  );
}
