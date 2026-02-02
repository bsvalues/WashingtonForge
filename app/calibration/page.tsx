"use client";

import { AppShell } from "@/components/app-shell";
import { CalibrationContent } from "@/components/calibration/calibration-content";

export default function CalibrationPage() {
  return (
    <AppShell
      user={{
        name: "Demo Assessor",
        email: "demo@terrafusion.gov",
        role: "assessor",
        countyName: "Benton County",
      }}
    >
      <CalibrationContent />
    </AppShell>
  );
}
