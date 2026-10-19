/**
 * Audit #4 — Unit tests for compliance math, pilot risk guard, and PII redactor.
 *
 * These are pure-logic modules with no I/O, so they are ideal for deterministic
 * unit tests that lock in the exact boundary behavior.
 */

import { describe, it, expect } from "vitest";

// Compliance math
import {
  computeComplianceStatus,
  computeCODCompliance,
  evaluateCompliance,
  getComplianceLabel,
} from "@/lib/compliance";

// Pilot risk guard
import {
  defaultRiskPolicy,
  guardToolExecution,
  getTool,
  type ToolExecutionContext,
} from "@/lib/pilot/tools";

// PII redactor
import { sanitizeText } from "@/lib/pilot/pii";

// =============================================================================
// Compliance Math
// =============================================================================

describe("computeComplianceStatus", () => {
  // ratio: min=0.9, max=1.1, range=0.2, buffer=0.1
  // warningMin = 0.9 - 0.02 = 0.88, warningMax = 1.1 + 0.02 = 1.12

  it("returns compliant when value is within [min, max]", () => {
    expect(computeComplianceStatus(1.0, 0.9, 1.1)).toBe("compliant");
    expect(computeComplianceStatus(0.9, 0.9, 1.1)).toBe("compliant");
    expect(computeComplianceStatus(1.1, 0.9, 1.1)).toBe("compliant");
  });

  it("returns warning when value is in the buffer zone", () => {
    expect(computeComplianceStatus(0.89, 0.9, 1.1)).toBe("warning");
    expect(computeComplianceStatus(1.11, 0.9, 1.1)).toBe("warning");
  });

  it("returns warning at exact buffer boundaries", () => {
    expect(computeComplianceStatus(0.88, 0.9, 1.1)).toBe("warning");
    expect(computeComplianceStatus(1.12, 0.9, 1.1)).toBe("warning");
  });

  it("returns non-compliant when value is outside the buffer zone", () => {
    expect(computeComplianceStatus(0.87, 0.9, 1.1)).toBe("non-compliant");
    expect(computeComplianceStatus(1.13, 0.9, 1.1)).toBe("non-compliant");
  });

  it("respects a custom warning buffer", () => {
    // buffer=0.5 → warningMin = 0.9 - 0.1 = 0.8, warningMax = 1.1 + 0.1 = 1.2
    expect(computeComplianceStatus(0.85, 0.9, 1.1, 0.5)).toBe("warning");
    expect(computeComplianceStatus(0.79, 0.9, 1.1, 0.5)).toBe("non-compliant");
  });
});

describe("computeCODCompliance", () => {
  // codMax=15: compliant ≤15, warning ≤17.25 (15*1.15), non-compliant >17.25

  it("returns compliant when COD is at or below max", () => {
    expect(computeCODCompliance(10, 15)).toBe("compliant");
    expect(computeCODCompliance(15, 15)).toBe("compliant");
  });

  it("returns warning when COD is within 15% above max", () => {
    expect(computeCODCompliance(16, 15)).toBe("warning");
    expect(computeCODCompliance(17.25, 15)).toBe("warning");
  });

  it("returns non-compliant when COD exceeds 15% above max", () => {
    expect(computeCODCompliance(17.26, 15)).toBe("non-compliant");
    expect(computeCODCompliance(25, 15)).toBe("non-compliant");
  });
});

describe("evaluateCompliance (residential thresholds)", () => {
  const good = { medianRatio: 1.0, cod: 10, prd: 1.0, prb: 0 };

  it("returns all-compliant when every metric is in range", () => {
    const r = evaluateCompliance(good);
    expect(r.overall).toBe("compliant");
    expect(r.ratio).toBe("compliant");
    expect(r.cod).toBe("compliant");
    expect(r.prd).toBe("compliant");
    expect(r.prb).toBe("compliant");
    expect(r.details).toContain("All IAAO standards met");
  });

  it("returns warning when one metric is in the buffer zone", () => {
    const r = evaluateCompliance({ ...good, medianRatio: 0.89 });
    expect(r.overall).toBe("warning");
    expect(r.ratio).toBe("warning");
    expect(r.details.some((d) => d.includes("Median ratio"))).toBe(true);
  });

  it("returns non-compliant when one metric is out of range", () => {
    const r = evaluateCompliance({ ...good, medianRatio: 0.8 });
    expect(r.overall).toBe("non-compliant");
    expect(r.ratio).toBe("non-compliant");
  });

  it("uses worst-of aggregation (non-compliant beats warning)", () => {
    const r = evaluateCompliance({ ...good, medianRatio: 0.89, cod: 20 });
    expect(r.overall).toBe("non-compliant");
    expect(r.ratio).toBe("warning");
    expect(r.cod).toBe("non-compliant");
  });

  it("flags PRD direction correctly (regressive > 1, progressive ≤ 1)", () => {
    const regressive = evaluateCompliance({ ...good, prd: 1.05 });
    expect(regressive.prd).toBe("non-compliant");
    expect(regressive.details.some((d) => d.includes("regressive"))).toBe(true);

    const progressive = evaluateCompliance({ ...good, prd: 0.95 });
    expect(progressive.prd).toBe("non-compliant");
    expect(progressive.details.some((d) => d.includes("progressive"))).toBe(true);
  });

  it("flags PRB direction correctly (regressive > 0, progressive ≤ 0)", () => {
    const regressive = evaluateCompliance({ ...good, prb: 0.08 });
    expect(regressive.prb).toBe("non-compliant");
    expect(regressive.details.some((d) => d.includes("regressive"))).toBe(true);

    const progressive = evaluateCompliance({ ...good, prb: -0.08 });
    expect(progressive.prb).toBe("non-compliant");
    expect(progressive.details.some((d) => d.includes("progressive"))).toBe(true);
  });
});

describe("getComplianceLabel", () => {
  it("maps statuses to display labels", () => {
    expect(getComplianceLabel("compliant")).toBe("IAAO Compliant");
    expect(getComplianceLabel("warning")).toBe("Review Needed");
    expect(getComplianceLabel("non-compliant")).toBe("Non-Compliant");
  });
});

// =============================================================================
// Pilot Risk Guard
// =============================================================================

describe("defaultRiskPolicy", () => {
  it("read_only requires nothing", () => {
    const p = defaultRiskPolicy("read_only");
    expect(p.requiresConfirmation).toBe(false);
    expect(p.requiresReasonCode).toBe(false);
    expect(p.requiresSupervisor).toBe(false);
  });

  it("write_low requires nothing", () => {
    const p = defaultRiskPolicy("write_low");
    expect(p.requiresConfirmation).toBe(false);
    expect(p.requiresReasonCode).toBe(false);
    expect(p.requiresSupervisor).toBe(false);
  });

  it("write_high requires confirmation + reason code", () => {
    const p = defaultRiskPolicy("write_high");
    expect(p.requiresConfirmation).toBe(true);
    expect(p.requiresReasonCode).toBe(true);
    expect(p.requiresSupervisor).toBe(false);
  });

  it("irreversible requires confirmation + reason code + supervisor", () => {
    const p = defaultRiskPolicy("irreversible");
    expect(p.requiresConfirmation).toBe(true);
    expect(p.requiresReasonCode).toBe(true);
    expect(p.requiresSupervisor).toBe(true);
  });
});

describe("guardToolExecution", () => {
  const baseCtx: ToolExecutionContext = {
    countyId: "03051",
    userId: "demo@terrafusion.gov",
    userClaims: ["parcel:read", "ratio:run", "calibration:write", "snapshot:publish"],
    enabledTools: ["route_to_parcel", "run_ratio_study", "create_calibration_patch", "publish_snapshot"],
    currentMode: "pilot",
    correlationId: "corr-test",
  };

  it("allows a read_only tool with correct mode, allowlist, and claims", () => {
    const tool = getTool("route_to_parcel")!;
    const d = guardToolExecution(tool, baseCtx);
    expect(d.ok).toBe(true);
  });

  it("blocks when mode does not match", () => {
    const tool = getTool("route_to_parcel")!; // pilot-only
    const d = guardToolExecution(tool, { ...baseCtx, currentMode: "muse" });
    expect(d.ok).toBe(false);
    if (!d.ok) expect(d.blockedBy).toBe("mode");
  });

  it("blocks when tool is not in the allowlist", () => {
    const tool = getTool("route_to_parcel")!;
    const d = guardToolExecution(tool, { ...baseCtx, enabledTools: [] });
    expect(d.ok).toBe(false);
    if (!d.ok) expect(d.blockedBy).toBe("allowlist");
  });

  it("blocks when required claims are missing", () => {
    const tool = getTool("route_to_parcel")!; // requires parcel:read
    const d = guardToolExecution(tool, { ...baseCtx, userClaims: [] });
    expect(d.ok).toBe(false);
    if (!d.ok) {
      expect(d.blockedBy).toBe("rbac");
      expect(d.summary).toContain("parcel:read");
    }
  });

  it("blocks write_high without confirmation", () => {
    const tool = getTool("create_calibration_patch")!;
    const d = guardToolExecution(tool, baseCtx);
    expect(d.ok).toBe(false);
    if (!d.ok) expect(d.blockedBy).toBe("policy");
  });

  it("blocks write_high without reason code (even with confirmation)", () => {
    const tool = getTool("create_calibration_patch")!;
    const d = guardToolExecution(tool, baseCtx, { confirmed: true });
    expect(d.ok).toBe(false);
    if (!d.ok) expect(d.blockedBy).toBe("policy");
  });

  it("allows write_high with confirmation + reason code", () => {
    const tool = getTool("create_calibration_patch")!;
    const d = guardToolExecution(tool, baseCtx, {
      confirmed: true,
      reasonCode: "DATA_FIX",
    });
    expect(d.ok).toBe(true);
  });

  it("blocks irreversible without supervisor approval", () => {
    const tool = getTool("publish_snapshot")!;
    const d = guardToolExecution(tool, baseCtx, {
      confirmed: true,
      reasonCode: "QA",
    });
    expect(d.ok).toBe(false);
    if (!d.ok) expect(d.blockedBy).toBe("policy");
  });

  it("allows irreversible with all three: confirmation + reason + supervisor", () => {
    const tool = getTool("publish_snapshot")!;
    const d = guardToolExecution(tool, baseCtx, {
      confirmed: true,
      reasonCode: "QA",
      supervisorApprovalRef: "sup-123",
    });
    expect(d.ok).toBe(true);
  });

  it("county policy can tighten read_only to require confirmation", () => {
    const tool = getTool("route_to_parcel")!;
    const d = guardToolExecution(tool, baseCtx, {}, {
      read_only: { requiresConfirmation: true },
    });
    expect(d.ok).toBe(false);
    if (!d.ok) expect(d.blockedBy).toBe("policy");
  });
});

// =============================================================================
// PII Redactor
// =============================================================================

describe("sanitizeText", () => {
  it("redacts SSN", () => {
    expect(sanitizeText("SSN: 123-45-6789")).toBe("SSN: [REDACTED_SSN]");
  });

  it("redacts email addresses", () => {
    expect(sanitizeText("Contact: jane.doe@county.gov")).toBe(
      "Contact: [REDACTED_EMAIL]",
    );
  });

  it("redacts phone numbers (various formats)", () => {
    expect(sanitizeText("Call: 509-555-0142")).toBe("Call: [REDACTED_PHONE]");
    expect(sanitizeText("Call: (509) 555-0142")).toBe("Call: [REDACTED_PHONE]");
    expect(sanitizeText("Call: +1 509-555-0142")).toBe("Call: [REDACTED_PHONE]");
  });

  it("redacts multiple PII types in one string", () => {
    const input = "Owner: Jane <jane@county.gov>, SSN 123-45-6789, phone 509-555-0142";
    const out = sanitizeText(input);
    expect(out).toContain("[REDACTED_EMAIL]");
    expect(out).toContain("[REDACTED_SSN]");
    expect(out).toContain("[REDACTED_PHONE]");
    expect(out).not.toContain("jane@county.gov");
    expect(out).not.toContain("123-45-6789");
    expect(out).not.toContain("509-555-0142");
  });

  it("leaves clean text unchanged", () => {
    const clean = "Parcel 03051-00123-045 assessed at $450,000 in 2024.";
    expect(sanitizeText(clean)).toBe(clean);
  });

  it("does not redact short numeric strings that are not SSNs/phones", () => {
    // 3-digit numbers alone should not match phone pattern
    expect(sanitizeText("Zone 123 has 456 parcels")).toBe("Zone 123 has 456 parcels");
  });

  it("does not redact long digit runs that are not phones (lookbehind guard)", () => {
    // A 16-digit order number must not be partially matched as a phone.
    expect(sanitizeText("Order 1234567890123456 done")).toBe("Order 1234567890123456 done");
  });

  it("redacts a 10-digit phone with no separators", () => {
    expect(sanitizeText("Call 5095550142 now")).toBe("Call [REDACTED_PHONE] now");
  });
});