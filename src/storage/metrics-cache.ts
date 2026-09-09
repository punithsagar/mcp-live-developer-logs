import type { LogAggregation } from "./log-aggregator.js";

export interface CachedMetrics {
  aggregation: LogAggregation;
  updatedAt: number;
}

export class MetricsCache {
  private cachedMetrics: CachedMetrics | null = null;

  set(aggregation: LogAggregation): void {
    this.cachedMetrics = {
      aggregation,
      updatedAt: Date.now(),
    };
  }

  get(): CachedMetrics | null {
    return this.cachedMetrics;
  }

  isFresh(maxAgeMs: number): boolean {
    if (!this.cachedMetrics) {
      return false;
    }

    return (
      Date.now() - this.cachedMetrics.updatedAt <= maxAgeMs
    );
  }

  clear(): void {
    this.cachedMetrics = null;
  }

  isEmpty(): boolean {
    return this.cachedMetrics === null;
  }
}