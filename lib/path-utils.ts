import { languageOptions, localeCodes, type LocaleCode } from "./i18n";
import { localizedPageSegments } from "./routes";

export const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function stripBasePath(pathname: string) {
  if (!basePath || pathname === basePath) {
    return pathname === basePath ? "/" : pathname;
  }

  if (pathname.startsWith(`${basePath}/`)) {
    return pathname.slice(basePath.length) || "/";
  }

  return pathname;
}

export function currentLocale(pathname: string): LocaleCode | undefined {
  const segment = stripBasePath(pathname).split("/").filter(Boolean)[0];
  return localeCodes.includes(segment as LocaleCode) ? (segment as LocaleCode) : undefined;
}

export function stripLocalePrefix(pathname: string) {
  const path = stripBasePath(pathname);
  const locale = languageOptions.find((item) => item.prefix && (path === item.prefix || path.startsWith(`${item.prefix}/`)));

  if (!locale?.prefix) {
    return path || "/";
  }

  return path.slice(locale.prefix.length) || "/";
}

export function localizedInternalHref(href: string, locale?: LocaleCode) {
  if (!locale) {
    return href;
  }

  const normalized = href === "/" ? "/" : `/${href.replace(/^\/|\/$/g, "")}/`;
  return `/${locale}${normalized}`;
}

export function localizedLanguageHref(prefix: string, currentPath: string) {
  const path = stripLocalePrefix(currentPath);
  const normalizedPath = path === "/" ? "/" : `/${path.replace(/^\/|\/$/g, "")}/`;
  const localizedPaths = new Set(["/", ...Object.values(localizedPageSegments).filter(Boolean).map((segment) => `/${segment}/`)]);
  const safePath = prefix && !localizedPaths.has(normalizedPath) ? "/" : normalizedPath;

  return `${basePath}${prefix}${safePath}`;
}
