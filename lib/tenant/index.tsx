"use client";

// TerraFusion Tenant Boundary Enforcement
// Every API call and UI action must be scoped to the current county tenant

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { setAuditContext, clearAuditContext } from "@/lib/audit";
import type { User, DatasetVersion } from "@/lib/api/types";

// ============================================
// Tenant Context Types
// ============================================

interface TenantState {
  user: User | null;
  countyId: string | null;
  countyName: string | null;
  datasetVersionId: string | null;
  isInitialized: boolean;
}

interface TenantContextValue extends TenantState {
  setTenant: (user: User, datasetVersionId?: string) => void;
  clearTenant: () => void;
  setDatasetVersion: (datasetVersionId: string) => void;
  assertTenant: () => { countyId: string; userId: string };
}

const TenantContext = createContext<TenantContextValue | null>(null);

// ============================================
// Tenant Provider Component
// ============================================

interface TenantProviderProps {
  children: ReactNode;
  initialUser?: User;
  initialDatasetVersionId?: string;
}

export function TenantProvider({
  children,
  initialUser,
  initialDatasetVersionId,
}: TenantProviderProps) {
  const [state, setState] = useState<TenantState>({
    user: initialUser || null,
    countyId: initialUser?.countyId || null,
    countyName: initialUser?.countyName || null,
    datasetVersionId: initialDatasetVersionId || null,
    isInitialized: !!initialUser,
  });

  const setTenant = useCallback((user: User, datasetVersionId?: string) => {
    setState({
      user,
      countyId: user.countyId,
      countyName: user.countyName,
      datasetVersionId: datasetVersionId || null,
      isInitialized: true,
    });

    // Sync audit context
    setAuditContext({
      userId: user.id,
      userName: user.name,
      countyId: user.countyId,
      datasetVersionId,
    });

    console.info(
      `[TerraFusion Tenant] Set tenant: county=${user.countyId}, user=${user.id}`
    );
  }, []);

  const clearTenant = useCallback(() => {
    setState({
      user: null,
      countyId: null,
      countyName: null,
      datasetVersionId: null,
      isInitialized: false,
    });

    clearAuditContext();
    console.info("[TerraFusion Tenant] Cleared tenant context");
  }, []);

  const setDatasetVersion = useCallback(
    (datasetVersionId: string) => {
      setState((prev) => ({
        ...prev,
        datasetVersionId,
      }));

      if (state.user) {
        setAuditContext({
          userId: state.user.id,
          userName: state.user.name,
          countyId: state.user.countyId,
          datasetVersionId,
        });
      }

      console.info(
        `[TerraFusion Tenant] Set dataset version: ${datasetVersionId}`
      );
    },
    [state.user]
  );

  const assertTenant = useCallback((): { countyId: string; userId: string } => {
    if (!state.countyId || !state.user) {
      throw new TenantBoundaryError(
        "Tenant context not initialized. Cannot perform operation without county scope."
      );
    }
    return { countyId: state.countyId, userId: state.user.id };
  }, [state.countyId, state.user]);

  const value: TenantContextValue = {
    ...state,
    setTenant,
    clearTenant,
    setDatasetVersion,
    assertTenant,
  };

  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}

// ============================================
// Tenant Hook
// ============================================

export function useTenant(): TenantContextValue {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}

// ============================================
// Tenant Boundary Error
// ============================================

export class TenantBoundaryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TenantBoundaryError";
  }
}

// ============================================
// Tenant-Scoped API Request Helper
// ============================================

export function createTenantScopedRequest(
  countyId: string,
  datasetVersionId?: string
) {
  return function scopedRequest<T extends Record<string, unknown>>(
    params: T
  ): T & { countyId: string; datasetVersionId?: string } {
    return {
      ...params,
      countyId,
      ...(datasetVersionId && { datasetVersionId }),
    };
  };
}

// ============================================
// Validate County Boundary
// ============================================

export function validateCountyBoundary(
  requestedCountyId: string,
  currentCountyId: string
): void {
  if (requestedCountyId !== currentCountyId) {
    throw new TenantBoundaryError(
      `Access denied: Cannot access data for county '${requestedCountyId}' while authenticated as '${currentCountyId}'`
    );
  }
}

// ============================================
// Validate Parcel Within County
// ============================================

export function validateParcelInCounty(
  parcelCountyId: string,
  currentCountyId: string,
  parcelId: string
): void {
  if (parcelCountyId !== currentCountyId) {
    throw new TenantBoundaryError(
      `Parcel '${parcelId}' belongs to county '${parcelCountyId}', not current county '${currentCountyId}'`
    );
  }
}

// ============================================
// Validate Selection Within County
// ============================================

export function validateSelectionInCounty(
  selectedParcelCountyIds: string[],
  currentCountyId: string
): void {
  const foreignParcels = selectedParcelCountyIds.filter(
    (id) => id !== currentCountyId
  );
  if (foreignParcels.length > 0) {
    throw new TenantBoundaryError(
      `Selection includes ${foreignParcels.length} parcel(s) from other counties. Cross-county selection is not allowed.`
    );
  }
}

// ============================================
// Export Types
// ============================================

export type { TenantState, TenantContextValue };
