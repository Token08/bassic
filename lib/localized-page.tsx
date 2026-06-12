import type { Metadata } from "next";
import { LocalizedPage } from "@/components/localized-content";
import { PageShell } from "@/components/site-shell";
import { isLocale, localeCodes, type LocaleCode, type LocalizedPageKey } from "./i18n";
import { localizedMetadata } from "./localized-seo";

type LocaleParams = Promise<{ locale: string }>;
type MetadataLocaleParams = Promise<{ locale: LocaleCode }>;

export function localizedStaticParams() {
  return localeCodes.map((locale) => ({ locale }));
}

export async function buildLocalizedPageMetadata(
  pageKey: LocalizedPageKey,
  params: MetadataLocaleParams
): Promise<Metadata> {
  const { locale } = await params;
  return localizedMetadata(locale, pageKey);
}

export async function renderLocalizedPage(pageKey: LocalizedPageKey, params: LocaleParams) {
  const { locale: localeParam } = await params;
  const locale = isLocale(localeParam) ? localeParam : "en";

  return (
    <PageShell>
      <main>
        <LocalizedPage locale={locale} pageKey={pageKey} />
      </main>
    </PageShell>
  );
}
