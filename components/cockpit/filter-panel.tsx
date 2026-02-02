"use client";

import { useState, useEffect } from "react";
import { Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getNeighborhoods,
  getPropertyClasses,
  type ParcelFilter,
  type EquityStatus,
} from "@/lib/api";
import { cn } from "@/lib/utils";

interface FilterPanelProps {
  filters: ParcelFilter;
  onFilterChange: (filters: ParcelFilter) => void;
}

const equityStatuses: { value: EquityStatus; label: string; color: string }[] = [
  { value: "fair", label: "Fair", color: "bg-chart-1" },
  { value: "progressive", label: "Progressive", color: "bg-chart-2" },
  { value: "regressive", label: "Regressive", color: "bg-chart-3" },
];

const valueTiers = [
  { value: "low", label: "Low ($0 - $200k)" },
  { value: "mid", label: "Mid ($200k - $500k)" },
  { value: "high", label: "High ($500k+)" },
];

export function FilterPanel({ filters, onFilterChange }: FilterPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const [propertyClasses, setPropertyClasses] = useState<string[]>([]);
  const [yearRange, setYearRange] = useState<[number, number]>([1900, 2025]);

  // Load filter options
  useEffect(() => {
    async function loadOptions() {
      try {
        const [hoods, classes] = await Promise.all([
          getNeighborhoods(),
          getPropertyClasses(),
        ]);
        setNeighborhoods(hoods);
        setPropertyClasses(classes);
      } catch (err) {
        console.error("[v0] Failed to load filter options:", err);
      }
    }
    loadOptions();
  }, []);

  const handlePropertyClassChange = (value: string) => {
    const current = filters.propertyClass || [];
    const updated = current.includes(value)
      ? current.filter((c) => c !== value)
      : [...current, value];
    onFilterChange({ ...filters, propertyClass: updated });
  };

  const handleNeighborhoodChange = (value: string) => {
    onFilterChange({
      ...filters,
      neighborhood: value === "all" ? undefined : [value],
    });
  };

  const handleYearRangeChange = (value: number[]) => {
    const range: [number, number] = [value[0], value[1]];
    setYearRange(range);
    onFilterChange({ ...filters, yearRange: range });
  };

  const handleValueTierChange = (value: string) => {
    onFilterChange({
      ...filters,
      valueTier: value === "all" ? undefined : value,
    });
  };

  const handleEquityStatusChange = (status: EquityStatus, checked: boolean) => {
    const current = filters.equityStatus || [];
    const updated = checked
      ? [...current, status]
      : current.filter((s) => s !== status);
    onFilterChange({ ...filters, equityStatus: updated.length > 0 ? updated : undefined });
  };

  const clearFilters = () => {
    setYearRange([1900, 2025]);
    onFilterChange({});
  };

  if (isCollapsed) {
    return (
      <div className="absolute left-0 top-4 z-10">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsCollapsed(false)}
          className="glass-btn border-border/50 text-foreground rounded-l-none"
        >
          <ChevronRight className="w-4 h-4" />
          <span className="sr-only">Expand filters</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-72 shrink-0 glass-panel border-r border-border/50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" />
          <h2 className="font-medium text-foreground">Filters</h2>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(true)}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="sr-only">Collapse filters</span>
          </Button>
        </div>
      </div>

      {/* Filter Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Property Class */}
        <div>
          <Label className="text-foreground mb-3 block">Property Class</Label>
          <div className="space-y-2">
            {propertyClasses.length === 0 ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              propertyClasses.map((cls) => (
                <div key={cls} className="flex items-center gap-2">
                  <Checkbox
                    id={`class-${cls}`}
                    checked={filters.propertyClass?.includes(cls) || false}
                    onCheckedChange={() => handlePropertyClassChange(cls)}
                    className="border-border/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <label
                    htmlFor={`class-${cls}`}
                    className="text-sm text-foreground cursor-pointer"
                  >
                    {cls}
                  </label>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Neighborhood */}
        <div>
          <Label className="text-foreground mb-3 block">Neighborhood</Label>
          <Select
            value={filters.neighborhood?.[0] || "all"}
            onValueChange={handleNeighborhoodChange}
          >
            <SelectTrigger className="w-full bg-input border-border/50 text-foreground">
              <SelectValue placeholder="All neighborhoods" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border/50">
              <SelectItem value="all" className="text-foreground">
                All Neighborhoods
              </SelectItem>
              {neighborhoods.map((hood) => (
                <SelectItem key={hood} value={hood} className="text-foreground">
                  {hood}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Year Built Range */}
        <div>
          <Label className="text-foreground mb-3 block">
            Year Built: {yearRange[0]} - {yearRange[1]}
          </Label>
          <Slider
            value={yearRange}
            min={1900}
            max={2025}
            step={5}
            onValueChange={handleYearRangeChange}
            className="mt-2"
          />
        </div>

        {/* Value Tier */}
        <div>
          <Label className="text-foreground mb-3 block">Value Tier</Label>
          <Select
            value={filters.valueTier || "all"}
            onValueChange={handleValueTierChange}
          >
            <SelectTrigger className="w-full bg-input border-border/50 text-foreground">
              <SelectValue placeholder="All tiers" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border/50">
              <SelectItem value="all" className="text-foreground">
                All Tiers
              </SelectItem>
              {valueTiers.map((tier) => (
                <SelectItem
                  key={tier.value}
                  value={tier.value}
                  className="text-foreground"
                >
                  {tier.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Equity Status */}
        <div>
          <Label className="text-foreground mb-3 block">Equity Status</Label>
          <div className="space-y-2">
            {equityStatuses.map((status) => (
              <div key={status.value} className="flex items-center gap-2">
                <Checkbox
                  id={`equity-${status.value}`}
                  checked={filters.equityStatus?.includes(status.value) || false}
                  onCheckedChange={(checked) =>
                    handleEquityStatusChange(status.value, checked as boolean)
                  }
                  className="border-border/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <div className={cn("w-3 h-3 rounded-sm", status.color)} />
                <label
                  htmlFor={`equity-${status.value}`}
                  className="text-sm text-foreground cursor-pointer"
                >
                  {status.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
