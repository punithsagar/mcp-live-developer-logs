import { watch } from "node:fs";
import { stat, readFile } from "node:fs/promises";
import type { Log } from "./types.js";

const logFile = "logs/app.jsonl";

export async function watchLogs(
  onLog: (log: Log) => void
): Promise<() => void> {
  let filePosition = 0;

  const fileStats = await stat(logFile);
  filePosition = fileStats.size;

  console.log("Starting from position:", filePosition);

  const watcher = watch(logFile, async () => {
    const newStats = await stat(logFile);

    if (newStats.size <= filePosition) {
      return;
    }

    const fileContent = await readFile(logFile, "utf-8");

    const newContent = fileContent.slice(filePosition);

    filePosition = newStats.size;

    const newLines = newContent
      .split("\n")
      .filter((line) => line.trim().length > 0);

    for (const line of newLines) {
      const log = JSON.parse(line) as Log;

      onLog(log);
    }
  });

  console.log("Watching:", logFile);

  return () => {
    watcher.close();
    console.log("Stopped watching:", logFile);
  };
}