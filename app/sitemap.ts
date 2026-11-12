import type { MetadataRoute } from "next";
import { localeCodes } from "@public/lib/i18n";
import { canonicalPath, localizedPath, sitemapPages } from "@public/lib/routes";
import { absoluteUrl } from "@public/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    ...sitemapPages.map((page) => ({
      path: page.path,
      priority: page.sitemapPriority
    })),
    ...localeCodes.flatMap((locale) =>
      sitemapPages
        .filter((page) => page.localized)
        .map((page) => ({
          path: localizedPath(locale, page.key),
          priority: page.key === "home" ? 0.82 : 0.72
        }))
    )
  ];

  return pages.map((page) => ({
    url: absoluteUrl(canonicalPath(page.path)),
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: page.priority
  }));
}
