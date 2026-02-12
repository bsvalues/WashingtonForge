"use client";

import { useState, useEffect, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { CockpitMap } from "@/components/cockpit/cockpit-map";
import { FilterPanel } from "@/components/cockpit/filter-panel";
import { SelectionDrawer } from "@/components/cockpit/selection-drawer";
import { SelectionProvider } from "@/lib/selection";
import type { ParcelFilter, Parcel } from "@/lib/api";

// Extended parcel data for the cockpit
const MOCK_PARCELS: Parcel[] = [
  { id: "p1", parcelId: "12-34-567-001", situs: "123 Main St, Richland", landValue: 85000, impValue: 215000, totalValue: 300000, salePrice: 310000, saleDate: "2024-01-15", equityStatus: "fair", ratio: 0.97, propertyClass: "Single Family", neighborhood: "Downtown", yearBuilt: 1985 },
  { id: "p2", parcelId: "12-34-567-002", situs: "456 Oak Ave, Kennewick", landValue: 92000, impValue: 258000, totalValue: 350000, salePrice: 380000, saleDate: "2024-02-20", equityStatus: "progressive", ratio: 0.92, propertyClass: "Single Family", neighborhood: "Westside", yearBuilt: 2001 },
  { id: "p3", parcelId: "12-34-567-003", situs: "789 Pine Rd, West Richland", landValue: 78000, impValue: 182000, totalValue: 260000, salePrice: 245000, saleDate: "2024-03-10", equityStatus: "regressive", ratio: 1.06, propertyClass: "Condo", neighborhood: "Eastgate", yearBuilt: 2015 },
  { id: "p4", parcelId: "12-34-567-004", situs: "321 Cedar Blvd, Richland", landValue: 125000, impValue: 375000, totalValue: 500000, salePrice: 515000, saleDate: "2024-04-05", equityStatus: "fair", ratio: 0.97, propertyClass: "Single Family", neighborhood: "Northgate", yearBuilt: 2018 },
  { id: "p5", parcelId: "12-34-567-005", situs: "555 Birch Lane, Kennewick", landValue: 68000, impValue: 132000, totalValue: 200000, salePrice: 218000, saleDate: "2024-05-12", equityStatus: "progressive", ratio: 0.92, propertyClass: "Multi-Family", neighborhood: "Southend", yearBuilt: 1972 },
  { id: "p6", parcelId: "12-34-567-006", situs: "888 Elm Court, Richland", landValue: 95000, impValue: 305000, totalValue: 400000, salePrice: 425000, saleDate: "2024-06-01", equityStatus: "fair", ratio: 0.94, propertyClass: "Single Family", neighborhood: "Downtown", yearBuilt: 2010 },
  { id: "p7", parcelId: "12-34-567-007", situs: "222 Maple Dr, Kennewick", landValue: 72000, impValue: 178000, totalValue: 250000, salePrice: 235000, saleDate: "2024-06-15", equityStatus: "regressive", ratio: 1.08, propertyClass: "Condo", neighborhood: "Westside", yearBuilt: 2005 },
  { id: "p8", parcelId: "12-34-567-008", situs: "444 Oak St, Richland", landValue: 88000, impValue: 262000, totalValue: 350000, salePrice: 360000, saleDate: "2024-07-01", equityStatus: "fair", ratio: 0.97, propertyClass: "Single Family", neighborhood: "Eastgate", yearBuilt: 1995 },
  { id: "p9", parcelId: "12-34-567-009", situs: "666 Pine Ave, Kennewick", landValue: 110000, impValue: 340000, totalValue: 450000, salePrice: 470000, saleDate: "2024-07-20", equityStatus: "fair", ratio: 0.96, propertyClass: "Single Family", neighborhood: "Northgate", yearBuilt: 2020 },
  { id: "p10", parcelId: "12-34-567-010", situs: "777 Spruce Way, Richland", landValue: 55000, impValue: 145000, totalValue: 200000, salePrice: null, saleDate: null, equityStatus: "fair", ratio: null, propertyClass: "Condo", neighborhood: "Southend", yearBuilt: 1988 },
  { id: "p11", parcelId: "12-34-567-011", situs: "101 River Rd, Kennewick", landValue: 135000, impValue: 365000, totalValue: 500000, salePrice: 480000, saleDate: "2024-08-01", equityStatus: "regressive", ratio: 1.04, propertyClass: "Single Family", neighborhood: "Downtown", yearBuilt: 2019 },
  { id: "p12", parcelId: "12-34-567-012", situs: "202 Valley View, Richland", landValue: 95000, impValue: 255000, totalValue: 350000, salePrice: 365000, saleDate: "2024-08-15", equityStatus: "progressive", ratio: 0.96, propertyClass: "Single Family", neighborhood: "Westside", yearBuilt: 2012 },
  { id: "p13", parcelId: "12-34-567-013", situs: "303 Hilltop Dr, Kennewick", landValue: 82000, impValue: 218000, totalValue: 300000, salePrice: 295000, saleDate: "2024-09-01", equityStatus: "regressive", ratio: 1.02, propertyClass: "Single Family", neighborhood: "Eastgate", yearBuilt: 2000 },
  { id: "p14", parcelId: "12-34-567-014", situs: "404 Sunset Blvd, Richland", landValue: 145000, impValue: 455000, totalValue: 600000, salePrice: 620000, saleDate: "2024-09-10", equityStatus: "progressive", ratio: 0.97, propertyClass: "Single Family", neighborhood: "Northgate", yearBuilt: 2021 },
  { id: "p15", parcelId: "12-34-567-015", situs: "505 Lakeside Ave, Kennewick", landValue: 62000, impValue: 138000, totalValue: 200000, salePrice: 210000, saleDate: "2024-09-20", equityStatus: "progressive", ratio: 0.95, propertyClass: "Multi-Family", neighborhood: "Southend", yearBuilt: 1975 },
  { id: "p16", parcelId: "12-34-567-016", situs: "606 Park Place, Richland", landValue: 88000, impValue: 262000, totalValue: 350000, salePrice: 340000, saleDate: "2024-10-01", equityStatus: "regressive", ratio: 1.03, propertyClass: "Single Family", neighborhood: "Downtown", yearBuilt: 2008 },
  { id: "p17", parcelId: "12-34-567-017", situs: "707 Garden Ln, Kennewick", landValue: 75000, impValue: 175000, totalValue: 250000, salePrice: 255000, saleDate: "2024-10-15", equityStatus: "fair", ratio: 0.98, propertyClass: "Condo", neighborhood: "Westside", yearBuilt: 2003 },
  { id: "p18", parcelId: "12-34-567-018", situs: "808 Forest Rd, Richland", landValue: 98000, impValue: 302000, totalValue: 400000, salePrice: 410000, saleDate: "2024-10-20", equityStatus: "fair", ratio: 0.98, propertyClass: "Single Family", neighborhood: "Eastgate", yearBuilt: 2015 },
  { id: "p19", parcelId: "12-34-567-019", situs: "909 Mountain View, Kennewick", landValue: 120000, impValue: 380000, totalValue: 500000, salePrice: null, saleDate: null, equityStatus: "fair", ratio: null, propertyClass: "Single Family", neighborhood: "Northgate", yearBuilt: 2022 },
  { id: "p20", parcelId: "12-34-567-020", situs: "1010 Creek Side, Richland", landValue: 58000, impValue: 142000, totalValue: 200000, salePrice: 195000, saleDate: "2024-11-01", equityStatus: "regressive", ratio: 1.03, propertyClass: "Condo", neighborhood: "Southend", yearBuilt: 1990 },
];

export default function CockpitPage() {
  const [filters, setFilters] = useState<ParcelFilter>({});
  const [focusedParcel, setFocusedParcel] = useState<Parcel | null>(null);

  // Apply filters to parcels (selection state is separate)
  const filteredParcels = useMemo(() => {
    return MOCK_PARCELS.filter((p) => {
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
        if (p.yearBuilt < minYear || p.yearBuilt > maxYear) {
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
  }, [filters]);

  const handleFilterChange = (newFilters: ParcelFilter) => {
    setFilters(newFilters);
    // Note: Selection is NOT cleared when filters change (per spec)
  };

  const handleZoomToParcel = (parcel: Parcel) => {
    setFocusedParcel(parcel);
    // In a real implementation, this would pan/zoom the map to the parcel
  };

  return (
    <SelectionProvider>
      <AppShell
        user={{ name: "Jane Doe", role: "Assessor", county: "Benton County" }}
      >
        <div className="h-[calc(100vh-var(--system-bar-h)-var(--dock-h)-2*var(--stage-inset)-0.75rem)] relative flex overflow-hidden">
          {/* Left Panel - Filters */}
          <FilterPanel filters={filters} onFilterChange={handleFilterChange} />

          {/* Map Area */}
          <div className="flex-1 relative">
            <CockpitMap
              filters={filters}
              parcels={filteredParcels}
              onZoomToParcel={handleZoomToParcel}
            />

            {/* Bottom Drawer - Selection */}
            <SelectionDrawer
              allParcels={MOCK_PARCELS}
              filters={filters}
              onZoomToParcel={handleZoomToParcel}
            />
          </div>
        </div>
      </AppShell>
    </SelectionProvider>
  );
}
