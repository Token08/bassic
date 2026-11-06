import { readdir, readFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";

const outDir = path.join(process.cwd(), "out");

const localeBySegment = new Map([
  ["en", "en"],
  ["ko", "ko"],
  ["zh-hant", "zh-Hant"],
  ["zh-hans", "zh-Hans"]
]);

async function listHtmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return listHtmlFiles(fullPath);
      if (entry.isFile() && entry.name.endsWith(".html")) return [fullPath];
      return [];
    })
  );

  return files.flat();
}

function langForFile(filePath) {
  const relative = path.relative(outDir, filePath).replaceAll(path.sep, "/");
  const firstSegment = relative.split("/")[0];
  return localeBySegment.get(firstSegment) || "ja";
}

const htmlFiles = await listHtmlFiles(outDir);
let updated = 0;

for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  const lang = langForFile(file);
  const nextHtml = html.replace(/<html lang="[^"]*"/, `<html lang="${lang}"`);

  if (nextHtml !== html) {
    await writeFile(file, nextHtml);
    updated += 1;
  }
}

console.log(`Postbuild HTML check complete. Updated ${updated} file(s).`);

// GitHub Pages has no server-side redirects. Preserve the old site's entry URLs
// with immediate HTML redirects and a canonical pointing at the replacement.
const legacyRoutes = {
  "bassic.html": "/first-visit/",
  "calendar.html": "/events/",
  "menu.html": "/menu/",
  "party.html": "/party/",
  "access.html": "/access/"
};
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.bassic.jp").replace(/\/$/, "");
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
if (new URL(siteUrl).hostname.endsWith(".github.io")) {
  await rm(path.join(outDir, "CNAME"), { force: true });
}
for (const [file, route] of Object.entries(legacyRoutes)) {
  const target = `${basePath}${route}`;
  const canonical = `${siteUrl}${route}`;
  await writeFile(path.join(outDir, file), `<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ページを移動しました | public bar Bassic.</title>
<link rel="canonical" href="${canonical}"><meta http-equiv="refresh" content="0;url=${target}"></head>
<body><p>ページを移動しました。<a href="${target}">新しいページを開く</a></p></body></html>\n`);
}
console.log(`Created ${Object.keys(legacyRoutes).length} legacy URL redirects.`);
