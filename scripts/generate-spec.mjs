import { spawn } from "node:child_process";
import process from "node:process";

const sourceRepo = process.argv[2] ?? "../masterbelt";

await run(process.execPath, ["scripts/sync-specs.mjs", sourceRepo]);
await run(process.execPath, ["scripts/generate-search-index.mjs"]);

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} failed with ${signal ?? `exit code ${code}`}`));
    });
  });
}
