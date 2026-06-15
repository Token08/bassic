import { existsSync, readFileSync } from "node:fs";
import { loadLocalEnv } from "./load-local-env.mjs";

loadLocalEnv("admin-app/.env.local");

const checks = [];

checkFile("dedicated admin app package", "admin-app/package.json");
checkFile("dedicated admin app package lock", "admin-app/package-lock.json");
checkFile("Vercel config", "admin-app/vercel.json");
checkFile("dedicated admin README", "admin-app/README.md");
checkFile("client handoff manual", "docs/delivery-admin-manual.md");
checkFile("client handoff checklist", "docs/client-handoff-checklist.md");
checkFile("login API route", "admin-app/app/api/login/route.ts");
checkFile("content API route", "admin-app/app/api/content/[endpoint]/route.ts");
checkFile("media upload API route", "admin-app/app/api/media/route.ts");
checkFile("deploy API route", "admin-app/app/api/deploy/route.ts");
checkFile("health API route", "admin-app/app/api/health/route.ts");
checkNoMojibake();
checkClientFacingText();
checkClientDocsText();
checkDocsIndexBoundaries();
checkAdminSchemaDocsMatch();
checkPackageScript("dev:admin-app");
checkPackageScript("build:admin-app");
checkPackageScript("typecheck:admin-app");
checkPackageScript("check:admin-app");
checkLocalEnv("ADMIN_PASSWORD", "Vercel required; local optional");
checkLocalEnv("ADMIN_SESSION_SECRET", "Vercel required; local optional");
checkLocalEnv("MICROCMS_SERVICE_DOMAIN", "Vercel required; local optional");
checkLocalEnv("MICROCMS_API_KEY", "Vercel required; local optional");
checkLocalEnv("GITHUB_DISPATCH_TOKEN", "Vercel required; local optional");
checkLocalEnv("GITHUB_OWNER", "defaults to Token08 when omitted");
checkLocalEnv("GITHUB_REPO", "defaults to bassic when omitted");
checkLocalEnv("GITHUB_DISPATCH_EVENT_TYPE", "defaults to microcms_publish when omitted");
checkLocalEnv("NEXT_PUBLIC_PUBLIC_SITE_URL", "defaults to https://www.bassic.jp/ when omitted");

const failed = checks.filter((check) => !check.ok);

for (const check of checks) {
  console.log(`${check.ok ? "OK" : "NG"} ${check.label}${check.detail ? ` - ${check.detail}` : ""}`);
}

if (failed.length) {
  console.error("\nDedicated admin app readiness check failed. Complete the NG items above, then run npm run check:admin-app again.");
  process.exit(1);
}

console.log("\nDedicated admin app readiness check passed.");

function add(label, ok, detail = "") {
  checks.push({ label, ok, detail });
}

function checkFile(label, path) {
  add(label, existsSync(path), path);
}

function checkPackageScript(scriptName) {
  if (!existsSync("package.json")) {
    add(`package script ${scriptName}`, false, "package.json missing");
    return;
  }

  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
  add(`package script ${scriptName}`, Boolean(packageJson.scripts?.[scriptName]));
}

function checkLocalEnv(name, detail) {
  add(`env ${name}`, true, process.env[name] ? "set locally" : detail);
}

function checkNoMojibake() {
  const patterns = [
    "繝ｭ",
    "繧ｰ",
    "縺ｧ",
    "縺励",
    "譁ｰ",
    "蜈ｬ",
    "邂｡",
    "髱｢",
    "逕ｻ",
    "菫晏",
    "蜿肴",
    "螟画"
  ];
  const files = [
    "admin-app/app/admin-client.tsx",
    "admin-app/app/layout.tsx",
    "admin-app/lib/admin-schema.ts",
    "admin-app/lib/env.ts",
    "admin-app/README.md",
    "docs/admin-docs-index.md",
    "docs/client-handoff-checklist.md",
    "docs/delivery-admin-manual.md",
    "docs/delivery-admin-manual-v1.md",
    "docs/dedicated-admin-app-v1.md",
    "docs/microcms-admin-v1.md",
    "docs/microcms-field-definitions-v1.md"
  ];
  const hits = [];

  for (const file of files) {
    if (!existsSync(file)) {
      continue;
    }

    const text = readFileSync(file, "utf8");
    for (const pattern of patterns) {
      if (text.includes(pattern)) {
        hits.push(`${file}: ${pattern}`);
      }
    }
  }

  add("admin and handoff docs have no mojibake markers", hits.length === 0, hits.join(", "));
}

function checkClientFacingText() {
  const forbidden = ["microCMS", "GitHub", "Vercel", "APIキー", "トークン", "環境変数"];
  const files = [
    "admin-app/app/admin-client.tsx",
    "admin-app/app/api/content/[endpoint]/route.ts",
    "admin-app/app/api/content/[endpoint]/[id]/route.ts",
    "admin-app/app/api/deploy/route.ts",
    "admin-app/app/api/media/route.ts",
    "admin-app/app/api/login/route.ts",
    "admin-app/app/api/session/route.ts",
    "admin-app/app/api/social-status/route.ts"
  ];
  const leaks = [];

  for (const file of files) {
    if (!existsSync(file)) {
      continue;
    }

    const text = readFileSync(file, "utf8");
    for (const term of forbidden) {
      if (text.includes(term)) {
        leaks.push(`${file}: ${term}`);
      }
    }
  }

  if (existsSync("admin-app/lib/env.ts")) {
    const envText = readFileSync("admin-app/lib/env.ts", "utf8");
    const labelMatches = [...envText.matchAll(/label:\s*"([^"]+)"/g)].map((match) => match[1]);
    for (const label of labelMatches) {
      for (const term of forbidden) {
        if (label.includes(term)) {
          leaks.push(`admin-app/lib/env.ts label: ${term}`);
        }
      }
    }
  }

  add("client-facing admin text hides technical setup terms", leaks.length === 0, leaks.join(", "));
}

function checkClientDocsText() {
  const forbidden = ["microCMS", "GitHub", "Vercel", "APIキー", "トークン", "環境変数", ".env", "canonical", "sitemap", "hreflang"];
  const files = [
    "docs/delivery-admin-manual.md",
    "docs/client-handoff-checklist.md"
  ];
  const leaks = [];

  for (const file of files) {
    if (!existsSync(file)) {
      continue;
    }

    const text = readFileSync(file, "utf8");
    for (const term of forbidden) {
      if (text.includes(term)) {
        leaks.push(`${file}: ${term}`);
      }
    }
  }

  add("client handoff docs hide technical setup terms", leaks.length === 0, leaks.join(", "));
}

function checkDocsIndexBoundaries() {
  const file = "docs/admin-docs-index.md";
  if (!existsSync(file)) {
    add("admin docs index separates client and maintainer docs", false, `${file} missing`);
    return;
  }

  const text = readFileSync(file, "utf8");
  const required = [
    "## 納品先へ渡す資料",
    "## 制作者・保守担当だけが見る資料",
    "## 旧版・控え"
  ];
  const missing = required.filter((heading) => !text.includes(heading));

  add("admin docs index separates client and maintainer docs", missing.length === 0, missing.join(", "));
}

function checkAdminSchemaDocsMatch() {
  const schemaFile = "admin-app/lib/admin-schema.ts";
  const docsFile = "docs/microcms-field-definitions-v1.md";
  if (!existsSync(schemaFile) || !existsSync(docsFile)) {
    add("admin schema sections are documented", false, `${schemaFile} or ${docsFile} missing`);
    return;
  }

  const schemaText = readFileSync(schemaFile, "utf8");
  const docsText = readFileSync(docsFile, "utf8");
  const sectionIds = [...schemaText.matchAll(/id:\s*"([^"]+)"/g)].map((match) => match[1]);
  const missing = [...new Set(sectionIds)].filter((id) => !docsText.includes(`## \`${id}\``));

  add("admin schema sections are documented", missing.length === 0, missing.join(", "));
}
