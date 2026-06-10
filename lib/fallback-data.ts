import type { CmsContents } from "./types";

export const fallbackContents: CmsContents = {
  home: {
    heroTitle: "public bar Bassic.",
    heroLead:
      "パブリックバー・ベーシックは福岡・天神 親不孝通りのミュージックバー。初めてでも入りやすい音楽と料理のお店です",
    firstVisitLead:
      "高い天井と柔らかな灯り。豊富なお酒と心地よい空間が、それぞれの夜をゆっくりと深めていく。\nお一人でも、ライヴ前後でも、会話を愉しみたい夜でも。\n初めてでも入りやすい、大人の隠れ家的なお店。\nライヴイベントのない日は通常バータイムとしてゆったりご利用いただけます。",
    accessNote:
      "天神駅から徒歩約4分。WITH天神ビル5Fまで上がってください。イベント日は通常営業開始時間が変わる場合があります。"
  },
  events: [
    {
      id: "sample-1",
      title: "Bassic. Music Night",
      date: "2026-07-12",
      openTime: "19:00",
      startTime: "20:00",
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
  ],
  menu: [
    {
      category: "food",
      name: "ファズ・カレー",
      englishName: "Fuzz Curry",
      price: "￥1,100",
      description:
        "Bassic.の名物カレー。スパイスの香りとコクのあるソースで、飲む前の食事にも、ライブ後の一皿にも合います。",
      image: { url: "/assets/drive/menu/fuzz-curry.jpg", alt: "Bassic.のファズ・カレー" }
    },
    {
      category: "food",
      name: "タコス＆ポテト",
      englishName: "Tacos & Potato",
      price: "￥800",
      description: "ライムと香草が効いたタコスにポテトを添えた、シェアしやすい定番フードです。",
      image: { url: "/assets/drive/menu/tacos.jpg", alt: "Bassic.のタコス" }
    },
    {
      category: "food",
      name: "フライドチキン",
      englishName: "Fried Chicken",
      price: "￥850",
      description: "外は香ばしく、中はジューシー。ビールやハイボールと合わせやすい一皿です。",
      image: { url: "/assets/drive/menu/fried-chicken.jpg", alt: "Bassic.のフライドチキン" }
    },
    {
      category: "food",
      name: "シェアプレート",
      englishName: "Share Plate",
      price: "￥1,200〜",
      description: "ライブ前後や二次会でつまみやすい、人数に合わせた盛り合わせです。",
      image: { url: "/assets/drive/index_back/table-food.jpg", alt: "Bassic.の料理が並ぶテーブル" }
    },
    {
      category: "drink",
      name: "ハートランド 生",
      englishName: "Heartland Draft",
      price: "￥700",
      description: "最初の一杯に頼みやすい生ビール。料理にも音楽にもすっと馴染みます。",
      image: { url: "/assets/drive/menu/whiskey.jpg", alt: "Bassic.のドリンク" }
    },
    {
      category: "drink",
      name: "自家製サングリア",
      englishName: "House Sangria",
      price: "￥750",
      description: "果実感のある飲みやすい一杯。初めての方やゆっくり飲みたい夜にもおすすめです。",
      image: { url: "/assets/drive/menu/cocktails.jpg", alt: "色鮮やかなカクテル" }
    },
    {
      category: "drink",
      name: "ウイスキー",
      englishName: "Whiskey",
      price: "￥700〜",
      description: "ロック、水割り、ハイボールで。音楽を聴きながらじっくり楽しめます。",
      image: { url: "/assets/drive/menu/whiskey.jpg", alt: "Bassic.のウイスキー" }
    },
    {
      category: "drink",
      name: "カクテル",
      englishName: "Cocktails",
      price: "￥750〜",
      description: "気分に合わせて選べるカクテル。甘め、すっきり、強めなど相談できます。",
      image: { url: "/assets/drive/menu/cocktails.jpg", alt: "色鮮やかなカクテル" }
    }
  ],
  partyPlans: [
    {
      title: "Bassic. Party Plan",
      price: "￥3,000〜 / 1名",
      body: "10名様から利用可能。貸切は25名様以上より。2時間フリードリンクと大皿料理のプランです。"
    },
    {
      title: "Live After Party",
      price: "フード ￥1,500〜 / 1名",
      body: "ライブやイベント後の打ち上げに。キャッシュオンドリンクと人数に合わせた料理をご用意します。"
    },
    {
      title: "Rental",
      price: "平日 1H ￥10,000〜",
      body: "機材使用料込み。土日祝・祝前日は 1H ￥12,000〜。詳細はお問い合わせください。"
    }
  ]
};
