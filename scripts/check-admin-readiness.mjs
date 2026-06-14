import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { loadLocalEnv } from "./load-local-env.mjs";

loadLocalEnv();

const checks = [];

checkFile("microCMS admin guide", "docs/microcms-admin-v1.md");
checkFile("GitHub Pages workflow", ".github/workflows/deploy-pages.yml");
checkWorkflow();
checkLocalEnv();
checkGithubSecrets();

const failed = checks.filter((check) => !check.ok);

for (const check of checks) {
  console.log(`${check.ok ? "OK" : "NG"} ${check.label}${check.detail ? ` - ${check.detail}` : ""}`);
}

if (failed.length) {
  console.error("\nAdmin readiness check failed. Complete the NG items above, then run npm run check:admin again.");
  process.exit(1);
}

console.log("\nAdmin readiness check passed.");

function add(label, ok, detail = "") {
  checks.push({ label, ok, detail });
}

function checkFile(label, path) {
  add(label, existsSync(path), path);
}

function checkWorkflow() {
  const path = ".github/workflows/deploy-pages.yml";
  if (!existsSync(path)) {
    return;
  }

  const workflow = readFileSync(path, "utf8");
  add("repository_dispatch trigger", workflow.includes("repository_dispatch") && workflow.includes("microcms_publish"));
  add("MICROCMS_SERVICE_DOMAIN GitHub secret wired", workflow.includes("secrets.MICROCMS_SERVICE_DOMAIN"));
  add("MICROCMS_API_KEY GitHub secret wired", workflow.includes("secrets.MICROCMS_API_KEY"));
}

function checkLocalEnv() {
  add(
    "local MICROCMS_SERVICE_DOMAIN env",
    true,
    process.env.MICROCMS_SERVICE_DOMAIN ? "set" : "not set; optional for local smoke test"
  );
  add("local MICROCMS_API_KEY env", true, process.env.MICROCMS_API_KEY ? "set" : "not set; optional for local smoke test");
}

function checkGithubSecrets() {
  const gh = spawnSync("gh", ["secret", "list"], { encoding: "utf8" });

  if (gh.error || gh.status !== 0) {
    add("GitHub secrets readable", false, gh.stderr?.trim() || gh.error?.message || "gh secret list failed");
    return;
  }

  add("GitHub secrets readable", true);
  const secretNames = new Set(
    gh.stdout
      .split(/\r?\n/)
      .map((line) => line.trim().split(/\s+/)[0])
      .filter(Boolean)
  );

  add("GitHub secret MICROCMS_SERVICE_DOMAIN", secretNames.has("MICROCMS_SERVICE_DOMAIN"));
  add("GitHub secret MICROCMS_API_KEY", secretNames.has("MICROCMS_API_KEY"));
}
