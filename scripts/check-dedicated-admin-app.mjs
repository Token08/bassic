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
checkFile("client handoff sheet", "docs/client-handoff-sheet.md");
checkFile("login API route", "admin-app/app/api/login/route.ts");
checkFile("content API route", "admin-app/app/api/content/[endpoint]/route.ts");
checkFile("media upload API route", "admin-app/app/api/media/route.ts");
checkFile("deploy API route", "admin-app/app/api/deploy/route.ts");
checkFile("Facebook event preview API route", "admin-app/app/api/facebook-event-preview/route.ts");
checkFile("health API route", "admin-app/app/api/health/route.ts");
checkNoMojibake();
checkClientFacingText();
checkClientDocsText();
checkClientHandoffDocsLinked();
checkAdminReadmeLinksHandoffDocs();
checkDocsIndexBoundaries();
checkAdminSchemaDocsMatch();
checkAdminSchemaEndpointsMatch();
checkCmsSmokeCoversAdminEndpoints();
checkSeedDataCoversAdminEndpoints();
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
    "\u7e5d\uff9d",
    "\u7e67\uff70",
    "\u7e3a\uff67",
    "\u7e3a\u52b1",
    "\u8b41\uff70",
    "\u8708\uff6c",
    "\u9082\uff61",
    "\u9af1\uff62",
    "\u9021\uff7b",
    "\u83eb\u664f",
    "\u873f\u80b4",
    "\u879f\u753b"
  ];
  const files = [
    "admin-app/app/admin-client.tsx",
    "admin-app/app/layout.tsx",
    "admin-app/lib/admin-schema.ts",
    "admin-app/lib/env.ts",
    "admin-app/README.md",
    "docs/admin-docs-index.md",
    "docs/client-handoff-checklist.md",
    "docs/client-handoff-sheet.md",
    "docs/delivery-admin-manual.md"
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
    "admin-app/app/api/facebook-event-preview/route.ts",
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
    "docs/client-handoff-checklist.md",
    "docs/client-handoff-sheet.md"
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

function checkClientHandoffDocsLinked() {
  const checklistFile = "docs/client-handoff-checklist.md";
  const sheetFile = "docs/client-handoff-sheet.md";
  if (!existsSync(checklistFile) || !existsSync(sheetFile)) {
    add("client handoff checklist references handoff sheet", false, `${checklistFile} or ${sheetFile} missing`);
    return;
  }

  const checklistText = readFileSync(checklistFile, "utf8");
  const sheetText = readFileSync(sheetFile, "utf8");
  const requiredSheetTerms = ["公開サイト", "管理画面", "ログイン方法", "パスワード", "困った時の連絡先"];
  const missingSheetTerms = requiredSheetTerms.filter((term) => !sheetText.includes(term));
  const checklistMentionsSheet = checklistText.includes("引き渡しメモ");
  const requiredChecklistTerms = ["リンクを開いて確認", "画像を開いて確認"];
  const missingChecklistTerms = requiredChecklistTerms.filter((term) => !checklistText.includes(term));
  const problems = [
    ...(checklistMentionsSheet ? [] : ["checklist missing 引き渡しメモ"]),
    ...missingSheetTerms.map((term) => `sheet missing ${term}`),
    ...missingChecklistTerms.map((term) => `checklist missing ${term}`)
  ];

  add("client handoff checklist references handoff sheet", problems.length === 0, problems.join(", "));
}

function checkAdminReadmeLinksHandoffDocs() {
  const file = "admin-app/README.md";
  if (!existsSync(file)) {
    add("admin README links handoff docs", false, `${file} missing`);
    return;
  }

  const text = readFileSync(file, "utf8");
  const required = [
    "docs/delivery-admin-manual.md",
    "docs/client-handoff-checklist.md",
    "docs/client-handoff-sheet.md",
    "docs/admin-docs-index.md"
  ];
  const missing = required.filter((item) => !text.includes(item));

  add("admin README links handoff docs", missing.length === 0, missing.join(", "));
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

function checkAdminSchemaEndpointsMatch() {
  const schemaFile = "admin-app/lib/admin-schema.ts";
  const endpointFile = "admin-app/lib/microcms.ts";
  if (!existsSync(schemaFile) || !existsSync(endpointFile)) {
    add("admin schema sections match microCMS endpoints", false, `${schemaFile} or ${endpointFile} missing`);
    return;
  }

  const schemaText = readFileSync(schemaFile, "utf8");
  const endpointText = readFileSync(endpointFile, "utf8");
  const sectionIds = [...schemaText.matchAll(/id:\s*"([^"]+)"/g)].map((match) => match[1]);
  const endpointIds = [...endpointText.matchAll(/\n\s{2}(?:"([^"]+)"|([A-Za-z][\w-]*)):\s*\{/g)].map((match) => match[1] || match[2]);
  const missingEndpoints = [...new Set(sectionIds)].filter((id) => !endpointIds.includes(id));
  const missingSections = [...new Set(endpointIds)].filter((id) => !sectionIds.includes(id));
  const problems = [
    ...missingEndpoints.map((id) => `missing endpoint ${id}`),
    ...missingSections.map((id) => `missing section ${id}`)
  ];

  add("admin schema sections match microCMS endpoints", problems.length === 0, problems.join(", "));
}

function checkCmsSmokeCoversAdminEndpoints() {
  const endpointFile = "admin-app/lib/microcms.ts";
  const smokeFile = "scripts/smoke-cms.mjs";
  if (!existsSync(endpointFile) || !existsSync(smokeFile)) {
    add("CMS smoke test covers admin endpoints", false, `${endpointFile} or ${smokeFile} missing`);
    return;
  }

  const endpointText = readFileSync(endpointFile, "utf8");
  const smokeText = readFileSync(smokeFile, "utf8");
  const endpointIds = [...endpointText.matchAll(/\n\s{2}(?:"([^"]+)"|([A-Za-z][\w-]*)):\s*\{/g)].map((match) => match[1] || match[2]);
  const missing = [...new Set(endpointIds)].filter((id) => !smokeText.includes(`/${id}`));

  add("CMS smoke test covers admin endpoints", missing.length === 0, missing.join(", "));
}

function checkSeedDataCoversAdminEndpoints() {
  const endpointFile = "admin-app/lib/microcms.ts";
  const seedFile = "scripts/microcms-seed-data.mjs";
  if (!existsSync(endpointFile) || !existsSync(seedFile)) {
    add("microCMS seed data covers admin endpoints", false, `${endpointFile} or ${seedFile} missing`);
    return;
  }

  const endpointText = readFileSync(endpointFile, "utf8");
  const seedText = readFileSync(seedFile, "utf8");
  const endpointIds = [...endpointText.matchAll(/\n\s{2}(?:"([^"]+)"|([A-Za-z][\w-]*)):\s*\{/g)].map((match) => match[1] || match[2]);
  const missing = [...new Set(endpointIds)].filter((id) => !seedText.includes(`"${id}"`) && !seedText.includes(`\n    ${id},`));

  add("microCMS seed data covers admin endpoints", missing.length === 0, missing.join(", "));
}
