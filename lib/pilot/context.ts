// lib/pilot/context.ts
import type { ToolExecutionContext } from "./tools";

export function newCorrelationId(): string {
  return "corr_" + Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
}

export function getPilotContext(): Omit<ToolExecutionContext, "correlationId"> {
  // Minimal demo context; later replace with TenantProvider + Auth session
  return {
    countyId: "benton",
    userId: "demo.user",
    userClaims: ["parcel:read", "ratio:run", "dossier:draft"],
    enabledTools: [
      "route_to_parcel",
      "run_ratio_study",
      "assemble_packet",
      "explain_value_change",
      "draft_appeal_response",
    ],
    currentMode: "pilot",
  };
}
