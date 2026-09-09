import type { Log } from "./types.js";
import { readStoredLogs } from "./storage/log-storage.js";
import { LogIndex } from "./storage/log-index.js";
import { sanitizeLogMessage } from "./security/log-sanitizer.js";
const logIndex = new LogIndex();
let initialized = false;

async function ensureInitialized(): Promise<void> {
  if (!initialized) {
    await logIndex.initialize();
    initialized = true;
  }
}

export async function readLogs(): Promise<Log[]> {
  const logs = await readStoredLogs();

  return logs.map((log) => ({
    ...log,
    message: sanitizeLogMessage(log.message),
  }));
}
export async function getLogIndex(): Promise<LogIndex> {
  await ensureInitialized();
  return logIndex;
}

export async function updateLogIndex(): Promise<void> {
  await ensureInitialized();
  await logIndex.update();
}