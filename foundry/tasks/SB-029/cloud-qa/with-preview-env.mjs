import { spawn } from "node:child_process";

// Private operator command wrapper. It never prints environment values and does
// not control a browser, install a cookie, or weaken the application's boundary.
const [command, ...args] = process.argv.slice(2);
if (!command || !process.env.SB029_PREVIEW_WORKSPACE) {
  throw new Error("PREVIEW_COMMAND_AND_WORKSPACE_REQUIRED");
}
const child = spawn(command, args, {
  cwd: process.env.SB029_PREVIEW_WORKSPACE,
  env: process.env,
  stdio: "inherit",
});
child.on("error", () => {
  console.error("PREVIEW_COMMAND_START_FAILED; details suppressed");
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
