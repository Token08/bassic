import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const outDir = join(process.cwd(), "out");
const failures = [];

const menuRegressionTerms = [
  "DRINK&FOOD MENU",
  "FOOD MENU",
  "DRINK MENU 1",
  "drink-menu-2026-01.webp",
  "DRINK MENU 4",
  "drink-menu-2026-04.webp",
  "fuzz-curry.jpg",
  "tacos-potato.jpg",
  "chorizo-con-papas.jpg",
  "cheese-assortment.jpg",
  "nachos.jpg",
  "spicy-oil-sardine.jpg",
  "pork-sausage.jpg",
  "mexican-plain.jpg",
  "prosciutto-assortment.jpg",
  "daily-pasta.jpg"
];

const pages = [
  {
    label: "TOP",
    file: "index.html",
    terms: [
      "public bar Bassic.",
      "通常営業 20:00 OPEN",
      "店内喫煙OK",
      "テーブル・チャージ",
      "Google Mapで開く",
      "公式SNSから"
    ]
  },
  {
    label: "Events",
    file: "events/index.html",
    terms: ["Google Calendarで開く", "イベント日は営業時間が変動します", "通常営業は20:00 OPENです"]
  },
  {
    label: "Menu",
    file: "menu/index.html",
    terms: ["DRINK&FOOD MENU", "FOOD MENU", "DRINK MENU 1", "DRINK MENU 4", "ファズ・カレー", "本日のパスタ"]
  },
  {
    label: "Party",
    file: "party/index.html",
    terms: [
      "Bassic. Party Plan",
      ["￥4,000", "￥４,000", "¥4,000"],
      "機材レンタルについて",
      "詳細はコチラ",
      "/assets/pdf/equipment-rental-list.pdf"
    ]
  },
  {
    label: "Access",
    file: "access/index.html",
    terms: ["天神駅から徒歩約4分", "WITH天神5F", "092-713-1040", "mail@bassic.jp", "Google Mapで開く"]
  }
];

const localizedPages = [
  {
    label: "English TOP",
    file: "en/index.html",
    terms: ["public bar Bassic.", "Regular hours:", "Smoking allowed:", "Cover charge:"]
  },
  {
    label: "English Events",
    file: "en/events/index.html",
    terms: ["Event hours may vary", "Open Google Map", "Email reservation"]
  },
  {
    label: "English Menu",
    file: "en/menu/index.html",
    terms: ["Food and drinks for a music night.", "Cover charge: 500 yen per person", "View menu"]
  },
  {
    label: "English Party",
    file: "en/party/index.html",
    terms: ["Private parties and after-parties.", "Cover charge: 500 yen per person", "Open Google Map"]
  },
  {
    label: "English Access",
    file: "en/access/index.html",
    terms: ["4 minutes from Tenjin Station.", "092-713-1040", "mail@bassic.jp"]
  }
];

for (const locale of ["ko", "zh-hant", "zh-hans"]) {
  for (const file of ["index.html", "events/index.html", "menu/index.html", "party/index.html", "access/index.html"]) {
    localizedPages.push({
      label: `${locale} ${file}`,
      file: `${locale}/${file}`,
      terms: ["Google Map"]
    });
  }
}

for (const page of pages) {
  requireTerms(page);
}

requireTerms({
  label: "Menu regression",
  file: "menu/index.html",
  terms: menuRegressionTerms
});

for (const page of localizedPages) {
  requireTerms(page);
}

if (failures.length) {
  console.error("Content smoke check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Content smoke check passed.");

function requireTerms({ label, file, terms }) {
  const html = readPage(file);
  if (!html) {
    return;
  }

  for (const term of terms) {
    const options = Array.isArray(term) ? term : [term];
    if (!options.some((option) => html.includes(option))) {
      failures.push(`${label} missing: ${options.join(" / ")}`);
    }
  }
}

function readPage(file) {
  const path = join(outDir, file);
  if (!existsSync(path)) {
    failures.push(`missing exported page: out/${file}`);
    return "";
  }

  return decodeBasicEntities(readFileSync(path, "utf8"));
}

function decodeBasicEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&#(\d+);/g, (_, number) => String.fromCodePoint(Number(number)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, number) => String.fromCodePoint(parseInt(number, 16)));
}
