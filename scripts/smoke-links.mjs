import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, normalize } from "node:path";

const outDir = join(process.cwd(), "out");
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
const failures = [];

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function stripKnownPrefix(value) {
  if (siteUrl && value.startsWith(`${siteUrl}/`)) {
    return value.slice(siteUrl.length);
  }

  if (basePath && value.startsWith(`${basePath}/`)) {
    return value.slice(basePath.length);
  }

  return value;
}

function isExternal(value) {
  return /^(https?:|mailto:|tel:|sms:|#|javascript:)/.test(value);
}

function htmlPathForRoute(route) {
  const clean = decodeURIComponent(route.split("#")[0].split("?")[0]);
  if (!clean || clean === "/") {
    return join(outDir, "index.html");
  }

  const normalizedRoute = clean.replace(/^\/|\/$/g, "");
  if (normalizedRoute.includes(".")) {
    return join(outDir, normalizedRoute);
  }

  return join(outDir, normalizedRoute, "index.html");
}

function assetPathForRoute(route) {
  const clean = decodeURIComponent(route.split("#")[0].split("?")[0]).replace(/^\/+/, "");
  return join(outDir, clean);
}

function extractAttributes(html, attr) {
  const values = [];
  const pattern = new RegExp(`${attr}="([^"]+)"`, "g");
  for (const match of html.matchAll(pattern)) {
    values.push(match[1]);
  }

  return values;
}

for (const file of walk(outDir).filter((path) => path.endsWith(".html"))) {
  const html = readFileSync(file, "utf8");
  const attrs = [
    ...extractAttributes(html, "href").map((value) => ({ value, type: "href" })),
    ...extractAttributes(html, "src").map((value) => ({ value, type: "src" })),
    ...extractAttributes(html, "content").filter((value) => value.startsWith("/") || value.startsWith(siteUrl)).map((value) => ({ value, type: "content" }))
  ];

  for (const { value, type } of attrs) {
    if (!value || isExternal(value) || value.startsWith("data:")) {
      continue;
    }

    const stripped = stripKnownPrefix(value);
    if (!stripped.startsWith("/")) {
      continue;
    }

    const target = type === "href" ? htmlPathForRoute(stripped) : assetPathForRoute(stripped);
    if (!existsSync(target)) {
      failures.push(`${normalize(file)} references missing ${type}: ${value}`);
    }
  }
}

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log("Link and asset smoke check passed.");
