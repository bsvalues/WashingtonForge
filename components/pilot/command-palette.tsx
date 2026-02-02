"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Command, Zap, Sparkles, Search, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassCard, SignalBadge } from "@/components/material";
import {
  TOOL_REGISTRY,
  getRiskLabel,
  defaultRiskPolicy,
  type ToolDescriptor,
} from "@/lib/pilot/tools";
import { executeTool, getDemoPilotContext, generateCorrelationId } from "@/lib/pilot/executor";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPanel: () => void;
  onNeedsConfirmation: (tool: ToolDescriptor) => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onOpenPanel,
  onNeedsConfirmation,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mode, setMode] = useState<"pilot" | "muse">("pilot");
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredTools = TOOL_REGISTRY.filter((t) => {
    const modeMatch = t.mode === mode || t.mode === "both";
    const queryMatch =
      query === "" ||
      t.title.toLowerCase().includes(query.toLowerCase()) ||
      t.description.toLowerCase().includes(query.toLowerCase()) ||
      t.toolId.toLowerCase().includes(query.toLowerCase());
    return modeMatch && queryMatch;
  });

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, mode]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filteredTools.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Tab") {
        e.preventDefault();
        setMode((m) => (m === "pilot" ? "muse" : "pilot"));
      } else if (e.key === "Enter" && filteredTools[selectedIndex]) {
        e.preventDefault();
        handleSelectTool(filteredTools[selectedIndex]);
      }
    },
    [isOpen, filteredTools, selectedIndex, onClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleSelectTool = async (tool: ToolDescriptor) => {
    const policy = defaultRiskPolicy(tool.risk);

    if (policy.requiresConfirmation) {
      onClose();
      onNeedsConfirmation(tool);
      onOpenPanel();
      return;
    }

    // Execute directly (low-risk tools)
    const ctx = getDemoPilotContext(mode);
    ctx.correlationId = generateCorrelationId();
    await executeTool(tool.toolId, ctx, { confirmed: true });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div className="bg-background/80 absolute inset-0 backdrop-blur-sm" onClick={onClose} />

      {/* Palette */}
      <GlassCard
        strength="strong"
        className="relative mx-4 w-full max-w-lg overflow-hidden rounded-xl shadow-2xl"
      >
        {/* Header */}
        <div className="border-border/30 flex items-center gap-3 border-b p-4">
          <div className="text-muted-foreground flex items-center gap-1">
            <Command className="h-4 w-4" />
            <span className="text-xs">K</span>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="text-foreground placeholder:text-muted-foreground flex-1 border-none bg-transparent outline-none"
          />
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMode("pilot")}
              className={cn(
                "flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors",
                mode === "pilot"
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Zap className="h-3 w-3" />
              Pilot
            </button>
            <button
              onClick={() => setMode("muse")}
              className={cn(
                "flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors",
                mode === "muse"
                  ? "bg-accent/20 text-accent"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Sparkles className="h-3 w-3" />
              Muse
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {filteredTools.length === 0 ? (
            <div className="text-muted-foreground p-8 text-center">
              <Search className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p className="text-sm">No tools found</p>
            </div>
          ) : (
            <div className="p-2">
              {filteredTools.map((tool, index) => (
                <button
                  key={tool.toolId}
                  onClick={() => handleSelectTool(tool)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors",
                    index === selectedIndex
                      ? "bg-primary/10 border-primary/30 border"
                      : "hover:bg-muted/30"
                  )}
                >
                  <div className="bg-muted/30 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                    {tool.mode === "pilot" ? (
                      <Zap className="text-primary h-4 w-4" />
                    ) : (
                      <Sparkles className="text-accent h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground truncate text-sm font-medium">
                        {tool.title}
                      </span>
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
                    </div>
                    <p className="text-muted-foreground truncate text-xs">{tool.description}</p>
                  </div>
                  <ArrowRight className="text-muted-foreground h-4 w-4 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-border/30 text-muted-foreground flex items-center justify-between border-t p-3 text-[10px]">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="bg-muted/50 border-border/30 rounded border px-1 py-0.5">↑↓</kbd>{" "}
              Navigate
            </span>
            <span>
              <kbd className="bg-muted/50 border-border/30 rounded border px-1 py-0.5">Tab</kbd>{" "}
              Switch mode
            </span>
            <span>
              <kbd className="bg-muted/50 border-border/30 rounded border px-1 py-0.5">Enter</kbd>{" "}
              Execute
            </span>
          </div>
          <span>
            <kbd className="bg-muted/50 border-border/30 rounded border px-1 py-0.5">Esc</kbd> Close
          </span>
        </div>
      </GlassCard>
    </div>
  );
}
