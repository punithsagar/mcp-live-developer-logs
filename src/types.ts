export type LogLevel = "INFO" | "WARN" | "ERROR";

export interface Log {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
}