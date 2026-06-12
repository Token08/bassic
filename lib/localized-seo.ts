import type { Metadata } from "next";
import { type LocaleCode, type LocalizedPageKey, localizedPages } from "./i18n";
import { localizedPath } from "./routes";
import { absoluteUrl, site } from "./site";

const localeOg: Record<LocaleCode, string> = {
  en: "en_US",
  ko: "ko_KR",
  "zh-hant": "zh_TW",
  "zh-hans": "zh_CN"
};

const hreflang: Record<LocaleCode, string> = {
  en: "en",
  ko: "ko",
  "zh-hant": "zh-Hant",
  "zh-hans": "zh-Hans"
};

export function localizedMetadata(locale: LocaleCode, pageKey: LocalizedPageKey): Metadata {
  const page = localizedPages[locale][pageKey];
  const path = localizedPath(locale, pageKey);
  const canonical = absoluteUrl(path);
  const segment = path.replace(/^\/(en|ko|zh-hant|zh-hans)/, "") || "/";
  const title = page.titleMeta.includes(site.name) ? page.titleMeta : `${page.titleMeta} | ${site.name}`;

  return {
    title: {
      absolute: title
    },
    description: page.description,
    alternates: {
      canonical,
      languages: {
        ja: absoluteUrl(segment),
        en: absoluteUrl(`/en${segment}`),
        ko: absoluteUrl(`/ko${segment}`),
        "zh-Hant": absoluteUrl(`/zh-hant${segment}`),
        "zh-Hans": absoluteUrl(`/zh-hans${segment}`),
        "x-default": absoluteUrl(segment)
      }
    },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: site.name,
      title,
      description: page.description,
      images: [{ url: absoluteUrl("/ogp.png"), width: 1200, height: 630, alt: site.name }],
      locale: localeOg[locale]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: page.description,
      images: [absoluteUrl("/ogp.png")]
    },
    other: {
      "content-language": hreflang[locale]
    }
  };
}
