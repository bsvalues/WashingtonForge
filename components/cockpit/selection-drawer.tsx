"use client";

import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, Download, X, Sliders, List, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SelectionTable } from "./selection-table";
import { SelectionSummary } from "./selection-summary";
import { useSelection, downloadSelectionJSON } from "@/lib/selection";
import type { Parcel, ParcelFilter } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { DrawerShell, TactileButton } from "@/components/material";

interface SelectionDrawerProps {
  allParcels: Parcel[];
  filters: ParcelFilter;
  onZoomToParcel: (parcel: Parcel) => void;
}

export function SelectionDrawer({ allParcels, filters, onZoomToParcel }: SelectionDrawerProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState("parcels");

  const { selectedParcelIds, selectionGeometry, selectedCount, clearSelection } = useSelection();

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
    <DrawerShell
      className={cn(
        "border-border/50 absolute right-0 bottom-0 left-0 z-30 rounded-none border-t transition-all duration-300",
        isExpanded ? "h-80" : "h-12"
      )}
    >
      {/* Toggle Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="hover:bg-muted/10 flex h-12 w-full items-center justify-between px-4 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-foreground font-medium">Selected Parcels</span>
          <span className="bg-primary/20 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
            {selectedCount}
          </span>
          {hiddenCount > 0 && (
            <span className="text-xs text-amber-400">({hiddenCount} hidden by filters)</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="text-muted-foreground h-4 w-4" />
          ) : (
            <ChevronUp className="text-muted-foreground h-4 w-4" />
          )}
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="flex h-[calc(100%-3rem)] flex-col">
          {/* Tabs + Actions */}
          <div className="border-border/30 flex items-center justify-between border-b px-4 py-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-muted/30 h-8">
                <TabsTrigger
                  value="parcels"
                  className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary h-6 px-3 text-xs"
                >
                  <List className="mr-1.5 h-3.5 w-3.5" />
                  Parcels
                </TabsTrigger>
                <TabsTrigger
                  value="summary"
                  className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary h-6 px-3 text-xs"
                >
                  <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
                  Summary
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <TactileButton
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="border-border/50 text-foreground h-7 bg-transparent px-3 text-xs"
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Export JSON
              </TactileButton>
              <TactileButton
                variant="outline"
                size="sm"
                onClick={handleCreateCalibrationZone}
                className="border-border/50 text-foreground h-7 bg-transparent px-3 text-xs"
              >
                <Sliders className="mr-1.5 h-3.5 w-3.5" />
                Create Calibration Zone
              </TactileButton>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="text-muted-foreground hover:text-foreground h-7 px-2 text-xs"
              >
                <X className="mr-1 h-3.5 w-3.5" />
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
    </DrawerShell>
  );
}
