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
        requestedAt: new Date().toISOString()
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
    requestedAt: new Date().toISOString()
  };
}
