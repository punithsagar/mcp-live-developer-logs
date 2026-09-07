export function logInfo(message: string, ...args: unknown[]): void {
  console.error(`[INFO] ${message}`, ...args);
}

export function logWarn(message: string, ...args: unknown[]): void {
  console.error(`[WARN] ${message}`, ...args);
}

export function logError(message: string, ...args: unknown[]): void {
  console.error(`[ERROR] ${message}`, ...args);
}