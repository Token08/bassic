const siteSettings = {
  address: "福岡市中央区天神3-4-19 WITH天神5F",
  phone: "092-713-1040",
  hoursLabel: "通常営業 20:00 OPEN / L.O. 1:30 / 2:00 CLOSE\nイベントがある日は 22:30 から通常営業\n※イベントにより異なる場合もございます",
  eventHoursNote:
    "イベント時は営業時間が変動します。\nイベント終了後は 22:30 から通常営業です。\n詳細はイベントスケジュールページをご確認ください。",
  smokingLabel:
    "店内喫煙OK（紙タバコ・電子タバコOK）\n※未成年の入店はお断りしております。\n※イベント内容によりイベント中は禁煙になる場合がございます。",
  chargeLabel: "チャージ 500円 / お一人様",
  googleMapsUrl:
    "https://www.google.com/maps/search/?api=1&query=public%20bar%20Bassic.%20福岡市中央区天神3-4-19%20WITH天神5F",
  directionsUrl:
    "https://www.google.com/maps/dir/?api=1&destination=public%20bar%20Bassic.%20福岡市中央区天神3-4-19%20WITH天神5F",
  instagramUrl: "https://www.instagram.com/bassic_official/",
  facebookUrl: "https://www.facebook.com/bar.Bassic/",
  xUrl: "https://x.com/bar_Bassic",
  onlineStoreUrl: "https://bassic.official.ec/"
};

const home = {
  heroTitle: "public bar Bassic.",
  heroLead:
    "福岡は親不孝通りにあるミュージックバーです。ライヴやイベント等もお気軽にご相談ください。OPEN 20:00PM~2:00AM（イベントがある日は22:30~通常営業）",
  firstVisitLead:
    "お一人でも、ライヴ後でも会話を愉しみたい夜でも。初めてでも入りやすい、大人の隠れ家的な空間で、それぞれの夜を深めていく。\nライヴイベントのない日は通常バータイムとして、ゆったりご利用できます。",
  accessNote:
    "天神駅から徒歩約4分。WITH天神ビル5Fまで上がってください。イベント日は通常営業開始時間が変わる場合があります。",
  heroImage: {
    url: "/assets/brand/top-slides/hero-01.jpg",
    alt: "public bar Bassic.の店内"
  }
};

const heroSlides = [
  ...[
    ["home-hero-01", "home", "/assets/brand/top-slides/hero-01.jpg", "public bar Bassic.の客席とバーカウンターが見える店内"],
    ["home-hero-02", "home", "/assets/brand/top-slides/hero-02.jpg", "public bar Bassic.のバーカウンター"],
    ["home-hero-03", "home", "/assets/brand/top-slides/hero-03.jpg", "Bassic.のボトルとグラス"],
    ["home-hero-04", "home", "/assets/brand/top-slides/hero-04.jpg", "public bar Bassic.の入口へ続く通路"],
    ["home-hero-05", "home", "/assets/brand/top-slides/hero-05.jpg", "ミラーボールの光"],
    ["home-hero-06", "home", "/assets/brand/top-slides/hero-06.jpg", "DJターンテーブル"],
    ["home-hero-07", "home", "/assets/brand/top-slides/hero-07.jpg", "Bassic.のステージと音楽のある夜"],
    ["home-hero-08", "home", "/assets/brand/top-slides/hero-08.jpg", "Bassic.の店内風景"],
    ["home-hero-09", "home", "/assets/brand/top-slides/hero-09.jpg", "Bassic.の夜の空間"],
    ["home-hero-10", "home", "/assets/brand/top-slides/hero-10.jpg", "public bar Bassic.の店内写真"]
  ].map(([id, page, url, alt], index) => ({
    id,
    page,
    title: `TOP ${index + 1}`,
    image: { url, alt },
    displayOrder: index + 1,
    isPublished: true
  })),
  ...[
    ["events-hero-01", "/assets/brand/event-slides/event-01.jpg", "Bassic.のライヴイベント風景"],
    ["events-hero-02", "/assets/brand/event-slides/event-02.jpg", "Bassic.のステージと客席"],
    ["events-hero-03", "/assets/brand/event-slides/event-03.jpg", "Bassic.のライヴフロア"],
    ["events-hero-04", "/assets/brand/event-slides/event-04.jpg", "Bassic.のイベント風景"],
    ["events-hero-05", "/assets/brand/event-slides/event-05.jpg", "Bassic.の音楽イベント"],
    ["events-hero-06", "/assets/brand/event-slides/event-06.jpg", "Bassic.のライヴとDJの夜"]
  ].map(([id, url, alt], index) => ({
    id,
    page: "events",
    title: `Events ${index + 1}`,
    image: { url, alt },
    displayOrder: index + 1,
    isPublished: true
  })),
  ...[
    ["party-hero-01", "/assets/brand/party-slides/party-01.jpg", "Bassic.のパーティー利用イメージ"],
    ["party-hero-02", "/assets/brand/party-slides/party-02.jpg", "Bassic.の貸切イベントイメージ"],
    ["party-hero-03", "/assets/brand/party-slides/party-03.jpg", "Bassic.の音楽とパーティーの夜"]
  ].map(([id, url, alt], index) => ({
    id,
    page: "party",
    title: `Party ${index + 1}`,
    image: { url, alt },
    displayOrder: index + 1,
    isPublished: true
  })),
  {
    id: "menu-hero-01",
    page: "menu",
    title: "Menu main",
    image: { url: "/assets/menu-refresh/menu-hero.jpg", alt: "Bassic.の料理とドリンク" },
    displayOrder: 1,
    isPublished: true
  },
  {
    id: "access-hero-01",
    page: "access",
    title: "Access main",
    image: { url: "/assets/brand/access-hero.jpg", alt: "Bassic.のバーカウンターと照明" },
    displayOrder: 1,
    isPublished: true
  }
];

const events = [
  {
    id: "sample-1",
    title: "Bassic. Music Night",
    date: "2026-07-12",
    openTime: "19:00",
    startTime: "20:00",
    endTime: "22:00",
    sourceUrl: "https://www.facebook.com/events/1234567890123456/",
    sourceType: "facebook",
    performers: "出演者は決まり次第更新",
    price: "予約・料金はイベントごとに告知",
    reservation: "mail@bassic.jp まで日付、枚数、氏名、電話番号をお送りください。",
    isPublished: true
  },
  {
    id: "sample-2",
    title: "After Party / DJ Bar Time",
    date: "2026-07-19",
    openTime: "20:00",
    performers: "DJ / Guest Musician",
    price: "キャッシュオン",
    reservation: "予約不要。貸切状況は事前にSNSをご確認ください。",
    isPublished: true
  }
];

const menu = [
  ["menu-fuzz-curry", "ファズ・カレー", "¥1,200", "/assets/menu-refresh/fuzz-curry.jpg"],
  ["menu-tacos-potato", "タコス＆ポテト", "¥900", "/assets/menu-refresh/tacos-potato.jpg"],
  ["menu-chorizo-con-papas", "チョリソーコンパパス", "¥900", "/assets/menu-refresh/chorizo-con-papas.jpg"],
  ["menu-cheese-assortment", "チーズ盛り合わせ", "¥900", "/assets/menu-refresh/cheese-assortment.jpg"],
  ["menu-nachos", "ナチョス", "¥500", "/assets/menu-refresh/nachos.jpg"],
  ["menu-spicy-oil-sardine", "ピリ辛オイルサーディン", "¥750", "/assets/menu-refresh/spicy-oil-sardine.jpg"],
  ["menu-pork-sausage", "ポークソーセージ", "¥700", "/assets/menu-refresh/pork-sausage.jpg"],
  ["menu-mexican-plain", "メキシカンプレーン", "¥900", "/assets/menu-refresh/mexican-plain.jpg"],
  ["menu-prosciutto-assortment", "生ハム盛り合わせ", "¥900", "/assets/menu-refresh/prosciutto-assortment.jpg"],
  ["menu-daily-pasta", "本日のパスタ", "¥1,100~", "/assets/menu-refresh/daily-pasta.jpg"]
].map(([id, name, price, url], index) => ({
  id,
  name,
  price,
  category: "food",
  image: { url, alt: name },
  displayOrder: index + 1,
  isPublished: true
}));

const drinkMenuSheets = [
  ["drink-sheet-01", "Drink Menu 1", "/assets/menu-refresh/drinks/drink-01.webp"],
  ["drink-sheet-02", "Drink Menu 2", "/assets/menu-refresh/drinks/drink-02.webp"],
  ["drink-sheet-03", "Drink Menu 3", "/assets/menu-refresh/drinks/drink-03.webp"],
  ["drink-sheet-04", "Drink Menu 4", "/assets/menu-refresh/drinks/drink-04.webp"]
].map(([id, title, url], index) => ({
  id,
  title,
  image: { url, alt: title },
  displayOrder: index + 1,
  isPublished: true
}));

const partyPlans = [
  {
    id: "party-plan-basic",
    title: "Bassic. Party Plan",
    price: "￥4,000〜 / 1名",
    body: "10名様から利用可能。貸切は25名様以上より。2時間フリードリンクと大皿料理のプランです。",
    displayOrder: 1,
    isPublished: true
  },
  {
    id: "party-plan-after-party",
    title: "Live After Party",
    price: "フード ￥1,500〜 / 1名",
    body: "ライヴやイベント後の打ち上げに。キャッシュオンドリンクと人数に合わせた料理をご用意します。",
    displayOrder: 2,
    isPublished: true
  },
  {
    id: "party-plan-rental",
    title: "Rental",
    price: "平日 1H ￥10,000〜",
    body: "機材使用料込み。土日祝・祝前日は 1H ￥12,000〜。詳細はお問い合わせください。",
    displayOrder: 3,
    isPublished: true
  }
];

const equipmentRental = {
  title: "機材レンタルについて",
  price: "平日 1H ￥10,000〜 / 土日祝・祝前日 1H ￥12,000〜",
  body: "機材使用料込みで、ライヴ、DJ、イベント、配信、二次会などのレンタル利用に対応しています。内容や人数により利用条件が変わる場合がありますので、詳細はお問い合わせください。",
  pdfUrl: "/assets/pdf/equipment-rental-list.pdf"
};

const socialNotices = [
  {
    id: "instagram-profile",
    platform: "instagram",
    title: "Instagramで店内写真・イベント情報を更新中",
    url: "https://www.instagram.com/bassic_official/",
    description: "直近の写真、イベント告知、店内の空気感は公式Instagramで確認できます。",
    isPublished: true
  },
  {
    id: "facebook-profile",
    platform: "facebook",
    title: "Facebookでイベント投稿を確認",
    url: "https://www.facebook.com/bar.Bassic/",
    description: "ライヴ、DJ、イベント告知などをFacebookでも更新しています。",
    isPublished: true
  },
  {
    id: "x-profile",
    platform: "x",
    title: "Xでイベント告知・営業情報を確認",
    url: "https://x.com/bar_Bassic",
    description: "管理画面にXの投稿URLを貼ると、この欄にお知らせカードとして表示できます。",
    isPublished: true
  }
];

const pageCopy = [
  {
    id: "copy-home",
    page: "home",
    heroTitle: home.heroTitle,
    heroLead: home.heroLead,
    introLead: home.firstVisitLead,
    accessNote: home.accessNote,
    socialTitleLine1: "最新情報は、",
    socialTitleLine2: "公式SNSから。",
    socialLead: "Instagram、Facebook、Xの公式投稿をまとめて確認できます。イベント、営業情報、店内の空気感はSNSでも更新しています。",
    displayOrder: 1,
    isPublished: true
  },
  {
    id: "copy-events",
    page: "events",
    heroEyebrow: "Event Schedule",
    heroTitle: "ライヴ・DJ・イベント。",
    heroLead:
      "イベント終了後はバータイムとしてご利用できます。\n各イベントについてはスケジュールページで最新情報を確認できます。\n※イベントを行いたい方はお気軽にスタッフへご相談下さい。",
    calendarNote: "Google Calendarでも最新イベントを確認できます。",
    displayOrder: 1,
    isPublished: true
  },
  {
    id: "copy-menu",
    page: "menu",
    heroEyebrow: "Food & Drink",
    heroTitle: "Bassic.の料理と、音楽に合うお酒。",
    heroLead: "初めての方にも選びやすいよう、人気メニューと価格感を見やすく整理しました。",
    drinkLead: "ドリンク表は画像で確認できます。季節や仕入れにより内容が変わる場合があります。",
    foodLead: "写真付きのフードメニューです。売り切れや季節メニューは店頭でご確認ください。",
    displayOrder: 1,
    isPublished: true
  },
  {
    id: "copy-party",
    page: "party",
    heroEyebrow: "Party & Rental",
    heroTitle: "貸切、二次会、ライヴ後の打ち上げに。",
    heroLead: "親不孝通りで、音楽と料理を楽しめるパーティーやレンタル利用に対応しています。",
    partyLead: "人数や内容に合わせてご相談いただけます。まずは日程と人数をお知らせください。",
    rentalLead: equipmentRental.body,
    displayOrder: 1,
    isPublished: true
  },
  {
    id: "copy-access",
    page: "access",
    heroEyebrow: "Access",
    heroTitle: "天神駅から徒歩約4分。WITH天神5Fへ。",
    heroLead: "Google Map、住所、電話、メールをまとめました。初めての方も地図から迷わず来店できます。",
    accessNote: home.accessNote,
    displayOrder: 1,
    isPublished: true
  }
];

const pageSections = [
  ["home-hero", "home", "hero", 1],
  ["home-first-visit", "home", "firstVisit", 2],
  ["home-visit-info", "home", "visitInfo", 3],
  ["home-local-search", "home", "localSearch", 4],
  ["home-social", "home", "social", 5],
  ["home-access", "home", "access", 6],
  ["events-hero", "events", "hero", 1],
  ["events-list", "events", "eventList", 2, false],
  ["events-calendar", "events", "calendar", 2],
  ["menu-hero", "menu", "hero", 1],
  ["menu-drink-sheets", "menu", "drinkSheets", 2],
  ["menu-food", "menu", "foodMenu", 3],
  ["party-hero", "party", "hero", 1],
  ["party-plans", "party", "plans", 2],
  ["party-equipment", "party", "equipmentRental", 3],
  ["party-use-cases", "party", "useCases", 4],
  ["access-hero", "access", "hero", 1],
  ["access-info", "access", "accessInfo", 2],
  ["access-map", "access", "googleMap", 3]
].map(([id, page, sectionKey, displayOrder, isPublished = true]) => ({
  id,
  page,
  sectionKey,
  displayOrder,
  isPublished
}));

export const seedData = {
  objects: {
    "site-settings": siteSettings,
    home,
    "equipment-rental": equipmentRental
  },
  lists: {
    "hero-slides": heroSlides,
    events,
    menu,
    "drink-menu-sheets": drinkMenuSheets,
    "party-plans": partyPlans,
    "social-notices": socialNotices,
    "page-copy": pageCopy,
    "page-sections": pageSections,
    "custom-sections": []
  }
};
