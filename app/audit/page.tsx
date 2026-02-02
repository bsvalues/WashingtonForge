"use client";

import { AppShell } from "@/components/app-shell";
import { AuditContent } from "@/components/audit/audit-content";

export default function AuditPage() {
  return (
    <AppShell
      user={{
        name: "Demo Assessor",
        email: "demo@terrafusion.gov",
        role: "assessor",
        countyName: "Benton County",
      }}
    >
      <AuditContent />
    </AppShell>
  );
}
