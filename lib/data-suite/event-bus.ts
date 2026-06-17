/**
 * DataSuite Event Bus
 *
 * In-process pub/sub for demo. Production: table-backed + worker.
 *
 * Events emitted:
 * - ingest.started / ingest.fingerprinted / ingest.ready / ingest.failed
 * - product.published / product.rolledback / product.stale
 * - routing.completed / routing.failed
 * - quality.changed / quality.degraded
 * - audit.updated
 */

// ============================================
// Event Types
// ============================================

export type DataSuiteEventType =
  | "ingest.started"
  | "ingest.fingerprinted"
  | "ingest.ready"
  | "ingest.failed"
  | "product.published"
  | "product.rolledback"
  | "product.stale"
  | "routing.completed"
  | "routing.failed"
  | "quality.changed"
  | "quality.degraded"
  | "audit.updated"
  | "deprecated.api_call"; // Emitted when legacy API shim is used

export interface DataSuiteEvent {
  type: DataSuiteEventType;
  payload: Record<string, unknown>;
  timestamp: string;
}

// ============================================
// Event Bus Implementation
// ============================================

type EventHandler = (event: DataSuiteEvent) => void;

class DataSuiteEventBus {
  private handlers: Set<EventHandler> = new Set();
  private eventLog: DataSuiteEvent[] = [];
  private maxLogSize = 1000;

  /**
   * Subscribe to all events
   */
  subscribe(handler: EventHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  /**
   * Emit an event to all subscribers
   */
  emit(event: DataSuiteEvent): void {
    // Log event
    this.eventLog.push(event);
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog = this.eventLog.slice(-this.maxLogSize);
    }

    // Notify handlers
    for (const handler of this.handlers) {
      try {
        handler(event);
      } catch (error) {
        console.error("[DataSuiteEventBus] Handler error:", error);
      }
    }
  }

  /**
   * Get recent events (for UI display)
   */
  getRecentEvents(limit = 50): DataSuiteEvent[] {
    return this.eventLog.slice(-limit).reverse();
  }

  /**
   * Get events by type
   */
  getEventsByType(type: DataSuiteEventType, limit = 20): DataSuiteEvent[] {
    return this.eventLog
      .filter((e) => e.type === type)
      .slice(-limit)
      .reverse();
  }

  /**
   * Clear event log (for testing)
   */
  clear(): void {
    this.eventLog = [];
  }

  // ============================================
  // OBSERVABILITY HELPERS (for monitoring/alerting)
  // ============================================

  /**
   * Get deprecated API call events (for alerting)
   */
  getDeprecatedCalls(limit = 100): DataSuiteEvent[] {
    return this.getEventsByType("deprecated.api_call", limit);
  }

  /**
   * Get count of deprecated calls since a timestamp
   */
  getDeprecatedCallCountSince(since: Date): number {
    return this.eventLog.filter(
      (e) => e.type === "deprecated.api_call" && new Date(e.timestamp) >= since
    ).length;
  }

  /**
   * Get summary for alerting (returns null if no deprecated calls)
   */
  getDeprecatedCallSummary(): {
    totalCalls: number;
    uniqueFunctions: Set<string>;
    mutatorCalls: number;
    lastCall: string | null;
  } | null {
    const deprecatedEvents = this.getDeprecatedCalls();
    if (deprecatedEvents.length === 0) return null;

    const uniqueFunctions = new Set<string>();
    let mutatorCalls = 0;

    for (const event of deprecatedEvents) {
      const fnName = event.payload.functionName as string;
      uniqueFunctions.add(fnName);
      if (event.payload.isMutator) mutatorCalls++;
    }

    return {
      totalCalls: deprecatedEvents.length,
      uniqueFunctions,
      mutatorCalls,
      lastCall: deprecatedEvents[0]?.timestamp || null,
    };
  }
}

// Singleton instance
export const eventBus = new DataSuiteEventBus();
