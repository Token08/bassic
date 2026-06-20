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

export type FieldType = "text" | "textarea" | "url" | "date" | "number" | "checkbox" | "select" | "image" | "hidden";

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
  hint?: string;
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
    | "social-notices"
    | "page-copy"
    | "page-sections"
    | "custom-sections";
  title: string;
  shortTitle: string;
  description: string;
  helperText: string;
  kind: "object" | "list";
  createLabel?: string;
  icon: typeof Store;
  titleKey?: string;
  fields: FieldDefinition[];
  defaults: Record<string, unknown>;
};

const pageOptions: FieldOption[] = [
  { value: "home", label: "TOP" },
  { value: "events", label: "イベント" },
  { value: "menu", label: "メニュー" },
  { value: "party", label: "貸切・レンタル" },
  { value: "access", label: "アクセス" }
];

const sectionOptions: FieldOption[] = [
  { value: "hero", label: "メイン画像・見出し" },
  { value: "firstVisit", label: "初めての方向け" },
  { value: "visitInfo", label: "来店前の基本情報" },
  { value: "localSearch", label: "検索向け紹介" },
  { value: "social", label: "SNS欄" },
  { value: "access", label: "TOP内アクセス" },
  { value: "calendar", label: "Googleカレンダー" },
  { value: "drinkSheets", label: "ドリンク表" },
  { value: "foodMenu", label: "フードメニュー" },
  { value: "plans", label: "貸切プラン" },
  { value: "equipmentRental", label: "機材レンタル" },
  { value: "useCases", label: "利用シーン" },
  { value: "accessInfo", label: "アクセス情報" },
  { value: "googleMap", label: "Google Map" }
];

const imageFieldHint = "画像を入れた後は「画像を開いて確認」で正しい写真が開くか確認してください。横長の写真がおすすめです。";
const displayOrderHint = "数字が小さいものから先に表示されます。0以上の半角整数で、迷ったら1、2、3の順に入れてください。";
const publishFieldHint = "ONにするとサイトに表示されます。まだ見せたくない時はOFFのまま保存してください。";

export const sections: SectionDefinition[] = [
  {
    id: "site-settings",
    title: "店舗基本情報",
    shortTitle: "店舗情報",
    description: "住所、電話、営業時間、喫煙、テーブル・チャージ、SNSリンクを更新します。",
    helperText: "全ページで使う基本情報です。変更後はスマホで電話・地図リンクも確認してください。",
    kind: "object",
    icon: Settings,
    fields: [
      { key: "address", label: "住所", type: "textarea", required: true, rows: 2, placeholder: "福岡市中央区天神3-4-19 WITH天神5F" },
      { key: "phone", label: "電話番号", type: "text", required: true, placeholder: "092-713-1040" },
      { key: "email", label: "メールアドレス", type: "text", required: true, placeholder: "mail@bassic.jp" },
      {
        key: "hoursLabel",
        label: "通常営業時間",
        type: "textarea",
        required: true,
        rows: 4,
        placeholder: "通常営業 20:00 OPEN / L.O. 1:30 / 2:00 CLOSE\nイベントがある日は 22:30 から通常営業\n※イベントにより異なる場合もございます"
      },
      {
        key: "eventHoursNote",
        label: "イベント時の営業時間補足",
        type: "textarea",
        rows: 4,
        placeholder: "イベント時は営業時間が変動します。\nイベント終了後は 22:30 から通常営業です。\n詳細はイベントスケジュールページをご確認ください。"
      },
      {
        key: "smokingLabel",
        label: "喫煙について",
        type: "textarea",
        required: true,
        rows: 5,
        placeholder: "店内喫煙OK（紙タバコ・電子タバコOK）\n※未成年の入店はお断りしております。\n※イベント内容によりイベント中は禁煙になる場合がございます。"
      },
      { key: "chargeLabel", label: "テーブル・チャージ", type: "text", required: true, placeholder: "テーブル・チャージ 500円 / お一人様" },
      {
        key: "googleMapsUrl",
        label: "Google Map URL",
        type: "url",
        required: true,
        placeholder: "https://maps.google.com/...",
        hint: "保存前に「リンクを開いて確認」でBassic.の地図が開くか確認してください。"
      },
      {
        key: "directionsUrl",
        label: "現在地から向かうURL",
        type: "url",
        placeholder: "https://maps.google.com/...",
        hint: "Google Mapの経路案内URLを入れます。未入力でも通常の地図リンクは使えます。"
      },
      {
        key: "instagramUrl",
        label: "Instagram URL",
        type: "url",
        placeholder: "https://www.instagram.com/...",
        hint: "公式InstagramのプロフィールURLを入れます。"
      },
      {
        key: "facebookUrl",
        label: "Facebook URL",
        type: "url",
        placeholder: "https://www.facebook.com/...",
        hint: "公式FacebookページのURLを入れます。"
      },
      { key: "xUrl", label: "X URL", type: "url", placeholder: "https://x.com/...", hint: "公式XアカウントのURLを入れます。" },
      { key: "onlineStoreUrl", label: "オンラインストアURL", type: "url", placeholder: "https://...", hint: "物販ページがある場合だけ入力します。" }
    ],
    defaults: {}
  },
  {
    id: "home",
    title: "TOPページ",
    shortTitle: "TOP",
    description: "TOPページの見出し、説明文、初回来店向け文言を更新します。",
    helperText: "初めて見る人に向けた文章です。短く、店の雰囲気が伝わる言葉にします。",
    kind: "object",
    icon: Home,
    fields: [
      { key: "heroTitle", label: "大きな見出し", type: "textarea", required: true, rows: 2, placeholder: "public bar Bassic." },
      { key: "heroLead", label: "TOP説明文", type: "textarea", required: true, rows: 4, placeholder: "福岡は親不孝通りにあるミュージックバーです。" },
      { key: "firstVisitLead", label: "初回来店向け説明文", type: "textarea", rows: 4, placeholder: "初めての方でも入りやすい雰囲気を伝える文章" },
      { key: "accessNote", label: "アクセス補足", type: "textarea", rows: 3, placeholder: "天神駅から徒歩約4分。" },
      {
        key: "instagramWidgetSrc",
        label: "Instagram表示URL",
        type: "url",
        placeholder: "https://cdn.lightwidget.com/widgets/...",
        hint: "通常のInstagramプロフィールURLではありません。保守担当者が用意した表示用URLを入れます。分からない場合は空欄のままで大丈夫です。"
      }
    ],
    defaults: {}
  },
  {
    id: "hero-slides",
    title: "メイン画像",
    shortTitle: "画像",
    description: "各ページのメイン背景画像やスライド画像を更新します。",
    helperText: "ページの第一印象を決める画像です。暗すぎず、店内やイベントの雰囲気が分かる写真がおすすめです。",
    kind: "list",
    createLabel: "画像を追加",
    icon: ImageIcon,
    titleKey: "title",
    fields: [
      { key: "page", label: "使うページ", type: "select", required: true, options: pageOptions },
      { key: "title", label: "画像名", type: "text", placeholder: "TOP 1枚目" },
      { key: "image", label: "画像", type: "image", required: true, hint: imageFieldHint },
      { key: "displayOrder", label: "表示順", type: "number", placeholder: "1", hint: displayOrderHint },
      { key: "isPublished", label: "公開する", type: "checkbox", hint: publishFieldHint }
    ],
    defaults: { page: "home", displayOrder: 1, isPublished: false }
  },
  {
    id: "events",
    title: "イベント",
    shortTitle: "イベント",
    description: "イベントの日付、時間、料金、予約方法を更新します。",
    helperText: "公開前に日付、START、料金を必ず確認してください。下書き保存ならサイトには出ません。",
    kind: "list",
    createLabel: "イベントを追加",
    icon: CalendarDays,
    titleKey: "title",
    fields: [
      { key: "title", label: "イベント名", type: "text", required: true, placeholder: "Bassic. Live Night" },
      { key: "date", label: "日付", type: "date", required: true, hint: "開催日だけを選びます。開場・開始・終了の時刻は下の時間欄に入力します。" },
      { key: "openTime", label: "開場時間", type: "text", placeholder: "18:30", hint: "OPENなどの文字は入れず、18:30 のように半角数字と : で入力します。" },
      { key: "startTime", label: "START", type: "text", placeholder: "19:00", hint: "公開する場合は必ず入れます。STARTなどの文字は入れず、19:00 のように半角数字と : で入力します。" },
      { key: "endTime", label: "終了時間", type: "text", placeholder: "22:00", hint: "空欄の場合、Google Calendarには開始から2時間の予定として入ります。深夜2時終了なら 02:00 と入力します。" },
      { key: "performers", label: "出演者", type: "textarea", rows: 3, placeholder: "出演者名を改行で入力" },
      { key: "price", label: "料金", type: "text", placeholder: "前売 3,000円 / 当日 3,500円" },
      { key: "reservation", label: "予約方法", type: "textarea", rows: 3, placeholder: "電話、DM、フォームなど" },
      { key: "sourceUrl", label: "FacebookイベントURL・詳細URL", type: "url", placeholder: "https://www.facebook.com/events/1234567890/", hint: "Facebookのイベント一覧ページではなく、個別イベントページのURLを入れます。Google Calendarへ反映する時も、このURLが説明欄に入ります。" },
      { key: "sourceId", label: "FacebookイベントID", type: "hidden" },
      { key: "sourceType", label: "取り込み元", type: "hidden" },
      { key: "image", label: "イベント画像", type: "image", hint: "チラシや告知画像がある場合だけ入れます。入れた後は「画像を開いて確認」で確認してください。" },
      { key: "isPublished", label: "公開する", type: "checkbox", hint: publishFieldHint }
    ],
    defaults: { isPublished: false }
  },
  {
    id: "menu",
    title: "フードメニュー",
    shortTitle: "メニュー",
    description: "フード名、料金、写真、表示順を更新します。",
    helperText: "売り切れや季節メニューは、公開するチェックを外すとサイトから隠せます。",
    kind: "list",
    createLabel: "メニューを追加",
    icon: Utensils,
    titleKey: "name",
    fields: [
      { key: "name", label: "フード名", type: "text", required: true, placeholder: "ファズ・カレー" },
      { key: "englishName", label: "英語名", type: "text", placeholder: "Fuzz Curry" },
      { key: "price", label: "料金", type: "text", placeholder: "1,200円", hint: "公開する場合は必ず入れます。1,200円、時価、お問い合わせ のように来店前に意味が分かる表記にしてください。" },
      {
        key: "description",
        label: "補足メモ",
        type: "textarea",
        rows: 3,
        placeholder: "必要な場合だけ短く入力",
        hint: "メニューカードは画像・名前・料金を中心に表示します。ここは検索向けや将来用の補足です。"
      },
      { key: "image", label: "画像", type: "image", hint: `公開する場合は必ず入れます。${imageFieldHint}` },
      { key: "displayOrder", label: "表示順", type: "number", placeholder: "1", hint: displayOrderHint },
      { key: "isPublished", label: "公開する", type: "checkbox", hint: publishFieldHint }
    ],
    defaults: { category: "food", isPublished: false, displayOrder: 1 }
  },
  {
    id: "drink-menu-sheets",
    title: "ドリンクメニュー表",
    shortTitle: "ドリンク表",
    description: "ドリンクメニュー表の画像を更新します。",
    helperText: "文字が読める明るい画像を使ってください。複数枚ある場合は表示順を設定します。",
    kind: "list",
    createLabel: "ドリンク表を追加",
    icon: FileText,
    titleKey: "title",
    fields: [
      { key: "title", label: "タイトル", type: "text", required: true, placeholder: "Drink Menu 1" },
      { key: "image", label: "画像", type: "image", required: true, hint: "公開する場合は必ず入れます。文字が切れていないメニュー表画像を入れてください。入れた後は「画像を開いて確認」で確認してください。" },
      { key: "displayOrder", label: "表示順", type: "number", placeholder: "1", hint: displayOrderHint },
      { key: "isPublished", label: "公開する", type: "checkbox", hint: publishFieldHint }
    ],
    defaults: { isPublished: false, displayOrder: 1 }
  },
  {
    id: "party-plans",
    title: "貸切・レンタルプラン",
    shortTitle: "貸切",
    description: "貸切、二次会、レンタル料金を更新します。",
    helperText: "料金や条件は問い合わせ前提でも大丈夫です。古い料金を出さないよう注意します。",
    kind: "list",
    createLabel: "プランを追加",
    icon: Store,
    titleKey: "title",
    fields: [
      { key: "title", label: "プラン名", type: "text", required: true, placeholder: "Bassic. Party Plan" },
      { key: "price", label: "料金", type: "text", required: true, placeholder: "4,000円〜 / 1名", hint: "4,000円〜 / 1名、応相談、お問い合わせ のように意味が分かる表記にしてください。" },
      { key: "body", label: "説明", type: "textarea", required: true, rows: 5, placeholder: "内容、人数、注意点など", hint: "公開する場合は12文字以上で、料金・人数・利用内容が分かる一文を入れてください。" },
      { key: "displayOrder", label: "表示順", type: "number", placeholder: "1", hint: displayOrderHint },
      { key: "isPublished", label: "公開する", type: "checkbox", hint: publishFieldHint }
    ],
    defaults: { isPublished: false, displayOrder: 1 }
  },
  {
    id: "equipment-rental",
    title: "機材レンタル",
    shortTitle: "機材",
    description: "機材レンタルの説明とPDFリンクを更新します。",
    helperText: "PDFを差し替えた場合は、PDFのURLも新しいものに変えてください。",
    kind: "object",
    icon: Music,
    fields: [
      { key: "title", label: "見出し", type: "text", required: true, placeholder: "機材レンタルについて" },
      { key: "price", label: "料金", type: "text", placeholder: "料金はPDFをご確認ください" },
      { key: "body", label: "説明", type: "textarea", required: true, rows: 5, placeholder: "レンタル可能な機材や注意点" },
      { key: "pdfUrl", label: "PDFリンク", type: "url", placeholder: "/assets/pdf/list.pdf または https://...", hint: "入力後は「リンクを開いて確認」でPDFが開くか確認してください。" }
    ],
    defaults: {}
  },
  {
    id: "social-notices",
    title: "SNSお知らせカード",
    shortTitle: "SNSお知らせ",
    description: "Instagram、Facebook、Xへの誘導カードを更新します。",
    helperText: "SNS投稿そのものを自動取得するのではなく、見に行ってほしい投稿へのリンクカードを作ります。SNSを選ぶと、URLの種類が合っているか入力中に確認できます。",
    kind: "list",
    createLabel: "お知らせを追加",
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
      { key: "title", label: "タイトル", type: "text", required: true, placeholder: "今週のライヴ情報", hint: "公開する場合は6文字以上で、何のお知らせか分かるタイトルにします。" },
      { key: "description", label: "説明", type: "textarea", rows: 3, placeholder: "短い紹介文", hint: "公開する場合は10文字以上で、投稿内容や見てほしいポイントを1〜2文で書きます。" },
      { key: "url", label: "リンクURL", type: "url", required: true, placeholder: "https://...", hint: "入力後は「リンクを開いて確認」で正しい投稿やページが開くか確認してください。" },
      { key: "date", label: "日付", type: "date" },
      { key: "isPublished", label: "公開する", type: "checkbox", hint: publishFieldHint }
    ],
    defaults: { platform: "instagram", isPublished: false }
  },
  {
    id: "page-copy",
    title: "ページ文言（保守用）",
    shortTitle: "文言",
    description: "各ページの大きな見出しや説明文をページ単位で編集します。",
    helperText: "日常更新はTOP、メニュー、イベント、店舗情報を使います。ここはページ全体の見出しを変える時だけ触ってください。空欄は今のサイト文言が使われます。",
    kind: "list",
    createLabel: "ページ文言を追加",
    icon: FileText,
    titleKey: "page",
    fields: [
      { key: "page", label: "ページ", type: "select", required: true, options: pageOptions, hint: "どのページの文言を変えるか選びます。" },
      { key: "heroEyebrow", label: "メイン上の小見出し", type: "text", placeholder: "Food & Drink", hint: "メイン見出しの上に小さく出る英字ラベルです。" },
      { key: "heroTitle", label: "メイン見出し", type: "textarea", rows: 2, placeholder: "ページの一番大きな見出し", hint: "PC/スマホで大きく表示されます。長すぎる場合は自動で小さくなります。" },
      { key: "heroLead", label: "メイン説明文", type: "textarea", rows: 4, placeholder: "初めて見る人に伝えたい説明文", hint: "メイン見出しの下に出る説明です。2〜3行程度がおすすめです。" },
      { key: "introLead", label: "初めての方向け説明", type: "textarea", rows: 4, placeholder: "TOPの初回来店セクションで使います", hint: "TOPページのFirst Visitセクションだけで使います。" },
      { key: "accessNote", label: "アクセス補足", type: "textarea", rows: 3, placeholder: "道案内や来店前の注意を短く", hint: "TOPとアクセスページの案内文に使います。" },
      { key: "socialTitleLine1", label: "SNS見出し 1行目", type: "text", placeholder: "最新情報は", hint: "TOPのSNS欄だけで使います。" },
      { key: "socialTitleLine2", label: "SNS見出し 2行目", type: "text", placeholder: "公式SNSから", hint: "TOPのSNS欄だけで使います。" },
      { key: "socialLead", label: "SNS説明文", type: "textarea", rows: 3, placeholder: "SNSお知らせカードの上に出る説明文", hint: "TOPのSNS欄だけで使います。" },
      { key: "calendarNote", label: "カレンダー補足", type: "textarea", rows: 2, placeholder: "イベント日程を見る時の注意", hint: "イベントページのGoogle Calendar上部に出る短い補足です。" },
      { key: "drinkLead", label: "ドリンク表説明", type: "textarea", rows: 2, placeholder: "ドリンク表の上に出す一言", hint: "メニューページのドリンク表上部に出ます。空欄でも問題ありません。" },
      { key: "foodLead", label: "フードメニュー説明", type: "textarea", rows: 2, placeholder: "フードメニューの上に出す一言", hint: "メニューページのフード一覧上部に出ます。空欄でも問題ありません。" },
      { key: "partyLead", label: "貸切説明", type: "textarea", rows: 3, placeholder: "貸切ページのプラン上に出す説明", hint: "貸切ページのプラン一覧上部に出ます。" },
      { key: "rentalLead", label: "機材レンタル説明", type: "textarea", rows: 3, placeholder: "機材レンタルカードで使う説明", hint: "貸切ページの機材レンタルカード本文に使います。" },
      { key: "displayOrder", label: "優先順位", type: "number", placeholder: "1", hint: "同じページの文言が複数ある時、数字が大きいものが優先されます。0以上の半角整数で、通常は1のままで大丈夫です。" },
      { key: "isPublished", label: "使う", type: "checkbox", hint: "ONにすると、この文言がサイトで使われます。下書きにしたい時はOFFにしてください。" }
    ],
    defaults: { page: "home", displayOrder: 1, isPublished: true }
  },
  {
    id: "page-sections",
    title: "セクション表示（保守用）",
    shortTitle: "表示切替",
    description: "既存セクションを表示するか、どの順番で出すかをページごとに管理します。",
    helperText: "ページの部品そのものを出し分ける保守用設定です。通常運用では変更しません。迷ったら触らず、保守担当者へ確認してください。",
    kind: "list",
    createLabel: "表示設定を追加（保守用）",
    icon: Settings,
    titleKey: "sectionKey",
    fields: [
      { key: "page", label: "ページ", type: "select", required: true, options: pageOptions, hint: "表示を変えるページを選びます。" },
      { key: "sectionKey", label: "セクション", type: "select", required: true, options: sectionOptions, hint: "ページ内のどの部品を出すか選びます。分からない場合は変更しないでください。" },
      { key: "displayOrder", label: "表示順", type: "number", placeholder: "1", hint: "小さい数字ほど上に表示されます。0以上の半角整数で入力します。数字が重なると意図しない順番になる場合があります。" },
      { key: "isPublished", label: "表示する", type: "checkbox", hint: "OFFにすると、そのセクションが公開サイトから消えます。" }
    ],
    defaults: { page: "home", sectionKey: "hero", displayOrder: 1, isPublished: true }
  },
  {
    id: "custom-sections",
    title: "お知らせ枠",
    shortTitle: "追加枠",
    description: "既存ページに、1種類だけ使える自由なお知らせセクションを追加します。",
    helperText: "キャンペーンや一時案内に使います。ページを増やす機能ではありません。",
    kind: "list",
    createLabel: "お知らせ枠を追加",
    icon: Megaphone,
    titleKey: "title",
    fields: [
      { key: "page", label: "表示ページ", type: "select", required: true, options: pageOptions },
      { key: "title", label: "タイトル", type: "text", required: true, placeholder: "臨時休業のお知らせ", hint: "公開する場合は6文字以上で、内容が分かるタイトルにします。" },
      { key: "body", label: "本文", type: "textarea", required: true, rows: 5, placeholder: "お客様に伝えたい内容を短く入力します。", hint: "公開する場合は20文字以上で、誰に何を伝える案内か分かる文章にします。" },
      { key: "image", label: "画像", type: "image", hint: `必要な時だけ追加します。${imageFieldHint}` },
      { key: "linkLabel", label: "リンクボタン名", type: "text", placeholder: "詳しく見る" },
      { key: "linkUrl", label: "リンクURL", type: "url", placeholder: "https://..." },
      { key: "displayOrder", label: "表示順", type: "number", placeholder: "10", hint: displayOrderHint },
      { key: "isPublished", label: "公開する", type: "checkbox", hint: publishFieldHint }
    ],
    defaults: { page: "home", displayOrder: 10, isPublished: false }
  }
];

export function getSection(id: string) {
  const section = sections.find((item) => item.id === id);

  if (!section) {
    throw new Error("Unknown section.");
  }

  return section;
}
