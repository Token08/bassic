import { readdir, readFile, writeFile } from "node:fs/promises";
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
