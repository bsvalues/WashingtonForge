// lib/pilot/executor.ts
// Prototype executor: emits TerraTrace events with correlationId and safe summaries.
// TerraTrace rules: append-only, county-scoped, correlation-linked.

import {
  guardToolExecution,
  getTool,
  type ToolExecutionContext,
  type ToolInvokeOptions,
  type ToolResult,
} from "./tools";
import { sanitizeText } from "./pii";

export type TraceClassification = "PUBLIC" | "CONFIDENTIAL" | "RESTRICTED";
export type TraceEventType =
  | "tool_invoked"
  | "tool_succeeded"
  | "tool_failed"
  | "mode_switched"
  | "permission_denied"
  | "policy_blocked";

export interface TraceEvent {
  id: string;
  countyId: string;
  type: TraceEventType;
  ts: string;
  correlationId: string;
  suite: "pilot";
  classification: TraceClassification;
  actor: { userId: string; roles?: string[] };
  toolId?: string;
  risk?: string;
  reasonCode?: string;
  supervisorApprovalRef?: string;
  inputSummary?: string;
  outputSummary?: string;
  payloadRef?: string;
}

// In-memory append-only trace store (demo)
const TRACE: TraceEvent[] = [];

// Listeners for real-time updates
type TraceListener = () => void;
const listeners: Set<TraceListener> = new Set();

function uuid() {
  return Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
}

export function generateCorrelationId(): string {
  return `corr-${uuid()}`;
}

export function getTraceFeed(): TraceEvent[] {
  return TRACE.slice().reverse();
}

export function getTraceByCorrelation(correlationId: string): TraceEvent[] {
  return TRACE.filter((e) => e.correlationId === correlationId);
}

export function subscribeToTrace(listener: TraceListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitTrace(e: Omit<TraceEvent, "id" | "ts">) {
  TRACE.push({ ...e, id: uuid(), ts: new Date().toISOString() });
  listeners.forEach((l) => l());
}

export function emitModeSwitch(
  countyId: string,
  userId: string,
  correlationId: string,
  newMode: "pilot" | "muse"
) {
  emitTrace({
    countyId,
    correlationId,
    suite: "pilot",
    type: "mode_switched",
    classification: "PUBLIC",
    actor: { userId },
    outputSummary: `Mode switched to ${newMode}.`,
  });
}

export async function executeTool(
  toolId: string,
  ctx: ToolExecutionContext,
  opts: ToolInvokeOptions = {}
): Promise<ToolResult> {
  const tool = getTool(toolId);
  if (!tool) {
    emitTrace({
      countyId: ctx.countyId,
      correlationId: ctx.correlationId,
      suite: "pilot",
      type: "tool_failed",
      classification: "PUBLIC",
      actor: { userId: ctx.userId },
      toolId,
      outputSummary: "Unknown toolId.",
    });
    return { ok: false, summary: "Unknown tool." };
  }

  emitTrace({
    countyId: ctx.countyId,
    correlationId: ctx.correlationId,
    suite: "pilot",
    type: "tool_invoked",
    classification: "PUBLIC",
    actor: { userId: ctx.userId },
    toolId: tool.toolId,
    risk: tool.risk,
    reasonCode: opts.reasonCode,
    supervisorApprovalRef: opts.supervisorApprovalRef,
    inputSummary: sanitizeText(`Invoked ${tool.title} (${tool.suiteOwner}).`),
  });

  const decision = guardToolExecution(tool, ctx, opts);
  if (!decision.ok) {
    emitTrace({
      countyId: ctx.countyId,
      correlationId: ctx.correlationId,
      suite: "pilot",
      type: decision.blockedBy === "policy" ? "policy_blocked" : "permission_denied",
      classification: "PUBLIC",
      actor: { userId: ctx.userId },
      toolId: tool.toolId,
      risk: tool.risk,
      outputSummary: sanitizeText(decision.summary),
    });
    return { ok: false, summary: decision.summary };
  }

  // Simulate async execution
  await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 500));

  // Demo: no real side effects; return stub result
  const result: ToolResult = {
    ok: true,
    summary: `OK: ${tool.title} completed successfully.`,
    payloadRef: `ref-${uuid().slice(0, 8)}`,
  };

  emitTrace({
    countyId: ctx.countyId,
    correlationId: ctx.correlationId,
    suite: "pilot",
    type: "tool_succeeded",
    classification: "PUBLIC",
    actor: { userId: ctx.userId },
    toolId: tool.toolId,
    risk: tool.risk,
    outputSummary: sanitizeText(result.summary),
    payloadRef: result.payloadRef,
  });

  return result;
}

// Get demo context for prototype
export function getDemoPilotContext(mode: "pilot" | "muse"): ToolExecutionContext {
  return {
    countyId: "benton",
    userId: "demo_user",
    userClaims: [
      "parcel:read",
      "ratio:run",
      "ratio:read",
      "calibration:write",
      "model:run",
      "dossier:draft",
      "sales:read",
      "snapshot:publish",
    ],
    enabledTools: [
      "route_to_parcel",
      "run_ratio_study",
      "create_calibration_patch",
      "run_valuation_model",
      "export_ratio_snapshot",
      "assemble_packet",
      "publish_snapshot",
      "explain_value_change",
      "summarize_hotspots",
      "draft_appeal_response",
      "draft_commissioner_memo",
      "analyze_comparable_sales",
    ],
    currentMode: mode,
    correlationId: generateCorrelationId(),
  };
}
