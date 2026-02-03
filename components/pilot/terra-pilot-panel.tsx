"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Zap, Sparkles, ChevronRight, Loader2, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DrawerShell, SignalBadge, TactileButton } from "@/components/material";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  TOOL_REGISTRY,
  getToolsByMode,
  getTool,
  defaultRiskPolicy,
  getRiskLabel,
  getSuiteLabel,
  DEFAULT_REASON_CODES,
  type ToolDescriptor,
  type PilotMode,
} from "@/lib/pilot/tools";
import {
  executeTool,
  getDemoPilotContext,
  generateCorrelationId,
  emitModeSwitch,
} from "@/lib/pilot/executor";

interface TerraPilotPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ConfirmationState {
  tool: ToolDescriptor;
  reasonCode: string;
  note: string;
  supervisorRef: string;
}

export function TerraPilotPanel({ isOpen, onClose }: TerraPilotPanelProps) {
  const [mode, setMode] = useState<"pilot" | "muse">("pilot");
  const [searchQuery, setSearchQuery] = useState("");
  const [executingTool, setExecutingTool] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{
    toolId: string;
    ok: boolean;
    summary: string;
  } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmationState | null>(null);

  const tools = getToolsByMode(mode);
  const filteredTools = tools.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.toolId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleModeSwitch = (newMode: "pilot" | "muse") => {
    setMode(newMode);
    emitModeSwitch("benton", "demo_user", generateCorrelationId(), newMode);
    setLastResult(null);
  };

  const handleToolClick = useCallback(
    async (tool: ToolDescriptor) => {
      const policy = defaultRiskPolicy(tool.risk);

      // If confirmation required, show dialog
      if (policy.requiresConfirmation) {
        setConfirmDialog({
          tool,
          reasonCode: "",
          note: "",
          supervisorRef: "",
        });
        return;
      }

      // Execute directly
      await executeToolDirect(tool);
    },
    [mode]
  );

  const executeToolDirect = async (
    tool: ToolDescriptor,
    opts?: { reasonCode?: string; note?: string; supervisorRef?: string }
  ) => {
    setExecutingTool(tool.toolId);
    setLastResult(null);

    const ctx = getDemoPilotContext(mode);
    ctx.correlationId = generateCorrelationId();

    const result = await executeTool(tool.toolId, ctx, {
      confirmed: true,
      reasonCode: opts?.reasonCode,
      note: opts?.note,
      supervisorApprovalRef: opts?.supervisorRef,
    });

    setExecutingTool(null);
    setLastResult({ toolId: tool.toolId, ok: result.ok, summary: result.summary });
  };

  const handleConfirmExecute = async () => {
    if (!confirmDialog) return;

    const { tool, reasonCode, note, supervisorRef } = confirmDialog;
    setConfirmDialog(null);
    await executeToolDirect(tool, { reasonCode, note, supervisorRef });
  };

  if (!isOpen) return null;

  return (
    <>
      <DrawerShell
        strength="strong"
        className="border-border/30 fixed top-0 right-0 z-50 flex h-full w-96 flex-col border-l"
      >
        {/* Header */}
        <div className="border-border/30 border-b p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-primary/20 flex h-8 w-8 items-center justify-center rounded-lg">
                <Zap className="text-primary h-4 w-4" />
              </div>
              <div>
                <h2 className="text-foreground text-sm font-semibold">TerraPilot</h2>
                <p className="text-muted-foreground text-xs">Copilot Assistant</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Mode Toggle */}
          <div className="bg-muted/30 border-border/30 flex rounded-lg border p-1">
            <button
              onClick={() => handleModeSwitch("pilot")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all",
                mode === "pilot"
                  ? "bg-primary/20 text-primary border-primary/30 border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Zap className="h-4 w-4" />
              Pilot
            </button>
            <button
              onClick={() => handleModeSwitch("muse")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all",
                mode === "muse"
                  ? "bg-accent/20 text-accent border-accent/30 border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Sparkles className="h-4 w-4" />
              Muse
            </button>
          </div>

          <p className="text-muted-foreground mt-2 text-center text-xs">
            {mode === "pilot" ? "Execute actions and workflows" : "Explain, summarize, and draft"}
          </p>
        </div>

        {/* Search */}
        <div className="border-border/30 border-b p-4">
          <Input
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-input/50 border-border/30"
          />
        </div>

        {/* Last Result */}
        {lastResult && (
          <div
            className={cn(
              "mx-4 mt-4 rounded-lg border p-3 text-sm",
              lastResult.ok
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-red-500/30 bg-red-500/10 text-red-400"
            )}
          >
            <div className="flex items-start gap-2">
              {lastResult.ok ? (
                <Check className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <span>{lastResult.summary}</span>
            </div>
          </div>
        )}

        {/* Tools List */}
        <ScrollArea className="flex-1">
          <div className="space-y-2 p-4">
            {filteredTools.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                No tools match your search.
              </p>
            ) : (
              filteredTools.map((tool) => (
                <button
                  key={tool.toolId}
                  onClick={() => handleToolClick(tool)}
                  disabled={executingTool !== null}
                  className={cn(
                    "w-full rounded-lg border p-3 text-left transition-all",
                    "bg-card/30 border-border/30 hover:bg-card/50 hover:border-border/50",
                    executingTool === tool.toolId && "opacity-70"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-foreground truncate text-sm font-medium">
                          {tool.title}
                        </span>
                        {executingTool === tool.toolId && (
                          <Loader2 className="text-primary h-3 w-3 animate-spin" />
                        )}
                      </div>
                      <p className="text-muted-foreground line-clamp-2 text-xs">
                        {tool.description}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <SignalBadge
                          state={
                            tool.risk === "read_only"
                              ? "official"
                              : tool.risk === "write_low"
                                ? "overlay"
                                : tool.risk === "write_high"
                                  ? "warning"
                                  : "blocked"
                          }
                        >
                          {getRiskLabel(tool.risk)}
                        </SignalBadge>
                        <span className="text-muted-foreground text-[10px]">
                          {getSuiteLabel(tool.suiteOwner)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="text-muted-foreground mt-1 h-4 w-4 shrink-0" />
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-border/30 border-t p-4">
          <p className="text-muted-foreground text-center text-[10px]">
            Press{" "}
            <kbd className="bg-muted/50 border-border/30 rounded border px-1 py-0.5 text-[10px]">
              ⌘K
            </kbd>{" "}
            for command palette
          </p>
        </div>
      </DrawerShell>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog !== null}
        onOpenChange={(open) => !open && setConfirmDialog(null)}
      >
        <DialogContent className="border-0 bg-transparent p-0 shadow-none">
          <DrawerShell strength="strong" className="p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                Confirm Action
              </DialogTitle>
              <DialogDescription>
                This action requires confirmation before execution.
              </DialogDescription>
            </DialogHeader>

            {confirmDialog && (
              <div className="space-y-4">
                <div className="bg-muted/30 border-border/30 rounded-lg border p-3">
                  <p className="text-sm font-medium">{confirmDialog.tool.title}</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {confirmDialog.tool.description}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <SignalBadge
                      state={
                        confirmDialog.tool.risk === "read_only"
                          ? "official"
                          : confirmDialog.tool.risk === "write_low"
                            ? "overlay"
                            : confirmDialog.tool.risk === "write_high"
                              ? "warning"
                              : "blocked"
                      }
                    >
                      {getRiskLabel(confirmDialog.tool.risk)}
                    </SignalBadge>
                    {confirmDialog.tool.writesTo.length > 0 && (
                      <span className="text-muted-foreground text-[10px]">
                        Writes to: {confirmDialog.tool.writesTo.join(", ")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Reason Code *</Label>
                    <Select
                      value={confirmDialog.reasonCode}
                      onValueChange={(v) => setConfirmDialog({ ...confirmDialog, reasonCode: v })}
                    >
                      <SelectTrigger className="bg-input/50 border-border/30 mt-1">
                        <SelectValue placeholder="Select reason..." />
                      </SelectTrigger>
                      <SelectContent>
                        {DEFAULT_REASON_CODES.map((rc) => (
                          <SelectItem key={rc.code} value={rc.code}>
                            {rc.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">Note (optional)</Label>
                    <Textarea
                      value={confirmDialog.note}
                      onChange={(e) => setConfirmDialog({ ...confirmDialog, note: e.target.value })}
                      placeholder="Add context..."
                      className="bg-input/50 border-border/30 mt-1 h-20"
                    />
                  </div>

                  {defaultRiskPolicy(confirmDialog.tool.risk).requiresSupervisor && (
                    <div>
                      <Label className="text-xs">Supervisor Approval Ref *</Label>
                      <Input
                        value={confirmDialog.supervisorRef}
                        onChange={(e) =>
                          setConfirmDialog({ ...confirmDialog, supervisorRef: e.target.value })
                        }
                        placeholder="e.g., SUP-2024-001"
                        className="bg-input/50 border-border/30 mt-1"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmDialog(null)}
                className="bg-transparent"
              >
                Cancel
              </Button>
              <TactileButton
                onClick={handleConfirmExecute}
                disabled={
                  !confirmDialog?.reasonCode ||
                  (defaultRiskPolicy(confirmDialog?.tool.risk || "read_only").requiresSupervisor &&
                    !confirmDialog?.supervisorRef)
                }
                className="bg-primary/20 hover:bg-primary/30 text-primary border-primary/30 border"
              >
                Confirm & Execute
              </TactileButton>
            </DialogFooter>
          </DrawerShell>
        </DialogContent>
      </Dialog>
    </>
  );
}
