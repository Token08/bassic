"use client";

import { usePathname } from "next/navigation";

const locales = [
  { code: "ja", label: "日本語", prefix: "" },
  { code: "en", label: "English", prefix: "/en" },
  { code: "ko", label: "한국어", prefix: "/ko" },
  { code: "zh-hant", label: "繁體中文", prefix: "/zh-hant" },
  { code: "zh-hans", label: "简体中文", prefix: "/zh-hans" }
] as const;

function stripLocalePrefix(pathname: string) {
  const locale = locales.find((item) => item.prefix && (pathname === item.prefix || pathname.startsWith(`${item.prefix}/`)));

  if (!locale?.prefix) {
    return pathname || "/";
  }

  const stripped = pathname.slice(locale.prefix.length);
  return stripped || "/";
}

function localizedHref(prefix: string, currentPath: string) {
  const path = stripLocalePrefix(currentPath);
  const normalizedPath = path === "/" ? "/" : `/${path.replace(/^\/|\/$/g, "")}/`;
  return `${prefix}${normalizedPath}`;
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
