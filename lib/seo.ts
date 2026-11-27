import type { Metadata } from "next";
import { pageRoutes } from "./routes";
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
    path: pageRoutes.home.path,
    title: "福岡・天神の親不孝通りにあるミュージックバー｜public bar Bassic.",
    description:
      "福岡・天神の親不孝通りにある public bar Bassic.。天神駅から徒歩約4分。ライヴやDJ、通常のバー営業で音楽とお酒、ファズカレーを楽しめます。営業時間・チャージ・行き方はこちら。"
  },
  events: {
    path: pageRoutes.events.path,
    title: "イベントスケジュール | 福岡 天神のライヴ・DJ・イベント",
    description:
      "福岡・天神 親不孝通りのライヴバー public bar Bassic. のイベント予定。ライヴ、DJ、イベント後のバータイム、出演やイベント開催の相談も確認できます。"
  },
  menu: {
    path: pageRoutes.menu.path,
    title: "メニュー | ファズカレー・タコス・ドリンク | 福岡 天神",
    description:
      "福岡・天神の親不孝通りにあるミュージックバー、public bar Bassic.のメニュー。ファズカレーやタコス＆ポテト、スコッチをはじめとするウイスキー、ワイン、シャンパン、焼酎、カクテルをご用意しています。"
  },
  party: {
    path: pageRoutes.party.path,
    title: "貸切・パーティー・機材レンタル | 福岡 天神 親不孝通り",
    description:
      "福岡・天神 親不孝通りで貸切、二次会、ライヴ後の打ち上げ、DJイベント、機材レンタルに対応する public bar Bassic. のパーティー案内。"
  },
  access: {
    path: pageRoutes.access.path,
    title: "アクセス | 福岡 天神駅徒歩約4分・親不孝通り WITH天神5F",
    description:
      "public bar Bassic.へのアクセス。福岡市中央区天神3-4-19 WITH天神5F、天神駅から徒歩約4分。Google Map、現在地からのルート、電話、メールを確認できます。"
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
