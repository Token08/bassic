"use client";

import { usePathname } from "next/navigation";
import { languageOptions } from "@/lib/i18n";
import { localizedLanguageHref } from "@/lib/path-utils";

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
          <a key={locale.code} href={localizedLanguageHref(locale.prefix, pathname)} hrefLang={locale.code}>
            {locale.label}
          </a>
        ))}
      </div>
    </details>
  );
}
