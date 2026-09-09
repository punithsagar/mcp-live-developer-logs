export const config = {
  logFile: "logs/app.jsonl",
metricsCache: {
  maxAgeMs: 5000,
},
  rotation: {
    maxFileSize: 1024 * 1024,
    maxBackups: 5,
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