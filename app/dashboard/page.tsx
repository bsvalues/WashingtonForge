"use client";

import { AppShell } from "@/components/app-shell";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default function DashboardPage() {
  return (
    <AppShell
      user={{
        name: "Demo Assessor",
        email: "demo@terrafusion.gov",
        role: "Assessor Admin",
        county: "Benton County",
      }}
    >
      <DashboardContent />
    </AppShell>
  );
}
