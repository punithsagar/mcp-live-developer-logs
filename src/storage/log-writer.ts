import { appendFile } from "node:fs/promises";
import { rotateLogsIfNeeded } from "./log-rotation.js";
import type { Log } from "../types.js";

const logFile = "logs/app.jsonl";

export async function writeLog(log: Log): Promise<void> {
  const line = JSON.stringify(log) + "\n";

  await appendFile(logFile, line, "utf-8");

  await rotateLogsIfNeeded();
}