"use client";

// TerraFusion Audit Event Pipeline
// Every state change emits an audit event for compliance and traceability

import type {
  AuditAction,
  AuditResourceType,
  AuditLogEntry,
  AuditEventPayload,
} from "@/lib/api/types";

// ============================================
// Audit Context (Client-side session state)
// ============================================

interface AuditContext {
  userId: string;
  userName: string;
  countyId: string;
  datasetVersionId?: string;
}

let auditContext: AuditContext | null = null;

export function setAuditContext(ctx: AuditContext) {
  auditContext = ctx;
}

export function getAuditContext(): AuditContext | null {
  return auditContext;
}

export function clearAuditContext() {
  auditContext = null;
}

// ============================================
// In-Memory Event Store (Demo Mode)
// In production, this would POST to /api/audit
// ============================================

const eventStore: AuditLogEntry[] = [];
const MAX_EVENTS = 1000;

export function getAuditEvents(limit = 50): AuditLogEntry[] {
  return eventStore.slice(-limit).reverse();
}

export function getAuditEventsByResource(
  resourceType: AuditResourceType,
  resourceId: string
): AuditLogEntry[] {
  return eventStore
    .filter((e) => e.resourceType === resourceType && e.resourceId === resourceId)
    .reverse();
}

// ============================================
// Payload Hash (Stable summary for change tracking)
// ============================================

function computePayloadHash(details: Record<string, unknown> | undefined): string {
  if (!details) return "";
  const sorted = JSON.stringify(details, Object.keys(details).sort());
  // Simple hash for demo - in production use crypto.subtle
  let hash = 0;
  for (let i = 0; i < sorted.length; i++) {
    const char = sorted.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

// ============================================
// Emit Audit Event
// ============================================

export function emitAuditEvent(payload: AuditEventPayload): AuditLogEntry {
  if (!auditContext) {
    console.warn("[TerraFusion Audit] No audit context set - using anonymous");
  }

  const entry: AuditLogEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    userId: auditContext?.userId || "anonymous",
    userName: auditContext?.userName || "Anonymous User",
    action: payload.action,
    resourceType: payload.resourceType,
    resourceId: payload.resourceId,
    countyId: payload.countyId || auditContext?.countyId || "unknown",
    datasetVersionId: payload.datasetVersionId || auditContext?.datasetVersionId,
    timestamp: new Date().toISOString(),
    payloadHash: computePayloadHash(payload.details),
    details: payload.details,
  };

  // Store event
  eventStore.push(entry);
  if (eventStore.length > MAX_EVENTS) {
    eventStore.shift();
  }

  // Log for debugging/monitoring
  console.info(
    `[TerraFusion Audit] ${entry.action} on ${entry.resourceType}/${entry.resourceId}`,
    { countyId: entry.countyId, datasetVersionId: entry.datasetVersionId }
  );

  return entry;
}

// ============================================
// Convenience Emitters for Common Actions
// ============================================

export const audit = {
  // Authentication
  login: (userId: string, userName: string, countyId: string) =>
    emitAuditEvent({
      action: "AUTH_LOGIN",
      resourceType: "session",
      resourceId: `sess-${Date.now()}`,
      countyId,
      details: { userId, userName },
    }),

  logout: (countyId: string) =>
    emitAuditEvent({
      action: "AUTH_LOGOUT",
      resourceType: "session",
      resourceId: auditContext?.userId || "unknown",
      countyId,
    }),

  // Ingestion
  ingestUpload: (datasetId: string, countyId: string, fileName: string, rowCount: number) =>
    emitAuditEvent({
      action: "INGEST_UPLOAD",
      resourceType: "dataset",
      resourceId: datasetId,
      countyId,
      details: { fileName, rowCount },
    }),

  ingestValidate: (
    datasetId: string,
    countyId: string,
    accepted: number,
    rejected: number
  ) =>
    emitAuditEvent({
      action: "INGEST_VALIDATE",
      resourceType: "dataset",
      resourceId: datasetId,
      countyId,
      details: { accepted, rejected, passRate: accepted / (accepted + rejected) },
    }),

  ingestPublish: (datasetVersionId: string, countyId: string, rowCount: number) =>
    emitAuditEvent({
      action: "INGEST_PUBLISH",
      resourceType: "dataset_version",
      resourceId: datasetVersionId,
      countyId,
      datasetVersionId,
      details: { rowCount },
    }),

  // Dataset
  datasetPublish: (datasetVersionId: string, countyId: string, rollYear: number) =>
    emitAuditEvent({
      action: "DATASET_PUBLISH",
      resourceType: "dataset_version",
      resourceId: datasetVersionId,
      countyId,
      datasetVersionId,
      details: { rollYear },
    }),

  // Ratio Studies
  ratioRunCreate: (studyId: string, countyId: string, studyName: string, rollYear: number) =>
    emitAuditEvent({
      action: "RATIO_RUN_CREATE",
      resourceType: "ratio_study",
      resourceId: studyId,
      countyId,
      details: { studyName, rollYear },
    }),

  ratioRunComplete: (
    studyId: string,
    countyId: string,
    metrics: { cod: number; prd: number; prb: number; medianRatio: number }
  ) =>
    emitAuditEvent({
      action: "RATIO_RUN_COMPLETE",
      resourceType: "ratio_study",
      resourceId: studyId,
      countyId,
      details: metrics,
    }),

  ratioExport: (studyId: string, countyId: string, format: string) =>
    emitAuditEvent({
      action: "RATIO_EXPORT",
      resourceType: "ratio_study",
      resourceId: studyId,
      countyId,
      details: { format },
    }),

  // Cockpit
  cockpitView: (countyId: string, filters: Record<string, unknown>) =>
    emitAuditEvent({
      action: "COCKPIT_VIEW",
      resourceType: "parcel",
      resourceId: "view",
      countyId,
      details: { filters },
    }),

  cockpitSelect: (countyId: string, parcelIds: string[], method: "click" | "lasso") =>
    emitAuditEvent({
      action: "COCKPIT_SELECT",
      resourceType: "selection",
      resourceId: `sel-${Date.now()}`,
      countyId,
      details: { count: parcelIds.length, method, parcelIds: parcelIds.slice(0, 10) },
    }),

  // Snapshots
  snapshotCreate: (snapshotId: string, countyId: string, rollYear: number) =>
    emitAuditEvent({
      action: "SNAPSHOT_CREATE",
      resourceType: "snapshot",
      resourceId: snapshotId,
      countyId,
      details: { rollYear },
    }),

  snapshotPublish: (snapshotId: string, countyId: string, rollYear: number) =>
    emitAuditEvent({
      action: "SNAPSHOT_PUBLISH",
      resourceType: "snapshot",
      resourceId: snapshotId,
      countyId,
      details: { rollYear },
    }),
};
