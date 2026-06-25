import type { MenuItem } from "./types";

const foodImageBase = "/assets/menu-refresh";

export const drinkMenuSheets = [
  { title: "DRINK MENU 1", src: "/assets/menu-refresh/drinks/drink-menu-2026-01.webp" },
  { title: "DRINK MENU 2", src: "/assets/menu-refresh/drinks/drink-menu-2026-02.webp" },
  { title: "DRINK MENU 3", src: "/assets/menu-refresh/drinks/drink-menu-2026-03.webp" },
  { title: "DRINK MENU 4", src: "/assets/menu-refresh/drinks/drink-menu-2026-04.webp" }
] as const;

export const defaultMenuItems: MenuItem[] = [
  {
    name: "ファズ・カレー",
    price: "¥1,200",
    category: "food",
    image: { url: `${foodImageBase}/fuzz-curry.jpg`, alt: "ファズ・カレー" }
  },
  {
    name: "タコス＆ポテト",
    price: "¥900",
    category: "food",
    image: { url: `${foodImageBase}/tacos-potato.jpg`, alt: "タコス＆ポテト" }
  },
  {
    name: "チョリソーコンパパス",
    price: "¥900",
    category: "food",
    image: { url: `${foodImageBase}/chorizo-con-papas.jpg`, alt: "チョリソーコンパパス" }
  },
  {
    name: "チーズ盛り合わせ",
    price: "¥900",
    category: "food",
    image: { url: `${foodImageBase}/cheese-assortment.jpg`, alt: "チーズ盛り合わせ" }
  },
  {
    name: "ナチョス",
    price: "¥500",
    category: "food",
    image: { url: `${foodImageBase}/nachos.jpg`, alt: "ナチョス" }
  },
  {
    name: "ピリ辛オイルサーディン",
    price: "¥750",
    category: "food",
    image: { url: `${foodImageBase}/spicy-oil-sardine.jpg`, alt: "ピリ辛オイルサーディン" }
  },
  {
    name: "ポークソーセージ",
    price: "¥700",
    category: "food",
    image: { url: `${foodImageBase}/pork-sausage.jpg`, alt: "ポークソーセージ" }
  },
  {
    name: "メキシカンプレーン",
    price: "¥900",
    category: "food",
    image: { url: `${foodImageBase}/mexican-plain.jpg`, alt: "メキシカンプレーン" }
  },
  {
    name: "生ハム盛り合わせ",
    price: "¥900",
    category: "food",
    image: { url: `${foodImageBase}/prosciutto-assortment.jpg`, alt: "生ハム盛り合わせ" }
  },
  {
    name: "本日のパスタ",
    price: "¥1,100~",
    category: "food",
    image: { url: `${foodImageBase}/daily-pasta.jpg`, alt: "本日のパスタ" }
  },
  {
    name: "ハートランド生",
    price: "¥700",
    category: "drink",
    image: { url: "/assets/drive/menu/cocktails.jpg", alt: "ハートランド生" }
  },
  {
    name: "自家製サングリア",
    price: "¥750",
    category: "drink",
    image: { url: "/assets/drive/menu/cocktails.jpg", alt: "自家製サングリア" }
  },
  {
    name: "カクテル各種",
    price: "¥750〜",
    category: "drink",
    image: { url: "/assets/drive/menu/cocktails.jpg", alt: "カクテル各種" }
  },
  {
    name: "ウイスキー各種",
    price: "¥700〜",
    category: "drink",
    image: { url: "/assets/drive/menu/whiskey.jpg", alt: "ウイスキー各種" }
  },
  {
    name: "コーヒー焼酎",
    price: "¥700",
    category: "drink",
    image: { url: "/assets/drive/menu/whiskey.jpg", alt: "コーヒー焼酎" }
  }
];
