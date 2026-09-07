import { readFile } from "node:fs/promises";
import type { Log } from "../types.js";

const logFile = "logs/app.jsonl";

export async function readStoredLogs(): Promise<Log[]> {
  const file = await readFile(logFile, "utf-8");

  const lines = file
    .split("\n")
    .filter((line) => line.trim().length > 0);

  return lines.map((line) => JSON.parse(line) as Log);
}