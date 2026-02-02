"use client";

import { memo } from "react";
import {
  Lasso,
  Layers,
  ZoomIn,
  ZoomOut,
  Compass,
  Square,
  MousePointer2,
  X,
  Flame,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useSelection } from "@/lib/selection";
import { cn } from "@/lib/utils";
import type { MapLayer } from "@/lib/api/types";

interface MapControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  layers: MapLayer[];
  visibleLayers: Set<string>;
  onToggleLayer: (layerId: string) => void;
}

function MapControlsComponent({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetView,
  layers,
  visibleLayers,
  onToggleLayer,
}: MapControlsProps) {
  const {
    selectMode,
    setSelectMode,
    singleSelectMode,
    setSingleSelectMode,
    selectedCount,
    clearSelection,
  } = useSelection();

  return (
    <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
      {/* Selection Controls Panel */}
      <div className="glass-panel space-y-2 rounded-lg p-2">
        {/* Single Select Toggle */}
        <div className="flex items-center justify-between gap-3 px-1">
          <Label htmlFor="single-select" className="text-muted-foreground cursor-pointer text-xs">
            Single Select
          </Label>
          <Switch
            id="single-select"
            checked={singleSelectMode}
            onCheckedChange={setSingleSelectMode}
            className="scale-75"
          />
        </div>

        <div className="border-border/30 flex gap-1 border-t pt-2">
          {/* Quick Lasso */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSelectMode(selectMode === "lasso" ? "none" : "lasso")}
                  className={cn(
                    "glass-btn border-border/50 h-8 w-8",
                    selectMode === "lasso"
                      ? "bg-primary/20 border-primary/50 text-primary"
                      : "text-foreground"
                  )}
                >
                  <Lasso className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">Quick Lasso</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Box Select */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSelectMode(selectMode === "box" ? "none" : "box")}
                  className={cn(
                    "glass-btn border-border/50 h-8 w-8",
                    selectMode === "box"
                      ? "bg-primary/20 border-primary/50 text-primary"
                      : "text-foreground"
                  )}
                >
                  <Square className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">Box Select</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Clear Selection */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={clearSelection}
                  disabled={selectedCount === 0}
                  className="glass-btn border-border/50 text-foreground h-8 w-8 bg-transparent disabled:opacity-40"
                >
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">Clear Selection</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Selection Count */}
        {selectedCount > 0 && (
          <div className="text-primary text-center text-xs font-medium">
            {selectedCount} selected
          </div>
        )}
      </div>

      {/* Layer Controls */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="glass-btn border-border/50 text-foreground bg-transparent"
          >
            <Layers className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-popover border-border/50 min-w-44">
          <DropdownMenuLabel className="text-muted-foreground text-xs">
            Map Layers
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-border/30" />

          {layers.map((layer) => (
            <DropdownMenuCheckboxItem
              key={layer.id}
              checked={visibleLayers.has(layer.id)}
              onCheckedChange={() => onToggleLayer(layer.id)}
              className="text-foreground"
            >
              {layer.name}
            </DropdownMenuCheckboxItem>
          ))}

          <DropdownMenuSeparator className="bg-border/30" />
          <DropdownMenuLabel className="text-muted-foreground text-xs">Overlays</DropdownMenuLabel>

          <DropdownMenuCheckboxItem
            checked={visibleLayers.has("drift-hotspots")}
            onCheckedChange={() => onToggleLayer("drift-hotspots")}
            className="text-foreground"
          >
            <Flame className="mr-2 h-3.5 w-3.5 text-amber-400" />
            Drift Hotspots
          </DropdownMenuCheckboxItem>

          <DropdownMenuCheckboxItem
            checked={visibleLayers.has("sales-points")}
            onCheckedChange={() => onToggleLayer("sales-points")}
            className="text-foreground"
          >
            <DollarSign className="mr-2 h-3.5 w-3.5 text-emerald-400" />
            Recent Sales
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Zoom Controls */}
      <div className="glass-panel flex flex-col gap-1 rounded-lg p-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onZoomIn}
                className="text-foreground hover:bg-muted/20 h-8 w-8"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Zoom In</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onZoomOut}
                className="text-foreground hover:bg-muted/20 h-8 w-8"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Zoom Out</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="border-border/30 my-0.5 border-t" />

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onResetView}
                className="text-foreground hover:bg-muted/20 h-8 w-8"
              >
                <Compass className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Reset View</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Zoom Level Indicator */}
      <div className="glass-panel text-muted-foreground rounded px-2 py-1 text-center text-xs">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}

export const MapControls = memo(MapControlsComponent);
