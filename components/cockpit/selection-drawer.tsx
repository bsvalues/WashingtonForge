"use client";

import { useState, useMemo } from "react";
import {
  ChevronUp,
  ChevronDown,
  Download,
  X,
  Sliders,
  List,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SelectionTable } from "./selection-table";
import { SelectionSummary } from "./selection-summary";
import { useSelection, downloadSelectionJSON } from "@/lib/selection";
import type { Parcel, ParcelFilter } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface SelectionDrawerProps {
  allParcels: Parcel[];
  filters: ParcelFilter;
  onZoomToParcel: (parcel: Parcel) => void;
}

export function SelectionDrawer({
  allParcels,
  filters,
  onZoomToParcel,
}: SelectionDrawerProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState("parcels");

  const {
    selectedParcelIds,
    selectionGeometry,
    selectedCount,
    clearSelection,
  } = useSelection();

  // Get selected parcels from the full list
  const selectedParcels = useMemo(() => {
    return allParcels.filter((p) => selectedParcelIds.has(p.id));
  }, [allParcels, selectedParcelIds]);

  // Calculate hidden count (selected but filtered out)
  const hiddenCount = useMemo(() => {
    const visibleIds = new Set(allParcels.map((p) => p.id));
    let hidden = 0;
    for (const id of selectedParcelIds) {
      if (!visibleIds.has(id)) {
        hidden++;
      }
    }
    return hidden;
  }, [allParcels, selectedParcelIds]);

  const handleExport = () => {
    downloadSelectionJSON(Array.from(selectedParcelIds), selectionGeometry);
  };

  const handleCreateCalibrationZone = () => {
    router.push("/calibration");
  };

  // Don't render if nothing selected
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "absolute bottom-0 left-0 right-0 glass-panel border-t border-border/50 transition-all duration-300 z-30",
        isExpanded ? "h-80" : "h-12"
      )}
    >
      {/* Toggle Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full h-12 px-4 flex items-center justify-between hover:bg-muted/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-medium text-foreground">Selected Parcels</span>
          <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
            {selectedCount}
          </span>
          {hiddenCount > 0 && (
            <span className="text-xs text-amber-400">
              ({hiddenCount} hidden by filters)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="h-[calc(100%-3rem)] flex flex-col">
          {/* Tabs + Actions */}
          <div className="px-4 py-2 border-b border-border/30 flex items-center justify-between">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-muted/30 h-8">
                <TabsTrigger
                  value="parcels"
                  className="h-6 px-3 text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
                >
                  <List className="w-3.5 h-3.5 mr-1.5" />
                  Parcels
                </TabsTrigger>
                <TabsTrigger
                  value="summary"
                  className="h-6 px-3 text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
                >
                  <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                  Summary
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="h-7 px-3 text-xs glass-btn border-border/50 text-foreground bg-transparent"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Export JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateCalibrationZone}
                className="h-7 px-3 text-xs glass-btn border-border/50 text-foreground bg-transparent"
              >
                <Sliders className="w-3.5 h-3.5 mr-1.5" />
                Create Calibration Zone
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Clear
              </Button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "parcels" && (
              <SelectionTable parcels={selectedParcels} onParcelClick={onZoomToParcel} />
            )}
            {activeTab === "summary" && (
              <SelectionSummary parcels={selectedParcels} hiddenCount={hiddenCount} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
