import { writeLog } from "./storage/log-writer.js";

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
  return {
    timestamp: new Date().toISOString(),
    level: levels[Math.floor(Math.random() * levels.length)] as
      | "INFO"
      | "WARN"
      | "ERROR",
    service: services[Math.floor(Math.random() * services.length)],
    message: messages[Math.floor(Math.random() * messages.length)],
  };
}

async function generateAndWriteLog() {
  const log = generateLog();

  await writeLog(log);

  console.log(JSON.stringify(log));
}

console.log("Log generator started...");

setInterval(() => {
  generateAndWriteLog().catch((error) => {
    console.error("Failed to write log:", error);
  });
}, 2000);