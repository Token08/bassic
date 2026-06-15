import {
  CalendarDays,
  FileText,
  Home,
  ImageIcon,
  Megaphone,
  Music,
  Settings,
  Store,
  Utensils
} from "lucide-react";

export type FieldType = "text" | "textarea" | "url" | "date" | "number" | "checkbox" | "select" | "image";

export type FieldOption = {
  value: string;
  label: string;
};

export type FieldDefinition = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: FieldOption[];
  rows?: number;
};

export type SectionDefinition = {
  id:
    | "site-settings"
    | "home"
    | "hero-slides"
    | "events"
    | "menu"
    | "drink-menu-sheets"
    | "party-plans"
    | "equipment-rental"
    | "social-notices";
  title: string;
  shortTitle: string;
  description: string;
  kind: "object" | "list";
  createLabel?: string;
  icon: typeof Store;
  titleKey?: string;
  fields: FieldDefinition[];
  defaults: Record<string, unknown>;
};

export const sections: SectionDefinition[] = [
  {
    id: "site-settings",
    title: "店舗情報",
    shortTitle: "店舗情報",
    description: "住所、電話、営業時間、SNSリンクを更新します。",
    kind: "object",
    icon: Settings,
    fields: [
      { key: "address", label: "住所", type: "textarea", required: true, rows: 2, placeholder: "福岡市中央区天神3-4-19 WITH天神5F" },
      { key: "phone", label: "電話番号", type: "text", required: true, placeholder: "092-713-1040" },
      { key: "hoursLabel", label: "営業時間", type: "text", required: true, placeholder: "19:00 - LAST" },
      { key: "eventHoursNote", label: "イベント時の補足", type: "textarea", rows: 2, placeholder: "イベントにより開場時間が変わります。" },
      { key: "smokingLabel", label: "喫煙", type: "text", placeholder: "喫煙可" },
      { key: "chargeLabel", label: "チャージ", type: "text", placeholder: "チャージ 500円" },
      { key: "googleMapsUrl", label: "Google Map URL", type: "url", required: true, placeholder: "https://maps.google.com/..." },
      { key: "directionsUrl", label: "道案内URL", type: "url", placeholder: "https://maps.google.com/..." },
      { key: "instagramUrl", label: "Instagram URL", type: "url", placeholder: "https://www.instagram.com/..." },
      { key: "facebookUrl", label: "Facebook URL", type: "url", placeholder: "https://www.facebook.com/..." },
      { key: "xUrl", label: "X URL", type: "url", placeholder: "https://x.com/..." },
      { key: "onlineStoreUrl", label: "オンラインストアURL", type: "url", placeholder: "https://..." }
    ],
    defaults: {}
  },
  {
    id: "home",
    title: "TOP文言",
    shortTitle: "TOP",
    description: "最初に表示される文章と画像を更新します。",
    kind: "object",
    icon: Home,
    fields: [
      { key: "heroTitle", label: "大きな見出し", type: "textarea", required: true, rows: 2, placeholder: "音楽と人が集まる天神のバー" },
      { key: "heroLead", label: "TOP説明文", type: "textarea", required: true, rows: 4, placeholder: "初めての方にも入りやすい..." },
      { key: "firstVisitLead", label: "初回来店文言", type: "textarea", rows: 4, placeholder: "初めてご来店の方へ..." },
      { key: "accessNote", label: "アクセス補足", type: "textarea", rows: 3, placeholder: "天神駅から徒歩..." },
      { key: "instagramWidgetSrc", label: "InstagramウィジェットURL", type: "url", placeholder: "https://cdn.lightwidget.com/widgets/..." },
      { key: "heroImage", label: "TOP画像", type: "image" }
    ],
    defaults: {}
  },
  {
    id: "hero-slides",
    title: "メイン画像",
    shortTitle: "画像",
    description: "各ページのメイン画像やスライドを更新します。",
    kind: "list",
    createLabel: "画像を追加",
    icon: ImageIcon,
    titleKey: "title",
    fields: [
      {
        key: "page",
        label: "使うページ",
        type: "select",
        required: true,
        options: [
          { value: "home", label: "TOP" },
          { value: "events", label: "イベント" },
          { value: "party", label: "貸切" },
          { value: "menu", label: "メニュー" },
          { value: "access", label: "アクセス" }
        ]
      },
      { key: "title", label: "画像名", type: "text", placeholder: "TOP 1枚目" },
      { key: "image", label: "画像", type: "image", required: true },
      { key: "displayOrder", label: "表示順", type: "number", placeholder: "1" },
      { key: "isPublished", label: "公開する", type: "checkbox" }
    ],
    defaults: { page: "home", displayOrder: 1, isPublished: false }
  },
  {
    id: "events",
    title: "イベント",
    shortTitle: "イベント",
    description: "イベントの日時、料金、予約方法を更新します。",
    kind: "list",
    createLabel: "イベントを追加",
    icon: CalendarDays,
    titleKey: "title",
    fields: [
      { key: "title", label: "イベント名", type: "text", required: true, placeholder: "Bassic. Live Night" },
      { key: "date", label: "日付", type: "date", required: true },
      { key: "openTime", label: "開場時間", type: "text", placeholder: "OPEN 18:30" },
      { key: "startTime", label: "開始時間", type: "text", placeholder: "START 19:00" },
      { key: "performers", label: "出演者", type: "textarea", rows: 3, placeholder: "出演者名を改行で入力" },
      { key: "price", label: "料金", type: "text", placeholder: "前売 3,000円 / 当日 3,500円" },
      { key: "reservation", label: "予約方法", type: "textarea", rows: 3, placeholder: "電話、DM、フォームなど" },
      { key: "sourceUrl", label: "詳細URL", type: "url", placeholder: "https://..." },
      { key: "image", label: "イベント画像", type: "image" },
      { key: "isPublished", label: "公開する", type: "checkbox" }
    ],
    defaults: { isPublished: false }
  },
  {
    id: "menu",
    title: "フードメニュー",
    shortTitle: "メニュー",
    description: "フード名、料金、写真、表示順を更新します。",
    kind: "list",
    createLabel: "メニューを追加",
    icon: Utensils,
    titleKey: "name",
    fields: [
      { key: "name", label: "フード名", type: "text", required: true, placeholder: "カレー" },
      { key: "englishName", label: "英語名", type: "text", placeholder: "Curry" },
      { key: "price", label: "料金", type: "text", placeholder: "900円" },
      { key: "description", label: "説明", type: "textarea", rows: 3, placeholder: "短い説明を入力" },
      { key: "image", label: "画像", type: "image" },
      { key: "displayOrder", label: "表示順", type: "number", placeholder: "1" },
      { key: "isPublished", label: "公開する", type: "checkbox" }
    ],
    defaults: { category: "food", isPublished: false, displayOrder: 1 }
  },
  {
    id: "drink-menu-sheets",
    title: "ドリンク表",
    shortTitle: "ドリンク表",
    description: "ドリンクメニュー画像を更新します。",
    kind: "list",
    createLabel: "ドリンク表を追加",
    icon: FileText,
    titleKey: "title",
    fields: [
      { key: "title", label: "タイトル", type: "text", required: true, placeholder: "ドリンクメニュー 1枚目" },
      { key: "image", label: "画像", type: "image", required: true },
      { key: "displayOrder", label: "表示順", type: "number", placeholder: "1" },
      { key: "isPublished", label: "公開する", type: "checkbox" }
    ],
    defaults: { isPublished: false, displayOrder: 1 }
  },
  {
    id: "party-plans",
    title: "貸切プラン",
    shortTitle: "貸切",
    description: "貸切、二次会、レンタル料金を更新します。",
    kind: "list",
    createLabel: "プランを追加",
    icon: Store,
    titleKey: "title",
    fields: [
      { key: "title", label: "プラン名", type: "text", required: true, placeholder: "貸切プラン" },
      { key: "price", label: "料金", type: "text", required: true, placeholder: "1時間 10,000円から" },
      { key: "body", label: "説明", type: "textarea", required: true, rows: 5, placeholder: "内容、人数、注意点など" },
      { key: "displayOrder", label: "表示順", type: "number", placeholder: "1" },
      { key: "isPublished", label: "公開する", type: "checkbox" }
    ],
    defaults: { isPublished: false, displayOrder: 1 }
  },
  {
    id: "equipment-rental",
    title: "機材レンタル",
    shortTitle: "機材",
    description: "機材レンタルの説明とPDFリンクを更新します。",
    kind: "object",
    icon: Music,
    fields: [
      { key: "title", label: "見出し", type: "text", required: true, placeholder: "機材レンタル" },
      { key: "price", label: "料金", type: "text", placeholder: "料金はPDFをご確認ください" },
      { key: "body", label: "説明", type: "textarea", required: true, rows: 5, placeholder: "レンタル可能な機材や注意点" },
      { key: "pdfUrl", label: "PDFリンク", type: "url", placeholder: "https://..." }
    ],
    defaults: {}
  },
  {
    id: "social-notices",
    title: "SNS告知カード",
    shortTitle: "SNS告知",
    description: "Instagram、Facebook、Xへの誘導カードを更新します。",
    kind: "list",
    createLabel: "告知を追加",
    icon: Megaphone,
    titleKey: "title",
    fields: [
      {
        key: "platform",
        label: "SNS",
        type: "select",
        required: true,
        options: [
          { value: "instagram", label: "Instagram" },
          { value: "facebook", label: "Facebook" },
          { value: "x", label: "X" }
        ]
      },
      { key: "title", label: "タイトル", type: "text", required: true, placeholder: "今週のライブ情報" },
      { key: "description", label: "説明", type: "textarea", rows: 3, placeholder: "短い紹介文" },
      { key: "url", label: "リンクURL", type: "url", required: true, placeholder: "https://..." },
      { key: "date", label: "日付", type: "date" },
      { key: "isPublished", label: "公開する", type: "checkbox" }
    ],
    defaults: { platform: "instagram", isPublished: false }
  }
];

export function getSection(id: string) {
  const section = sections.find((item) => item.id === id);

  if (!section) {
    throw new Error("Unknown section.");
  }

  return section;
}
