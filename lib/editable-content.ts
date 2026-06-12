import { assetPath } from "./assets";
import { site } from "./site";
import type { CmsImage } from "./types";

export type EditableImage = {
  src: string;
  alt: string;
};

export type SocialLink = {
  label: "Instagram" | "Facebook" | "X";
  href: string;
  account: string;
};

function brandImage(path: string, alt: string): EditableImage {
  return { src: assetPath(path), alt };
}

export function resolveEditableImage(image: CmsImage | undefined, fallback: EditableImage): EditableImage {
  if (!image?.url) {
    return fallback;
  }

  return {
    src: image.url.startsWith("/assets/") ? assetPath(image.url) : image.url,
    alt: image.alt || fallback.alt
  };
}

export const editableMedia = {
  homeHeroImage: brandImage("/assets/brand/top-slides/hero-01.jpg", "public bar Bassic.の店内"),
  homeHeroSlides: [
    brandImage("/assets/brand/top-slides/hero-01.jpg", "public bar Bassic.の客席とバーカウンターが見える店内"),
    brandImage("/assets/brand/top-slides/hero-02.jpg", "public bar Bassic.のバーカウンター"),
    brandImage("/assets/brand/top-slides/hero-03.jpg", "Bassic.のボトルとグラス"),
    brandImage("/assets/brand/top-slides/hero-04.jpg", "public bar Bassic.の入口へ続く通路"),
    brandImage("/assets/brand/top-slides/hero-05.jpg", "ミラーボールの光"),
    brandImage("/assets/brand/top-slides/hero-06.jpg", "DJターンテーブル"),
    brandImage("/assets/brand/top-slides/hero-07.jpg", "Bassic.のステージと音楽のある夜"),
    brandImage("/assets/brand/top-slides/hero-08.jpg", "Bassic.の店内風景"),
    brandImage("/assets/brand/top-slides/hero-09.jpg", "Bassic.の夜の空間"),
    brandImage("/assets/brand/top-slides/hero-10.jpg", "public bar Bassic.の店内写真")
  ],
  eventHeroSlides: [
    brandImage("/assets/brand/event-slides/event-01.jpg", "Bassic.のライブイベント風景"),
    brandImage("/assets/brand/event-slides/event-02.jpg", "Bassic.のステージと客席"),
    brandImage("/assets/brand/event-slides/event-03.jpg", "Bassic.のライブフロア"),
    brandImage("/assets/brand/event-slides/event-04.jpg", "Bassic.のイベント風景"),
    brandImage("/assets/brand/event-slides/event-05.jpg", "Bassic.の音楽イベント"),
    brandImage("/assets/brand/event-slides/event-06.jpg", "Bassic.のライブとDJの夜")
  ],
  partyHeroSlides: [
    brandImage("/assets/brand/party-slides/party-01.jpg", "Bassic.のパーティー利用イメージ"),
    brandImage("/assets/brand/party-slides/party-02.jpg", "Bassic.の貸切イベントイメージ"),
    brandImage("/assets/brand/party-slides/party-03.jpg", "Bassic.の音楽とパーティーの夜")
  ],
  atmosphereImages: [
    brandImage("/assets/drive/bassic/drums.jpg", "Bassic.のドラムセットがあるライブスペース"),
    brandImage("/assets/drive/index_back/live-room.jpg", "赤い照明のBassic.店内"),
    brandImage("/assets/drive/index_back/warm-interior.jpg", "温かい照明のBassic.店内")
  ],
  fallbackMenuImages: {
    food: assetPath("/assets/drive/menu/fuzz-curry.jpg"),
    drink: assetPath("/assets/drive/menu/cocktails.jpg")
  },
  pageHeroImages: {
    menu: brandImage("/assets/drive/index_back/table-food.jpg", "Bassic.の料理とドリンク"),
    access: brandImage("/assets/drive/index_back/bar-counter.jpg", "Bassic.のバーカウンター"),
    firstVisit: brandImage("/assets/drive/index_back/warm-interior.jpg", "温かい照明のBassic.店内")
  },
  foodTeaser: brandImage("/assets/drive/index_back/table-food.jpg", "Bassic.の料理が並ぶテーブル"),
  eventPoster: brandImage("/assets/drive/brf-2023.jpg", "Bassic. Rock Fes poster")
} as const;

export const editableSocialLinks: SocialLink[] = [
  { label: "Instagram", href: site.instagramUrl, account: "@bassic_official" },
  { label: "Facebook", href: site.facebookUrl, account: "bar.Bassic" },
  { label: "X", href: site.xUrl, account: "@bar_Bassic" }
];

export const externalEmbeds = {
  instagramPostUrl: "https://www.instagram.com/p/BTbP44JFyJt/",
  xTimelineUrl: "https://twitter.com/bar_Bassic?ref_src=twsrc%5Etfw",
  googleCalendarPublicUrl:
    "https://calendar.google.com/calendar/embed?src=bpi41sabm94gp0sni0ps7vajkc%40group.calendar.google.com&ctz=Asia%2FTokyo",
  googleCalendarEmbedUrl:
    "https://calendar.google.com/calendar/embed?showCalendars=0&showTz=0&height=600&wkst=1&bgcolor=%23FFFFFF&src=bpi41sabm94gp0sni0ps7vajkc%40group.calendar.google.com&color=%23B1365F&ctz=Asia%2FTokyo",
  facebookPluginUrl: `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(
    site.facebookUrl
  )}&tabs=timeline&width=340&height=675&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=false&appId=542452342568830`
} as const;
