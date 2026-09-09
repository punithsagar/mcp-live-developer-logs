import type { Log } from "../types.js";

export interface LogAggregation {
  totalLogs: number;
  info: number;
  warnings: number;
  errors: number;
  byService: Record<string, number>;
  errorsByService: Record<string, number>;
  latestLogs: Log[];
}

export class LogAggregator {
  private totalLogs = 0;
  private info = 0;
  private warnings = 0;
  private errors = 0;

  private byService: Record<string, number> = {};
  private errorsByService: Record<string, number> = {};
  private latestLogs: Log[] = [];
  private logsByService: Record<string, Log[]> = {};

  addLogs(logs: Log[]): void {
    for (const log of logs) {
      this.totalLogs++;

      if (log.level === "INFO") this.info++;
      if (log.level === "WARN") this.warnings++;
      if (log.level === "ERROR") this.errors++;

      if (!this.logsByService[log.service]) {
  this.logsByService[log.service] = [];
}

this.logsByService[log.service].push(log);

if (this.logsByService[log.service].length > 100) {
  this.logsByService[log.service] =
    this.logsByService[log.service].slice(-100);
}

      if (log.level === "ERROR") {
        this.errorsByService[log.service] =
          (this.errorsByService[log.service] ?? 0) + 1;
      }

      this.latestLogs.push(log);
    }

    // Keep only the latest 100 logs in memory.
    if (this.latestLogs.length > 100) {
      this.latestLogs = this.latestLogs.slice(-100);
    }
  }

  getAggregation(): LogAggregation {
    return {
      totalLogs: this.totalLogs,
      info: this.info,
      warnings: this.warnings,
      errors: this.errors,
      byService: { ...this.byService },
      errorsByService: { ...this.errorsByService },
      latestLogs: [...this.latestLogs],
    };
  }
  getLatestLogs(): Log[] {
  return [...this.latestLogs];

}
getLogsByService(service: string): Log[] {
  return [...(this.logsByService[service] ?? [])];
}
}