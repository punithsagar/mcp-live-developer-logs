import { readFile } from "node:fs/promises";
const logFile = "logs/app.jsonl";
export async function readLogs() {
    const file = await readFile(logFile, "utf-8");
    const lines = file
        .split("\n")
        .filter((line) => line.trim().length > 0);
    return lines.map((line) => JSON.parse(line));
}
//# sourceMappingURL=log-service.js.map