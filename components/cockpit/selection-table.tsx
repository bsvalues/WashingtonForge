"use client";

import React from "react"

import { memo, useState, useMemo } from "react";
import { Search, ArrowUpDown, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Parcel } from "@/lib/api/types";
import { cn } from "@/lib/utils";

interface SelectionTableProps {
  parcels: Parcel[];
  onParcelClick: (parcel: Parcel) => void;
}

type SortField = "parcelId" | "ratio" | "totalValue" | "salePrice";
type SortDirection = "asc" | "desc";

function SelectionTableComponent({ parcels, onParcelClick }: SelectionTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("ratio");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const filteredAndSortedParcels = useMemo(() => {
    let result = parcels;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.parcelId.toLowerCase().includes(query) ||
          p.situs?.toLowerCase().includes(query)
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;

      switch (sortField) {
        case "parcelId":
          aVal = a.parcelId;
          bVal = b.parcelId;
          break;
        case "ratio":
          aVal = a.ratio ?? 0;
          bVal = b.ratio ?? 0;
          break;
        case "totalValue":
          aVal = a.totalValue;
          bVal = b.totalValue;
          break;
        case "salePrice":
          aVal = a.salePrice ?? 0;
          bVal = b.salePrice ?? 0;
          break;
        default:
          return 0;
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortDirection === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    return result;
  }, [parcels, searchQuery, sortField, sortDirection]);

  const getEquityBadge = (status: Parcel["equityStatus"]) => {
    const styles = {
      fair: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      progressive: "bg-sky-500/20 text-sky-400 border-sky-500/30",
      regressive: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    };

    return (
      <span
        className={cn(
          "px-2 py-0.5 rounded-full text-xs font-medium border capitalize",
          styles[status]
        )}
      >
        {status}
      </span>
    );
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className={cn(
        "h-7 px-2 -ml-2 text-xs font-medium",
        sortField === field ? "text-primary" : "text-muted-foreground"
      )}
    >
      {children}
      <ArrowUpDown className="ml-1 h-3 w-3" />
    </Button>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="p-3 border-b border-border/30">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by parcel ID..."
            className="pl-9 h-8 text-sm bg-input border-border/50 text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Showing {filteredAndSortedParcels.length} of {parcels.length} parcels
        </p>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background/80 backdrop-blur-sm">
            <TableRow className="border-border/30 hover:bg-transparent">
              <TableHead className="w-36">
                <SortButton field="parcelId">Parcel ID</SortButton>
              </TableHead>
              <TableHead className="text-muted-foreground text-xs">Class</TableHead>
              <TableHead className="text-muted-foreground text-xs">Neighborhood</TableHead>
              <TableHead className="text-right">
                <SortButton field="totalValue">Assessed</SortButton>
              </TableHead>
              <TableHead className="text-right">
                <SortButton field="salePrice">Sale Price</SortButton>
              </TableHead>
              <TableHead className="text-right">
                <SortButton field="ratio">Ratio</SortButton>
              </TableHead>
              <TableHead className="text-muted-foreground text-xs">Equity</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedParcels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  {searchQuery ? "No parcels match your search" : "No parcels selected"}
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedParcels.map((parcel) => (
                <TableRow
                  key={parcel.id}
                  className="border-border/30 cursor-pointer hover:bg-muted/10"
                  onClick={() => onParcelClick(parcel)}
                >
                  <TableCell className="font-mono text-sm text-foreground">
                    {parcel.parcelId}
                  </TableCell>
                  <TableCell className="text-foreground text-sm">
                    {parcel.propertyClass}
                  </TableCell>
                  <TableCell className="text-foreground text-sm">
                    {parcel.neighborhood}
                  </TableCell>
                  <TableCell className="text-right text-foreground text-sm">
                    ${parcel.totalValue.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-foreground text-sm">
                    {parcel.salePrice ? `$${parcel.salePrice.toLocaleString()}` : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    <span
                      className={cn(
                        parcel.equityStatus === "fair" && "text-emerald-400",
                        parcel.equityStatus === "progressive" && "text-sky-400",
                        parcel.equityStatus === "regressive" && "text-amber-400"
                      )}
                    >
                      {parcel.ratio?.toFixed(3) || "—"}
                    </span>
                  </TableCell>
                  <TableCell>{getEquityBadge(parcel.equityStatus)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onParcelClick(parcel);
                      }}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="sr-only">Zoom to parcel</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export const SelectionTable = memo(SelectionTableComponent);
