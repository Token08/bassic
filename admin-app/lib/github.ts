import { randomUUID } from "node:crypto";
import type { PublishStatus } from "./deploy-status";

function getEnv(name: string, fallback?: string) {
  const value = process.env[name] || fallback;

  if (!value) {
    throw new Error(`${name} is not set.`);
  }

  return value;
}

export async function triggerDeploy() {
  const owner = getEnv("GITHUB_OWNER", "Token08");
  const repo = getEnv("GITHUB_REPO", "bassic");
  const eventType = getEnv("GITHUB_DISPATCH_EVENT_TYPE", "microcms_publish");
  const token = getEnv("GITHUB_DISPATCH_TOKEN");
  const requestId = randomUUID();
  const requestedAt = new Date().toISOString();
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/dispatches`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28"
    },
    body: JSON.stringify({
      event_type: eventType,
      client_payload: {
        source: "bassic-admin-app",
        requestId,
        requestedAt
      }
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `GitHub dispatch failed: ${response.status}`);
  }

  const actionsUrl = `https://github.com/${owner}/${repo}/actions`;

  return {
    status: "queued",
    actionsUrl,
    requestId,
    requestedAt
  };
}

export async function getDeployStatus(requestId: string, requestedAt: number): Promise<PublishStatus> {
  const owner = getEnv("GITHUB_OWNER", "Token08");
  const repo = getEnv("GITHUB_REPO", "bassic");
  const api = `https://api.github.com/repos/${owner}/${repo}/actions`;
  const created = new Date(requestedAt - 60_000).toISOString();
  const query = new URLSearchParams({ event: "repository_dispatch", branch: "main", created: `>=${created}`, per_page: "100" });
  const read = async (url: string) => {
    const response = await fetch(url, {
      headers: { Accept: "application/vnd.github+json" },
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 15 }
    });
    if (!response.ok) throw new Error(`GitHub status lookup failed: ${response.status}`);
    return response.json();
  };
  const { workflow_runs } = await read(`${api}/workflows/deploy-pages.yml/runs?${query}`) as {
    workflow_runs: { display_title: string; status: string; conclusion: string | null; id: number }[];
  };
  const run = workflow_runs.find((item) => item.display_title === `Bassic publish ${requestId}`);
  if (!run) return { state: "pending" } as const;
  const actionsUrl = `https://github.com/${owner}/${repo}/actions/runs/${run.id}`;
  if (run.status !== "completed") return { state: "pending", actionsUrl } as const;
  if (run.conclusion !== "success") return { state: "failed", actionsUrl } as const;
  const { jobs } = await read(`${api}/runs/${run.id}/jobs`) as {
    jobs: { name: string; steps: { name: string; conclusion: string }[] }[];
  };
  const verified = jobs.some((job) => job.name === "publish-lolipop-release" &&
    job.steps?.some((step) => step.name === "Confirm release served by the production site" && step.conclusion === "success"));
  return { state: verified ? "published" : "unconfirmed", actionsUrl } as const;
}
