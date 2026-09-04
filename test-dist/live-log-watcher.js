import { watch } from "node:fs";
import { stat, readFile } from "node:fs/promises";
const logFile = "logs/app.jsonl";
let filePosition = 0;
async function initialize() {
    const fileStats = await stat(logFile);
    filePosition = fileStats.size;
    console.log("Starting from position:", filePosition);
    watch(logFile, async () => {
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
            console.log("New log:", line);
        }
    });
    console.log("Watching:", logFile);
}
await initialize();
//# sourceMappingURL=live-log-watcher.js.map