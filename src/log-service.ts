import type { Log } from "./types.js";
import { readStoredLogs } from "./storage/log-storage.js";

export async function readLogs(): Promise<Log[]> {
  return readStoredLogs();
}