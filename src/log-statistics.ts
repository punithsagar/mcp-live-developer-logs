import type { Log } from "./types.js";

export interface LogStatistics {
  totalLogs: number;
  info: number;
  warnings: number;
  errors: number;
  errorRate: number;
  byService: Record<string, number>;
  errorsByService: Record<string, number>;
  topErrorService: string | null;
  errorRateByService: Record<string, number>;
  warningsByService: Record<string, number>;
  healthStatus: "HEALTHY" | "WARNING" | "CRITICAL";
  warningRate: number;
  severityScore: number;
  errorTrend: "INCREASING" | "DECREASING" | "STABLE";
  recentErrorRate: number;
  healthSummary: string;
  anomalies: string[];
  recommendations: string[];
  serviceHealth: Record<
  string,
  "HEALTHY" | "WARNING" | "CRITICAL"
>;
}

export function calculateLogStatistics(logs: Log[]): LogStatistics {
  let info = 0;
  let warnings = 0;
  let errors = 0;

  const byService: Record<string, number> = {};
  const errorsByService: Record<string, number> = {};
  const warningsByService: Record<string, number> = {};

  for (const log of logs) {
    if (log.level === "INFO") {
      info++;
    } else if (log.level === "WARN") {
      warnings++;
    } else if (log.level === "ERROR") {
      errors++;
    }
    if (log.level === "WARN") {
  warningsByService[log.service] =
    (warningsByService[log.service] ?? 0) + 1;
}

    byService[log.service] = (byService[log.service] ?? 0) + 1;
    if (log.level === "ERROR") {
  errorsByService[log.service] =
    (errorsByService[log.service] ?? 0) + 1;
}
  }
  const errorRate =
  logs.length === 0 ? 0 : (errors / logs.length) * 100;
  let topErrorService: string | null = null;
let highestErrorCount = 0;

for (const [service, count] of Object.entries(errorsByService)) {
  if (count > highestErrorCount) {
    highestErrorCount = count;
    topErrorService = service;
  }
}
const warningRate =
  logs.length === 0 ? 0 : (warnings / logs.length) * 100;
  const severityScore =
  errorRate * 2 + warningRate;
  const midpoint = Math.floor(logs.length / 2);

const olderLogs = logs.slice(0, midpoint);
const recentLogs = logs.slice(midpoint);

const olderErrors = olderLogs.filter(
  (log) => log.level === "ERROR"
).length;

const recentErrors = recentLogs.filter(
  (log) => log.level === "ERROR"
).length;

const olderErrorRate =
  olderLogs.length === 0
    ? 0
    : (olderErrors / olderLogs.length) * 100;

const recentErrorRate =
  recentLogs.length === 0
    ? 0
    : (recentErrors / recentLogs.length) * 100;

let errorTrend: "INCREASING" | "DECREASING" | "STABLE";

const trendDifference = recentErrorRate - olderErrorRate;

if (trendDifference >= 5) {
  errorTrend = "INCREASING";
} else if (trendDifference <= -5) {
  errorTrend = "DECREASING";
} else {
  errorTrend = "STABLE";
}

let healthStatus: "HEALTHY" | "WARNING" | "CRITICAL";


if (errorRate >= 20) {
  healthStatus = "CRITICAL";
} else if (errorRate >= 10) {
  healthStatus = "WARNING";
} else {
  healthStatus = "HEALTHY";
}

let healthSummary: string;

if (healthStatus === "CRITICAL") {
  healthSummary = `CRITICAL: Error rate is ${errorRate.toFixed(
    2
  )}%. Top error service: ${
    topErrorService ?? "unknown"
  }. Error trend: ${errorTrend}.`;
} else if (healthStatus === "WARNING") {
  healthSummary = `WARNING: Error rate is ${errorRate.toFixed(
    2
  )}%. Top error service: ${
    topErrorService ?? "unknown"
  }. Error trend: ${errorTrend}.`;
} else {
  healthSummary = `HEALTHY: Error rate is ${errorRate.toFixed(
    2
  )}%. Error trend: ${errorTrend}.`;
}

const errorRateByService: Record<string, number> = {};

for (const [service, total] of Object.entries(byService)) {
  const serviceErrors = errorsByService[service] ?? 0;

  errorRateByService[service] =
    total === 0 ? 0 : (serviceErrors / total) * 100;
}

const serviceHealth: Record<
  string,
  "HEALTHY" | "WARNING" | "CRITICAL"
> = {};

for (const [service, rate] of Object.entries(errorRateByService)) {
  if (rate >= 50) {
    serviceHealth[service] = "CRITICAL";
  } else if (rate >= 20) {
    serviceHealth[service] = "WARNING";
  } else {
    serviceHealth[service] = "HEALTHY";
  }
}

const anomalies: string[] = [];
const recommendations: string[] = [];

if (healthStatus === "CRITICAL") {
  recommendations.push(
    "Investigate the highest-error service immediately."
  );
}

if (errorTrend === "INCREASING") {
  recommendations.push(
    "Error rate is increasing. Check recent deployments and application changes."
  );
}

if (topErrorService !== null) {
  const topServiceRate =
    errorRateByService[topErrorService] ?? 0;

  if (topServiceRate >= 30) {
    recommendations.push(
      `${topErrorService} has a high service-level error rate of ${topServiceRate.toFixed(
        2
      )}%.`
    );
  }
}

if (anomalies.length > 0) {
  recommendations.push(
    "Investigate the detected service anomalies."
  );
}

for (const [service, rate] of Object.entries(errorRateByService)) {
  const serviceTotal = byService[service] ?? 0;
  const serviceErrors = errorsByService[service] ?? 0;

  if (rate >= 50 && serviceTotal >= 5) {
    anomalies.push(
      `${service} has a high error rate of ${rate.toFixed(
        2
      )}% with ${serviceErrors} errors out of ${serviceTotal} logs`
    );
  }
}
  return {
    totalLogs: logs.length,
    info,
    warnings,
    errors,
    errorRate,
    errorsByService,
    byService,
    topErrorService,
    errorRateByService,
    warningsByService,
    healthStatus,
    warningRate,
    severityScore,
    errorTrend,
    recentErrorRate,
    healthSummary,
    anomalies,
    recommendations,
    serviceHealth,
  };
}