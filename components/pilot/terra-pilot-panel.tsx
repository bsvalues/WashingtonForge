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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  TOOL_REGISTRY,
  getToolsByMode,
  getTool,
  defaultRiskPolicy,
  getRiskBadgeColor,
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
  const [lastResult, setLastResult] = useState<{ toolId: string; ok: boolean; summary: string } | null>(null);
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

  const handleToolClick = useCallback(async (tool: ToolDescriptor) => {
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
  }, [mode]);

  const executeToolDirect = async (tool: ToolDescriptor, opts?: { reasonCode?: string; note?: string; supervisorRef?: string }) => {
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
      <div className="fixed right-0 top-0 h-full w-96 z-50 glass-panel border-l border-border/30 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">TerraPilot</h2>
                <p className="text-xs text-muted-foreground">Copilot Assistant</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Mode Toggle */}
          <div className="flex rounded-lg p-1 bg-muted/30 border border-border/30">
            <button
              onClick={() => handleModeSwitch("pilot")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all",
                mode === "pilot"
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Zap className="w-4 h-4" />
              Pilot
            </button>
            <button
              onClick={() => handleModeSwitch("muse")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all",
                mode === "muse"
                  ? "bg-accent/20 text-accent border border-accent/30"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Sparkles className="w-4 h-4" />
              Muse
            </button>
          </div>

          <p className="text-xs text-muted-foreground mt-2 text-center">
            {mode === "pilot" ? "Execute actions and workflows" : "Explain, summarize, and draft"}
          </p>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border/30">
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
              "mx-4 mt-4 p-3 rounded-lg border text-sm",
              lastResult.ok
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-red-500/10 border-red-500/30 text-red-400"
            )}
          >
            <div className="flex items-start gap-2">
              {lastResult.ok ? (
                <Check className="w-4 h-4 mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              )}
              <span>{lastResult.summary}</span>
            </div>
          </div>
        )}

        {/* Tools List */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {filteredTools.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No tools match your search.</p>
            ) : (
              filteredTools.map((tool) => (
                <button
                  key={tool.toolId}
                  onClick={() => handleToolClick(tool)}
                  disabled={executingTool !== null}
                  className={cn(
                    "w-full p-3 rounded-lg border text-left transition-all",
                    "bg-card/30 border-border/30 hover:bg-card/50 hover:border-border/50",
                    executingTool === tool.toolId && "opacity-70"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-foreground truncate">{tool.title}</span>
                        {executingTool === tool.toolId && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{tool.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded border font-medium",
                            getRiskBadgeColor(tool.risk)
                          )}
                        >
                          {getRiskLabel(tool.risk)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{getSuiteLabel(tool.suiteOwner)}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-border/30">
          <p className="text-[10px] text-muted-foreground text-center">
            Press <kbd className="px-1 py-0.5 rounded bg-muted/50 border border-border/30 text-[10px]">⌘K</kbd> for command palette
          </p>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog !== null} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <DialogContent className="glass-panel border-border/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Confirm Action
            </DialogTitle>
            <DialogDescription>
              This action requires confirmation before execution.
            </DialogDescription>
          </DialogHeader>

          {confirmDialog && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                <p className="font-medium text-sm">{confirmDialog.tool.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{confirmDialog.tool.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-medium", getRiskBadgeColor(confirmDialog.tool.risk))}>
                    {getRiskLabel(confirmDialog.tool.risk)}
                  </span>
                  {confirmDialog.tool.writesTo.length > 0 && (
                    <span className="text-[10px] text-muted-foreground">
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
                      onChange={(e) => setConfirmDialog({ ...confirmDialog, supervisorRef: e.target.value })}
                      placeholder="e.g., SUP-2024-001"
                      className="bg-input/50 border-border/30 mt-1"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)} className="bg-transparent">
              Cancel
            </Button>
            <Button
              onClick={handleConfirmExecute}
              disabled={
                !confirmDialog?.reasonCode ||
                (defaultRiskPolicy(confirmDialog?.tool.risk || "read_only").requiresSupervisor && !confirmDialog?.supervisorRef)
              }
              className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30"
            >
              Confirm & Execute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
