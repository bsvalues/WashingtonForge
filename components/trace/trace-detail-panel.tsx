"use client";

import { useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DrawerShell, SignalBadge, TactileButton } from "@/components/material";
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

export function TraceDetailPanel({ isOpen, onClose, correlationId }: TraceDetailPanelProps) {
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
        return <Play className="text-primary h-4 w-4" />;
      case "tool_succeeded":
        return <CheckCircle2 className="text-chart-1 h-4 w-4" />;
      case "tool_failed":
        return <XCircle className="text-destructive h-4 w-4" />;
      case "permission_denied":
        return <Shield className="text-destructive h-4 w-4" />;
      case "policy_blocked":
        return <AlertTriangle className="text-chart-3 h-4 w-4" />;
      case "mode_switched":
        return <Clock className="text-accent h-4 w-4" />;
      default:
        return <Clock className="text-muted-foreground h-4 w-4" />;
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

  const outcomeState =
    outcome === "success" ? "success" : outcome === "failure" ? "blocked" : "official";

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
        className="w-[400px] overflow-hidden border-l-0 bg-transparent p-0 sm:w-[480px]"
      >
        <DrawerShell
          strength="strong"
          className="border-border/30 h-full w-full overflow-y-auto border-l"
        >
          <SheetHeader className="pb-4">
            <SheetTitle className="text-foreground flex items-center gap-2">
              <Clock className="text-primary h-5 w-5" />
              Trace Replay
            </SheetTitle>
          </SheetHeader>

          {!correlationId || chainEvents.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center py-12">
              <Clock className="mb-4 h-12 w-12 opacity-30" />
              <p className="text-sm">No trace selected</p>
              <p className="mt-1 text-xs">Click a correlation ID in the Trace Feed</p>
            </div>
          ) : (
            <>
              {/* Header Summary */}
              <div className="bg-muted/30 border-border/30 mb-6 rounded-lg border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">Correlation ID</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyCorrelationId}
                    className="h-6 px-2 text-xs"
                  >
                    <Copy className="mr-1 h-3 w-3" />
                    Copy
                  </Button>
                </div>
                <code className="text-primary font-mono text-xs break-all">{correlationId}</code>

                <div className="border-border/20 mt-4 grid grid-cols-3 gap-4 border-t pt-4">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Events</span>
                    <span className="text-lg font-semibold">{chainEvents.length}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Duration</span>
                    <span className="text-lg font-semibold">
                      {duration !== null ? `${duration}ms` : "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Outcome</span>
                    <SignalBadge state={outcomeState} className="mt-1">
                      {outcome === "success"
                        ? "Success"
                        : outcome === "failure"
                          ? "Blocked/Failed"
                          : "Pending"}
                    </SignalBadge>
                  </div>
                </div>
              </div>

              {/* Context Info */}
              {chainEvents[0] && (
                <div className="mb-6">
                  <h4 className="text-muted-foreground mb-2 text-xs font-medium">Context</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-muted/20 border-border/20 rounded border p-2">
                      <span className="text-muted-foreground">County:</span>{" "}
                      <span className="font-medium">{chainEvents[0].countyId}</span>
                    </div>
                    {chainEvents[0].actor?.userId && (
                      <div className="bg-muted/20 border-border/20 rounded border p-2">
                        <span className="text-muted-foreground">User:</span>{" "}
                        <span className="font-medium">{chainEvents[0].actor.userId}</span>
                      </div>
                    )}
                    {chainEvents[0].toolId && (
                      <div className="bg-muted/20 border-border/20 rounded border p-2">
                        <span className="text-muted-foreground">Tool:</span>{" "}
                        <span className="font-medium">{chainEvents[0].toolId}</span>
                      </div>
                    )}
                    {chainEvents[0].risk && (
                      <div className="bg-muted/20 border-border/20 rounded border p-2">
                        <span className="text-muted-foreground">Risk:</span>{" "}
                        <span className="font-medium">{chainEvents[0].risk}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Separator className="bg-border/30 my-4" />

              {/* Event Timeline */}
              <div>
                <h4 className="text-muted-foreground mb-3 text-xs font-medium">Event Chain</h4>
                <div className="relative">
                  {/* Timeline line */}
                  <div className="bg-border/30 absolute top-6 bottom-6 left-[11px] w-px" />

                  <div className="space-y-4">
                    {chainEvents.map((event, index) => {
                      const state =
                        event.type === "tool_succeeded"
                          ? "success"
                          : event.type === "tool_failed" ||
                              event.type === "permission_denied" ||
                              event.type === "policy_blocked"
                            ? "blocked"
                            : event.type === "tool_invoked"
                              ? "overlay"
                              : event.type === "mode_switched"
                                ? "simulated"
                                : "official";

                      return (
                        <div key={event.id} className="relative flex gap-3">
                          {/* Timeline dot */}
                          <div
                            className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full ${
                              event.type === "tool_succeeded"
                                ? "bg-chart-1/20 border-chart-1/40 border"
                                : event.type === "tool_failed" ||
                                    event.type === "permission_denied" ||
                                    event.type === "policy_blocked"
                                  ? "bg-destructive/20 border-destructive/40 border"
                                  : event.type === "tool_invoked"
                                    ? "bg-primary/20 border-primary/40 border"
                                    : "bg-muted/40 border-border/40 border"
                            }`}
                          >
                            {getEventIcon(event.type)}
                          </div>

                          {/* Event content */}
                          <div className="flex-1 pb-4">
                            <div className="flex items-center justify-between">
                              <SignalBadge state={state} className="text-[10px]">
                                {getEventLabel(event.type)}
                              </SignalBadge>
                              <span className="text-muted-foreground font-mono text-[10px]">
                                {formatTime(event.ts)}
                              </span>
                            </div>

                            {(event.inputSummary || event.outputSummary) && (
                              <p className="text-muted-foreground mt-1 text-xs">
                                {event.inputSummary || event.outputSummary}
                              </p>
                            )}

                            {event.reasonCode && (
                              <div className="mt-1 text-[10px]">
                                <span className="text-muted-foreground">Reason: </span>
                                <span className="text-foreground">{event.reasonCode}</span>
                              </div>
                            )}

                            {event.payloadRef && (
                              <div className="mt-1 text-[10px]">
                                <span className="text-muted-foreground">Payload: </span>
                                <code className="text-primary font-mono">{event.payloadRef}</code>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="border-border/30 mt-6 border-t pt-4">
                <TactileButton
                  variant="outline"
                  size="sm"
                  className="w-full bg-transparent text-xs"
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
                  <ExternalLink className="mr-1 h-3 w-3" />
                  Export Trace Chain
                </TactileButton>
              </div>
            </>
          )}
        </DrawerShell>
      </SheetContent>
    </Sheet>
  );
}
