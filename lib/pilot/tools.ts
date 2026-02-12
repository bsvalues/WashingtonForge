// lib/pilot/tools.ts
// TerraPilot tool registry — canonical, aligned to TerraFusion OS Constitution.
// Enforces: mode + RBAC claims + tool allowlist + risk policy. Emits Trace events via emitTrace().

export type PilotMode = "pilot" | "muse" | "both";
export type ToolRisk = "read" | "write-medium" | "write-high" | "irreversible";
export type SuiteOwner = "os" | "forge" | "atlas" | "dais" | "dossier" | "gpt";

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
  category: string;
  mode: PilotMode;
  risk: ToolRisk;
  suiteOwner: SuiteOwner;
  requiredClaims: string[];
  enabledBy?: { license?: string; policyFlag?: string };
  writesTo: string[];
  /** Muse-mode only: output type */
  outputType?: "document" | "narrative" | "text" | "template";
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
  | { ok: false; blockedBy: "mode" | "rbac" | "allowlist" | "policy"; summary: string; policy?: RiskPolicy };

export const REASON_CODES = [
  { code: "DATA_FIX", label: "Data correction / coding drift" },
  { code: "MARKET_CAL", label: "Market calibration evidence" },
  { code: "EQUITY_FIX", label: "Equity / VEI correction" },
  { code: "QA", label: "QA / anomaly investigation" },
] as const;

export const DEFAULT_REASON_CODES = REASON_CODES;

export function defaultRiskPolicy(risk: ToolRisk): RiskPolicy {
  switch (risk) {
    case "read":
      return { risk, requiresConfirmation: false, requiresReasonCode: false, requiresSupervisor: false };
    case "write-medium":
      return { risk, requiresConfirmation: false, requiresReasonCode: false, requiresSupervisor: false };
    case "write-high":
      return { risk, requiresConfirmation: true, requiresReasonCode: true, requiresSupervisor: false };
    case "irreversible":
      return { risk, requiresConfirmation: true, requiresReasonCode: true, requiresSupervisor: true };
  }
}

// ============================================
// Pilot Mode Tools (18) — "Do the work."
// ============================================

const PILOT_TOOLS: ToolDescriptor[] = [
  // Navigation
  {
    toolId: "route_to_parcel",
    title: "Open Parcel",
    description: "Navigate to a specific parcel in the Property Workbench",
    category: "navigation",
    mode: "pilot",
    risk: "read",
    suiteOwner: "os",
    requiredClaims: ["parcel:read"],
    writesTo: [],
  },
  {
    toolId: "open_panel",
    title: "Open Panel",
    description: "Open a specific panel or tab in the workbench",
    category: "navigation",
    mode: "pilot",
    risk: "read",
    suiteOwner: "os",
    requiredClaims: ["parcel:read"],
    writesTo: [],
  },
  {
    toolId: "switch_work_mode",
    title: "Switch Work Mode",
    description: "Switch between Overview, Valuation, Mapping, Admin, Case modes",
    category: "navigation",
    mode: "pilot",
    risk: "read",
    suiteOwner: "os",
    requiredClaims: ["parcel:read"],
    writesTo: [],
  },
  // Workflow (TerraDais)
  {
    toolId: "assign_task",
    title: "Assign Task",
    description: "Assign a workflow task to a user",
    category: "workflow",
    mode: "pilot",
    risk: "write-medium",
    suiteOwner: "dais",
    requiredClaims: ["workflow:write"],
    writesTo: ["task_assignments"],
  },
  {
    toolId: "create_workflow",
    title: "Create Workflow",
    description: "Create a new workflow (permit, exemption, appeal)",
    category: "workflow",
    mode: "pilot",
    risk: "write-medium",
    suiteOwner: "dais",
    requiredClaims: ["workflow:write"],
    writesTo: ["workflow_states"],
  },
  {
    toolId: "escalate_task",
    title: "Escalate Task",
    description: "Escalate a workflow task to supervisor",
    category: "workflow",
    mode: "pilot",
    risk: "write-medium",
    suiteOwner: "dais",
    requiredClaims: ["workflow:write"],
    writesTo: ["workflow_states"],
  },
  // Data (read)
  {
    toolId: "fetch_comps",
    title: "Find Comparables",
    description: "Fetch comparable sales for a parcel",
    category: "data",
    mode: "pilot",
    risk: "read",
    suiteOwner: "forge",
    requiredClaims: ["sales:read"],
    writesTo: [],
  },
  {
    toolId: "search_parcels",
    title: "Search Parcels",
    description: "Search parcels by address, PIN, or owner",
    category: "data",
    mode: "pilot",
    risk: "read",
    suiteOwner: "os",
    requiredClaims: ["parcel:read"],
    writesTo: [],
  },
  {
    toolId: "get_permit_history",
    title: "Get Permit History",
    description: "Retrieve permit history for a parcel",
    category: "data",
    mode: "pilot",
    risk: "read",
    suiteOwner: "dais",
    requiredClaims: ["permit:read"],
    writesTo: [],
  },
  {
    toolId: "get_exemption_status",
    title: "Get Exemption Status",
    description: "Check current exemption status for a parcel",
    category: "data",
    mode: "pilot",
    risk: "read",
    suiteOwner: "dais",
    requiredClaims: ["exemption:read"],
    writesTo: [],
  },
  // Execution
  {
    toolId: "run_model",
    title: "Run Valuation Model",
    description: "Execute valuation model on selection (draft version)",
    category: "execution",
    mode: "pilot",
    risk: "write-medium",
    suiteOwner: "forge",
    requiredClaims: ["model:run"],
    writesTo: ["valuation_artifacts"],
  },
  {
    toolId: "generate_notice",
    title: "Generate Notice",
    description: "Generate assessment change notice for parcel(s)",
    category: "execution",
    mode: "pilot",
    risk: "write-high",
    suiteOwner: "dais",
    requiredClaims: ["notice:write"],
    writesTo: ["notices"],
  },
  {
    toolId: "create_exemption",
    title: "Create Exemption",
    description: "Create a new exemption record for a parcel",
    category: "execution",
    mode: "pilot",
    risk: "write-medium",
    suiteOwner: "dais",
    requiredClaims: ["exemption:write"],
    writesTo: ["exemption_records"],
  },
  {
    toolId: "assemble_packet",
    title: "Assemble BOE Packet",
    description: "Assemble Board of Equalization evidence packet",
    category: "execution",
    mode: "pilot",
    risk: "write-medium",
    suiteOwner: "dossier",
    requiredClaims: ["dossier:write"],
    writesTo: ["packets"],
  },
  {
    toolId: "approve_exemption",
    title: "Approve Exemption",
    description: "Approve an exemption application (write-high)",
    category: "execution",
    mode: "pilot",
    risk: "write-high",
    suiteOwner: "dais",
    requiredClaims: ["exemption:approve"],
    writesTo: ["exemption_records"],
  },
  // Monitoring
  {
    toolId: "check_cert_status",
    title: "Check Certification",
    description: "Check certification status for current roll year",
    category: "monitoring",
    mode: "pilot",
    risk: "read",
    suiteOwner: "dais",
    requiredClaims: ["cert:read"],
    writesTo: [],
  },
  {
    toolId: "verify_roll_ready",
    title: "Verify Roll Ready",
    description: "Verify all requirements met for roll certification",
    category: "monitoring",
    mode: "pilot",
    risk: "read",
    suiteOwner: "dais",
    requiredClaims: ["cert:read"],
    writesTo: [],
  },
  {
    toolId: "check_queue",
    title: "Check My Queue",
    description: "View current task queue and pending items",
    category: "monitoring",
    mode: "pilot",
    risk: "read",
    suiteOwner: "dais",
    requiredClaims: ["workflow:read"],
    writesTo: [],
  },
];

// ============================================
// Muse Mode Tools (16) — "Draft and explain."
// ============================================

const MUSE_TOOLS: ToolDescriptor[] = [
  // Draft
  {
    toolId: "draft_notice",
    title: "Draft Notice",
    description: "Draft an assessment notice document",
    category: "draft",
    mode: "muse",
    risk: "read",
    suiteOwner: "dais",
    requiredClaims: ["notice:read"],
    writesTo: [],
    outputType: "document",
  },
  {
    toolId: "draft_letter",
    title: "Draft Letter",
    description: "Draft a general correspondence letter",
    category: "draft",
    mode: "muse",
    risk: "read",
    suiteOwner: "dais",
    requiredClaims: ["parcel:read"],
    writesTo: [],
    outputType: "document",
  },
  {
    toolId: "draft_appeal_response",
    title: "Draft Appeal Response",
    description: "Draft a response outline for an appeal",
    category: "draft",
    mode: "muse",
    risk: "read",
    suiteOwner: "dais",
    requiredClaims: ["appeal:read"],
    writesTo: [],
    outputType: "document",
  },
  {
    toolId: "draft_exemption_letter",
    title: "Draft Exemption Letter",
    description: "Draft an exemption approval/denial letter",
    category: "draft",
    mode: "muse",
    risk: "read",
    suiteOwner: "dais",
    requiredClaims: ["exemption:read"],
    writesTo: [],
    outputType: "document",
  },
  {
    toolId: "draft_commissioner_memo",
    title: "Draft Commissioner Memo",
    description: "Draft a briefing memo for the commissioner",
    category: "draft",
    mode: "muse",
    risk: "read",
    suiteOwner: "dais",
    requiredClaims: ["parcel:read"],
    writesTo: [],
    outputType: "document",
  },
  // Explain
  {
    toolId: "explain_value_change",
    title: "Explain Value Change",
    description: "Summarize why a parcel's assessed value changed",
    category: "explain",
    mode: "muse",
    risk: "read",
    suiteOwner: "forge",
    requiredClaims: ["parcel:read"],
    writesTo: [],
    outputType: "narrative",
  },
  {
    toolId: "explain_model_results",
    title: "Explain Model Results",
    description: "Explain valuation model outputs in plain language",
    category: "explain",
    mode: "muse",
    risk: "read",
    suiteOwner: "forge",
    requiredClaims: ["model:read"],
    writesTo: [],
    outputType: "narrative",
  },
  {
    toolId: "explain_exemption_decision",
    title: "Explain Exemption Decision",
    description: "Explain why an exemption was approved or denied",
    category: "explain",
    mode: "muse",
    risk: "read",
    suiteOwner: "dais",
    requiredClaims: ["exemption:read"],
    writesTo: [],
    outputType: "narrative",
  },
  {
    toolId: "explain_appeal_outcome",
    title: "Explain Appeal Outcome",
    description: "Explain the outcome of an appeal hearing",
    category: "explain",
    mode: "muse",
    risk: "read",
    suiteOwner: "dais",
    requiredClaims: ["appeal:read"],
    writesTo: [],
    outputType: "narrative",
  },
  // Summarize
  {
    toolId: "summarize_dossier",
    title: "Summarize Case File",
    description: "Summarize all evidence and documents in a case file",
    category: "summarize",
    mode: "muse",
    risk: "read",
    suiteOwner: "dossier",
    requiredClaims: ["dossier:read"],
    writesTo: [],
    outputType: "text",
  },
  {
    toolId: "summarize_parcel_history",
    title: "Summarize Parcel History",
    description: "Summarize the full history of a parcel",
    category: "summarize",
    mode: "muse",
    risk: "read",
    suiteOwner: "os",
    requiredClaims: ["parcel:read"],
    writesTo: [],
    outputType: "text",
  },
  {
    toolId: "summarize_permit_activity",
    title: "Summarize Permit Activity",
    description: "Summarize recent permit activity for a parcel or area",
    category: "summarize",
    mode: "muse",
    risk: "read",
    suiteOwner: "dais",
    requiredClaims: ["permit:read"],
    writesTo: [],
    outputType: "text",
  },
  // Synthesize
  {
    toolId: "synthesize_evidence",
    title: "Synthesize Evidence",
    description: "Synthesize multiple evidence items into a narrative",
    category: "synthesize",
    mode: "muse",
    risk: "read",
    suiteOwner: "dossier",
    requiredClaims: ["dossier:read"],
    writesTo: [],
    outputType: "narrative",
  },
  {
    toolId: "create_hearing_narrative",
    title: "Create Hearing Narrative",
    description: "Create a narrative document for a hearing",
    category: "synthesize",
    mode: "muse",
    risk: "read",
    suiteOwner: "dossier",
    requiredClaims: ["dossier:read"],
    writesTo: [],
    outputType: "document",
  },
  // Template
  {
    toolId: "create_template",
    title: "Create Template",
    description: "Create a new document template",
    category: "template",
    mode: "muse",
    risk: "read",
    suiteOwner: "os",
    requiredClaims: ["template:write"],
    writesTo: [],
    outputType: "template",
  },
  {
    toolId: "customize_template",
    title: "Customize Template",
    description: "Customize an existing template for a specific use case",
    category: "template",
    mode: "muse",
    risk: "read",
    suiteOwner: "os",
    requiredClaims: ["template:write"],
    writesTo: [],
    outputType: "template",
  },
];

// ============================================
// Combined Registry
// ============================================

export const TOOL_REGISTRY: ToolDescriptor[] = [...PILOT_TOOLS, ...MUSE_TOOLS];

// Deduplicated list of every RBAC claim referenced in the registry
export const ALL_CLAIMS: string[] = Array.from(
  new Set(TOOL_REGISTRY.flatMap((t) => t.requiredClaims))
).sort();

export function getTool(toolId: string): ToolDescriptor | undefined {
  return TOOL_REGISTRY.find((t) => t.toolId === toolId);
}

export function getToolsByMode(mode: "pilot" | "muse"): ToolDescriptor[] {
  return TOOL_REGISTRY.filter((t) => t.mode === mode || t.mode === "both");
}

export function getToolsByCategory(category: string): ToolDescriptor[] {
  return TOOL_REGISTRY.filter((t) => t.category === category);
}

export function getToolsBySuite(suite: SuiteOwner): ToolDescriptor[] {
  return TOOL_REGISTRY.filter((t) => t.suiteOwner === suite);
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
    return { ok: false, blockedBy: "allowlist", summary: "Blocked: tool not enabled for this county/policy." };
  }

  // RBAC claims
  const missing = tool.requiredClaims.filter((c) => !ctx.userClaims.includes(c));
  if (missing.length) {
    return { ok: false, blockedBy: "rbac", summary: `Blocked: missing claims (${missing.join(", ")}).` };
  }

  // Risk policy (county may tighten)
  const base = defaultRiskPolicy(tool.risk);
  const tightened = { ...base, ...(countyPolicy?.[tool.risk] ?? {}) };

  if (tightened.requiresConfirmation && !opts.confirmed) {
    return { ok: false, blockedBy: "policy", summary: "Blocked: confirmation required.", policy: tightened };
  }
  if (tightened.requiresReasonCode && !opts.reasonCode) {
    return { ok: false, blockedBy: "policy", summary: "Blocked: reason code required.", policy: tightened };
  }
  if (tightened.requiresSupervisor && !opts.supervisorApprovalRef) {
    return { ok: false, blockedBy: "policy", summary: "Blocked: supervisor approval required.", policy: tightened };
  }

  return { ok: true, policy: tightened };
}

// ============================================
// Display helpers
// ============================================

export function getRiskBadgeColor(risk: ToolRisk): string {
  switch (risk) {
    case "read":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "write-medium":
      return "bg-sky-500/20 text-sky-400 border-sky-500/30";
    case "write-high":
      return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case "irreversible":
      return "bg-red-500/20 text-red-400 border-red-500/30";
  }
}

export function getRiskLabel(risk: ToolRisk): string {
  switch (risk) {
    case "read":
      return "Read";
    case "write-medium":
      return "Write";
    case "write-high":
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
    case "gpt":
      return "TerraGPT";
  }
}

export function getCategoryLabel(category: string): string {
  switch (category) {
    case "navigation": return "Navigation";
    case "workflow": return "Workflow";
    case "data": return "Data";
    case "execution": return "Execution";
    case "monitoring": return "Monitoring";
    case "draft": return "Draft";
    case "explain": return "Explain";
    case "summarize": return "Summarize";
    case "synthesize": return "Synthesize";
    case "template": return "Template";
    default: return category;
  }
}
