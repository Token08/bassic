import { spawnSync } from "node:child_process";

const repo = process.env.GITHUB_REPOSITORY || getRepoFullName();

if (!repo) {
  console.error("Could not determine GitHub repository. Set GITHUB_REPOSITORY=owner/repo or run inside a gh-enabled repo.");
  process.exit(1);
}

const result = spawnSync(
  "gh",
  ["api", `repos/${repo}/dispatches`, "--method", "POST", "-f", "event_type=microcms_publish"],
  { encoding: "utf8", shell: true }
);

if (result.error || result.status !== 0) {
  console.error(result.stderr?.trim() || result.error?.message || "Failed to trigger repository_dispatch.");
  process.exit(result.status || 1);
}

console.log(`Triggered microcms_publish repository_dispatch for ${repo}.`);

function getRepoFullName() {
  const view = spawnSync("gh", ["repo", "view", "--json", "nameWithOwner", "-q", ".nameWithOwner"], {
    encoding: "utf8",
    shell: true
  });

  if (view.error || view.status !== 0) {
    return "";
  }

  return view.stdout.trim();
}
