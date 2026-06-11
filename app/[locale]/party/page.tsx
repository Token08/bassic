import type { Metadata } from "next";
import { LocalizedPage } from "@/components/localized-content";
import { PageShell } from "@/components/site-shell";
import { isLocale, localeCodes, type LocaleCode } from "@/lib/i18n";
import { localizedMetadata } from "@/lib/localized-seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return localeCodes.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: LocaleCode }> }): Promise<Metadata> {
  const { locale } = await params;
  return localizedMetadata(locale, "party");
}

export default async function LocalizedParty({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale = isLocale(localeParam) ? localeParam : "en";

  return (
    <PageShell>
      <main>
        <LocalizedPage locale={locale} pageKey="party" />
      </main>
    </PageShell>
  );
}
