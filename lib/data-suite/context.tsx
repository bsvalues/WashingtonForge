"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { dataSuiteHub, eventBus, type DataSuiteEvent } from "./index";
import type { WACountyFips, CountyDataStatus, DataProductType } from "./types";

// ============================================
// State Shape
// ============================================

interface DataSuiteState {
  // Active county context
  selectedCounty: WACountyFips | null;
  countyStatus: CountyDataStatus | null;

  // Active jobs (keyed by job ID to prevent duplicates)
  activeJobs: Record<string, IngestJob>;

  // Event stream (limited to last 50)
  events: DataSuiteEvent[];

  // UI state
  isLoading: boolean;
  error: string | null;
}

interface IngestJob {
  id: string;
  countyFips: WACountyFips;
  product: DataProductType;
  status: "pending" | "running" | "complete" | "failed";
  progress: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

// ============================================
// Actions
// ============================================

type DataSuiteAction =
  | { type: "SET_COUNTY"; fips: WACountyFips }
  | { type: "SET_STATUS"; status: CountyDataStatus }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "ADD_JOB"; job: IngestJob }
  | { type: "UPDATE_JOB"; jobId: string; updates: Partial<IngestJob> }
  | { type: "REMOVE_JOB"; jobId: string }
  | { type: "ADD_EVENT"; event: DataSuiteEvent }
  | { type: "CLEAR_EVENTS" };

// ============================================
// Reducer
// ============================================

function dataSuiteReducer(state: DataSuiteState, action: DataSuiteAction): DataSuiteState {
  switch (action.type) {
    case "SET_COUNTY":
      return { ...state, selectedCounty: action.fips };

    case "SET_STATUS":
      return { ...state, countyStatus: action.status, isLoading: false };

    case "SET_LOADING":
      return { ...state, isLoading: action.loading };

    case "SET_ERROR":
      return { ...state, error: action.error, isLoading: false };

    case "ADD_JOB":
      return {
        ...state,
        activeJobs: { ...state.activeJobs, [action.job.id]: action.job },
      };

    case "UPDATE_JOB":
      if (!state.activeJobs[action.jobId]) return state;
      return {
        ...state,
        activeJobs: {
          ...state.activeJobs,
          [action.jobId]: { ...state.activeJobs[action.jobId], ...action.updates },
        },
      };

    case "REMOVE_JOB":
      const { [action.jobId]: _, ...remainingJobs } = state.activeJobs;
      return { ...state, activeJobs: remainingJobs };

    case "ADD_EVENT":
      return {
        ...state,
        events: [action.event, ...state.events].slice(0, 50),
      };

    case "CLEAR_EVENTS":
      return { ...state, events: [] };

    default:
      return state;
  }
}

// ============================================
// Context
// ============================================

interface DataSuiteContextValue {
  state: DataSuiteState;

  // County operations
  selectCounty: (fips: WACountyFips) => Promise<void>;
  refreshStatus: () => Promise<void>;

  // Ingest operations (all route through hub)
  startIngest: (options: {
    countyFips: WACountyFips;
    product: DataProductType;
    source: "file" | "connected-feed" | "wa-fabric";
    file?: File;
  }) => Promise<string>;

  // Job tracking
  getJob: (jobId: string) => IngestJob | undefined;

  // Event stream
  clearEvents: () => void;
}

const DataSuiteContext = createContext<DataSuiteContextValue | null>(null);

// ============================================
// Provider
// ============================================

const initialState: DataSuiteState = {
  selectedCounty: null,
  countyStatus: null,
  activeJobs: {},
  events: [],
  isLoading: false,
  error: null,
};

export function DataSuiteProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(dataSuiteReducer, initialState);

  // Subscribe to event bus
  useEffect(() => {
    const unsubscribe = eventBus.subscribe((event) => {
      dispatch({ type: "ADD_EVENT", event });

      // Update job status based on events
      if (event.type === "ingest.started") {
        dispatch({
          type: "ADD_JOB",
          job: {
            id: event.payload.ingestRunId as string,
            countyFips: event.payload.countyFips as WACountyFips,
            product: event.payload.product as DataProductType,
            status: "running",
            progress: 0,
            startedAt: event.timestamp,
          },
        });
      } else if (event.type === "ingest.ready") {
        dispatch({
          type: "UPDATE_JOB",
          jobId: event.payload.ingestRunId as string,
          updates: {
            status: "complete",
            progress: 100,
            completedAt: event.timestamp,
          },
        });
      } else if (event.type === "ingest.failed") {
        dispatch({
          type: "UPDATE_JOB",
          jobId: event.payload.ingestRunId as string,
          updates: {
            status: "failed",
            error: event.payload.error as string | undefined,
          },
        });
      }
    });

    return unsubscribe;
  }, []);

  // Select county and load status
  const selectCounty = useCallback(async (fips: WACountyFips) => {
    dispatch({ type: "SET_COUNTY", fips });
    dispatch({ type: "SET_LOADING", loading: true });

    try {
      const status = await dataSuiteHub.getStatus(fips);
      if (status) {
        dispatch({ type: "SET_STATUS", status });
      } else {
        dispatch({ type: "SET_ERROR", error: "County not found" });
      }
    } catch (err) {
      dispatch({ type: "SET_ERROR", error: String(err) });
    }
  }, []);

  // Refresh current county status
  const refreshStatus = useCallback(async () => {
    if (!state.selectedCounty) return;

    dispatch({ type: "SET_LOADING", loading: true });
    try {
      const status = await dataSuiteHub.getStatus(state.selectedCounty);
      if (status) {
        dispatch({ type: "SET_STATUS", status });
      }
    } catch (err) {
      dispatch({ type: "SET_ERROR", error: String(err) });
    }
  }, [state.selectedCounty]);

  // Start ingest - ALWAYS through hub
  const startIngest = useCallback(
    async (options: {
      countyFips: WACountyFips;
      product: DataProductType;
      source: "file" | "connected-feed" | "wa-fabric";
      file?: File;
    }): Promise<string> => {
      const ingestRun = await dataSuiteHub.ingest(options);
      return ingestRun.id;
    },
    []
  );

  // Get job by ID
  const getJob = useCallback(
    (jobId: string) => {
      return state.activeJobs[jobId];
    },
    [state.activeJobs]
  );

  // Clear events
  const clearEvents = useCallback(() => {
    dispatch({ type: "CLEAR_EVENTS" });
  }, []);

  const value: DataSuiteContextValue = {
    state,
    selectCounty,
    refreshStatus,
    startIngest,
    getJob,
    clearEvents,
  };

  return <DataSuiteContext.Provider value={value}>{children}</DataSuiteContext.Provider>;
}

// ============================================
// Hook
// ============================================

export function useDataSuite() {
  const context = useContext(DataSuiteContext);
  if (!context) {
    throw new Error("useDataSuite must be used within a DataSuiteProvider");
  }
  return context;
}

// Convenience hooks
export function useCountyStatus() {
  const { state } = useDataSuite();
  return {
    county: state.selectedCounty,
    status: state.countyStatus,
    isLoading: state.isLoading,
    error: state.error,
  };
}

export function useActiveJobs() {
  const { state, getJob } = useDataSuite();
  return {
    jobs: Object.values(state.activeJobs),
    getJob,
  };
}

export function useEventStream() {
  const { state, clearEvents } = useDataSuite();
  return {
    events: state.events,
    clearEvents,
  };
}
