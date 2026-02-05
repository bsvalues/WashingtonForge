"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CountyOnboardingWizard } from "@/components/onboarding/county-onboarding-wizard";
import { DataStatusDashboard } from "@/components/onboarding/data-status-dashboard";
import { JoinQualityDashboard } from "@/components/onboarding/join-quality-dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { WACountyFips, OnboardingPath, CountyDataStatus } from "@/lib/wa-data/types";
import { getCountyDataStatus, initializeDemoCounties } from "@/lib/wa-data/client";
import { WA_COUNTIES } from "@/lib/wa-data/types";

export default function OnboardingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"wizard" | "status" | "quality">("wizard");
  const [countyStatus, setCountyStatus] = useState<CountyDataStatus | null>(null);
  const [selectedFips, setSelectedFips] = useState<WACountyFips | null>(null);

  // Initialize demo data on mount
  useEffect(() => {
    initializeDemoCounties();
  }, []);

  // Load county status when fips changes
  useEffect(() => {
    if (selectedFips) {
      getCountyDataStatus(selectedFips).then(setCountyStatus);
    }
  }, [selectedFips]);

  const handleOnboardingComplete = async (fips: WACountyFips, path: OnboardingPath) => {
    setSelectedFips(fips);
    const status = await getCountyDataStatus(fips);
    setCountyStatus(status);
    
    if (path === "public_quickstart") {
      // Show status dashboard after quick start
      setActiveTab("status");
    } else if (path === "file_drop") {
      // Navigate to ingest page
      router.push("/ingest");
    } else {
      // Navigate to data sources for connected feed setup
      router.push("/data-sources");
    }
  };

  const handleNavigate = (destination: string) => {
    switch (destination) {
      case "ingest":
        router.push("/ingest");
        break;
      case "cockpit":
        router.push("/cockpit");
        break;
      case "onboarding":
        setActiveTab("wizard");
        break;
      default:
        router.push(`/${destination}`);
    }
  };

  const handleRefresh = async () => {
    if (selectedFips) {
      const status = await getCountyDataStatus(selectedFips);
      setCountyStatus(status);
    }
  };

  return (
    <AppShell user={{ name: "Demo User", role: "Assessor", county: "Washington State" }}>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-foreground text-3xl font-bold tracking-tight">
            County Data Onboarding
          </h1>
          <p className="text-muted-foreground mt-2">
            Connect your county to Washington's sovereign valuation platform
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "wizard" | "status" | "quality")}>
          <TabsList className="tf-glass mb-6">
            <TabsTrigger value="wizard">Onboarding Wizard</TabsTrigger>
            <TabsTrigger value="status" disabled={!countyStatus}>
              Data Status
            </TabsTrigger>
            <TabsTrigger value="quality" disabled={!countyStatus || countyStatus.county_roll.status !== "active"}>
              Join Quality
            </TabsTrigger>
          </TabsList>

          <TabsContent value="wizard">
            <CountyOnboardingWizard onComplete={handleOnboardingComplete} />
          </TabsContent>

          <TabsContent value="status">
            {countyStatus && (
              <DataStatusDashboard
                status={countyStatus}
                onRefresh={handleRefresh}
                onNavigate={handleNavigate}
              />
            )}
          </TabsContent>

          <TabsContent value="quality">
            {countyStatus && selectedFips && (
              <JoinQualityDashboard
                countyFips={selectedFips}
                countyName={WA_COUNTIES[selectedFips]?.name || countyStatus.county_name}
                onExportMismatches={() => {
                  // In production: trigger CSV download
                  alert("Exporting mismatches CSV...");
                }}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
