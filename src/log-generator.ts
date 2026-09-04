
import { appendFile } from "node:fs/promises";

const logFile = "logs/app.jsonl";

const services = [
  "auth-service",
  "payment-service",
  "database-service",
  "api-service",
];

const messages = [
  "Request completed successfully",
  "User logged in successfully",
  "Payment initiated",
  "Database query completed",
  "Database connection failed",
  "Payment retry attempt",
  "API request received",
];

const levels = ["INFO", "INFO", "INFO", "WARN", "ERROR"];

function generateLog() {
  const log = {
    timestamp: new Date().toISOString(),
    level: levels[Math.floor(Math.random() * levels.length)],
    service: services[Math.floor(Math.random() * services.length)],
    message: messages[Math.floor(Math.random() * messages.length)],
  };

  return JSON.stringify(log) + "\n";
}

async function writeLog() {
  const log = generateLog();

  await appendFile(logFile, log);

  console.log(log.trim());
}

console.log("Log generator started...");

setInterval(() => {
  writeLog().catch((error) => {
    console.error("Failed to write log:", error);
  });
}, 2000);

