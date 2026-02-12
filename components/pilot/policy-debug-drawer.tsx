"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  Key,
  ListChecks,
  AlertTriangle,
  Check,
  X,
} from "lucide-react";
import {
  TOOL_REGISTRY,
  ALL_CLAIMS,
  type ToolDescriptor,
} from "@/lib/pilot/tools";

interface PolicyDebugDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  // Live state that the panel modifies
  userClaims: string[];
  setUserClaims: (claims: string[]) => void;
  enabledTools: string[];
  setEnabledTools: (tools: string[]) => void;
  mode: "pilot" | "muse";
  // Policy overrides
  requireConfirmWriteHigh: boolean;
  setRequireConfirmWriteHigh: (v: boolean) => void;
  requireSupervisorIrreversible: boolean;
  setRequireSupervisorIrreversible: (v: boolean) => void;
}

export function PolicyDebugDrawer({
  isOpen,
  onClose,
  userClaims,
  setUserClaims,
  enabledTools,
  setEnabledTools,
  mode,
  requireConfirmWriteHigh,
  setRequireConfirmWriteHigh,
  requireSupervisorIrreversible,
  setRequireSupervisorIrreversible,
}: PolicyDebugDrawerProps) {
  const [selectedTool, setSelectedTool] = useState<ToolDescriptor | null>(null);

  const toggleClaim = (claim: string) => {
    if (userClaims.includes(claim)) {
      setUserClaims(userClaims.filter((c) => c !== claim));
    } else {
      setUserClaims([...userClaims, claim]);
    }
  };

  const toggleToolEnabled = (toolId: string) => {
    if (enabledTools.includes(toolId)) {
      setEnabledTools(enabledTools.filter((t) => t !== toolId));
    } else {
      setEnabledTools([...enabledTools, toolId]);
    }
  };

  // Check if a tool would be blocked and why
  const getToolBlockReasons = (tool: ToolDescriptor): string[] => {
    const reasons: string[] = [];

    // Mode check
    if (tool.mode !== "both" && tool.mode !== mode) {
      reasons.push(`Mode: ${tool.mode}-only tool (current mode: ${mode})`);
    }

    // Allowlist check
    if (!enabledTools.includes(tool.toolId)) {
      reasons.push("Allowlist: Tool not enabled for this county");
    }

    // RBAC check
    const missingClaims = tool.requiredClaims.filter(
      (c) => !userClaims.includes(c)
    );
    if (missingClaims.length > 0) {
      reasons.push(`RBAC: Missing claims [${missingClaims.join(", ")}]`);
    }

    // Risk policy
    if (tool.risk === "write-high" && requireConfirmWriteHigh) {
      reasons.push("Policy: Requires confirmation + reason code");
    }
    if (tool.risk === "irreversible" && requireSupervisorIrreversible) {
      reasons.push("Policy: Requires supervisor approval");
    }

    return reasons;
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-[440px] sm:w-[540px] glass-panel border-l border-border/30 overflow-y-auto"
      >
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <Shield className="w-5 h-5 text-primary" />
            Pilot Policy Debug
          </SheetTitle>
          <p className="text-xs text-muted-foreground">
            Toggle claims, allowlist, and policy to test gating behavior
          </p>
        </SheetHeader>

        {/* Current Mode */}
        <div className="mb-6 p-3 rounded-lg bg-muted/30 border border-border/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Current Mode</span>
            <Badge
              variant="outline"
              className={
                mode === "pilot"
                  ? "border-primary/50 text-primary"
                  : "border-accent/50 text-accent"
              }
            >
              {mode === "pilot" ? "Pilot (Execute)" : "Muse (Explain)"}
            </Badge>
          </div>
        </div>

        {/* RBAC Claims */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Key className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">User Claims (RBAC)</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {ALL_CLAIMS.map((claim) => (
              <div
                key={claim}
                className="flex items-center gap-2 p-2 rounded bg-muted/20 border border-border/20"
              >
                <Switch
                  id={`claim-${claim}`}
                  checked={userClaims.includes(claim)}
                  onCheckedChange={() => toggleClaim(claim)}
                  className="scale-75"
                />
                <Label
                  htmlFor={`claim-${claim}`}
                  className="text-xs cursor-pointer"
                >
                  {claim}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator className="my-4 bg-border/30" />

        {/* County Policy Overrides */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">County Risk Policy</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 rounded bg-muted/20 border border-border/20">
              <Label
                htmlFor="confirm-write-high"
                className="text-xs cursor-pointer"
              >
                write_high requires confirmation + reason
              </Label>
              <Switch
                id="confirm-write-high"
                checked={requireConfirmWriteHigh}
                onCheckedChange={setRequireConfirmWriteHigh}
                className="scale-75"
              />
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-muted/20 border border-border/20">
              <Label
                htmlFor="supervisor-irreversible"
                className="text-xs cursor-pointer"
              >
                irreversible requires supervisor approval
              </Label>
              <Switch
                id="supervisor-irreversible"
                checked={requireSupervisorIrreversible}
                onCheckedChange={setRequireSupervisorIrreversible}
                className="scale-75"
              />
            </div>
          </div>
        </div>

        <Separator className="my-4 bg-border/30" />

        {/* Tool Allowlist + Status */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ListChecks className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Tool Allowlist & Status</span>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
            {TOOL_REGISTRY.map((tool) => {
              const blockReasons = getToolBlockReasons(tool);
              const isBlocked = blockReasons.length > 0;
              const isEnabled = enabledTools.includes(tool.toolId);

              return (
                <div
                  key={tool.toolId}
                  className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                    selectedTool?.toolId === tool.toolId
                      ? "border-primary/50 bg-primary/10"
                      : "border-border/20 bg-muted/20 hover:bg-muted/30"
                  }`}
                  onClick={() =>
                    setSelectedTool(
                      selectedTool?.toolId === tool.toolId ? null : tool
                    )
                  }
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={() => toggleToolEnabled(tool.toolId)}
                        onClick={(e) => e.stopPropagation()}
                        className="scale-75"
                      />
                      <span className="text-sm font-medium">{tool.title}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          tool.mode === "pilot"
                            ? "border-primary/40 text-primary"
                            : "border-accent/40 text-accent"
                        }`}
                      >
                        {tool.suiteOwner}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          tool.risk === "read"
                            ? "border-emerald-500/40 text-emerald-400"
                            : tool.risk === "write-medium"
                              ? "border-sky-500/40 text-sky-400"
                              : tool.risk === "write-high"
                                ? "border-amber-500/40 text-amber-400"
                                : "border-destructive/40 text-destructive"
                        }`}
                      >
                        {tool.risk}
                      </Badge>
                      {isBlocked ? (
                        <X className="w-4 h-4 text-destructive" />
                      ) : (
                        <Check className="w-4 h-4 text-chart-1" />
                      )}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {selectedTool?.toolId === tool.toolId && (
                    <div className="mt-3 pt-3 border-t border-border/20">
                      <p className="text-xs text-muted-foreground mb-2">
                        {tool.description}
                      </p>
                      <div className="text-xs mb-2">
                        <span className="text-muted-foreground">
                          Required claims:{" "}
                        </span>
                        {tool.requiredClaims.map((c) => (
                          <Badge
                            key={c}
                            variant="outline"
                            className={`text-[9px] mx-0.5 ${
                              userClaims.includes(c)
                                ? "border-chart-1/40 text-chart-1"
                                : "border-destructive/40 text-destructive"
                            }`}
                          >
                            {c}
                          </Badge>
                        ))}
                      </div>

                      {isBlocked && (
                        <div className="mt-2 p-2 rounded bg-destructive/10 border border-destructive/20">
                          <p className="text-xs font-medium text-destructive mb-1">
                            Blocked:
                          </p>
                          <ul className="text-[10px] text-destructive/80 space-y-0.5">
                            {blockReasons.map((reason, i) => (
                              <li key={i}>• {reason}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 pt-4 border-t border-border/30 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setUserClaims([...ALL_CLAIMS]);
              setEnabledTools(TOOL_REGISTRY.map((t) => t.toolId));
            }}
            className="flex-1 text-xs"
          >
            Enable All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setUserClaims([]);
              setEnabledTools([]);
            }}
            className="flex-1 text-xs"
          >
            Disable All
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
