import type { Metadata } from "next";
import type { LocaleCode } from "@/lib/i18n";
import { buildLocalizedPageMetadata, localizedStaticParams, renderLocalizedPage } from "@/lib/localized-page";

export const dynamicParams = false;

export const generateStaticParams = localizedStaticParams;

export async function generateMetadata({ params }: { params: Promise<{ locale: LocaleCode }> }): Promise<Metadata> {
  return buildLocalizedPageMetadata("events", params);
}

export default async function LocalizedEvents({ params }: { params: Promise<{ locale: string }> }) {
  return renderLocalizedPage("events", params);
}
