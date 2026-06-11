export const localeCodes = ["en", "ko", "zh-hant", "zh-hans"] as const;

export type LocaleCode = (typeof localeCodes)[number];
export type LocalizedPageKey = "home" | "events" | "menu" | "party" | "access";

export const localizedLabels = {
  en: {
    language: "English",
    map: "Open Google Map",
    call: "Call",
    reserve: "Email reservation",
    hours: "Regular hours: 20:00 open / L.O. 1:30 / closes 2:00",
    eventHours: "Event hours may vary. Please check the event schedule.",
    charge: "Cover charge: 500 yen per person",
    smoking: "Smoking allowed: cigarettes and heated tobacco"
  },
  ko: {
    language: "한국어",
    map: "Google Map 열기",
    call: "전화하기",
    reserve: "메일 예약",
    hours: "일반 영업: 20:00 오픈 / L.O. 1:30 / 2:00 종료",
    eventHours: "이벤트 시 영업시간은 변동됩니다. 이벤트 스케줄을 확인해 주세요.",
    charge: "차지: 1인 500엔",
    smoking: "매장 내 흡연 가능: 종이담배, 전자담배 가능"
  },
  "zh-hant": {
    language: "繁體中文",
    map: "開啟 Google Map",
    call: "電話",
    reserve: "郵件預約",
    hours: "一般營業: 20:00 開店 / L.O. 1:30 / 2:00 打烊",
    eventHours: "活動日營業時間可能變動，請確認活動行程頁。",
    charge: "座位費: 每人500日圓",
    smoking: "店內可吸菸: 紙菸、電子菸皆可"
  },
  "zh-hans": {
    language: "简体中文",
    map: "打开 Google Map",
    call: "电话",
    reserve: "邮件预约",
    hours: "通常营业: 20:00 开店 / L.O. 1:30 / 2:00 结束",
    eventHours: "活动日营业时间可能变动，请查看活动日程页。",
    charge: "座位费: 每人500日元",
    smoking: "店内可吸烟: 纸烟、电子烟均可"
  }
} as const;

export const localizedPages = {
  en: {
    home: {
      eyebrow: "Music bar in Oyafuko Street, Tenjin, Fukuoka",
      title: "public bar Bassic.",
      lead: "public bar Bassic. is a music bar in Oyafuko Street, Tenjin, Fukuoka. A relaxed place for music, food, and drinks, even on your first visit.",
      titleMeta: "public bar Bassic. | Music Bar in Tenjin, Fukuoka",
      description: "Visit public bar Bassic. in Tenjin, Fukuoka for music, food, drinks, live events, and a relaxed bar night."
    },
    events: {
      eyebrow: "Event Schedule",
      title: "Live, DJ, and event schedule.",
      lead: "Check dates, open/start times, prices, and reservation details. Event hours may vary.",
      titleMeta: "Events | Live Music and DJ Bar in Tenjin, Fukuoka",
      description: "Live music, DJ events, reservation details, and event schedules at public bar Bassic. in Tenjin, Fukuoka."
    },
    menu: {
      eyebrow: "Food & Drink",
      title: "Food and drinks for a music night.",
      lead: "See popular food, drinks, and the cover charge before visiting.",
      titleMeta: "Menu | Food, Drinks, and Cover Charge",
      description: "Food and drink menu at public bar Bassic. including Fuzz Curry, tacos, drinks, and a 500 yen cover charge."
    },
    party: {
      eyebrow: "Party & Rental",
      title: "Private parties and after-parties.",
      lead: "Bassic. is available for private parties, after-parties, and rental use in Oyafuko Street.",
      titleMeta: "Party & Rental | Private Events in Tenjin",
      description: "Private party, after-party, and rental options at public bar Bassic. in Tenjin, Fukuoka."
    },
    access: {
      eyebrow: "Access",
      title: "4 minutes from Tenjin Station.",
      lead: "Find the address, Google Map, phone, email, hours, and smoking information before you visit.",
      titleMeta: "Access | 4 Minutes from Tenjin Station",
      description: "Access information for public bar Bassic. at WITH Tenjin 5F, 3-4-19 Tenjin, Chuo-ku, Fukuoka."
    }
  },
  ko: {
    home: {
      eyebrow: "후쿠오카 텐진 오야후코도리의 뮤직 바",
      title: "public bar Bassic.",
      lead: "public bar Bassic.은 후쿠오카 텐진 오야후코도리에 있는 뮤직 바입니다. 처음 방문해도 편하게 음악, 음식, 술을 즐길 수 있습니다.",
      titleMeta: "public bar Bassic. | 후쿠오카 텐진 뮤직 바",
      description: "후쿠오카 텐진 public bar Bassic.에서 음악, 음식, 술, 라이브 이벤트를 즐겨보세요."
    },
    events: {
      eyebrow: "Event Schedule",
      title: "라이브, DJ, 이벤트 일정.",
      lead: "날짜, 오픈/시작 시간, 요금, 예약 방법을 확인할 수 있습니다. 이벤트 시 영업시간은 변동됩니다.",
      titleMeta: "이벤트 | 텐진 라이브와 DJ 바",
      description: "public bar Bassic.의 라이브, DJ 이벤트, 예약 정보와 이벤트 일정을 안내합니다."
    },
    menu: {
      eyebrow: "Food & Drink",
      title: "음악과 함께 즐기는 음식과 술.",
      lead: "인기 메뉴, 음료, 차지 정보를 방문 전에 확인할 수 있습니다.",
      titleMeta: "메뉴 | 음식, 음료, 차지 안내",
      description: "public bar Bassic.의 푸드, 드링크, Fuzz Curry, 타코스, 1인 500엔 차지 안내."
    },
    party: {
      eyebrow: "Party & Rental",
      title: "대관, 2차, 라이브 후 뒤풀이.",
      lead: "오야후코도리에서 음악과 음식을 즐기는 파티와 대관 이용이 가능합니다.",
      titleMeta: "대관・파티 | 텐진 2차와 뒤풀이",
      description: "public bar Bassic.의 대관, 파티, 라이브 후 뒤풀이, 렌탈 이용 안내."
    },
    access: {
      eyebrow: "Access",
      title: "텐진역에서 도보 약 4분.",
      lead: "주소, Google Map, 전화, 메일, 영업시간, 흡연 정보를 방문 전에 확인하세요.",
      titleMeta: "오시는 길 | 텐진역 도보 약 4분",
      description: "후쿠오카시 주오구 텐진 3-4-19 WITH 텐진 5F public bar Bassic. 오시는 길."
    }
  },
  "zh-hant": {
    home: {
      eyebrow: "福岡天神親不孝通的音樂酒吧",
      title: "public bar Bassic.",
      lead: "public bar Bassic. 位於福岡天神親不孝通，是初次來訪也容易走進的音樂、料理與酒吧空間。",
      titleMeta: "public bar Bassic. | 福岡天神音樂酒吧",
      description: "福岡天神 public bar Bassic. 提供音樂、料理、酒類與現場活動，初次來訪也能輕鬆享受。"
    },
    events: {
      eyebrow: "Event Schedule",
      title: "LIVE、DJ與活動行程。",
      lead: "可確認日期、開場/開演時間、費用與預約方式。活動日營業時間可能變動。",
      titleMeta: "活動 | 福岡天神LIVE與DJ酒吧",
      description: "public bar Bassic. 的LIVE、DJ活動、預約資訊與活動行程。"
    },
    menu: {
      eyebrow: "Food & Drink",
      title: "適合音樂夜晚的料理與酒。",
      lead: "來店前可確認人氣餐點、飲品與座位費資訊。",
      titleMeta: "菜單 | 料理、飲品與座位費",
      description: "public bar Bassic. 的料理、飲品、Fuzz Curry、Tacos與每人500日圓座位費。"
    },
    party: {
      eyebrow: "Party & Rental",
      title: "包場、二次會、LIVE後聚會。",
      lead: "可用於親不孝通的包場派對、二次會與空間租借。",
      titleMeta: "包場・派對 | 天神二次會與聚會",
      description: "public bar Bassic. 的包場、派對、LIVE後聚會與租借使用資訊。"
    },
    access: {
      eyebrow: "Access",
      title: "從天神站步行約4分鐘。",
      lead: "來店前可確認地址、Google Map、電話、信箱、營業時間與吸菸資訊。",
      titleMeta: "交通 | 從天神站步行約4分鐘",
      description: "public bar Bassic. 位於福岡市中央區天神3-4-19 WITH天神5F。"
    }
  },
  "zh-hans": {
    home: {
      eyebrow: "福冈天神亲不孝通的音乐酒吧",
      title: "public bar Bassic.",
      lead: "public bar Bassic. 位于福冈天神亲不孝通，是初次到访也容易走进的音乐、料理与酒吧空间。",
      titleMeta: "public bar Bassic. | 福冈天神音乐酒吧",
      description: "福冈天神 public bar Bassic. 提供音乐、料理、酒类与现场活动，初次到访也能轻松享受。"
    },
    events: {
      eyebrow: "Event Schedule",
      title: "LIVE、DJ与活动日程。",
      lead: "可查看日期、开场/开始时间、费用与预约方式。活动日营业时间可能变动。",
      titleMeta: "活动 | 福冈天神LIVE与DJ酒吧",
      description: "public bar Bassic. 的LIVE、DJ活动、预约信息与活动日程。"
    },
    menu: {
      eyebrow: "Food & Drink",
      title: "适合音乐夜晚的料理与酒。",
      lead: "到店前可查看人气餐点、饮品与座位费信息。",
      titleMeta: "菜单 | 料理、饮品与座位费",
      description: "public bar Bassic. 的料理、饮品、Fuzz Curry、Tacos与每人500日元座位费。"
    },
    party: {
      eyebrow: "Party & Rental",
      title: "包场、二次会、LIVE后聚会。",
      lead: "可用于亲不孝通的包场派对、二次会与空间租借。",
      titleMeta: "包场・派对 | 天神二次会与聚会",
      description: "public bar Bassic. 的包场、派对、LIVE后聚会与租借使用信息。"
    },
    access: {
      eyebrow: "Access",
      title: "从天神站步行约4分钟。",
      lead: "到店前可查看地址、Google Map、电话、邮箱、营业时间与吸烟信息。",
      titleMeta: "交通 | 从天神站步行约4分钟",
      description: "public bar Bassic. 位于福冈市中央区天神3-4-19 WITH天神5F。"
    }
  }
} as const;

export function isLocale(value: string): value is LocaleCode {
  return localeCodes.includes(value as LocaleCode);
}
