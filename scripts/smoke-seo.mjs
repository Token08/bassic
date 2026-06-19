import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const outDir = join(process.cwd(), "out");
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.bassic.jp").replace(/\/$/, "");

const japanesePages = [
  { path: "/", file: "index.html" },
  { path: "/first-visit/", file: "first-visit/index.html" },
  { path: "/events/", file: "events/index.html" },
  { path: "/menu/", file: "menu/index.html" },
  { path: "/party/", file: "party/index.html" },
  { path: "/access/", file: "access/index.html" }
];
const localizedPages = ["", "events", "menu", "party", "access"];
const locales = ["en", "ko", "zh-hant", "zh-hans"];
const pages = [
  ...japanesePages,
  ...locales.flatMap((locale) =>
    localizedPages.map((segment) => ({
      path: segment ? `/${locale}/${segment}/` : `/${locale}/`,
      file: segment ? `${locale}/${segment}/index.html` : `${locale}/index.html`
    }))
  )
];

const requiredHreflang = ["ja", "en", "ko", "zh-Hant", "zh-Hans", "x-default"];
const forbiddenSeoUrlFragments = [
  "https://token08.github.io/bassic",
  `${siteUrl}/index.html`
].filter((fragment) => !siteUrl.startsWith(fragment));
const failures = [];

function readOutFile(file) {
  const path = join(outDir, file);
  if (!existsSync(path)) {
    failures.push(`Missing exported file: out/${file}`);
    return "";
  }

  return readFileSync(path, "utf8");
}

for (const page of pages) {
  const html = readOutFile(page.file);
  if (!html) {
    continue;
  }

  const canonical = `${siteUrl}${page.path}`;
  if (!html.includes(`rel="canonical" href="${canonical}"`)) {
    failures.push(`Missing canonical for ${page.path}: ${canonical}`);
  }

  for (const lang of requiredHreflang) {
    if (!html.includes(`hrefLang="${lang}"`) && !html.includes(`hreflang="${lang}"`)) {
      failures.push(`Missing hreflang ${lang} on ${page.path}`);
    }
  }

  if (!html.includes("og:image") || !html.includes("twitter:card")) {
    failures.push(`Missing OGP/Twitter metadata on ${page.path}`);
  }

  for (const fragment of forbiddenSeoUrlFragments) {
    if (html.includes(fragment)) {
      failures.push(`Unexpected SEO URL fragment on ${page.path}: ${fragment}`);
    }
  }

  if (page.path === "/events/" && (!html.includes('"@type":"Event"') || !html.includes('"endDate"'))) {
    failures.push("Missing Event structured data with endDate on /events/");
  }
}

const sitemap = readOutFile("sitemap.xml");
for (const page of pages) {
  const expected = `${siteUrl}${page.path}`;
  if (sitemap && !sitemap.includes(expected)) {
    failures.push(`Missing sitemap URL: ${expected}`);
  }
}

for (const fragment of forbiddenSeoUrlFragments) {
  if (sitemap && sitemap.includes(fragment)) {
    failures.push(`Unexpected sitemap URL fragment: ${fragment}`);
  }
}

const robots = readOutFile("robots.txt");
const expectedSitemapLine = `Sitemap: ${siteUrl}/sitemap.xml`;
if (robots && !robots.includes(expectedSitemapLine)) {
  failures.push(`Missing robots sitemap line: ${expectedSitemapLine}`);
}

for (const fragment of forbiddenSeoUrlFragments) {
  if (robots && robots.includes(fragment)) {
    failures.push(`Unexpected robots URL fragment: ${fragment}`);
  }
}

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log(`SEO smoke check passed for ${pages.length} pages.`);
