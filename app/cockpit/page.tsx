"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { AppShell } from "@/components/app-shell";
import { CockpitMap } from "@/components/cockpit/cockpit-map";
import { FilterPanel } from "@/components/cockpit/filter-panel";
import { SelectionDrawer } from "@/components/cockpit/selection-drawer";
import { SelectionProvider } from "@/lib/selection";
import { dataSuiteHub, repository, WA_COUNTIES } from "@/lib/data-suite";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Database, ArrowRight, AlertCircle, RefreshCw } from "lucide-react";
import { DataPlaneStatus } from "@/components/data-suite/data-plane-status";
import type { ParcelFilter, Parcel } from "@/lib/api";

// ============================================
// COCKPIT DATA CONTRACT
// ============================================
// Cockpit reads data through dataSuiteHub.getActiveDatasetForSubscriber()
// If no data has been delivered, it shows an empty state with link to Data Suite.
// This is the ONLY correct read path - no hardcoded mocks.
// ============================================

import type { WACountyFips } from "@/lib/data-suite";

const DEFAULT_COUNTY: WACountyFips = "53005"; // Benton County

interface CockpitDataState {
  status: "loading" | "no_data" | "ready" | "error";
  versionId: string | null;
  activatedAt: string | null;
  activatedBy: string | null;
  rowCount: number;
  error: string | null;
}

export default function CockpitPage() {
  const [filters, setFilters] = useState<ParcelFilter>({});
  const [focusedParcel, setFocusedParcel] = useState<Parcel | null>(null);
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [dataState, setDataState] = useState<CockpitDataState>({
    status: "loading",
    versionId: null,
    activatedAt: null,
    activatedBy: null,
    rowCount: 0,
    error: null,
  });

  // Load data from DataSuiteHub - THE CANONICAL READ PATH
  const loadCockpitData = useCallback(async () => {
    setDataState(prev => ({ ...prev, status: "loading", error: null }));
    console.log("[v0] Cockpit: Starting data load for", DEFAULT_COUNTY);

    try {
      // Check repository stats
      const stats = repository.getStats();
      console.log("[v0] Cockpit: Repository stats:", stats);

      // Ensure demo data is initialized (this runs once per session)
      const countyStatus = await dataSuiteHub.getStatus(DEFAULT_COUNTY);
      console.log("[v0] Cockpit: County status exists:", !!countyStatus);
      
      if (!countyStatus) {
        const countyInfo = WA_COUNTIES[DEFAULT_COUNTY];
        console.log("[v0] Cockpit: Initializing demo for", countyInfo?.name);
        await repository.initializeDemoCounty(DEFAULT_COUNTY, countyInfo?.name || "Benton County");
      }

      // Check if data has been delivered to cockpit-map
      const activeDataset = await dataSuiteHub.getActiveDatasetForSubscriber(
        "cockpit-map",
        DEFAULT_COUNTY,
        "COUNTY_ROLL"
      );
      console.log("[v0] Cockpit: Active dataset:", activeDataset);

      if (!activeDataset) {
        // No data delivered yet - show empty state
        console.log("[v0] Cockpit: No active dataset - showing empty state");
        setDataState({
          status: "no_data",
          versionId: null,
          activatedAt: null,
          activatedBy: null,
          rowCount: 0,
          error: null,
        });
        setParcels([]);
        return;
      }

      // Data exists! Load the actual parcel data for this version
      // In production: fetch from DB based on versionId
      // For demo: generate mock parcels that represent the delivered data
      const mockParcels = generateParcelsForVersion(
        activeDataset.versionId,
        activeDataset.rowCount
      );

      setDataState({
        status: "ready",
        versionId: activeDataset.versionId,
        activatedAt: activeDataset.activatedAt,
        activatedBy: activeDataset.activatedBy,
        rowCount: activeDataset.rowCount,
        error: null,
      });
      setParcels(mockParcels);
    } catch (error) {
      setDataState({
        status: "error",
        versionId: null,
        activatedAt: null,
        activatedBy: null,
        rowCount: 0,
        error: error instanceof Error ? error.message : "Failed to load data",
      });
      setParcels([]);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    loadCockpitData();
  }, [loadCockpitData]);

  // Subscribe to routing events to auto-refresh when new data is delivered
  useEffect(() => {
    const unsubscribe = dataSuiteHub.subscribe((event) => {
      if (
        event.type === "routing.completed" &&
        event.payload.subscriber === "cockpit-map"
      ) {
        console.log("[v0] Cockpit received routing.completed, refreshing data");
        loadCockpitData();
      }
    });

    return unsubscribe;
  }, [loadCockpitData]);

  // Apply filters to parcels
  const filteredParcels = useMemo(() => {
    return parcels.filter((p) => {
      if (filters.neighborhood?.length && !filters.neighborhood.includes(p.neighborhood)) {
        return false;
      }
      if (filters.propertyClass?.length && !filters.propertyClass.includes(p.propertyClass)) {
        return false;
      }
      if (filters.equityStatus?.length && !filters.equityStatus.includes(p.equityStatus)) {
        return false;
      }
      if (filters.yearRange) {
        const [minYear, maxYear] = filters.yearRange;
        if (p.yearBuilt !== undefined && (p.yearBuilt < minYear || p.yearBuilt > maxYear)) {
          return false;
        }
      }
      if (filters.valueTier) {
        const value = p.totalValue;
        if (filters.valueTier === "low" && value >= 200000) return false;
        if (filters.valueTier === "mid" && (value < 200000 || value >= 500000)) return false;
        if (filters.valueTier === "high" && value < 500000) return false;
      }
      return true;
    });
  }, [parcels, filters]);

  const handleFilterChange = (newFilters: ParcelFilter) => {
    setFilters(newFilters);
  };

  const handleZoomToParcel = (parcel: Parcel) => {
    setFocusedParcel(parcel);
  };

  // LOADING STATE
  if (dataState.status === "loading") {
    return (
      <AppShell user={{ name: "Jane Doe", role: "Assessor", countyName: "Benton County" }}>
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <div className="text-center">
            <Loader2 className="text-primary mx-auto mb-4 h-12 w-12 animate-spin" />
            <h2 className="text-foreground mb-2 text-xl font-semibold">Loading Cockpit Data</h2>
            <p className="text-muted-foreground">Checking for delivered datasets...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  // NO DATA STATE - Link to Data Suite
  if (dataState.status === "no_data") {
    return (
      <AppShell user={{ name: "Jane Doe", role: "Assessor", countyName: "Benton County" }}>
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center p-8">
          <Card className="tf-glass max-w-lg p-8 text-center">
            <Database className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
            <h2 className="text-foreground mb-2 text-2xl font-bold">No Data Delivered</h2>
            <p className="text-muted-foreground mb-6">
              The Cockpit Map needs data to be delivered from the Data Suite. 
              Go to the Data Suite to ingest and publish your county roll data.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild className="tf-glass-btn tf-glass-btn--primary">
                <a href="/data-suite?tab=ingest">
                  <Database className="mr-2 h-4 w-4" />
                  Open Data Suite
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button variant="outline" onClick={loadCockpitData} className="tf-glass-btn">
                <RefreshCw className="mr-2 h-4 w-4" />
                Check Again
              </Button>
            </div>
            <p className="text-muted-foreground mt-6 text-xs">
              After publishing data in the Data Suite, it will be automatically routed to the Cockpit.
            </p>

            {/* Data Plane Status (Dev Debug) */}
            {process.env.NODE_ENV !== "production" && (
              <div className="mt-6">
                <DataPlaneStatus
                  countyFips={DEFAULT_COUNTY}
                  subscriber="cockpit-map"
                  product="COUNTY_ROLL"
                />
              </div>
            )}
          </Card>
        </div>
      </AppShell>
    );
  }

  // ERROR STATE
  if (dataState.status === "error") {
    return (
      <AppShell user={{ name: "Jane Doe", role: "Assessor", countyName: "Benton County" }}>
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center p-8">
          <Card className="tf-glass max-w-lg border-red-400/30 bg-red-400/5 p-8 text-center">
            <AlertCircle className="mx-auto mb-4 h-16 w-16 text-red-400" />
            <h2 className="mb-2 text-2xl font-bold text-red-400">Error Loading Data</h2>
            <p className="text-muted-foreground mb-6">{dataState.error}</p>
            <Button onClick={loadCockpitData} className="tf-glass-btn tf-glass-btn--primary">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </Card>
        </div>
      </AppShell>
    );
  }

  // READY STATE - Show the map
  return (
    <SelectionProvider>
      <AppShell user={{ name: "Jane Doe", role: "Assessor", countyName: "Benton County" }}>
        <div className="relative flex h-[calc(100vh-4rem)] overflow-hidden">
          {/* Left Panel - Filters */}
          <FilterPanel filters={filters} onFilterChange={handleFilterChange} />

          {/* Map Area */}
          <div className="relative flex-1">
            {/* Data Version Badge */}
            <div className="absolute left-4 top-4 z-20">
              <div className="tf-glass flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs">
                <span className="text-muted-foreground">Version:</span>
                <span className="text-foreground font-mono">{dataState.versionId?.slice(0, 12)}</span>
                <span className="text-muted-foreground">|</span>
                <span className="text-foreground">{dataState.rowCount.toLocaleString()} parcels</span>
              </div>
            </div>

            <CockpitMap
              filters={filters}
              parcels={filteredParcels}
              onZoomToParcel={handleZoomToParcel}
            />

            {/* Bottom Drawer - Selection */}
            <SelectionDrawer
              allParcels={parcels}
              filters={filters}
              onZoomToParcel={handleZoomToParcel}
            />

            {/* Data Plane Status (Dev Debug) */}
            {process.env.NODE_ENV !== "production" && (
              <div className="absolute bottom-4 right-4 z-20 w-64">
                <DataPlaneStatus
                  countyFips={DEFAULT_COUNTY}
                  subscriber="cockpit-map"
                  product="COUNTY_ROLL"
                />
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </SelectionProvider>
  );
}

// ============================================
// DEMO HELPER: Generate parcels for a version
// In production, this would be a real DB query
// ============================================

function generateParcelsForVersion(versionId: string, count: number): Parcel[] {
  // Use versionId as seed for deterministic generation
  const seed = versionId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = (i: number) => {
    const x = Math.sin(seed + i) * 10000;
    return x - Math.floor(x);
  };

  const neighborhoods = ["Downtown", "Westside", "Eastgate", "Northgate", "Southend"];
  const propertyClasses = ["Single Family", "Condo", "Multi-Family", "Commercial"];
  const equityStatuses: Array<"fair" | "progressive" | "regressive"> = ["fair", "progressive", "regressive"];

  const parcels: Parcel[] = [];
  const parcelCount = Math.min(count, 50); // Cap at 50 for demo

  for (let i = 0; i < parcelCount; i++) {
    const baseValue = 150000 + random(i) * 500000;
    const salePrice = Math.random() > 0.2 ? baseValue * (0.9 + random(i + 1000) * 0.2) : null;
    const ratio = salePrice ? baseValue / salePrice : null;
    
    let equityStatus: "fair" | "progressive" | "regressive" = "fair";
    if (ratio) {
      if (ratio < 0.95) equityStatus = "progressive";
      else if (ratio > 1.05) equityStatus = "regressive";
    }

    parcels.push({
      id: `p-${versionId.slice(2, 8)}-${i}`,
      parcelId: `12-34-${String(567 + i).padStart(3, "0")}-${String(i + 1).padStart(3, "0")}`,
      situs: `${100 + i * 10} ${["Main St", "Oak Ave", "Pine Rd", "Cedar Blvd", "Birch Lane"][i % 5]}, ${["Richland", "Kennewick", "West Richland"][i % 3]}`,
      landValue: Math.round(baseValue * 0.3),
      impValue: Math.round(baseValue * 0.7),
      totalValue: Math.round(baseValue),
      salePrice: salePrice ? Math.round(salePrice) : undefined,
      saleDate: salePrice ? `2024-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}` : undefined,
      equityStatus,
      ratio: ratio ? Math.round(ratio * 100) / 100 : undefined,
      propertyClass: propertyClasses[Math.floor(random(i + 2000) * propertyClasses.length)],
      neighborhood: neighborhoods[Math.floor(random(i + 3000) * neighborhoods.length)],
      yearBuilt: 1970 + Math.floor(random(i + 4000) * 55),
    });
  }

  return parcels;
}
