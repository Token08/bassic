import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const rl = createInterface({ input, output });

try {
  const serviceDomain = (await ask("microCMS service domain")).trim();
  const apiKey = (await ask("microCMS API key")).trim();

  if (!serviceDomain || !apiKey) {
    throw new Error("Both microCMS service domain and API key are required.");
  }

  setGithubSecret("MICROCMS_SERVICE_DOMAIN", serviceDomain);
  setGithubSecret("MICROCMS_API_KEY", apiKey);
  writeLocalEnv({ MICROCMS_SERVICE_DOMAIN: serviceDomain, MICROCMS_API_KEY: apiKey });

  console.log("\nmicroCMS admin setup values were saved.");
  console.log("Next: npm run check:admin && npm run smoke:cms");
} finally {
  rl.close();
}

async function ask(label) {
  return rl.question(`${label}: `);
}

function setGithubSecret(name, value) {
  const result = spawnSync("gh", ["secret", "set", name], {
    input: value,
    encoding: "utf8",
    shell: true
  });

  if (result.error || result.status !== 0) {
    throw new Error(`Failed to set GitHub secret ${name}: ${result.stderr?.trim() || result.error?.message}`);
  }

  console.log(`Set GitHub secret ${name}`);
}

function writeLocalEnv(values) {
  const envPath = ".env.local";
  const existing = existsSync(envPath) ? parseEnv(readFileSync(envPath, "utf8")) : new Map();

  for (const [key, value] of Object.entries(values)) {
    existing.set(key, value);
  }

  const content = `${Array.from(existing.entries())
    .map(([key, value]) => `${key}=${value}`)
    .join("\n")}\n`;

  writeFileSync(envPath, content, "utf8");
  console.log(`Updated ${envPath}`);
}

function parseEnv(content) {
  const values = new Map();
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    values.set(trimmed.slice(0, separatorIndex).trim(), trimmed.slice(separatorIndex + 1).trim());
  }

  return values;
}
