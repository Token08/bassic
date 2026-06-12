import { editableMedia } from "./editable-content";
import { site } from "./site";

export type PageHeroContent = {
  eyebrow: string;
  title: string;
  lead: string;
  image?: string;
  imageAlt?: string;
  slides?: readonly { src: string; alt: string }[];
  className?: string;
};

export type VisitInfoIcon = "clock" | "calendar" | "smoking" | "charge";

export type VisitInfoItem = {
  icon: VisitInfoIcon;
  title: string;
  text: string;
};

export const pageHeroes = {
  events: {
    eyebrow: "Event Schedule",
    title: "ライブ・DJ・イベント予定。",
    lead: "日付、開場、開演、料金、予約方法をまとめています。イベント情報は管理画面から更新できます。",
    slides: editableMedia.eventHeroSlides,
    className: "event-hero"
  },
  menu: {
    eyebrow: "Food & Drink",
    title: "Bassic.の料理と、音楽に合うお酒。",
    lead: "初めての方にも選びやすいよう、人気メニューと価格感を見やすく整理しました。",
    image: editableMedia.pageHeroImages.menu.src,
    imageAlt: editableMedia.pageHeroImages.menu.alt,
    className: "menu-hero"
  },
  party: {
    eyebrow: "Party & Rental",
    title: "貸切、二次会、ライブ後の打ち上げに。",
    lead: "親不孝通りで、音楽と料理を楽しめるパーティーやレンタル利用に対応しています。",
    slides: editableMedia.partyHeroSlides,
    className: "party-hero"
  },
  access: {
    eyebrow: "Access",
    title: "天神駅から徒歩約4分。WITH天神5Fへ。",
    lead: "Google Map、住所、電話、メールをまとめました。初めての方も地図から迷わず来店できます。",
    image: editableMedia.pageHeroImages.access.src,
    imageAlt: editableMedia.pageHeroImages.access.alt,
    className: "access-hero"
  },
  firstVisit: {
    eyebrow: "First Visit",
    title: "初めてでも、入りやすい音楽バー。",
    lead: "ひとりでも、ライヴ前後でも、音楽の話をしたい夜でも。来店前に知りたいことをまとめました。",
    image: editableMedia.pageHeroImages.firstVisit.src,
    imageAlt: editableMedia.pageHeroImages.firstVisit.alt
  }
} satisfies Record<string, PageHeroContent>;

export const localizedPageImages = {
  home: editableMedia.homeHeroImage.src,
  events: editableMedia.eventHeroSlides[0].src,
  menu: editableMedia.pageHeroImages.menu.src,
  party: editableMedia.partyHeroSlides[0].src,
  access: editableMedia.pageHeroImages.access.src
} as const;

export const visitInfoItems: VisitInfoItem[] = [
  {
    icon: "clock",
    title: "通常営業",
    text: site.hoursLabel
  },
  {
    icon: "calendar",
    title: "イベント時の営業時間",
    text: site.eventHoursNote
  },
  {
    icon: "smoking",
    title: "喫煙について",
    text: site.smokingLabel
  },
  {
    icon: "charge",
    title: "チャージ",
    text: site.chargeLabel
  }
];

export const socialUpdatesCopy = {
  titleLines: ["最新情報は、", "公式SNSから。"],
  lead: "Instagram、Facebook、Xの公式投稿をまとめて確認できます。イベント、営業情報、店内の空気感はSNSでも更新しています。"
};

export const homeMenuTeaser = {
  eyebrow: "Food & Drink",
  titleLines: ["料理もドリンクも、", "写真で先に見られます。"],
  lead: "ファズ・カレー、タコス、カクテルなど。詳しい一覧はメニューページへ。",
  linkLabel: "メニューページを見る"
};
