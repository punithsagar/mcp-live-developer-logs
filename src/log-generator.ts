import { writeLog } from "./storage/log-writer.js";
import type { Log, LogLevel } from "./types.js";

const services = [
  "api-service",
  "auth-service",
  "payment-service",
  "database-service",
];

const messages: Record<LogLevel, string[]> = {
  INFO: [
    "API request completed successfully",
    "User request processed",
    "Database query completed",
    "Payment request received",
    "Authentication successful",
  ],

  WARN: [
    "Slow database query detected",
    "Payment retry scheduled",
    "API response time exceeded threshold",
    "Rate limit approaching",
    "Connection pool usage is high",
  ],

  ERROR: [
    "Database connection failed",
    "Authentication request failed",
    "Payment processing failed",
    "API request returned server error",
    "Database query failed",
  ],
};

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomLevel(): LogLevel {
  const value = Math.random();

  if (value < 0.65) return "INFO";
  if (value < 0.9) return "WARN";

  return "ERROR";
}

async function generateLogs(count = 20): Promise<void> {
  for (let i = 0; i < count; i++) {
    const level = randomLevel();

    const log: Log = {
      timestamp: new Date().toISOString(),
      level,
      service: randomItem(services),
      message: randomItem(messages[level]),
    };

    await writeLog(log);
  }

  console.log(`Generated ${count} logs.`);
}

await generateLogs();