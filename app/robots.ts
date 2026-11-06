import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      ...(process.env.NEXT_PUBLIC_NOINDEX === "true" ? { disallow: "/" } : { allow: "/" })
    },
    sitemap: absoluteUrl("/sitemap.xml")
  };
}
