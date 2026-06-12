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

export type FeatureCardContent = {
  icon: "music" | "store" | "users";
  title: string;
  text: string;
};

export type LocalSearchCardContent = {
  icon: "map" | "music" | "food" | "party";
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

export const firstVisitSection = {
  eyebrow: "First Visit",
  title: "高い天井と柔らかな灯り。豊富なお酒と心地よい空間が、それぞれの夜をゆっくりと深めていく。",
  features: [
    {
      icon: "music",
      title: "天神の夜に、音楽という余白を。",
      text: "ライヴ、DJ、イベントの余韻まで。当店イベント後は通常バータイムでそれぞれお楽しみいただけます。"
    },
    {
      icon: "store",
      title: "ノンアルコールでも、お食事だけでも。",
      text: "当店名物のファズカレーやタコス＆ポテトなど、自家製のサングリアや珈琲焼酎も人気です。"
    },
    {
      icon: "users",
      title: "お一人様でもグループでも。",
      text: "お一人でふらっと来店、待ち合わせ、貸切パーティーまで用途に合わせてご利用いただけます。"
    }
  ] satisfies FeatureCardContent[]
};

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

export const localSearchSection = {
  eyebrow: "Local Search",
  title: "福岡・天神で、音楽も料理も楽しめるバーを探している方へ。",
  lead:
    "public bar Bassic.は、福岡市中央区天神・親不孝通りにあるミュージックバーです。ライブバー、DJイベント、バーご飯、貸切パーティーまで、Google検索やGoogle Mapから初めて来る方にも分かりやすい情報をまとめています。",
  cards: [
    {
      icon: "map",
      title: "天神駅から徒歩約4分",
      text: "親不孝通りのWITH天神5F。Google Mapから現在地ルートを開けるので、初来店でも迷いにくい導線です。"
    },
    {
      icon: "music",
      title: "ライブ・DJ・音楽イベント",
      text: "ライブバー、DJバー、イベント後のバータイムとして利用できます。イベント日はスケジュールページで最新情報を確認できます。"
    },
    {
      icon: "food",
      title: "ファズカレーとバーご飯",
      text: "名物ファズカレー、タコス＆ポテト、ドリンクを写真付きで掲載。食事だけ、ノンアルコールでも利用しやすいお店です。"
    },
    {
      icon: "party",
      title: "貸切・二次会・打ち上げ",
      text: "天神・親不孝通りでの貸切パーティー、ライブ後の打ち上げ、二次会、レンタル利用の相談に対応しています。"
    }
  ] satisfies LocalSearchCardContent[]
};

export const accessRouteTips = [
  "Google Mapで「public bar Bassic.」を開き、WITH天神ビルを目印にしてください。",
  "ビル到着後は5Fまで上がってください。初めての方は地図リンクから現在地ルートを開くと安心です。",
  "イベント日は通常営業開始時間が変わる場合があります。来店前にイベントスケジュールをご確認ください。"
] as const;

export const partyUseCases = [
  "天神・親不孝通りでの二次会",
  "ライブ後の打ち上げ",
  "DJイベントや音楽イベント",
  "少人数パーティーや貸切利用"
] as const;
