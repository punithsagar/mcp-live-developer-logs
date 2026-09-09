import { readLogsIncrementally } from "./incremental-log-reader.js";
import { LogAggregator } from "./log-aggregator.js";
import { MetricsCache } from "./metrics-cache.js";
import type { Log } from "../types.js";

export class LogIndex {
  private position = 0;
  private remainder = "";

  private aggregator = new LogAggregator();
  private metricsCache = new MetricsCache();
getLogsByService(service: string): Log[] {
  return this.aggregator.getLogsByService(service);
}

  async initialize(): Promise<void> {
    const result = await readLogsIncrementally(
      this.position,
      this.remainder
    );

    this.position = result.nextPosition;
    this.remainder = result.remainder;

    this.aggregator.addLogs(result.logs);
    this.metricsCache.set(this.aggregator.getAggregation());
  }

  async update(): Promise<void> {
    const result = await readLogsIncrementally(
      this.position,
      this.remainder
    );

    this.position = result.nextPosition;
    this.remainder = result.remainder;

    this.aggregator.addLogs(result.logs);
    this.metricsCache.set(this.aggregator.getAggregation());
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
}