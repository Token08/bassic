import type { Metadata } from "next";
import type { LocaleCode } from "@public/lib/i18n";
import { buildLocalizedPageMetadata, localizedStaticParams, renderLocalizedPage } from "@public/lib/localized-page";

export const dynamicParams = false;

export const generateStaticParams = localizedStaticParams;

export async function generateMetadata({ params }: { params: Promise<{ locale: LocaleCode }> }): Promise<Metadata> {
  return buildLocalizedPageMetadata("access", params);
}

export default async function LocalizedAccess({ params }: { params: Promise<{ locale: string }> }) {
  return renderLocalizedPage("access", params);
}
