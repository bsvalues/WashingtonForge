/**
 * TerraFusion Data Suite - Module Subscribers
 * 
 * Each module subscribes to DataSuiteHub events and reacts accordingly.
 * This creates the "data flows visibly" experience where users see
 * immediate effects of their data actions.
 */

import { DataSuiteHub, DataSuiteEvent } from "./hub";
import type { ModuleId } from "./types";

// =============================================================================
// Subscriber Interface
// =============================================================================

export interface ModuleSubscriber {
  moduleId: ModuleId;
  name: string;
  description: string;
  eventTypes: DataSuiteEvent["type"][];
  handler: (event: DataSuiteEvent, hub: DataSuiteHub) => void | Promise<void>;
}

// =============================================================================
// Cockpit Module Subscriber
// =============================================================================

export const cockpitSubscriber: ModuleSubscriber = {
  moduleId: "cockpit",
  name: "Cockpit Map",
  description: "Interactive parcel map with selection and analysis tools",
  eventTypes: [
    "PARCEL_FABRIC_LOADED",
    "ROLL_LOADED",
    "ROLL_UPDATED",
    "SELECTION_CHANGED",
  ],
  handler: (event, hub) => {
    switch (event.type) {
      case "PARCEL_FABRIC_LOADED":
        console.log("[Cockpit] Parcel fabric loaded, refreshing map layer");
        // In production: trigger map source refresh
        break;
      case "ROLL_LOADED":
      case "ROLL_UPDATED":
        console.log("[Cockpit] Roll data updated, refreshing parcel styling");
        // In production: update parcel colors based on new values
        break;
      case "SELECTION_CHANGED":
        console.log("[Cockpit] Selection changed:", event.payload.parcelIds?.length, "parcels");
        // In production: highlight selected parcels
        break;
    }
  },
};

// =============================================================================
// Ratio Studies Module Subscriber
// =============================================================================

export const ratioStudiesSubscriber: ModuleSubscriber = {
  moduleId: "ratio-studies",
  name: "Ratio Studies",
  description: "IAAO-compliant ratio analysis and compliance reporting",
  eventTypes: [
    "ROLL_LOADED",
    "ROLL_UPDATED",
    "SALES_LOADED",
    "SALES_UPDATED",
    "SELECTION_CHANGED",
  ],
  handler: (event, hub) => {
    switch (event.type) {
      case "ROLL_LOADED":
      case "ROLL_UPDATED":
        console.log("[RatioStudies] Roll updated, recalculating ratios");
        // In production: trigger ratio recalculation
        break;
      case "SALES_LOADED":
      case "SALES_UPDATED":
        console.log("[RatioStudies] Sales updated, refreshing ratio analysis");
        // In production: re-run ratio calculations with new sales
        break;
      case "SELECTION_CHANGED":
        console.log("[RatioStudies] Selection changed, filtering ratio view");
        // In production: filter ratio display to selected parcels
        break;
    }
  },
};

// =============================================================================
// Comps Selection Module Subscriber
// =============================================================================

export const compsSubscriber: ModuleSubscriber = {
  moduleId: "comps",
  name: "Comps Selection",
  description: "Comparable sales search and selection for valuation",
  eventTypes: [
    "SALES_LOADED",
    "SALES_UPDATED",
    "SELECTION_CHANGED",
    "EXPORT_REQUESTED",
  ],
  handler: (event, hub) => {
    switch (event.type) {
      case "SALES_LOADED":
      case "SALES_UPDATED":
        console.log("[Comps] Sales data updated, refreshing comps pool");
        // In production: rebuild comps index
        break;
      case "SELECTION_CHANGED":
        const subjectId = event.payload.parcelIds?.[0];
        if (subjectId) {
          console.log("[Comps] Subject parcel selected:", subjectId);
          // In production: auto-search for similar sales
        }
        break;
      case "EXPORT_REQUESTED":
        if (event.payload.moduleId === "comps") {
          console.log("[Comps] Export requested for comps analysis");
        }
        break;
    }
  },
};

// =============================================================================
// Model Calibration Module Subscriber
// =============================================================================

export const calibrationSubscriber: ModuleSubscriber = {
  moduleId: "calibration",
  name: "Model Calibration",
  description: "Mass appraisal model calibration and coefficient tuning",
  eventTypes: [
    "ROLL_LOADED",
    "ROLL_UPDATED",
    "SALES_LOADED",
    "SALES_UPDATED",
    "CALIBRATION_STARTED",
    "CALIBRATION_COMPLETED",
  ],
  handler: (event, hub) => {
    switch (event.type) {
      case "ROLL_LOADED":
      case "SALES_LOADED":
        console.log("[Calibration] Data loaded, checking calibration readiness");
        // In production: check if we have enough data to calibrate
        break;
      case "CALIBRATION_STARTED":
        console.log("[Calibration] Calibration run started");
        break;
      case "CALIBRATION_COMPLETED":
        console.log("[Calibration] Calibration completed, results available");
        // In production: notify user, update model coefficients
        break;
    }
  },
};

// =============================================================================
// Appeals Support Module Subscriber
// =============================================================================

export const appealsSubscriber: ModuleSubscriber = {
  moduleId: "appeals",
  name: "Appeals Support",
  description: "Board of Equalization appeal packet preparation",
  eventTypes: [
    "SELECTION_CHANGED",
    "EXPORT_REQUESTED",
    "LINEAGE_RECORDED",
  ],
  handler: (event, hub) => {
    switch (event.type) {
      case "SELECTION_CHANGED":
        const parcelIds = event.payload.parcelIds || [];
        if (parcelIds.length === 1) {
          console.log("[Appeals] Single parcel selected, ready for appeal prep");
        }
        break;
      case "EXPORT_REQUESTED":
        if (event.payload.moduleId === "appeals") {
          console.log("[Appeals] Court-ready export requested");
          // In production: generate PDF with full lineage
        }
        break;
      case "LINEAGE_RECORDED":
        console.log("[Appeals] Lineage event recorded:", event.payload);
        // In production: update appeal packet with new evidence
        break;
    }
  },
};

// =============================================================================
// Audit Module Subscriber
// =============================================================================

export const auditSubscriber: ModuleSubscriber = {
  moduleId: "audit",
  name: "Audit Trail",
  description: "Court-ready audit logging and compliance documentation",
  eventTypes: [
    "LINEAGE_RECORDED",
    "EXPORT_REQUESTED",
    "ROLL_UPDATED",
    "CALIBRATION_COMPLETED",
  ],
  handler: (event, hub) => {
    // Audit module records ALL events for compliance
    console.log("[Audit] Event recorded:", event.type, "at", event.timestamp);
    
    switch (event.type) {
      case "LINEAGE_RECORDED":
        // In production: persist to audit database
        break;
      case "EXPORT_REQUESTED":
        // In production: log export for compliance
        break;
      case "ROLL_UPDATED":
        // In production: snapshot roll state for court defense
        break;
      case "CALIBRATION_COMPLETED":
        // In production: archive calibration results
        break;
    }
  },
};

// =============================================================================
// All Subscribers Registry
// =============================================================================

export const ALL_SUBSCRIBERS: ModuleSubscriber[] = [
  cockpitSubscriber,
  ratioStudiesSubscriber,
  compsSubscriber,
  calibrationSubscriber,
  appealsSubscriber,
  auditSubscriber,
];

// =============================================================================
// Subscriber Registration Helper
// =============================================================================

export function registerAllSubscribers(hub: DataSuiteHub): void {
  for (const subscriber of ALL_SUBSCRIBERS) {
    for (const eventType of subscriber.eventTypes) {
      hub.subscribe(eventType, (event) => {
        subscriber.handler(event, hub);
      });
    }
    console.log(`[DataSuite] Registered subscriber: ${subscriber.name}`);
  }
}

// =============================================================================
// Module Capability Requirements
// =============================================================================

export const MODULE_REQUIREMENTS: Record<ModuleId, {
  requiredLayers: ("parcel_fabric" | "county_roll" | "sales_stream")[];
  minConfidence: number;
}> = {
  cockpit: {
    requiredLayers: ["parcel_fabric"],
    minConfidence: 0,
  },
  "ratio-studies": {
    requiredLayers: ["county_roll", "sales_stream"],
    minConfidence: 70,
  },
  comps: {
    requiredLayers: ["parcel_fabric", "sales_stream"],
    minConfidence: 60,
  },
  calibration: {
    requiredLayers: ["county_roll", "sales_stream"],
    minConfidence: 80,
  },
  appeals: {
    requiredLayers: ["parcel_fabric", "county_roll", "sales_stream"],
    minConfidence: 90,
  },
  audit: {
    requiredLayers: [],
    minConfidence: 0,
  },
};
