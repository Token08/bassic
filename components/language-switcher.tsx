"use client";

import { usePathname } from "next/navigation";
import { languageOptions } from "@/lib/i18n";
import { localizedPageSegments } from "@/lib/routes";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

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
  const locale = languageOptions.find((item) => item.prefix && (path === item.prefix || path.startsWith(`${item.prefix}/`)));

  if (!locale?.prefix) {
    return path || "/";
  }

  const stripped = path.slice(locale.prefix.length);
  return stripped || "/";
}

function localizedHref(prefix: string, currentPath: string) {
  const path = stripLocalePrefix(currentPath);
  const normalizedPath = path === "/" ? "/" : `/${path.replace(/^\/|\/$/g, "")}/`;
  const localizedPaths = new Set(["/", ...Object.values(localizedPageSegments).filter(Boolean).map((segment) => `/${segment}/`)]);
  const safePath = prefix && !localizedPaths.has(normalizedPath) ? "/" : normalizedPath;
  return `${basePath}${prefix}${safePath}`;
}

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname() || "/";

  return (
    <details className={compact ? "language-switcher language-switcher-compact" : "language-switcher"}>
      <summary>
        <span className="language-flag-jp" aria-hidden="true" />
        Language
      </summary>
      <div>
        {languageOptions.map((locale) => (
          <a key={locale.code} href={localizedHref(locale.prefix, pathname)} hrefLang={locale.code}>
            {locale.label}
          </a>
        ))}
      </div>
    </details>
  );
}
