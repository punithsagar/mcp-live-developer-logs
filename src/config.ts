const getNumberEnv = (
  name: string,
  defaultValue: number,
  min: number,
  max: number
): number => {
  const value = process.env[name];

  if (value === undefined) {
    return defaultValue;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new Error(
      `${name} must be a number between ${min} and ${max}`
    );
  }

  return parsed;
};

export const config = {
  port: getNumberEnv("PORT", 3000, 1, 65535),

  logFile: process.env.LOG_FILE ?? "logs/app.jsonl",

  rotation: {
    maxFileSize: getNumberEnv(
      "LOG_MAX_FILE_SIZE",
      1024 * 1024,
      1024,
      1024 * 1024 * 1024
    ),
    maxBackups: getNumberEnv("LOG_MAX_BACKUPS", 5, 1, 100),
  },

  metricsCache: {
    maxAgeMs: getNumberEnv("METRICS_CACHE_MAX_AGE_MS", 5000, 100, 600000),
  },

  recentLogs: {
    defaultLimit: 10,
    maxLimit: 100,
    maxMinutes: 1440,
  },

  liveLogs: {
    defaultDuration: 30,
    maxDuration: 300,
    defaultMaxLogs: 100,
    maxLogs: 1000,
  },
};