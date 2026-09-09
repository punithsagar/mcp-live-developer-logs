import type { Log } from "../types.js";
import { MetricsCache } from "./metrics-cache.js";
import { readLogsIncrementally } from "./incremental-log-reader.js";
import { LogAggregator } from "./log-aggregator.js";

export class LogIndex {
  private position = 0;
  private remainder = "";

  private aggregator = new LogAggregator();
  private metricsCache = new MetricsCache();

  private lastUpdateAt = 0;
  private lastFileSize = 0;

  async initialize(): Promise<void> {
    const result = await readLogsIncrementally(
      this.position,
      this.remainder
    );

    this.position = result.nextPosition;
    this.remainder = result.remainder;

    this.aggregator.addLogs(result.logs);

    this.metricsCache.set(
      this.aggregator.getAggregation()
    );

    this.lastUpdateAt = Date.now();
    this.lastFileSize = this.position;
  }

  async update(): Promise<void> {
    const result = await readLogsIncrementally(
      this.position,
      this.remainder
    );

    if (
      result.nextPosition === this.position &&
      result.logs.length === 0 &&
      result.remainder === this.remainder
    ) {
      return;
    }

    this.position = result.nextPosition;
    this.remainder = result.remainder;

    this.aggregator.addLogs(result.logs);

    this.metricsCache.set(
      this.aggregator.getAggregation()
    );

    this.lastUpdateAt = Date.now();
    this.lastFileSize = this.position;
  }

  getAggregation() {
    return this.aggregator.getAggregation();
  }

  getCachedMetrics() {
    return this.metricsCache.get();
  }

  getRecentLogs(): Log[] {
    return this.aggregator.getLatestLogs();
  }

  getLogsByService(service: string): Log[] {
    return this.aggregator.getLogsByService(service);
  }

  getLastUpdateAt(): number {
    return this.lastUpdateAt;
  }

  getLastFileSize(): number {
    return this.lastFileSize;
  }
}