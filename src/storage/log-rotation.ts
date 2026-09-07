import {
  readdir,
  rename,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

const logDirectory = "logs";
const logFile = path.join(logDirectory, "app.jsonl");

const MAX_FILE_SIZE = 1024 * 1024;

// Keep the newest 5 rotated files.
const MAX_BACKUPS = 5;

export async function rotateLogsIfNeeded(): Promise<boolean> {
  const stats = await stat(logFile);

  if (stats.size < MAX_FILE_SIZE) {
    return false;
  }

  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-");

  const backupFile = path.join(
    logDirectory,
    `app-${timestamp}.jsonl`
  );

  await rename(logFile, backupFile);

  await writeFile(logFile, "", "utf-8");

  await enforceRetention();

  return true;
}

async function enforceRetention(): Promise<void> {
  const files = await readdir(logDirectory);

  const backups = files
    .filter(
      (file) =>
        file.startsWith("app-") &&
        file.endsWith(".jsonl")
    )
    .sort()
    .reverse();

  const filesToDelete = backups.slice(MAX_BACKUPS);

  for (const file of filesToDelete) {
    const filePath = path.join(logDirectory, file);

    try {
      await import("node:fs/promises").then(({ unlink }) =>
        unlink(filePath)
      );
    } catch {
      // Ignore cleanup failures.
    }
  }
}