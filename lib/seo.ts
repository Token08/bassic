import type { Metadata } from "next";
import { absoluteUrl, site } from "./site";

export const seoLanguages = {
  ja: "/",
  en: "/en/",
  ko: "/ko/",
  "zh-Hant": "/zh-hant/",
  "zh-Hans": "/zh-hans/",
  "x-default": "/"
} as const;

export const pageSeo = {
  home: {
    path: "/",
    title: "public bar Bassic. | 福岡 天神 親不孝通りのミュージックバー",
    description:
      "public bar Bassic.は福岡市中央区天神、親不孝通りのミュージックバー。初めてでも入りやすく、音楽、お酒、料理、ライブイベントを楽しめます。"
  },
  events: {
    path: "/events/",
    title: "イベント | 福岡 天神のライブ・DJ・イベント予約",
    description:
      "public bar Bassic.のライブ、DJ、イベント予定、開場・開演、料金、予約方法を掲載。イベント日は営業時間が変動するため詳細をご確認ください。"
  },
  menu: {
    path: "/menu/",
    title: "メニュー | ファズカレー・タコス・バーご飯とドリンク",
    description:
      "public bar Bassic.のフード、ドリンク、人気メニューを写真で紹介。チャージ500円/お一人様、ファズカレーやタコスも楽しめます。"
  },
  party: {
    path: "/party/",
    title: "貸切・パーティー | 天神の二次会・打ち上げ・レンタル",
    description:
      "福岡・天神 親不孝通りで貸切、二次会、ライブ後の打ち上げ、レンタル利用に対応するpublic bar Bassic.のプラン案内。"
  },
  access: {
    path: "/access/",
    title: "アクセス | 天神駅徒歩約4分・Google Map・WITH天神5F",
    description:
      "public bar Bassic.へのアクセス。福岡市中央区天神3-4-19 WITH天神5F、天神駅から徒歩約4分。Google Mapで迷わず来店できます。"
  },
  firstVisit: {
    path: "/first-visit/",
    title: "初めての方へ | 福岡 天神 親不孝通りの入りやすいバー",
    description:
      "public bar Bassic.に初めて来る方へ。雰囲気、料金、チャージ、喫煙、ひとり来店、予約、アクセスを分かりやすく案内します。"
  }
} as const;

export type PageSeoKey = keyof typeof pageSeo;

export function languageAlternates(path = "/") {
  const normalizedPath = path === "/" ? "/" : `/${path.replace(/^\/|\/$/g, "")}/`;

  return {
    ja: absoluteUrl(normalizedPath),
    en: absoluteUrl(`/en${normalizedPath}`),
    ko: absoluteUrl(`/ko${normalizedPath}`),
    "zh-Hant": absoluteUrl(`/zh-hant${normalizedPath}`),
    "zh-Hans": absoluteUrl(`/zh-hans${normalizedPath}`),
    "x-default": absoluteUrl(normalizedPath)
  };
}

export function buildMetadata(key: PageSeoKey, path = pageSeo[key].path): Metadata {
  const data = pageSeo[key];
  const url = absoluteUrl(path);

  return {
    title: data.title,
    description: data.description,
    alternates: {
      canonical: url,
      languages: languageAlternates(path)
    },
    openGraph: {
      type: "website",
      url,
      siteName: site.name,
      title: data.title,
      description: data.description,
      images: [
        {
          url: absoluteUrl("/ogp.png"),
          width: 1200,
          height: 630,
          alt: "public bar Bassic. 福岡 天神 親不孝通りのミュージックバー"
        }
      ],
      locale: "ja_JP"
    },
    twitter: {
      card: "summary_large_image",
      title: data.title,
      description: data.description,
      images: [absoluteUrl("/ogp.png")]
    }
  };
}
