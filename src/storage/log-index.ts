import { readLogsIncrementally } from "./incremental-log-reader.js";
import { LogAggregator } from "./log-aggregator.js";

export class LogIndex {
  private position = 0;
  private remainder = "";

  private aggregator = new LogAggregator();

  async initialize(): Promise<void> {
    const result = await readLogsIncrementally(
      this.position,
      this.remainder
    );

    this.position = result.nextPosition;
    this.remainder = result.remainder;

    this.aggregator.addLogs(result.logs);
  }

  async update(): Promise<void> {
    const result = await readLogsIncrementally(
      this.position,
      this.remainder
    );

    this.position = result.nextPosition;
    this.remainder = result.remainder;

    this.aggregator.addLogs(result.logs);
  }

  getAggregation() {
    return this.aggregator.getAggregation();
  }
}