import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    { path: "", priority: 1 },
    { path: "/first-visit", priority: 0.9 },
    { path: "/events", priority: 0.9 },
    { path: "/menu", priority: 0.9 },
    { path: "/party", priority: 0.8 },
    { path: "/access", priority: 0.9 }
  ];

  return pages.map((page) => ({
    url: `${site.siteUrl}${page.path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: page.priority
  }));
}
