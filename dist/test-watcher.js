import { watchLogs } from "./live-log-watcher.js";
const stopWatching = await watchLogs((log) => {
    console.log("Received log:", log);
});
process.on("SIGINT", () => {
    stopWatching();
    process.exit(0);
});
//# sourceMappingURL=test-watcher.js.map