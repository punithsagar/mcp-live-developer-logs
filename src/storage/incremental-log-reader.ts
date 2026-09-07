import { open } from "node:fs/promises";
import type { Log } from "../types.js";

const logFile = "logs/app.jsonl";

export interface IncrementalReadResult {
  logs: Log[];
  nextPosition: number;
  remainder: string;
}

export async function readLogsIncrementally(
  position: number,
  remainder = ""
): Promise<IncrementalReadResult> {
  const file = await open(logFile, "r");

  try {
    const stats = await file.stat();

    // The file was truncated or replaced.
    if (stats.size < position) {
      position = 0;
      remainder = "";
    }

    // No new data.
    if (stats.size === position) {
      return {
        logs: [],
        nextPosition: position,
        remainder,
      };
    }

    const length = stats.size - position;
    const buffer = Buffer.alloc(length);

    await file.read(buffer, 0, length, position);

    const content = remainder + buffer.toString("utf-8");

    const lines = content.split("\n");

    // Keep the final incomplete line for the next read.
    const incompleteLine = lines.pop() ?? "";

    const logs: Log[] = [];

    for (const line of lines) {
      if (!line.trim()) {
        continue;
      }

      try {
        logs.push(JSON.parse(line) as Log);
      } catch {
        // Ignore malformed lines.
      }
    }

    return {
      logs,
      nextPosition: stats.size,
      remainder: incompleteLine,
    };
  } finally {
    await file.close();
  }
}