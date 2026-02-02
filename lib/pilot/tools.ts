// lib/pilot/tools.ts
// TerraPilot tool registry stub (prototype-safe).
// Enforces: mode + RBAC claims + tool allowlist + risk policy. Emits Trace events via emitTrace().

export type PilotMode = "pilot" | "muse" | "both";
export type ToolRisk = "read_only" | "write_low" | "write_high" | "irreversible";
export type SuiteOwner = "os" | "forge" | "atlas" | "dais" | "dossier";

export interface RiskPolicy {
  risk: ToolRisk;
  requiresConfirmation: boolean;
  requiresReasonCode: boolean;
  requiresSupervisor: boolean;
}

export interface ToolDescriptor {
  toolId: string;
  title: string;
  description: string;
  mode: PilotMode;
  risk: ToolRisk;
  suiteOwner: SuiteOwner;
  requiredClaims: string[];
  enabledBy?: { license?: string; policyFlag?: string };
  writesTo: string[];
}

export interface ToolExecutionContext {
  countyId: string;
  userId: string;
  userClaims: string[];
  enabledTools: string[];
  parcelId?: string;
  dossierId?: string;
  currentMode: "pilot" | "muse";
  correlationId: string;
}

export interface ToolResult {
  ok: boolean;
  summary: string;
  payloadRef?: string;
}

export interface ToolInvokeOptions {
  reasonCode?: string;
  note?: string;
  supervisorApprovalRef?: string;
  confirmed?: boolean;
}

export type GuardDecision =
  | { ok: true; policy: RiskPolicy }
  | {
      ok: false;
      blockedBy: "mode" | "rbac" | "allowlist" | "policy";
      summary: string;
      policy?: RiskPolicy;
    };

export const REASON_CODES = [
  { code: "DATA_FIX", label: "Data correction / coding drift" },
  { code: "MARKET_CAL", label: "Market calibration evidence" },
  { code: "EQUITY_FIX", label: "Equity / VEI correction" },
  { code: "QA", label: "QA / anomaly investigation" },
] as const;

// Alias for backwards compatibility
export const DEFAULT_REASON_CODES = REASON_CODES;

export function defaultRiskPolicy(risk: ToolRisk): RiskPolicy {
  switch (risk) {
    case "read_only":
      return {
        risk,
        requiresConfirmation: false,
        requiresReasonCode: false,
        requiresSupervisor: false,
      };
    case "write_low":
      return {
        risk,
        requiresConfirmation: false,
        requiresReasonCode: false,
        requiresSupervisor: false,
      };
    case "write_high":
      return {
        risk,
        requiresConfirmation: true,
        requiresReasonCode: true,
        requiresSupervisor: false,
      };
    case "irreversible":
      return {
        risk,
        requiresConfirmation: true,
        requiresReasonCode: true,
        requiresSupervisor: true,
      };
  }
}

export const TOOL_REGISTRY: ToolDescriptor[] = [
  // Pilot mode tools
  {
    toolId: "route_to_parcel",
    title: "Route to Parcel",
    description: "Navigate to a specific parcel in the Cockpit map",
    mode: "pilot",
    risk: "read_only",
    suiteOwner: "os",
    requiredClaims: ["parcel:read"],
    enabledBy: { policyFlag: "pilot.route" },
    writesTo: [],
  },
  {
    toolId: "run_ratio_study",
    title: "Run Ratio Study",
    description: "Execute ratio study on current selection",
    mode: "pilot",
    risk: "write_low",
    suiteOwner: "forge",
    requiredClaims: ["ratio:run"],
    enabledBy: { policyFlag: "pilot.ratio" },
    writesTo: ["valuation_artifacts"],
  },
  {
    toolId: "create_calibration_patch",
    title: "Create Calibration Patch",
    description: "Draft a calibration patch for the selected zone",
    mode: "pilot",
    risk: "write_high",
    suiteOwner: "forge",
    requiredClaims: ["calibration:write"],
    enabledBy: { policyFlag: "pilot.calibration" },
    writesTo: ["valuation_artifacts"],
  },
  {
    toolId: "run_valuation_model",
    title: "Run Valuation Model",
    description: "Execute valuation model on selection (draft)",
    mode: "pilot",
    risk: "write_high",
    suiteOwner: "forge",
    requiredClaims: ["model:run"],
    enabledBy: { policyFlag: "pilot.model" },
    writesTo: ["valuation_artifacts"],
  },
  {
    toolId: "export_ratio_snapshot",
    title: "Export Ratio Snapshot",
    description: "Generate and download ratio study report",
    mode: "pilot",
    risk: "read_only",
    suiteOwner: "dossier",
    requiredClaims: ["ratio:read"],
    enabledBy: { policyFlag: "pilot.export" },
    writesTo: [],
  },
  {
    toolId: "assemble_packet",
    title: "Assemble Evidence Packet",
    description: "Create draft evidence packet for appeal/review",
    mode: "pilot",
    risk: "write_high",
    suiteOwner: "dossier",
    requiredClaims: ["dossier:draft"],
    enabledBy: { policyFlag: "pilot.packet" },
    writesTo: ["evidence_packets"],
  },
  {
    toolId: "publish_snapshot",
    title: "Publish Roll Year Snapshot",
    description: "Publish snapshot to production (irreversible)",
    mode: "pilot",
    risk: "irreversible",
    suiteOwner: "forge",
    requiredClaims: ["snapshot:publish"],
    enabledBy: { policyFlag: "pilot.publish" },
    writesTo: ["roll_snapshots"],
  },
  // Muse mode tools
  {
    toolId: "explain_value_change",
    title: "Explain Value Change",
    description: "Summarize why a parcel's value changed",
    mode: "muse",
    risk: "read_only",
    suiteOwner: "dossier",
    requiredClaims: ["parcel:read"],
    enabledBy: { policyFlag: "muse.explain" },
    writesTo: [],
  },
  {
    toolId: "summarize_hotspots",
    title: "Summarize Drift Hotspots",
    description: "Explain current equity drift hotspots",
    mode: "muse",
    risk: "read_only",
    suiteOwner: "atlas",
    requiredClaims: ["ratio:read"],
    enabledBy: { policyFlag: "muse.hotspots" },
    writesTo: [],
  },
  {
    toolId: "draft_appeal_response",
    title: "Draft Appeal Response",
    description: "Generate draft response outline for appeal",
    mode: "muse",
    risk: "write_low",
    suiteOwner: "dossier",
    requiredClaims: ["dossier:draft"],
    enabledBy: { policyFlag: "muse.appeal" },
    writesTo: ["evidence_packets"],
  },
  {
    toolId: "draft_commissioner_memo",
    title: "Draft Commissioner Memo",
    description: "Generate draft memo for commissioner briefing",
    mode: "muse",
    risk: "write_low",
    suiteOwner: "dossier",
    requiredClaims: ["dossier:draft"],
    enabledBy: { policyFlag: "muse.memo" },
    writesTo: ["evidence_packets"],
  },
  {
    toolId: "analyze_comparable_sales",
    title: "Analyze Comparable Sales",
    description: "Find and explain comparable sales for a parcel",
    mode: "muse",
    risk: "read_only",
    suiteOwner: "atlas",
    requiredClaims: ["sales:read"],
    enabledBy: { policyFlag: "muse.comps" },
    writesTo: [],
  },
];

export function getTool(toolId: string): ToolDescriptor | undefined {
  return TOOL_REGISTRY.find((t) => t.toolId === toolId);
}

export function getToolsByMode(mode: "pilot" | "muse"): ToolDescriptor[] {
  return TOOL_REGISTRY.filter((t) => t.mode === mode || t.mode === "both");
}

export function guardToolExecution(
  tool: ToolDescriptor,
  ctx: ToolExecutionContext,
  opts: ToolInvokeOptions = {},
  countyPolicy?: Partial<Record<ToolRisk, Partial<RiskPolicy>>>
): GuardDecision {
  // Mode lock: tool must allow current mode
  if (tool.mode !== "both" && tool.mode !== ctx.currentMode) {
    return { ok: false, blockedBy: "mode", summary: `Blocked: tool is ${tool.mode}-mode only.` };
  }

  // Allowlist: tool must be enabled
  if (!ctx.enabledTools.includes(tool.toolId)) {
    return {
      ok: false,
      blockedBy: "allowlist",
      summary: "Blocked: tool not enabled for this county/policy.",
    };
  }

  // RBAC claims
  const missing = tool.requiredClaims.filter((c) => !ctx.userClaims.includes(c));
  if (missing.length) {
    return {
      ok: false,
      blockedBy: "rbac",
      summary: `Blocked: missing claims (${missing.join(", ")}).`,
    };
  }

  // Risk policy (county may tighten)
  const base = defaultRiskPolicy(tool.risk);
  const tightened = { ...base, ...(countyPolicy?.[tool.risk] ?? {}) };

  if (tightened.requiresConfirmation && !opts.confirmed) {
    return {
      ok: false,
      blockedBy: "policy",
      summary: "Blocked: confirmation required.",
      policy: tightened,
    };
  }
  if (tightened.requiresReasonCode && !opts.reasonCode) {
    return {
      ok: false,
      blockedBy: "policy",
      summary: "Blocked: reason code required.",
      policy: tightened,
    };
  }
  if (tightened.requiresSupervisor && !opts.supervisorApprovalRef) {
    return {
      ok: false,
      blockedBy: "policy",
      summary: "Blocked: supervisor approval required.",
      policy: tightened,
    };
  }

  return { ok: true, policy: tightened };
}

// Risk badge styling
export function getRiskBadgeColor(risk: ToolRisk): string {
  switch (risk) {
    case "read_only":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "write_low":
      return "bg-sky-500/20 text-sky-400 border-sky-500/30";
    case "write_high":
      return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case "irreversible":
      return "bg-red-500/20 text-red-400 border-red-500/30";
  }
}

export function getRiskLabel(risk: ToolRisk): string {
  switch (risk) {
    case "read_only":
      return "Read";
    case "write_low":
      return "Write";
    case "write_high":
      return "Write (High)";
    case "irreversible":
      return "Irreversible";
  }
}

export function getSuiteLabel(suite: SuiteOwner): string {
  switch (suite) {
    case "os":
      return "TerraFusion OS";
    case "forge":
      return "TerraForge";
    case "atlas":
      return "TerraAtlas";
    case "dais":
      return "TerraDais";
    case "dossier":
      return "TerraDossier";
  }
}

// All available claims derived from the tool registry
export const ALL_CLAIMS = [
  ...new Set(TOOL_REGISTRY.flatMap((t) => t.requiredClaims)),
] as const;
