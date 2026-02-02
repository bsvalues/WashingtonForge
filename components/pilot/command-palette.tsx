"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Command, Zap, Sparkles, Search, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TOOL_REGISTRY,
  getRiskBadgeColor,
  getRiskLabel,
  getSuiteLabel,
  defaultRiskPolicy,
  type ToolDescriptor,
} from "@/lib/pilot/tools";
import {
  executeTool,
  getDemoPilotContext,
  generateCorrelationId,
} from "@/lib/pilot/executor";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPanel: () => void;
  onNeedsConfirmation: (tool: ToolDescriptor) => void;
}

export function CommandPalette({ isOpen, onClose, onOpenPanel, onNeedsConfirmation }: CommandPaletteProps) {
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
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      {/* Palette */}
      <div className="relative w-full max-w-lg mx-4 glass-panel border border-border/30 rounded-xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border/30">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Command className="w-4 h-4" />
            <span className="text-xs">K</span>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
          />
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMode("pilot")}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors",
                mode === "pilot"
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Zap className="w-3 h-3" />
              Pilot
            </button>
            <button
              onClick={() => setMode("muse")}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors",
                mode === "muse"
                  ? "bg-accent/20 text-accent"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Sparkles className="w-3 h-3" />
              Muse
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {filteredTools.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No tools found</p>
            </div>
          ) : (
            <div className="p-2">
              {filteredTools.map((tool, index) => (
                <button
                  key={tool.toolId}
                  onClick={() => handleSelectTool(tool)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                    index === selectedIndex
                      ? "bg-primary/10 border border-primary/30"
                      : "hover:bg-muted/30"
                  )}
                >
                  <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center shrink-0">
                    {tool.mode === "pilot" ? (
                      <Zap className="w-4 h-4 text-primary" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-accent" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-foreground truncate">{tool.title}</span>
                      <span
                        className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded border font-medium shrink-0",
                          getRiskBadgeColor(tool.risk)
                        )}
                      >
                        {getRiskLabel(tool.risk)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{tool.description}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border/30 flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1 py-0.5 rounded bg-muted/50 border border-border/30">↑↓</kbd> Navigate</span>
            <span><kbd className="px-1 py-0.5 rounded bg-muted/50 border border-border/30">Tab</kbd> Switch mode</span>
            <span><kbd className="px-1 py-0.5 rounded bg-muted/50 border border-border/30">Enter</kbd> Execute</span>
          </div>
          <span><kbd className="px-1 py-0.5 rounded bg-muted/50 border border-border/30">Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  );
}
