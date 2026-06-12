import type { LocalizedPageKey } from "./i18n";

export type SitePageKey = "home" | "firstVisit" | "events" | "menu" | "party" | "access";

export type SitePageRoute = {
  key: SitePageKey;
  path: string;
  sitemapPriority: number;
  localized: boolean;
};

export const pageRoutes = {
  home: { key: "home", path: "/", sitemapPriority: 1, localized: true },
  firstVisit: { key: "firstVisit", path: "/first-visit/", sitemapPriority: 0.9, localized: false },
  events: { key: "events", path: "/events/", sitemapPriority: 0.9, localized: true },
  menu: { key: "menu", path: "/menu/", sitemapPriority: 0.9, localized: true },
  party: { key: "party", path: "/party/", sitemapPriority: 0.8, localized: true },
  access: { key: "access", path: "/access/", sitemapPriority: 0.9, localized: true }
} satisfies Record<SitePageKey, SitePageRoute>;

export const sitemapPages = Object.values(pageRoutes);

export const localizedPageSegments: Record<LocalizedPageKey, string> = {
  home: "",
  events: "events",
  menu: "menu",
  party: "party",
  access: "access"
};

export function canonicalPath(path: string) {
  if (!path || path === "/") {
    return "/";
  }

  return `/${path.replace(/^\/|\/$/g, "")}/`;
}

export function localizedPath(locale: string, pageKey: LocalizedPageKey) {
  const segment = localizedPageSegments[pageKey];
  return segment ? `/${locale}/${segment}/` : `/${locale}/`;
}
