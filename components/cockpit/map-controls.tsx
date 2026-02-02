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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
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
    <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
      {/* Selection Controls Panel */}
      <div className="glass-panel rounded-lg p-2 space-y-2">
        {/* Single Select Toggle */}
        <div className="flex items-center justify-between gap-3 px-1">
          <Label htmlFor="single-select" className="text-xs text-muted-foreground cursor-pointer">
            Single Select
          </Label>
          <Switch
            id="single-select"
            checked={singleSelectMode}
            onCheckedChange={setSingleSelectMode}
            className="scale-75"
          />
        </div>

        <div className="border-t border-border/30 pt-2 flex gap-1">
          {/* Quick Lasso */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSelectMode(selectMode === "lasso" ? "none" : "lasso")}
                  className={cn(
                    "h-8 w-8 glass-btn border-border/50",
                    selectMode === "lasso"
                      ? "bg-primary/20 border-primary/50 text-primary"
                      : "text-foreground"
                  )}
                >
                  <Lasso className="w-4 h-4" />
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
                    "h-8 w-8 glass-btn border-border/50",
                    selectMode === "box"
                      ? "bg-primary/20 border-primary/50 text-primary"
                      : "text-foreground"
                  )}
                >
                  <Square className="w-4 h-4" />
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
                  className="h-8 w-8 glass-btn border-border/50 text-foreground disabled:opacity-40 bg-transparent"
                >
                  <X className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">Clear Selection</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Selection Count */}
        {selectedCount > 0 && (
          <div className="text-xs text-center text-primary font-medium">
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
            <Layers className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-popover border-border/50 min-w-44">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
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
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Overlays
          </DropdownMenuLabel>
          
          <DropdownMenuCheckboxItem
            checked={visibleLayers.has("drift-hotspots")}
            onCheckedChange={() => onToggleLayer("drift-hotspots")}
            className="text-foreground"
          >
            <Flame className="w-3.5 h-3.5 mr-2 text-amber-400" />
            Drift Hotspots
          </DropdownMenuCheckboxItem>
          
          <DropdownMenuCheckboxItem
            checked={visibleLayers.has("sales-points")}
            onCheckedChange={() => onToggleLayer("sales-points")}
            className="text-foreground"
          >
            <DollarSign className="w-3.5 h-3.5 mr-2 text-emerald-400" />
            Recent Sales
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Zoom Controls */}
      <div className="glass-panel rounded-lg p-1 flex flex-col gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onZoomIn}
                className="h-8 w-8 text-foreground hover:bg-muted/20"
              >
                <ZoomIn className="w-4 h-4" />
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
                className="h-8 w-8 text-foreground hover:bg-muted/20"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Zoom Out</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="border-t border-border/30 my-0.5" />

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onResetView}
                className="h-8 w-8 text-foreground hover:bg-muted/20"
              >
                <Compass className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Reset View</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Zoom Level Indicator */}
      <div className="glass-panel rounded px-2 py-1 text-xs text-muted-foreground text-center">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}

export const MapControls = memo(MapControlsComponent);
