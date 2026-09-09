import type { Log } from "../types.js";
import { sanitizeLogMessage } from "./log-sanitizer.js";

export function sanitizeLogs(logs: Log[]): Log[] {
  return logs.map((log) => ({
    ...log,
    message: sanitizeLogMessage(log.message),
  }));
}