import { readFile } from "node:fs/promises";
import type { Log } from "../types.js";

import { config } from "../config.js";

export async function readStoredLogs(): Promise<Log[]> {
  const file = await readFile(config.logFile, "utf-8");
  const lines = file
    .split("\n")
    .filter((line) => line.trim().length > 0);

  return lines.map((line) => JSON.parse(line) as Log);
}