/**
 * TerraFusion Court-Ready Export API
 * 
 * Generates comprehensive valuation defense packages with full data provenance.
 * All exports include cryptographic hashes for court admissibility.
 */

import { NextRequest, NextResponse } from "next/server";

// =============================================================================
// Types
// =============================================================================

interface ExportRequest {
  parcel_id: string;
  county_fips: string;
  roll_year: number;
  sections: string[];
  format: "pdf" | "docx";
  include_attachments?: boolean;
}

interface ExportResponse {
  export_id: string;
  parcel_id: string;
  format: string;
  sections_included: string[];
  generated_at: string;
  generated_by: string;
  package_hash: string;
  download_url: string;
  expires_at: string;
  lineage_events_count: number;
  certification: {
    certified_by: string;
    certified_at: string;
    signature_hash: string;
  };
}

// =============================================================================
// Helpers
// =============================================================================

function generatePackageHash(data: ExportRequest): string {
  // In production: use crypto.subtle.digest for real SHA-256
  const input = JSON.stringify({
    ...data,
    timestamp: new Date().toISOString(),
  });
  
  // Simulated hash for demo
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `sha256:${Math.abs(hash).toString(16).padStart(16, "0")}${Date.now().toString(16)}`;
}

function generateExportId(): string {
  return `exp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// =============================================================================
// POST - Generate Export Package
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body: ExportRequest = await request.json();
    
    // Validate required fields
    if (!body.parcel_id || !body.county_fips || !body.roll_year || !body.sections?.length) {
      return NextResponse.json(
        { error: "Missing required fields: parcel_id, county_fips, roll_year, sections" },
        { status: 400 }
      );
    }

    // Validate sections
    const validSections = [
      "property_summary",
      "valuation_history",
      "comparable_sales",
      "model_coefficients",
      "data_lineage",
      "methodology_statement",
      "certification",
    ];
    
    const invalidSections = body.sections.filter(s => !validSections.includes(s));
    if (invalidSections.length > 0) {
      return NextResponse.json(
        { error: `Invalid sections: ${invalidSections.join(", ")}` },
        { status: 400 }
      );
    }

    // Ensure required sections are included
    const requiredSections = ["property_summary", "valuation_history", "data_lineage", "certification"];
    const missingSections = requiredSections.filter(s => !body.sections.includes(s));
    if (missingSections.length > 0) {
      return NextResponse.json(
        { error: `Required sections missing: ${missingSections.join(", ")}` },
        { status: 400 }
      );
    }

    // Generate export
    const exportId = generateExportId();
    const packageHash = generatePackageHash(body);
    const generatedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    // In production: Actually generate the PDF/DOCX using a library like pdfkit or docx
    // For now, return the metadata that would accompany the generated file

    const response: ExportResponse = {
      export_id: exportId,
      parcel_id: body.parcel_id,
      format: body.format,
      sections_included: body.sections,
      generated_at: generatedAt,
      generated_by: "TerraFusion Export Service v1.0",
      package_hash: packageHash,
      download_url: `/api/export/court-packet/${exportId}/download`,
      expires_at: expiresAt,
      lineage_events_count: 12, // Simulated
      certification: {
        certified_by: `${body.county_fips} County Assessor`,
        certified_at: generatedAt,
        signature_hash: `sig:${packageHash.slice(7, 23)}`,
      },
    };

    // Set cache headers
    const headers = new Headers();
    headers.set("Cache-Control", "no-store"); // Never cache export results
    headers.set("X-Export-Id", exportId);
    headers.set("X-Package-Hash", packageHash);

    return NextResponse.json(response, { status: 201, headers });
  } catch (error) {
    console.error("[ExportAPI] Error generating export:", error);
    return NextResponse.json(
      { error: "Failed to generate export package" },
      { status: 500 }
    );
  }
}

// =============================================================================
// GET - Export Status / Metadata
// =============================================================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const exportId = searchParams.get("export_id");

  if (!exportId) {
    // Return available export templates
    return NextResponse.json({
      templates: [
        {
          id: "boe_appeal",
          name: "BOE Appeal Package",
          description: "Complete package for Board of Equalization appeals",
          default_sections: [
            "property_summary",
            "valuation_history",
            "comparable_sales",
            "data_lineage",
            "certification",
          ],
        },
        {
          id: "ratio_study",
          name: "Ratio Study Report",
          description: "IAAO-compliant ratio study documentation",
          default_sections: [
            "property_summary",
            "valuation_history",
            "model_coefficients",
            "methodology_statement",
            "certification",
          ],
        },
        {
          id: "full_defense",
          name: "Full Valuation Defense",
          description: "Comprehensive package with all available sections",
          default_sections: [
            "property_summary",
            "valuation_history",
            "comparable_sales",
            "model_coefficients",
            "data_lineage",
            "methodology_statement",
            "certification",
          ],
        },
      ],
      available_sections: [
        { id: "property_summary", required: true },
        { id: "valuation_history", required: true },
        { id: "comparable_sales", required: false },
        { id: "model_coefficients", required: false },
        { id: "data_lineage", required: true },
        { id: "methodology_statement", required: false },
        { id: "certification", required: true },
      ],
      supported_formats: ["pdf", "docx"],
    });
  }

  // In production: Look up export status from database
  return NextResponse.json({
    export_id: exportId,
    status: "completed",
    download_url: `/api/export/court-packet/${exportId}/download`,
  });
}
