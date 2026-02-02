"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, Key, ListChecks, AlertTriangle, Check, X } from "lucide-react";
import { TOOL_REGISTRY, ALL_CLAIMS, type ToolDescriptor } from "@/lib/pilot/tools";

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
    if (tool.suiteOwner === "pilot" && mode === "muse") {
      reasons.push("Mode: Pilot-only tool (current mode: Muse)");
    }

    // Allowlist check
    if (!enabledTools.includes(tool.toolId)) {
      reasons.push("Allowlist: Tool not enabled for this county");
    }

    // RBAC check
    const missingClaims = tool.requiredClaims.filter((c) => !userClaims.includes(c));
    if (missingClaims.length > 0) {
      reasons.push(`RBAC: Missing claims [${missingClaims.join(", ")}]`);
    }

    // Risk policy
    if (tool.risk === "write_high" && requireConfirmWriteHigh) {
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
        className="glass-panel border-border/30 w-[440px] overflow-y-auto border-l sm:w-[540px]"
      >
        <SheetHeader className="pb-4">
          <SheetTitle className="text-foreground flex items-center gap-2">
            <Shield className="text-primary h-5 w-5" />
            Pilot Policy Debug
          </SheetTitle>
          <p className="text-muted-foreground text-xs">
            Toggle claims, allowlist, and policy to test gating behavior
          </p>
        </SheetHeader>

        {/* Current Mode */}
        <div className="bg-muted/30 border-border/30 mb-6 rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Current Mode</span>
            <Badge
              variant="outline"
              className={
                mode === "pilot" ? "border-primary/50 text-primary" : "border-accent/50 text-accent"
              }
            >
              {mode === "pilot" ? "Pilot (Execute)" : "Muse (Explain)"}
            </Badge>
          </div>
        </div>

        {/* RBAC Claims */}
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <Key className="text-muted-foreground h-4 w-4" />
            <span className="text-sm font-medium">User Claims (RBAC)</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {ALL_CLAIMS.map((claim) => (
              <div
                key={claim}
                className="bg-muted/20 border-border/20 flex items-center gap-2 rounded border p-2"
              >
                <Switch
                  id={`claim-${claim}`}
                  checked={userClaims.includes(claim)}
                  onCheckedChange={() => toggleClaim(claim)}
                  className="scale-75"
                />
                <Label htmlFor={`claim-${claim}`} className="cursor-pointer text-xs">
                  {claim}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator className="bg-border/30 my-4" />

        {/* County Policy Overrides */}
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="text-muted-foreground h-4 w-4" />
            <span className="text-sm font-medium">County Risk Policy</span>
          </div>
          <div className="space-y-3">
            <div className="bg-muted/20 border-border/20 flex items-center justify-between rounded border p-2">
              <Label htmlFor="confirm-write-high" className="cursor-pointer text-xs">
                write_high requires confirmation + reason
              </Label>
              <Switch
                id="confirm-write-high"
                checked={requireConfirmWriteHigh}
                onCheckedChange={setRequireConfirmWriteHigh}
                className="scale-75"
              />
            </div>
            <div className="bg-muted/20 border-border/20 flex items-center justify-between rounded border p-2">
              <Label htmlFor="supervisor-irreversible" className="cursor-pointer text-xs">
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

        <Separator className="bg-border/30 my-4" />

        {/* Tool Allowlist + Status */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <ListChecks className="text-muted-foreground h-4 w-4" />
            <span className="text-sm font-medium">Tool Allowlist & Status</span>
          </div>
          <div className="max-h-[300px] space-y-2 overflow-y-auto pr-2">
            {TOOL_REGISTRY.map((tool) => {
              const blockReasons = getToolBlockReasons(tool);
              const isBlocked = blockReasons.length > 0;
              const isEnabled = enabledTools.includes(tool.toolId);

              return (
                <div
                  key={tool.toolId}
                  className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                    selectedTool?.toolId === tool.toolId
                      ? "border-primary/50 bg-primary/10"
                      : "border-border/20 bg-muted/20 hover:bg-muted/30"
                  }`}
                  onClick={() =>
                    setSelectedTool(selectedTool?.toolId === tool.toolId ? null : tool)
                  }
                >
                  <div className="mb-1 flex items-center justify-between">
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
                          tool.suiteOwner === "pilot"
                            ? "border-primary/40 text-primary"
                            : "border-accent/40 text-accent"
                        }`}
                      >
                        {tool.suiteOwner}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          tool.risk === "read_only"
                            ? "border-chart-1/40 text-chart-1"
                            : tool.risk === "write_low"
                              ? "border-chart-2/40 text-chart-2"
                              : tool.risk === "write_high"
                                ? "border-chart-3/40 text-chart-3"
                                : "border-destructive/40 text-destructive"
                        }`}
                      >
                        {tool.risk}
                      </Badge>
                      {isBlocked ? (
                        <X className="text-destructive h-4 w-4" />
                      ) : (
                        <Check className="text-chart-1 h-4 w-4" />
                      )}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {selectedTool?.toolId === tool.toolId && (
                    <div className="border-border/20 mt-3 border-t pt-3">
                      <p className="text-muted-foreground mb-2 text-xs">{tool.description}</p>
                      <div className="mb-2 text-xs">
                        <span className="text-muted-foreground">Required claims: </span>
                        {tool.requiredClaims.map((c) => (
                          <Badge
                            key={c}
                            variant="outline"
                            className={`mx-0.5 text-[9px] ${
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
                        <div className="bg-destructive/10 border-destructive/20 mt-2 rounded border p-2">
                          <p className="text-destructive mb-1 text-xs font-medium">Blocked:</p>
                          <ul className="text-destructive/80 space-y-0.5 text-[10px]">
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
        <div className="border-border/30 mt-6 flex gap-2 border-t pt-4">
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
