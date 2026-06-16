"use client";

import { useState, useCallback } from "react";
import {
  MapPin,
  Upload,
  Link2,
  Globe,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Database,
  FileSpreadsheet,
  Zap,
  Shield,
  Clock,
  Users,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  WA_COUNTIES,
  type WACountyFips,
  type OnboardingPath,
} from "@/lib/wa-data/types";
import {
  loadWAParcelFabric,
  startOnboarding,
  getCountyDataStatus,
} from "@/lib/wa-data/client";

interface CountyOnboardingWizardProps {
  onComplete?: (fips: WACountyFips, path: OnboardingPath) => void;
}

type WizardStep = "select_county" | "choose_path" | "loading_fabric" | "configure" | "complete";

const ONBOARDING_PATHS: {
  id: OnboardingPath;
  title: string;
  description: string;
  icon: typeof Globe;
  benefits: string[];
  effort: "low" | "medium" | "high";
  timeEstimate: string;
}[] = [
  {
    id: "public_quickstart",
    title: "Public Quick Start",
    description: "Get started instantly with WA statewide parcel data. Add your county roll and sales later.",
    icon: Globe,
    benefits: [
      "No IT involvement needed",
      "Working cockpit in minutes",
      "Add county data anytime",
    ],
    effort: "low",
    timeEstimate: "2 minutes",
  },
  {
    id: "file_drop",
    title: "File Upload",
    description: "Upload your existing CSV, Excel, or GDB exports. AI will map fields automatically.",
    icon: Upload,
    benefits: [
      "Works with standard exports",
      "AI-powered field mapping",
      "Full data control",
    ],
    effort: "medium",
    timeEstimate: "15-30 minutes",
  },
  {
    id: "connected_feed",
    title: "Connected Feed",
    description: "Connect to ArcGIS, SFTP, or API endpoints for automatic updates.",
    icon: Link2,
    benefits: [
      "Automatic updates",
      "Always fresh data",
      "Set and forget",
    ],
    effort: "high",
    timeEstimate: "1-2 hours setup",
  },
];

export function CountyOnboardingWizard({ onComplete }: CountyOnboardingWizardProps) {
  const [step, setStep] = useState<WizardStep>("select_county");
  const [selectedCounty, setSelectedCounty] = useState<WACountyFips | null>(null);
  const [selectedPath, setSelectedPath] = useState<OnboardingPath | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fabricResult, setFabricResult] = useState<{
    parcelCount: number;
    coveragePct: number;
    sourceVersion: string;
  } | null>(null);

  const countyOptions = Object.entries(WA_COUNTIES).map(([fips, county]) => ({
    value: fips as WACountyFips,
    label: `${county.name} County`,
    tier: county.tier,
    population: county.population,
  }));

  const handleCountySelect = useCallback((fips: string) => {
    setSelectedCounty(fips as WACountyFips);
  }, []);

  const handlePathSelect = useCallback(async (path: OnboardingPath) => {
    setSelectedPath(path);
    
    if (path === "public_quickstart" && selectedCounty) {
      // Start loading WA parcel fabric immediately
      setStep("loading_fabric");
      setIsLoading(true);
      
      try {
        await startOnboarding(selectedCounty, path);
        const result = await loadWAParcelFabric(selectedCounty);
        setFabricResult(result);
        setStep("complete");
      } catch (error) {
        console.error("Failed to load fabric:", error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setStep("configure");
    }
  }, [selectedCounty]);

  const handleBack = useCallback(() => {
    if (step === "choose_path") {
      setStep("select_county");
    } else if (step === "configure") {
      setStep("choose_path");
      setSelectedPath(null);
    }
  }, [step]);

  const handleComplete = useCallback(() => {
    if (selectedCounty && selectedPath) {
      onComplete?.(selectedCounty, selectedPath);
    }
  }, [selectedCounty, selectedPath, onComplete]);

  const selectedCountyData = selectedCounty ? WA_COUNTIES[selectedCounty] : null;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Progress Indicator */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {["select_county", "choose_path", "configure"].map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
                step === s || (step === "loading_fabric" && s === "choose_path") || step === "complete"
                  ? "bg-primary text-primary-foreground"
                  : i < ["select_county", "choose_path", "configure"].indexOf(step)
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {i < ["select_county", "choose_path", "configure"].indexOf(step) || step === "complete" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                i + 1
              )}
            </div>
            {i < 2 && (
              <div
                className={cn(
                  "mx-2 h-0.5 w-12 transition-colors",
                  i < ["select_county", "choose_path", "configure"].indexOf(step)
                    ? "bg-primary"
                    : "bg-muted"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step: Select County */}
      {step === "select_county" && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-foreground text-2xl font-bold">Welcome to TerraFusion</h2>
            <p className="text-muted-foreground mt-2">
              Select your county to get started with Washington's sovereign valuation platform.
            </p>
          </div>

          <Card className="tf-glass p-6">
            <label className="text-foreground mb-2 block text-sm font-medium">
              Select Your County
            </label>
            <Select value={selectedCounty || undefined} onValueChange={handleCountySelect}>
              <SelectTrigger className="tf-glass border-border/50 w-full">
                <SelectValue placeholder="Choose a Washington county..." />
              </SelectTrigger>
              <SelectContent>
                {countyOptions.map((county) => (
                  <SelectItem key={county.value} value={county.value}>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{county.label}</span>
                      <span className="text-muted-foreground text-xs">
                        ({county.population.toLocaleString()} pop)
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedCountyData && (
              <div className="bg-muted/30 mt-4 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/20 flex h-10 w-10 items-center justify-center rounded-lg">
                    <MapPin className="text-primary h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-foreground font-medium">{selectedCountyData.name} County</p>
                    <p className="text-muted-foreground text-sm">
                      {selectedCountyData.tier.charAt(0).toUpperCase() + selectedCountyData.tier.slice(1)} county with{" "}
                      {selectedCountyData.population.toLocaleString()} residents
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={() => setStep("choose_path")}
              disabled={!selectedCounty}
              className="tf-glass-btn tf-glass-btn--primary"
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step: Choose Path */}
      {step === "choose_path" && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-foreground text-2xl font-bold">Choose Your Path</h2>
            <p className="text-muted-foreground mt-2">
              How would you like to connect {selectedCountyData?.name} County to TerraFusion?
            </p>
          </div>

          <div className="grid gap-4">
            {ONBOARDING_PATHS.map((path) => (
              <Card
                key={path.id}
                className={cn(
                  "tf-glass cursor-pointer p-6 transition-all hover:border-primary/50",
                  selectedPath === path.id && "border-primary ring-primary/20 ring-2"
                )}
                onClick={() => handlePathSelect(path.id)}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                      path.effort === "low"
                        ? "bg-green-400/20 text-green-400"
                        : path.effort === "medium"
                        ? "bg-amber-400/20 text-amber-400"
                        : "bg-blue-400/20 text-blue-400"
                    )}
                  >
                    <path.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-foreground text-lg font-semibold">{path.title}</h3>
                      {path.id === "public_quickstart" && (
                        <span className="rounded-full bg-green-400/20 px-2 py-0.5 text-xs font-medium text-green-400">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">{path.description}</p>
                    
                    <div className="mt-3 flex flex-wrap gap-4">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {path.timeEstimate}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Zap className="h-3.5 w-3.5" />
                        {path.effort === "low"
                          ? "No IT needed"
                          : path.effort === "medium"
                          ? "Self-service"
                          : "IT coordination"}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {path.benefits.map((benefit) => (
                        <span
                          key={benefit}
                          className="bg-muted/50 text-muted-foreground inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs"
                        >
                          <CheckCircle2 className="h-3 w-3 text-green-400" />
                          {benefit}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ArrowRight className="text-muted-foreground h-5 w-5 shrink-0" />
                </div>
              </Card>
            ))}
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={handleBack} className="tf-glass-btn">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        </div>
      )}

      {/* Step: Loading Fabric (for Quick Start) */}
      {step === "loading_fabric" && (
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
          <div>
            <h2 className="text-foreground text-2xl font-bold">Loading WA Parcel Fabric</h2>
            <p className="text-muted-foreground mt-2">
              Connecting {selectedCountyData?.name} County to the Washington statewide parcel database...
            </p>
          </div>
          <div className="mx-auto max-w-md space-y-3">
            <div className="flex items-center gap-3 text-left">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <span className="text-foreground text-sm">Connecting to WA Geo Portal</span>
            </div>
            <div className="flex items-center gap-3 text-left">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-muted-foreground text-sm">Loading parcel geometries...</span>
            </div>
            <div className="flex items-center gap-3 text-left">
              <div className="h-5 w-5" />
              <span className="text-muted-foreground text-sm">Building spatial index</span>
            </div>
          </div>
        </div>
      )}

      {/* Step: Configure (for File Drop or Connected Feed) */}
      {step === "configure" && selectedPath && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-foreground text-2xl font-bold">
              {selectedPath === "file_drop" ? "Upload Your Data" : "Configure Connection"}
            </h2>
            <p className="text-muted-foreground mt-2">
              {selectedPath === "file_drop"
                ? "Drag and drop your county data files to get started."
                : "Set up your automated data feed connection."}
            </p>
          </div>

          <Card className="tf-glass p-8">
            {selectedPath === "file_drop" ? (
              <div className="space-y-4">
                <div className="flex justify-center gap-4">
                  <div className="text-center">
                    <div className="bg-muted/30 mx-auto flex h-16 w-16 items-center justify-center rounded-xl">
                      <FileSpreadsheet className="text-muted-foreground h-8 w-8" />
                    </div>
                    <p className="text-muted-foreground mt-2 text-xs">CSV/Excel</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-muted/30 mx-auto flex h-16 w-16 items-center justify-center rounded-xl">
                      <Database className="text-muted-foreground h-8 w-8" />
                    </div>
                    <p className="text-muted-foreground mt-2 text-xs">Geodatabase</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-muted/30 mx-auto flex h-16 w-16 items-center justify-center rounded-xl">
                      <MapPin className="text-muted-foreground h-8 w-8" />
                    </div>
                    <p className="text-muted-foreground mt-2 text-xs">Shapefile</p>
                  </div>
                </div>
                <p className="text-muted-foreground text-center text-sm">
                  Continue to the Data Ingest page to upload your files.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center gap-4">
                  <div className="text-center">
                    <div className="bg-muted/30 mx-auto flex h-16 w-16 items-center justify-center rounded-xl">
                      <Globe className="text-muted-foreground h-8 w-8" />
                    </div>
                    <p className="text-muted-foreground mt-2 text-xs">ArcGIS Hub</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-muted/30 mx-auto flex h-16 w-16 items-center justify-center rounded-xl">
                      <Link2 className="text-muted-foreground h-8 w-8" />
                    </div>
                    <p className="text-muted-foreground mt-2 text-xs">REST API</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-muted/30 mx-auto flex h-16 w-16 items-center justify-center rounded-xl">
                      <Shield className="text-muted-foreground h-8 w-8" />
                    </div>
                    <p className="text-muted-foreground mt-2 text-xs">SFTP</p>
                  </div>
                </div>
                <p className="text-muted-foreground text-center text-sm">
                  Configure your connection in the Data Sources settings.
                </p>
              </div>
            )}
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={handleBack} className="tf-glass-btn">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={handleComplete} className="tf-glass-btn tf-glass-btn--primary">
              Continue to {selectedPath === "file_drop" ? "Data Ingest" : "Data Sources"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step: Complete (Quick Start) */}
      {step === "complete" && fabricResult && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-400/20">
              <CheckCircle2 className="h-10 w-10 text-green-400" />
            </div>
            <h2 className="text-foreground mt-4 text-2xl font-bold">
              {selectedCountyData?.name} County is Connected!
            </h2>
            <p className="text-muted-foreground mt-2">
              Your parcel fabric is ready. You can now explore the Quantum Cockpit.
            </p>
          </div>

          <Card className="tf-glass p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">
                  {fabricResult.parcelCount.toLocaleString()}
                </p>
                <p className="text-muted-foreground text-sm">Parcels Loaded</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-400">
                  {fabricResult.coveragePct}%
                </p>
                <p className="text-muted-foreground text-sm">Coverage</p>
              </div>
              <div className="text-center">
                <p className="text-foreground text-lg font-medium">
                  {fabricResult.sourceVersion}
                </p>
                <p className="text-muted-foreground text-sm">Source Version</p>
              </div>
            </div>
          </Card>

          <Card className="tf-glass border-amber-400/20 bg-amber-400/5 p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
              <div>
                <p className="text-foreground text-sm font-medium">Next Step: Add Your County Data</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  To unlock Ratio Studies, Comps Selection, and Model Calibration, upload your
                  county roll and sales data from the Data Ingest page.
                </p>
              </div>
            </div>
          </Card>

          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={handleComplete} className="tf-glass-btn">
              Go to Data Ingest
              <Upload className="ml-2 h-4 w-4" />
            </Button>
            <Button onClick={handleComplete} className="tf-glass-btn tf-glass-btn--primary">
              Open Quantum Cockpit
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
