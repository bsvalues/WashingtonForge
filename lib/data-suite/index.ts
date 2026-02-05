/**
 * Intelligent Data Suite (IDS)
 * 
 * The single hub for ingestion → quality → versioning → routing
 * across the full TerraFusion OS.
 * 
 * Usage:
 *   import { dataSuiteHub, eventBus, repository } from "@/lib/data-suite";
 *   
 *   // All data operations go through the hub
 *   const run = await dataSuiteHub.ingest({ ... });
 *   const status = await dataSuiteHub.getStatus(countyFips);
 *   const quality = await dataSuiteHub.getQuality({ ... });
 */

export { dataSuiteHub } from "./hub";
export type { RoutingResult, QualityMetrics, ProductVersion, CourtPacket, HubConfig } from "./hub";

export { eventBus } from "./event-bus";
export type { DataSuiteEvent, DataSuiteEventType } from "./event-bus";

export { repository } from "./repository";
export type { IDataSuiteRepository } from "./repository";

export {
  DataSuiteProvider,
  useDataSuite,
  useCountyStatus,
  useActiveJobs,
  useEventStream,
} from "./context";

export * from "./types";
