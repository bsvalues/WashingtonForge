"use client";

import { useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shield,
  Clock,
  Copy,
  ExternalLink,
} from "lucide-react";
import { type TraceEvent, getTraceEvents } from "@/lib/pilot/executor";

interface TraceDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  correlationId: string | null;
}

export function TraceDetailPanel({
  isOpen,
  onClose,
  correlationId,
}: TraceDetailPanelProps) {
  // Get all events for this correlation chain
  const chainEvents = useMemo(() => {
    if (!correlationId) return [];
    return getTraceEvents()
      .filter((e) => e.correlationId === correlationId)
      .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
  }, [correlationId]);

  const getEventIcon = (type: TraceEvent["type"]) => {
    switch (type) {
      case "tool_invoked":
        return <Play className="w-4 h-4 text-primary" />;
      case "tool_succeeded":
        return <CheckCircle2 className="w-4 h-4 text-chart-1" />;
      case "tool_failed":
        return <XCircle className="w-4 h-4 text-destructive" />;
      case "permission_denied":
        return <Shield className="w-4 h-4 text-destructive" />;
      case "policy_blocked":
        return <AlertTriangle className="w-4 h-4 text-chart-3" />;
      case "mode_switched":
        return <Clock className="w-4 h-4 text-accent" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getEventLabel = (type: TraceEvent["type"]) => {
    switch (type) {
      case "tool_invoked":
        return "Invoked";
      case "tool_succeeded":
        return "Succeeded";
      case "tool_failed":
        return "Failed";
      case "permission_denied":
        return "Permission Denied";
      case "policy_blocked":
        return "Policy Blocked";
      case "mode_switched":
        return "Mode Switched";
      default:
        return type;
    }
  };

  const getOutcome = () => {
    if (chainEvents.length === 0) return null;
    const last = chainEvents[chainEvents.length - 1];
    if (last.type === "tool_succeeded") return "success";
    if (
      last.type === "tool_failed" ||
      last.type === "permission_denied" ||
      last.type === "policy_blocked"
    )
      return "failure";
    return "pending";
  };

  const outcome = getOutcome();

  const copyCorrelationId = () => {
    if (correlationId) {
      navigator.clipboard.writeText(correlationId);
    }
  };

  const formatTime = (ts: string) => {
    return new Date(ts).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
    });
  };

  const getDuration = () => {
    if (chainEvents.length < 2) return null;
    const start = new Date(chainEvents[0].ts).getTime();
    const end = new Date(chainEvents[chainEvents.length - 1].ts).getTime();
    return end - start;
  };

  const duration = getDuration();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-[400px] sm:w-[480px] glass-panel border-l border-border/30 overflow-y-auto"
      >
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <Clock className="w-5 h-5 text-primary" />
            Trace Replay
          </SheetTitle>
        </SheetHeader>

        {!correlationId || chainEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Clock className="w-12 h-12 mb-4 opacity-30" />
            <p className="text-sm">No trace selected</p>
            <p className="text-xs mt-1">
              Click a correlation ID in the Trace Feed
            </p>
          </div>
        ) : (
          <>
            {/* Header Summary */}
            <div className="p-4 rounded-lg bg-muted/30 border border-border/30 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground">
                  Correlation ID
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyCorrelationId}
                  className="h-6 px-2 text-xs"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </Button>
              </div>
              <code className="text-xs font-mono text-primary break-all">
                {correlationId}
              </code>

              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/20">
                <div>
                  <span className="text-[10px] text-muted-foreground block">
                    Events
                  </span>
                  <span className="text-lg font-semibold">
                    {chainEvents.length}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">
                    Duration
                  </span>
                  <span className="text-lg font-semibold">
                    {duration !== null ? `${duration}ms` : "-"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">
                    Outcome
                  </span>
                  <Badge
                    variant="outline"
                    className={`mt-1 ${
                      outcome === "success"
                        ? "border-chart-1/50 text-chart-1"
                        : outcome === "failure"
                          ? "border-destructive/50 text-destructive"
                          : "border-muted-foreground/50 text-muted-foreground"
                    }`}
                  >
                    {outcome === "success"
                      ? "Success"
                      : outcome === "failure"
                        ? "Blocked/Failed"
                        : "Pending"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Context Info */}
            {chainEvents[0] && (
              <div className="mb-6">
                <h4 className="text-xs font-medium text-muted-foreground mb-2">
                  Context
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-muted/20 border border-border/20">
                    <span className="text-muted-foreground">County:</span>{" "}
                    <span className="font-medium">
                      {chainEvents[0].countyId}
                    </span>
                  </div>
                  {chainEvents[0].actor?.userId && (
                    <div className="p-2 rounded bg-muted/20 border border-border/20">
                      <span className="text-muted-foreground">User:</span>{" "}
                      <span className="font-medium">
                        {chainEvents[0].actor.userId}
                      </span>
                    </div>
                  )}
                  {chainEvents[0].toolId && (
                    <div className="p-2 rounded bg-muted/20 border border-border/20">
                      <span className="text-muted-foreground">Tool:</span>{" "}
                      <span className="font-medium">
                        {chainEvents[0].toolId}
                      </span>
                    </div>
                  )}
                  {chainEvents[0].risk && (
                    <div className="p-2 rounded bg-muted/20 border border-border/20">
                      <span className="text-muted-foreground">Risk:</span>{" "}
                      <span className="font-medium">{chainEvents[0].risk}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <Separator className="my-4 bg-border/30" />

            {/* Event Timeline */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-3">
                Event Chain
              </h4>
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[11px] top-6 bottom-6 w-px bg-border/30" />

                <div className="space-y-4">
                  {chainEvents.map((event, index) => (
                    <div key={event.id} className="relative flex gap-3">
                      {/* Timeline dot */}
                      <div
                        className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center ${
                          event.type === "tool_succeeded"
                            ? "bg-chart-1/20 border border-chart-1/40"
                            : event.type === "tool_failed" ||
                                event.type === "permission_denied" ||
                                event.type === "policy_blocked"
                              ? "bg-destructive/20 border border-destructive/40"
                              : event.type === "tool_invoked"
                                ? "bg-primary/20 border border-primary/40"
                                : "bg-muted/40 border border-border/40"
                        }`}
                      >
                        {getEventIcon(event.type)}
                      </div>

                      {/* Event content */}
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              event.type === "tool_succeeded"
                                ? "border-chart-1/40 text-chart-1"
                                : event.type === "tool_failed" ||
                                    event.type === "permission_denied" ||
                                    event.type === "policy_blocked"
                                  ? "border-destructive/40 text-destructive"
                                  : event.type === "tool_invoked"
                                    ? "border-primary/40 text-primary"
                                    : "border-muted-foreground/40"
                            }`}
                          >
                            {getEventLabel(event.type)}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {formatTime(event.ts)}
                          </span>
                        </div>

                        {(event.inputSummary || event.outputSummary) && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {event.inputSummary || event.outputSummary}
                          </p>
                        )}

                        {event.reasonCode && (
                          <div className="mt-1 text-[10px]">
                            <span className="text-muted-foreground">
                              Reason:{" "}
                            </span>
                            <span className="text-foreground">
                              {event.reasonCode}
                            </span>
                          </div>
                        )}

                        {event.payloadRef && (
                          <div className="mt-1 text-[10px]">
                            <span className="text-muted-foreground">
                              Payload:{" "}
                            </span>
                            <code className="text-primary font-mono">
                              {event.payloadRef}
                            </code>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 pt-4 border-t border-border/30">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs bg-transparent"
                onClick={() => {
                  const data = JSON.stringify(chainEvents, null, 2);
                  const blob = new Blob([data], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `trace-${correlationId}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Export Trace Chain
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
