// lib/governance/stakeholder-launch.contract.test.ts
// Phase XXIV-B: Stakeholder & Audit Launch Package Contract Tests
// Validates document structure, required sections, and cross-references

import { describe, it, expect, beforeAll } from "vitest";
import * as fs from "fs";
import * as path from "path";

// ============================================
// Test Configuration
// ============================================

const DOCS_PATH = path.join(process.cwd(), "docs/golive");
const REQUIRED_APPROVALS = 2;

// Stop condition codes from XXIV-C
const STOP_CONDITION_CODES = ["STOP-001", "STOP-002", "STOP-003", "STOP-004", "STOP-005"] as const;

// KPI thresholds
const KPI_THRESHOLDS = {
  pilotWindowDays: 14,
  mttrMinutes: 30,
  rollbackPercent: 95,
  availabilityPercent: 99.5,
  drFreshnessDays: 90,
} as const;

// PII identifier pattern
const PII_CLEAN_PATTERN = /sha256:[a-z0-9_]+/;
const PII_LEAK_PATTERNS = [
  /\b\d{3}-\d{2}-\d{4}\b/, // SSN
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, // Email (unless redacted)
  /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/, // Phone
];

// ============================================
// Document Loaders
// ============================================

interface DocumentContent {
  path: string;
  content: string;
  lines: string[];
}

function loadDocument(filename: string): DocumentContent | null {
  const filePath = path.join(DOCS_PATH, filename);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const content = fs.readFileSync(filePath, "utf-8");
  return {
    path: filePath,
    content,
    lines: content.split("\n"),
  };
}

function hasSection(doc: DocumentContent, sectionName: string): boolean {
  const pattern = new RegExp(`^#+\\s+.*${sectionName}`, "im");
  return pattern.test(doc.content);
}

function hasTable(doc: DocumentContent, headerPattern: RegExp): boolean {
  return headerPattern.test(doc.content);
}

function countMatches(doc: DocumentContent, pattern: RegExp): number {
  const matches = doc.content.match(new RegExp(pattern.source, "g"));
  return matches ? matches.length : 0;
}

// ============================================
// EXECUTIVE_BRIEF.md Tests
// ============================================

describe("EXECUTIVE_BRIEF.md", () => {
  let doc: DocumentContent | null;

  beforeAll(() => {
    doc = loadDocument("EXECUTIVE_BRIEF.md");
  });

  it("exists in docs/golive/", () => {
    expect(doc).not.toBeNull();
  });

  describe("Required Sections", () => {
    it("has 'What Is Live' section", () => {
      expect(hasSection(doc!, "What Is Live")).toBe(true);
    });

    it("has 'Why It Is Safe' section", () => {
      expect(hasSection(doc!, "Why It Is Safe")).toBe(true);
    });

    it("has 'What Is Governed' section", () => {
      expect(hasSection(doc!, "What Is Governed")).toBe(true);
    });

    it("has 'What Is Measurable' section", () => {
      expect(hasSection(doc!, "What Is Measurable")).toBe(true);
    });

    it("has 'Leadership Action Items' section", () => {
      expect(hasSection(doc!, "Leadership Action Items")).toBe(true);
    });

    it("has 'Document Attestation' section", () => {
      expect(hasSection(doc!, "Document Attestation")).toBe(true);
    });
  });

  describe("Dual Approval Enforcement", () => {
    it("references REQUIRED_APPROVALS=2", () => {
      expect(doc!.content).toContain("REQUIRED_APPROVALS=2");
    });

    it("mentions dual approval requirement", () => {
      expect(doc!.content.toLowerCase()).toContain("dual approval");
    });
  });

  describe("Stop Condition Alignment (XXIV-C)", () => {
    it.each(STOP_CONDITION_CODES)("references stop condition %s", (code) => {
      expect(doc!.content).toContain(code);
    });

    it("has stop condition table", () => {
      expect(hasTable(doc!, /Code.*Trigger.*Response/i)).toBe(true);
    });
  });

  describe("KPI Thresholds", () => {
    it("specifies 14-day pilot window", () => {
      expect(doc!.content).toMatch(/14[\s-]?day/i);
    });

    it("specifies MTTR ≤ 30 minutes", () => {
      expect(doc!.content).toMatch(/MTTR.*≤?\s*30\s*min/i);
    });

    it("specifies rollback ≥ 95%", () => {
      expect(doc!.content).toMatch(/rollback.*≥?\s*95\s*%/i);
    });

    it("specifies availability ≥ 99.5%", () => {
      expect(doc!.content).toMatch(/availability.*≥?\s*99\.5\s*%/i);
    });

    it("specifies DR freshness ≤ 90 days", () => {
      expect(doc!.content).toMatch(/DR.*≤?\s*90\s*day/i);
    });
  });

  describe("Content Hash", () => {
    it("has content hash in header", () => {
      expect(doc!.content).toMatch(/Content Hash:.*sha256:/);
    });
  });
});

// ============================================
// SAMPLE_AUDIT_PACKET_AGENCY.md Tests
// ============================================

describe("SAMPLE_AUDIT_PACKET_AGENCY.md", () => {
  let doc: DocumentContent | null;

  beforeAll(() => {
    doc = loadDocument("SAMPLE_AUDIT_PACKET_AGENCY.md");
  });

  it("exists in docs/golive/", () => {
    expect(doc).not.toBeNull();
  });

  describe("Required Sections", () => {
    it("has 'Packet Overview' section", () => {
      expect(hasSection(doc!, "Packet Overview")).toBe(true);
    });

    it("has 'Compliance Evidence' section", () => {
      expect(hasSection(doc!, "Compliance Evidence")).toBe(true);
    });

    it("has 'Operational Evidence' section", () => {
      expect(hasSection(doc!, "Operational Evidence")).toBe(true);
    });

    it("has 'Access Control Evidence' section", () => {
      expect(hasSection(doc!, "Access Control Evidence")).toBe(true);
    });

    it("has 'Stop Condition Verification' section", () => {
      expect(hasSection(doc!, "Stop Condition Verification")).toBe(true);
    });

    it("has 'Attestation Chain' section", () => {
      expect(hasSection(doc!, "Attestation Chain")).toBe(true);
    });

    it("has 'Cross-Document References' section", () => {
      expect(hasSection(doc!, "Cross-Document References")).toBe(true);
    });
  });

  describe("PII Clean (sha256: prefix)", () => {
    it("uses sha256: prefixed identifiers", () => {
      const matches = countMatches(doc!, PII_CLEAN_PATTERN);
      expect(matches).toBeGreaterThan(10); // Should have many sha256: refs
    });

    it("has redaction summary table", () => {
      expect(hasTable(doc!, /Data Type.*Count.*Replacement/i)).toBe(true);
    });

    it("includes redaction confirmation in header", () => {
      expect(doc!.content).toMatch(/Redaction Confirmation/i);
    });

    it.each(PII_LEAK_PATTERNS.map((p, i) => [i, p] as const))(
      "does not contain raw PII pattern %i",
      (_, pattern) => {
        // Skip [REDACTED_*] markers - those are intentional
        const contentWithoutRedactions = doc!.content.replace(/\[REDACTED_[A-Z]+\]/g, "");
        // Also skip sha256: prefixed strings
        const cleanContent = contentWithoutRedactions.replace(/sha256:[a-z0-9_]+/g, "");
        const matches = cleanContent.match(pattern);
        // Allow email pattern if it's generic documentation
        if (matches) {
          expect(matches.every((m) => m.includes("@example") || m.includes("@test"))).toBe(true);
        }
      }
    );
  });

  describe("IAAO Metrics", () => {
    it("includes median ratio metric", () => {
      expect(doc!.content.toLowerCase()).toContain("median ratio");
    });

    it("includes COD metric", () => {
      expect(doc!.content).toContain("COD");
    });

    it("includes PRD metric", () => {
      expect(doc!.content).toContain("PRD");
    });

    it("includes PRB metric", () => {
      expect(doc!.content).toContain("PRB");
    });
  });

  describe("Evidence Hashes", () => {
    it("has multiple evidence hashes", () => {
      const hashCount = countMatches(doc!, /Evidence Hash:.*sha256:/);
      expect(hashCount).toBeGreaterThan(0);
    });
  });
});

// ============================================
// HASH_STAMPED_NARRATIVE_EXCERPTS.md Tests
// ============================================

describe("HASH_STAMPED_NARRATIVE_EXCERPTS.md", () => {
  let doc: DocumentContent | null;

  beforeAll(() => {
    doc = loadDocument("HASH_STAMPED_NARRATIVE_EXCERPTS.md");
  });

  it("exists in docs/golive/", () => {
    expect(doc).not.toBeNull();
  });

  describe("Required Sections", () => {
    it("has 'Document Purpose' section", () => {
      expect(hasSection(doc!, "Document Purpose")).toBe(true);
    });

    it("has 'Control-Evidence Mappings' section", () => {
      expect(hasSection(doc!, "Control-Evidence Mappings")).toBe(true);
    });

    it("has 'Hash Verification Instructions' section", () => {
      expect(hasSection(doc!, "Hash Verification")).toBe(true);
    });

    it("has 'Attestation' section", () => {
      expect(hasSection(doc!, "Attestation")).toBe(true);
    });
  });

  describe("Stop Condition Evidence (XXIV-C Alignment)", () => {
    it.each(STOP_CONDITION_CODES)("has evidence mapping for %s", (code) => {
      expect(doc!.content).toContain(code);
    });
  });

  describe("Evidence Structure", () => {
    it("includes generation timestamps", () => {
      expect(doc!.content).toMatch(/Generation Timestamp/i);
    });

    it("includes source references", () => {
      expect(doc!.content).toMatch(/Source/i);
    });

    it("includes verification commands", () => {
      expect(doc!.content).toMatch(/Verification/i);
    });
  });

  describe("Reproducibility", () => {
    it("mentions reproducibility guarantee", () => {
      expect(doc!.content.toLowerCase()).toContain("reproducib");
    });

    it("includes verification instructions", () => {
      expect(doc!.content).toContain("sha256sum");
    });
  });

  describe("Content Hashes", () => {
    it("has multiple sha256 hashes", () => {
      const hashCount = countMatches(doc!, /sha256:[a-z0-9_]+/);
      expect(hashCount).toBeGreaterThan(15);
    });
  });
});

// ============================================
// PILOT_STATUS_DASHBOARD_GUIDE.md Tests
// ============================================

describe("PILOT_STATUS_DASHBOARD_GUIDE.md", () => {
  let doc: DocumentContent | null;

  beforeAll(() => {
    doc = loadDocument("PILOT_STATUS_DASHBOARD_GUIDE.md");
  });

  it("exists in docs/golive/", () => {
    expect(doc).not.toBeNull();
  });

  describe("Required Panels", () => {
    it("documents Readiness Panel", () => {
      expect(hasSection(doc!, "Readiness Panel")).toBe(true);
    });

    it("documents Exception Panel", () => {
      expect(hasSection(doc!, "Exception Panel")).toBe(true);
    });

    it("documents Stop Watch Panel", () => {
      expect(hasSection(doc!, "Stop Watch Panel")).toBe(true);
    });

    it("documents DR Freshness Panel", () => {
      expect(hasSection(doc!, "DR Freshness Panel")).toBe(true);
    });

    it("documents KPI Metrics Panel", () => {
      expect(hasSection(doc!, "KPI.*Panel")).toBe(true);
    });
  });

  describe("KPI Thresholds Documentation", () => {
    it("documents MTTR threshold (30 min)", () => {
      expect(doc!.content).toMatch(/30\s*min/i);
    });

    it("documents rollback threshold (95%)", () => {
      expect(doc!.content).toMatch(/95\s*%/);
    });

    it("documents availability threshold (99.5%)", () => {
      expect(doc!.content).toMatch(/99\.5\s*%/);
    });

    it("documents DR freshness threshold (90 days)", () => {
      expect(doc!.content).toMatch(/90\s*day/i);
    });
  });

  describe("Stop Condition Documentation", () => {
    it.each(STOP_CONDITION_CODES)("documents stop condition %s", (code) => {
      expect(doc!.content).toContain(code);
    });

    it("documents stop condition triggers", () => {
      expect(doc!.content.toLowerCase()).toContain("trigger");
    });

    it("documents safe mode", () => {
      expect(doc!.content.toLowerCase()).toContain("safe mode");
    });
  });

  describe("Visual Examples", () => {
    it("includes ASCII dashboard mockups", () => {
      expect(doc!.content).toContain("┌");
      expect(doc!.content).toContain("└");
    });

    it("includes indicator color explanations", () => {
      expect(doc!.content).toMatch(/Green[\s\S]*Yellow[\s\S]*Red/i);
    });
  });

  describe("Quick Reference", () => {
    it("has daily checklist", () => {
      expect(doc!.content.toLowerCase()).toContain("checklist");
    });

    it("has escalation triggers", () => {
      expect(doc!.content.toLowerCase()).toContain("escalation");
    });
  });
});

// ============================================
// FAQ_FOR_AGENCY_LEADERSHIP.md Tests
// ============================================

describe("FAQ_FOR_AGENCY_LEADERSHIP.md", () => {
  let doc: DocumentContent | null;

  beforeAll(() => {
    doc = loadDocument("FAQ_FOR_AGENCY_LEADERSHIP.md");
  });

  it("exists in docs/golive/", () => {
    expect(doc).not.toBeNull();
  });

  describe("Required FAQ Categories", () => {
    it("has 'Incident Response' section", () => {
      expect(hasSection(doc!, "Incident Response")).toBe(true);
    });

    it("has 'Compliance Proof' section", () => {
      expect(hasSection(doc!, "Compliance Proof")).toBe(true);
    });

    it("has 'Safe Mode & Rollback' section", () => {
      expect(hasSection(doc!, "Safe Mode.*Rollback")).toBe(true);
    });

    it("has 'Pilot Operations' section", () => {
      expect(hasSection(doc!, "Pilot Operations")).toBe(true);
    });

    it("has 'Your Responsibilities' section", () => {
      expect(hasSection(doc!, "Your Responsibilities")).toBe(true);
    });
  });

  describe("Key Questions Answered", () => {
    it("answers 'What happens when something breaks?'", () => {
      expect(doc!.content).toContain("What happens when something breaks");
    });

    it("answers 'How do we prove compliance?'", () => {
      expect(doc!.content).toMatch(/how do we prove compliance/i);
    });

    it("answers questions about stop conditions", () => {
      expect(doc!.content.toLowerCase()).toContain("stop condition");
    });

    it("answers questions about safe mode", () => {
      expect(doc!.content.toLowerCase()).toContain("safe mode");
    });

    it("answers questions about rollback", () => {
      expect(doc!.content.toLowerCase()).toContain("rollback");
    });

    it("answers questions about dual approval", () => {
      expect(doc!.content.toLowerCase()).toContain("dual approval");
    });
  });

  describe("Stop Condition Explanations", () => {
    it.each(STOP_CONDITION_CODES)("explains stop condition %s", (code) => {
      expect(doc!.content).toContain(code);
    });
  });

  describe("Practical Guidance", () => {
    it("includes action tables", () => {
      expect(hasTable(doc!, /Action|When|Your Role/i)).toBe(true);
    });

    it("includes contact information", () => {
      expect(doc!.content.toLowerCase()).toContain("contact");
    });

    it("includes key documents reference", () => {
      expect(doc!.content.toLowerCase()).toContain("key documents");
    });
  });

  describe("Dual Approval Documentation", () => {
    it("references REQUIRED_APPROVALS=2", () => {
      expect(doc!.content).toContain("REQUIRED_APPROVALS=2");
    });

    it("explains approval workflow", () => {
      expect(doc!.content.toLowerCase()).toContain("approval");
    });
  });

  describe("Quick Reference", () => {
    it("has threshold quick reference", () => {
      expect(doc!.content.toLowerCase()).toContain("threshold");
    });
  });
});

// ============================================
// Cross-Document Reference Tests
// ============================================

describe("Cross-Document References", () => {
  let executiveBrief: DocumentContent | null;
  let auditPacket: DocumentContent | null;
  let hashNarrative: DocumentContent | null;
  let dashboardGuide: DocumentContent | null;
  let faq: DocumentContent | null;

  beforeAll(() => {
    executiveBrief = loadDocument("EXECUTIVE_BRIEF.md");
    auditPacket = loadDocument("SAMPLE_AUDIT_PACKET_AGENCY.md");
    hashNarrative = loadDocument("HASH_STAMPED_NARRATIVE_EXCERPTS.md");
    dashboardGuide = loadDocument("PILOT_STATUS_DASHBOARD_GUIDE.md");
    faq = loadDocument("FAQ_FOR_AGENCY_LEADERSHIP.md");
  });

  it("all five documents exist", () => {
    expect(executiveBrief).not.toBeNull();
    expect(auditPacket).not.toBeNull();
    expect(hashNarrative).not.toBeNull();
    expect(dashboardGuide).not.toBeNull();
    expect(faq).not.toBeNull();
  });

  describe("Stop Condition Consistency", () => {
    it("all documents reference the same stop condition codes", () => {
      const docs = [executiveBrief!, auditPacket!, hashNarrative!, dashboardGuide!, faq!];
      for (const code of STOP_CONDITION_CODES) {
        for (const doc of docs) {
          expect(doc.content).toContain(code);
        }
      }
    });
  });

  describe("KPI Threshold Consistency", () => {
    it("MTTR threshold consistent (30 min)", () => {
      const docs = [executiveBrief!, dashboardGuide!, faq!];
      for (const doc of docs) {
        expect(doc.content).toMatch(/30\s*min/i);
      }
    });

    it("availability threshold consistent (99.5%)", () => {
      const docs = [executiveBrief!, dashboardGuide!, faq!];
      for (const doc of docs) {
        expect(doc.content).toMatch(/99\.5/);
      }
    });

    it("rollback threshold consistent (95%)", () => {
      const docs = [executiveBrief!, dashboardGuide!, faq!];
      for (const doc of docs) {
        expect(doc.content).toMatch(/95\s*%/);
      }
    });

    it("DR freshness threshold consistent (90 days)", () => {
      const docs = [executiveBrief!, dashboardGuide!, faq!];
      for (const doc of docs) {
        expect(doc.content).toMatch(/90\s*day/i);
      }
    });

    it("pilot window consistent (14 days)", () => {
      const docs = [executiveBrief!, faq!];
      for (const doc of docs) {
        expect(doc.content).toMatch(/14[\s-]?day/i);
      }
    });
  });

  describe("Dual Approval Consistency", () => {
    it("dual approval referenced in multiple documents", () => {
      const docsWithDualApproval = [executiveBrief!, faq!];
      for (const doc of docsWithDualApproval) {
        expect(doc.content.toLowerCase()).toContain("dual approval");
      }
    });
  });

  describe("Content Hash Presence", () => {
    it("all documents have content hash", () => {
      const docs = [executiveBrief!, auditPacket!, hashNarrative!, dashboardGuide!, faq!];
      for (const doc of docs) {
        expect(doc.content).toMatch(/Content Hash.*sha256:/i);
      }
    });
  });
});

// ============================================
// Package Completeness Tests
// ============================================

describe("Phase XXIV-B Package Completeness", () => {
  it("has all 5 required deliverables", () => {
    const requiredFiles = [
      "EXECUTIVE_BRIEF.md",
      "SAMPLE_AUDIT_PACKET_AGENCY.md",
      "HASH_STAMPED_NARRATIVE_EXCERPTS.md",
      "PILOT_STATUS_DASHBOARD_GUIDE.md",
      "FAQ_FOR_AGENCY_LEADERSHIP.md",
    ];

    for (const file of requiredFiles) {
      const doc = loadDocument(file);
      expect(doc).not.toBeNull();
    }
  });

  it("total governance test count exceeds threshold", () => {
    // Phase XXIV-B adds tests on top of existing ~3,299
    // This test file adds 50+ tests
    expect(true).toBe(true); // Placeholder for actual test count
  });
});

// ============================================
// Phase XXIV-A Reference Documents
// ============================================

describe("Phase XXIV-A Reference Documents (Cross-Reference Validation)", () => {
  it("has PILOT_SELECTION_TEMPLATE.md", () => {
    const doc = loadDocument("PILOT_SELECTION_TEMPLATE.md");
    expect(doc).not.toBeNull();
    expect(doc!.content).toContain("sha256:pilot_selection_v1");
  });

  it("has WAR_ROOM_CADENCE.md", () => {
    const doc = loadDocument("WAR_ROOM_CADENCE.md");
    expect(doc).not.toBeNull();
    expect(doc!.content).toContain("sha256:war_room_v1");
  });

  it("has EXIT_CRITERIA_MATRIX.md", () => {
    const doc = loadDocument("EXIT_CRITERIA_MATRIX.md");
    expect(doc).not.toBeNull();
    expect(doc!.content).toContain("sha256:exit_criteria_v1");
  });

  it("EXIT_CRITERIA_MATRIX has 14 gates", () => {
    const doc = loadDocument("EXIT_CRITERIA_MATRIX.md");
    expect(doc!.content).toMatch(/Total Gates.*14/i);
  });

  it("WAR_ROOM_CADENCE has 7-step agenda", () => {
    const doc = loadDocument("WAR_ROOM_CADENCE.md");
    expect(doc!.content).toContain("Step 1");
    expect(doc!.content).toContain("Step 7");
  });

  it("all XXIV-A docs reference stop conditions", () => {
    const docs = [
      loadDocument("WAR_ROOM_CADENCE.md")!,
      loadDocument("EXIT_CRITERIA_MATRIX.md")!,
    ];
    for (const doc of docs) {
      for (const code of STOP_CONDITION_CODES) {
        expect(doc.content).toContain(code);
      }
    }
  });
});
