"use client";

import { usePathname } from "next/navigation";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const locales = [
  { code: "ja", label: "日本語", prefix: "" },
  { code: "en", label: "English", prefix: "/en" },
  { code: "ko", label: "한국어", prefix: "/ko" },
  { code: "zh-hant", label: "繁體中文", prefix: "/zh-hant" },
  { code: "zh-hans", label: "简体中文", prefix: "/zh-hans" }
] as const;

function stripBasePath(pathname: string) {
  if (!basePath || pathname === basePath) {
    return pathname === basePath ? "/" : pathname;
  }

  if (pathname.startsWith(`${basePath}/`)) {
    return pathname.slice(basePath.length) || "/";
  }

  return pathname;
}

function stripLocalePrefix(pathname: string) {
  const path = stripBasePath(pathname);
  const locale = locales.find((item) => item.prefix && (path === item.prefix || path.startsWith(`${item.prefix}/`)));

  if (!locale?.prefix) {
    return path || "/";
  }

  const stripped = path.slice(locale.prefix.length);
  return stripped || "/";
}

function localizedHref(prefix: string, currentPath: string) {
  const path = stripLocalePrefix(currentPath);
  const normalizedPath = path === "/" ? "/" : `/${path.replace(/^\/|\/$/g, "")}/`;
  return `${basePath}${prefix}${normalizedPath}`;
}

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname() || "/";

  return (
    <details className={compact ? "language-switcher language-switcher-compact" : "language-switcher"}>
      <summary>Language</summary>
      <div>
        {locales.map((locale) => (
          <a key={locale.code} href={localizedHref(locale.prefix, pathname)} hrefLang={locale.code}>
            {locale.label}
          </a>
        ))}
      </div>
    </details>
  );
}
