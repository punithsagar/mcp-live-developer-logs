import {
  readdir,
  rename,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { config } from "../config.js";

const logDirectory = path.dirname(config.logFile);

export async function rotateLogsIfNeeded(): Promise<boolean> {
  const stats = await stat(config.logFile);

  if (stats.size < config.rotation.maxFileSize) {
    return false;
  }

  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-");

  const backupFile = path.join(
    logDirectory,
    `app-${timestamp}.jsonl`
  );

  await rename(config.logFile, backupFile);

  await writeFile(config.logFile, "", "utf-8");

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

  const filesToDelete = backups.slice(
    config.rotation.maxBackups
  );

  for (const file of filesToDelete) {
    const filePath = path.join(logDirectory, file);

    try {
      await unlink(filePath);
    } catch {
      // Ignore cleanup failures.
    }
  }
}