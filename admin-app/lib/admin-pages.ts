import type { homeFieldGroups, SectionDefinition } from "./admin-schema";

type Draft = Record<string, unknown>;

export type ActiveSectionState = {
  id: string;
  initialDraft?: Draft;
  homeGroup?: keyof typeof homeFieldGroups;
  fieldKeys?: readonly string[];
  itemId?: string;
  editLabel?: string;
  previewContext?: Draft;
  sourcePage?: string;
  eventEntry?: boolean;
  relatedEventId?: string;
};

export type PageAdminAction = {
  label: string;
  group?: string;
  thumbnail?: string;
  description: string;
  sectionId: SectionDefinition["id"];
  initialDraft?: Draft;
  homeGroup?: keyof typeof homeFieldGroups;
  fieldKeys?: readonly string[];
  itemId?: string;
};

export type PageAdminItem = {
  page: string;
  title: string;
  description: string;
  publicPath: string;
  publicLabel: string;
  actions: PageAdminAction[];
};

export const adminPages: PageAdminItem[] = [
  {
    page: "TOP",
    title: "TOPページ",
    description: "最初に見える画像、見出し、初めての方向け文章、SNS欄を変更します。",
    publicPath: "/",
    publicLabel: "TOPページを確認",
    actions: []
  },
  {
    page: "EVENT SCHEDULE",
    title: "イベントスケジュール",
    description: "サイトのイベント情報を編集します。Google CalendarやSNSへの掲載は別に確認します。",
    publicPath: "/events/",
    publicLabel: "EVENT SCHEDULEを確認",
    actions: [
      { label: "サイトのイベント案内", group: "開催イベント", description: "イベント名、日時、料金、予約方法、案内画像を編集します。", sectionId: "events" },
      { label: "Facebookイベント取り込み", group: "開催イベント", description: "FacebookイベントURLから下書き作成に使う情報を取り込みます。", sectionId: "events" },
      { label: "カレンダーの案内文を変える", group: "カレンダー", description: "カレンダーに添える案内文", sectionId: "page-copy", initialDraft: { page: "events" }, fieldKeys: ["calendarNote"] },
      { label: "SNS投稿の下書き", description: "FacebookイベントからX・Instagram向けの下書きを作ります。投稿する前に各SNSで確認してください。", sectionId: "social-notices" },
      { label: "メイン画像", group: "メインビジュアル", description: "EVENT SCHEDULEページのメイン画像を編集します。", sectionId: "hero-slides", initialDraft: { page: "events" } }
    ]
  },
  {
    page: "MENU",
    title: "MENU",
    description: "メイン画像、ドリンク表、フードメニュー、料金を変更します。",
    publicPath: "/menu/",
    publicLabel: "MENUページを確認",
    actions: [
      { label: "メイン画像", group: "メインビジュアル", description: "MENUページのメイン画像を編集します。", sectionId: "hero-slides", initialDraft: { page: "menu" } },
      { label: "ドリンク表", description: "ドリンクメニュー画像を追加・削除・並び替えます。", sectionId: "drink-menu-sheets" },
      { label: "フードメニュー・料金", description: "フード名、料金、写真、表示順を編集します。", sectionId: "menu" }
    ]
  },
  {
    page: "ONLINE STORE",
    title: "ONLINE STORE",
    description: "オンラインストアへのリンクを変更します。",
    publicPath: "/",
    publicLabel: "公開サイトを確認",
    actions: [
      { label: "オンラインストアURL", description: "公開サイトから移動するオンラインストアのリンクを編集します。", sectionId: "site-settings" }
    ]
  },
  {
    page: "PARTY & RENTAL",
    title: "PARTY & RENTAL",
    description: "メイン画像、貸切プラン、機材レンタル、PDFリンクを変更します。",
    publicPath: "/party/",
    publicLabel: "PARTY & RENTALを確認",
    actions: [
      { label: "メイン画像", group: "メインビジュアル", description: "PARTY & RENTALページのメイン画像を編集します。", sectionId: "hero-slides", initialDraft: { page: "party" } },
      { label: "貸切プラン", description: "貸切やパーティープランの料金・説明を編集します。", sectionId: "party-plans" },
      { label: "機材レンタル・PDF", description: "機材レンタル説明とPDFリンクを編集します。", sectionId: "equipment-rental" }
    ]
  },
  {
    page: "ACCESS",
    title: "ACCESS",
    description: "メイン画像、住所、電話番号、Google Map、営業時間を変更します。",
    publicPath: "/access/",
    publicLabel: "ACCESSページを確認",
    actions: [
      { label: "メイン画像", group: "メインビジュアル", description: "ACCESSページのメイン画像を編集します。", sectionId: "hero-slides", initialDraft: { page: "access" } },
      { label: "住所・電話・Google Map・営業時間", description: "店舗基本情報と地図リンクを編集します。", sectionId: "site-settings" }
    ]
  }
];

