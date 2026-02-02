"use client";

import { AppShell } from "@/components/app-shell";
import { SnapshotsContent } from "@/components/snapshots/snapshots-content";

export default function SnapshotsPage() {
  return (
    <AppShell
      user={{
        name: "Demo Assessor",
        email: "demo@terrafusion.gov",
        role: "assessor",
        countyName: "Benton County",
      }}
    >
      <SnapshotsContent />
    </AppShell>
  );
}
