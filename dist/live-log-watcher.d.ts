import type { Log } from "./types.js";
export declare function watchLogs(onLog: (log: Log) => void): Promise<() => void>;
