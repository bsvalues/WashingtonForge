// TerraFusion API Client
// Makes real HTTP requests to backend services
// Used when NEXT_PUBLIC_DEMO_MODE=false

import type { GeoJSON } from "geojson";
import {
  ApiError,
  type User,
  type County,
  type Parcel,
  type RatioStudy,
  type AuditLogEntry,
  type RollYearSnapshot,
  type MapLayer,
  type AggregateStats,
  type AuthResponse,
  type LoginCredentials,
  type UserRole,
  type Dataset,
  type DatasetType,
  type ValidationResult,
  type ValidationError,
  type FieldMapping,
  type ParcelFilter,
  type SelectionResult,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

// ============================================
// Safe JSON Fetch
// ============================================

async function safeFetchJson<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  // Check response status
  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new ApiError(
      `API Error: ${response.status} ${response.statusText}`,
      response.status,
      errorText
    );
  }

  // Check content type
  const contentType = response.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    throw new ApiError(
      "Backend not connected - received non-JSON response",
      500,
      "INVALID_CONTENT_TYPE"
    );
  }

  return response.json();
}

// ============================================
// Authentication
// ============================================

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  return safeFetchJson<AuthResponse>(`${API_BASE}/auth/login`, {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export async function logout(): Promise<void> {
  await safeFetchJson(`${API_BASE}/auth/logout`, { method: "POST" });
}

export async function getCurrentUser(): Promise<User> {
  return safeFetchJson<User>(`${API_BASE}/auth/me`);
}

// ============================================
// Counties
// ============================================

export async function getCounties(): Promise<County[]> {
  return safeFetchJson<County[]>(`${API_BASE}/counties`);
}

export async function selectCounty(countyId: string, role: UserRole): Promise<User> {
  return safeFetchJson<User>(`${API_BASE}/counties/select`, {
    method: "POST",
    body: JSON.stringify({ countyId, role }),
  });
}

// ============================================
// Data Ingestion
// ============================================

export async function uploadDataset(
  file: File,
  datasetType: DatasetType
): Promise<Dataset> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", datasetType);

  const response = await fetch(`${API_BASE}/ingest/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new ApiError(`Upload failed: ${response.statusText}`, response.status);
  }

  return response.json();
}

export async function validateDataset(datasetId: string): Promise<ValidationResult> {
  return safeFetchJson<ValidationResult>(`${API_BASE}/ingest/${datasetId}/validate`, {
    method: "POST",
  });
}

export async function getDatasetErrors(datasetId: string): Promise<ValidationError[]> {
  return safeFetchJson<ValidationError[]>(`${API_BASE}/ingest/${datasetId}/errors`);
}

export async function downloadErrorCsv(datasetId: string): Promise<Blob> {
  const response = await fetch(`${API_BASE}/ingest/${datasetId}/errors/csv`);
  if (!response.ok) {
    throw new ApiError("Failed to download error CSV", response.status);
  }
  return response.blob();
}

export async function getSourceFields(datasetId: string): Promise<string[]> {
  return safeFetchJson<string[]>(`${API_BASE}/ingest/${datasetId}/fields`);
}

export async function saveFieldMapping(
  datasetId: string,
  mappings: FieldMapping[]
): Promise<void> {
  await safeFetchJson(`${API_BASE}/ingest/${datasetId}/mapping`, {
    method: "POST",
    body: JSON.stringify({ mappings }),
  });
}

export async function previewDataset(
  datasetId: string,
  limit?: number
): Promise<Record<string, unknown>[]> {
  const params = limit ? `?limit=${limit}` : "";
  return safeFetchJson<Record<string, unknown>[]>(`${API_BASE}/ingest/${datasetId}/preview${params}`);
}

export async function publishDataset(datasetId: string): Promise<Dataset> {
  return safeFetchJson<Dataset>(`${API_BASE}/ingest/${datasetId}/publish`, {
    method: "POST",
  });
}

// ============================================
// Parcels & Map
// ============================================

export async function getParcels(filter?: ParcelFilter): Promise<Parcel[]> {
  const params = filter ? `?filter=${encodeURIComponent(JSON.stringify(filter))}` : "";
  return safeFetchJson<Parcel[]>(`${API_BASE}/parcels${params}`);
}

export async function getParcelById(parcelId: string): Promise<Parcel> {
  return safeFetchJson<Parcel>(`${API_BASE}/parcels/${parcelId}`);
}

export async function getParcelGeoJson(filter?: ParcelFilter): Promise<GeoJSON.FeatureCollection> {
  const params = filter ? `?filter=${encodeURIComponent(JSON.stringify(filter))}` : "";
  return safeFetchJson<GeoJSON.FeatureCollection>(`${API_BASE}/parcels/geojson${params}`);
}

export async function selectParcelsInPolygon(
  polygon: GeoJSON.Polygon
): Promise<SelectionResult> {
  return safeFetchJson<SelectionResult>(`${API_BASE}/selection/polygon`, {
    method: "POST",
    body: JSON.stringify({ polygon }),
  });
}

export async function getAggregateStats(parcelIds: string[]): Promise<AggregateStats> {
  return safeFetchJson<AggregateStats>(`${API_BASE}/parcels/stats`, {
    method: "POST",
    body: JSON.stringify({ parcelIds }),
  });
}

export async function getMapLayers(): Promise<MapLayer[]> {
  return safeFetchJson<MapLayer[]>(`${API_BASE}/map/layers`);
}

export async function getNeighborhoods(): Promise<string[]> {
  return safeFetchJson<string[]>(`${API_BASE}/parcels/neighborhoods`);
}

export async function getPropertyClasses(): Promise<string[]> {
  return safeFetchJson<string[]>(`${API_BASE}/parcels/classes`);
}

// ============================================
// Ratio Studies
// ============================================

export async function getRatioStudies(): Promise<RatioStudy[]> {
  return safeFetchJson<RatioStudy[]>(`${API_BASE}/ratio-studies`);
}

export async function getRatioStudyById(studyId: string): Promise<RatioStudy> {
  return safeFetchJson<RatioStudy>(`${API_BASE}/ratio-studies/${studyId}`);
}

export async function runRatioStudy(params: {
  name: string;
  rollYear: number;
  filter?: ParcelFilter;
}): Promise<RatioStudy> {
  return safeFetchJson<RatioStudy>(`${API_BASE}/ratio-studies/run`, {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function exportRatioStudyReport(
  studyId: string,
  format: "pdf" | "csv" | "xlsx"
): Promise<Blob> {
  const response = await fetch(`${API_BASE}/ratio-studies/${studyId}/export?format=${format}`);
  if (!response.ok) {
    throw new ApiError("Failed to export report", response.status);
  }
  return response.blob();
}

// ============================================
// Audit Log
// ============================================

export async function getAuditLog(params?: {
  limit?: number;
  offset?: number;
  action?: string;
  userId?: string;
}): Promise<AuditLogEntry[]> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.offset) searchParams.set("offset", params.offset.toString());
  if (params?.action) searchParams.set("action", params.action);
  if (params?.userId) searchParams.set("userId", params.userId);

  const query = searchParams.toString();
  return safeFetchJson<AuditLogEntry[]>(`${API_BASE}/audit-log${query ? `?${query}` : ""}`);
}

// ============================================
// Roll Year Snapshots
// ============================================

export async function getRollYearSnapshots(): Promise<RollYearSnapshot[]> {
  return safeFetchJson<RollYearSnapshot[]>(`${API_BASE}/snapshots`);
}

export async function createRollYearSnapshot(rollYear: number): Promise<RollYearSnapshot> {
  return safeFetchJson<RollYearSnapshot>(`${API_BASE}/snapshots`, {
    method: "POST",
    body: JSON.stringify({ rollYear }),
  });
}

export async function publishSnapshot(snapshotId: string): Promise<RollYearSnapshot> {
  return safeFetchJson<RollYearSnapshot>(`${API_BASE}/snapshots/${snapshotId}/publish`, {
    method: "POST",
  });
}
