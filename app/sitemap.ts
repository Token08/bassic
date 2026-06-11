import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export const dynamic = "force-static";

function canonicalPath(path: string) {
  if (!path) {
    return "/";
  }

  return `${path.replace(/\/$/, "")}/`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const jaPages = [
    { path: "", priority: 1 },
    { path: "/first-visit", priority: 0.9 },
    { path: "/events", priority: 0.9 },
    { path: "/menu", priority: 0.9 },
    { path: "/party", priority: 0.8 },
    { path: "/access", priority: 0.9 }
  ];
  const localePages = ["", "/events", "/menu", "/party", "/access"];
  const locales = ["/en", "/ko", "/zh-hant", "/zh-hans"];
  const pages = [
    ...jaPages,
    ...locales.flatMap((locale) =>
      localePages.map((path) => ({
        path: `${locale}${path}`,
        priority: path ? 0.72 : 0.82
      }))
    )
  ];

  return pages.map((page) => ({
    url: `${site.siteUrl}${canonicalPath(page.path)}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: page.priority
  }));
}
