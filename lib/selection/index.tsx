"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { Parcel } from "@/lib/api/types";
import type * as GeoJSON from "geojson";

// ============================================
// Selection State Types
// ============================================

export interface SelectionState {
  selectedParcelIds: Set<string>;
  selectionGeometry: GeoJSON.Polygon | null;
  hoveredParcelId: string | null;
  singleSelectMode: boolean;
  selectMode: "none" | "lasso" | "box";
}

export interface SelectionActions {
  // Single parcel operations
  selectParcel: (parcelId: string, shiftKey?: boolean) => void;
  deselectParcel: (parcelId: string) => void;
  toggleParcel: (parcelId: string) => void;
  
  // Bulk operations
  selectParcels: (parcelIds: string[]) => void;
  clearSelection: () => void;
  
  // Hover
  setHoveredParcel: (parcelId: string | null) => void;
  
  // Selection mode
  setSingleSelectMode: (enabled: boolean) => void;
  setSelectMode: (mode: "none" | "lasso" | "box") => void;
  
  // Geometry
  setSelectionGeometry: (geometry: GeoJSON.Polygon | null) => void;
  
  // Utilities
  isSelected: (parcelId: string) => boolean;
}

export interface SelectionContextValue extends SelectionState, SelectionActions {
  // Derived state
  selectedCount: number;
}

// ============================================
// Context
// ============================================

const SelectionContext = createContext<SelectionContextValue | null>(null);

// ============================================
// Provider
// ============================================

interface SelectionProviderProps {
  children: ReactNode;
}

export function SelectionProvider({ children }: SelectionProviderProps) {
  const [selectedParcelIds, setSelectedParcelIds] = useState<Set<string>>(new Set());
  const [selectionGeometry, setSelectionGeometry] = useState<GeoJSON.Polygon | null>(null);
  const [hoveredParcelId, setHoveredParcelId] = useState<string | null>(null);
  const [singleSelectMode, setSingleSelectMode] = useState(false);
  const [selectMode, setSelectMode] = useState<"none" | "lasso" | "box">("none");

  // Select a single parcel (with optional shift key for multi-select)
  const selectParcel = useCallback((parcelId: string, shiftKey = false) => {
    setSelectedParcelIds((prev) => {
      if (singleSelectMode && !shiftKey) {
        // Single select mode: replace selection
        return new Set([parcelId]);
      }
      if (shiftKey) {
        // Shift+click: toggle without clearing
        const next = new Set(prev);
        if (next.has(parcelId)) {
          next.delete(parcelId);
        } else {
          next.add(parcelId);
        }
        return next;
      }
      // Default: add to selection
      const next = new Set(prev);
      next.add(parcelId);
      return next;
    });
  }, [singleSelectMode]);

  const deselectParcel = useCallback((parcelId: string) => {
    setSelectedParcelIds((prev) => {
      const next = new Set(prev);
      next.delete(parcelId);
      return next;
    });
  }, []);

  const toggleParcel = useCallback((parcelId: string) => {
    setSelectedParcelIds((prev) => {
      const next = new Set(prev);
      if (next.has(parcelId)) {
        next.delete(parcelId);
      } else {
        next.add(parcelId);
      }
      return next;
    });
  }, []);

  const selectParcels = useCallback((parcelIds: string[]) => {
    setSelectedParcelIds((prev) => {
      const next = new Set(prev);
      for (const id of parcelIds) {
        next.add(id);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedParcelIds(new Set());
    setSelectionGeometry(null);
  }, []);

  const setHoveredParcel = useCallback((parcelId: string | null) => {
    setHoveredParcelId(parcelId);
  }, []);

  const isSelected = useCallback((parcelId: string) => {
    return selectedParcelIds.has(parcelId);
  }, [selectedParcelIds]);

  const value = useMemo<SelectionContextValue>(() => ({
    // State
    selectedParcelIds,
    selectionGeometry,
    hoveredParcelId,
    singleSelectMode,
    selectMode,
    // Actions
    selectParcel,
    deselectParcel,
    toggleParcel,
    selectParcels,
    clearSelection,
    setHoveredParcel,
    setSingleSelectMode,
    setSelectMode,
    setSelectionGeometry,
    isSelected,
    // Derived
    selectedCount: selectedParcelIds.size,
  }), [
    selectedParcelIds,
    selectionGeometry,
    hoveredParcelId,
    singleSelectMode,
    selectMode,
    selectParcel,
    deselectParcel,
    toggleParcel,
    selectParcels,
    clearSelection,
    setHoveredParcel,
    isSelected,
  ]);

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

export function useSelection(): SelectionContextValue {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error("useSelection must be used within SelectionProvider");
  }
  return context;
}

// ============================================
// Export Selection Utility
// ============================================

export function exportSelectionJSON(
  parcelIds: string[],
  geometry: GeoJSON.Polygon | null
): string {
  const data = {
    exportedAt: new Date().toISOString(),
    parcelCount: parcelIds.length,
    parcelIds,
    selectionGeometry: geometry,
  };
  return JSON.stringify(data, null, 2);
}

export function downloadSelectionJSON(
  parcelIds: string[],
  geometry: GeoJSON.Polygon | null
) {
  const json = exportSelectionJSON(parcelIds, geometry);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `selection-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
