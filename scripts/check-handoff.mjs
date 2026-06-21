import { spawnSync } from "node:child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const commands = [
  ["typecheck"],
  ["typecheck:admin-app"],
  ["check:admin-app"],
  ["build"],
  ["build:admin-app"],
  ["smoke:links"],
  ["smoke:content"],
  ["smoke:seo"]
];

console.log("Bassic. handoff readiness check");
console.log("Running public site, admin app, and smoke checks in the handoff order.\n");

for (const [script] of commands) {
  console.log(`\n> npm run ${script}`);
  const command = process.platform === "win32" ? process.env.ComSpec || "cmd.exe" : npmCommand;
  const args = process.platform === "win32" ? ["/d", "/s", "/c", `${npmCommand} run ${script}`] : ["run", script];
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: false,
    env: process.env
  });

  if (result.status !== 0) {
    console.error(`\nHandoff readiness check failed at: npm run ${script}`);
    process.exit(result.status || 1);
  }
}

console.log("\nHandoff readiness check passed.");
console.log("If real microCMS credentials are available, also run: npm run smoke:cms");
