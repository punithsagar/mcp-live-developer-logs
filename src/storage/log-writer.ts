import { appendFile } from "node:fs/promises";
import { rotateLogsIfNeeded } from "./log-rotation.js";
import type { Log } from "../types.js";
import { config } from "../config.js";

export async function writeLog(log: Log): Promise<void> {
  const line = JSON.stringify(log) + "\n";

  await appendFile(config.logFile, line, "utf-8");

  await rotateLogsIfNeeded();
}