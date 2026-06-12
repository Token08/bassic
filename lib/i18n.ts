export const localeCodes = ["en", "ko", "zh-hant", "zh-hans"] as const;

export type LocaleCode = (typeof localeCodes)[number];
export type LocalizedPageKey = "home" | "events" | "menu" | "party" | "access";

export const languageOptions = [
  { code: "ja", label: "日本語", prefix: "" },
  { code: "en", label: "English", prefix: "/en" },
  { code: "ko", label: "한국어", prefix: "/ko" },
  { code: "zh-hant", label: "繁體中文", prefix: "/zh-hant" },
  { code: "zh-hans", label: "简体中文", prefix: "/zh-hans" }
] as const;

export const localizedLabels = {
  en: {
    language: "English",
    map: "Open Google Map",
    call: "Call",
    reserve: "Email reservation",
    hours: "Regular hours: 20:00 open / L.O. 1:30 / closes 2:00. On event days, regular bar time starts from 22:30.",
    eventHours: "Event hours may vary. After events, regular bar time starts from 22:30. Please check the event schedule.",
    charge: "Cover charge: 500 yen per person",
    smoking: "Smoking allowed: cigarettes and heated tobacco. Guests under 20 are not admitted. Some events may be non-smoking.",
    directions: "Get directions",
    menuLink: "View menu",
    address: "Address",
    phone: "Phone",
    email: "Email"
  },
  ko: {
    language: "한국어",
    map: "Google Map 열기",
    call: "전화하기",
    reserve: "메일 예약",
    hours: "일반 영업: 20:00 오픈 / L.O. 1:30 / 2:00 마감. 이벤트가 있는 날은 22:30부터 일반 바 타임입니다.",
    eventHours: "이벤트 당일은 영업 시간이 변동될 수 있습니다. 이벤트 종료 후 22:30부터 일반 바 타임입니다.",
    charge: "차지: 1인 500엔",
    smoking: "실내 흡연 가능: 종이담배・전자담배 가능. 미성년자는 입장할 수 없습니다. 이벤트에 따라 금연일 수 있습니다.",
    directions: "길찾기",
    menuLink: "메뉴 보기",
    address: "주소",
    phone: "전화",
    email: "메일"
  },
  "zh-hant": {
    language: "繁體中文",
    map: "開啟 Google Map",
    call: "撥打電話",
    reserve: "郵件預約",
    hours: "一般營業: 20:00 OPEN / L.O. 1:30 / 2:00 CLOSE。活動日一般酒吧時段為22:30開始。",
    eventHours: "活動日營業時間可能變動。活動結束後22:30開始一般酒吧時段，請確認活動行程頁面。",
    charge: "座位費: 每人500日圓",
    smoking: "店內可吸菸: 紙菸・電子菸皆可。未成年人不可入店。依活動內容，活動中可能禁菸。",
    directions: "現在位置導航",
    menuLink: "查看菜單",
    address: "地址",
    phone: "電話",
    email: "郵件"
  },
  "zh-hans": {
    language: "简体中文",
    map: "打开 Google Map",
    call: "拨打电话",
    reserve: "邮件预约",
    hours: "通常营业: 20:00 OPEN / L.O. 1:30 / 2:00 CLOSE。活动日通常酒吧时段为22:30开始。",
    eventHours: "活动日营业时间可能变动。活动结束后22:30开始通常酒吧时段，请查看活动日程页面。",
    charge: "座位费: 每人500日元",
    smoking: "店内可吸烟: 纸烟・电子烟均可。未成年人不可入店。根据活动内容，活动中可能禁烟。",
    directions: "当前位置导航",
    menuLink: "查看菜单",
    address: "地址",
    phone: "电话",
    email: "邮箱"
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
      lead: "public bar Bassic.은 후쿠오카 텐진 오야후코도리에 있는 뮤직 바입니다. 처음 방문해도 편하게 음악과 음식, 술을 즐길 수 있습니다.",
      titleMeta: "public bar Bassic. | 후쿠오카 텐진 뮤직 바",
      description: "후쿠오카 텐진의 public bar Bassic.에서 음악, 음식, 술, 라이브 이벤트를 편하게 즐겨 보세요."
    },
    events: {
      eyebrow: "Event Schedule",
      title: "라이브, DJ, 이벤트 일정.",
      lead: "날짜, 오픈/시작 시간, 요금, 예약 방법을 확인할 수 있습니다. 이벤트 당일은 영업 시간이 변동될 수 있습니다.",
      titleMeta: "이벤트 | 후쿠오카 텐진 라이브・DJ 바",
      description: "public bar Bassic.의 라이브, DJ 이벤트, 예약 정보와 이벤트 일정을 안내합니다."
    },
    menu: {
      eyebrow: "Food & Drink",
      title: "음악이 있는 밤에 어울리는 음식과 술.",
      lead: "방문 전 인기 메뉴, 음료, 차지 요금을 확인할 수 있습니다.",
      titleMeta: "메뉴 | 음식・음료・차지 요금",
      description: "public bar Bassic.의 음식과 음료 메뉴. Fuzz Curry, 타코스, 음료, 1인 500엔 차지를 안내합니다."
    },
    party: {
      eyebrow: "Party & Rental",
      title: "대관 파티와 2차 모임.",
      lead: "오야후코도리에서 음악과 음식을 함께 즐기는 대관 파티, 2차 모임, 렌털 이용이 가능합니다.",
      titleMeta: "파티・대관 | 텐진 프라이빗 이벤트",
      description: "public bar Bassic.의 대관 파티, 2차 모임, 렌털 이용 정보를 안내합니다."
    },
    access: {
      eyebrow: "Access",
      title: "텐진역에서 도보 약 4분.",
      lead: "방문 전 주소, Google Map, 전화, 메일, 영업 시간, 흡연 정보를 확인하세요.",
      titleMeta: "오시는 길 | 텐진역에서 도보 약 4분",
      description: "후쿠오카시 주오구 텐진 3-4-19 WITH 텐진 5F public bar Bassic. 오시는 길."
    }
  },
  "zh-hant": {
    home: {
      eyebrow: "福岡・天神 親不孝通的音樂酒吧",
      title: "public bar Bassic.",
      lead: "public bar Bassic. 是位於福岡・天神親不孝通的音樂酒吧。即使第一次來，也能輕鬆享受音樂、料理與飲品。",
      titleMeta: "public bar Bassic. | 福岡天神音樂酒吧",
      description: "在福岡天神 public bar Bassic. 享受音樂、料理、飲品與現場活動。"
    },
    events: {
      eyebrow: "Event Schedule",
      title: "LIVE、DJ、活動行程。",
      lead: "可確認日期、開場/開始時間、費用與預約方式。活動日營業時間可能變動。",
      titleMeta: "活動 | 福岡天神LIVE・DJ酒吧",
      description: "public bar Bassic. 的LIVE、DJ活動、預約資訊與活動行程。"
    },
    menu: {
      eyebrow: "Food & Drink",
      title: "適合音樂夜晚的料理與飲品。",
      lead: "來店前可確認人氣料理、飲品與座位費資訊。",
      titleMeta: "菜單 | 料理・飲品・座位費",
      description: "public bar Bassic. 的料理與飲品菜單，包含Fuzz Curry、Tacos與每人500日圓座位費。"
    },
    party: {
      eyebrow: "Party & Rental",
      title: "包場派對與二次會。",
      lead: "可用於親不孝通的包場派對、二次會與空間租借。",
      titleMeta: "包場・派對 | 天神私人活動",
      description: "public bar Bassic. 的包場、派對、二次會與租借使用資訊。"
    },
    access: {
      eyebrow: "Access",
      title: "從天神站步行約4分鐘。",
      lead: "來店前可確認地址、Google Map、電話、郵件、營業時間與吸菸資訊。",
      titleMeta: "交通 | 從天神站步行約4分鐘",
      description: "public bar Bassic. 位於福岡市中央區天神3-4-19 WITH天神5F。"
    }
  },
  "zh-hans": {
    home: {
      eyebrow: "福冈・天神 亲不孝通的音乐酒吧",
      title: "public bar Bassic.",
      lead: "public bar Bassic. 是位于福冈・天神亲不孝通的音乐酒吧。即使第一次到访，也可以轻松享受音乐、料理和饮品。",
      titleMeta: "public bar Bassic. | 福冈天神音乐酒吧",
      description: "在福冈天神 public bar Bassic. 享受音乐、料理、饮品和现场活动。"
    },
    events: {
      eyebrow: "Event Schedule",
      title: "LIVE、DJ、活动日程。",
      lead: "可查看日期、开场/开始时间、费用和预约方式。活动日营业时间可能变动。",
      titleMeta: "活动 | 福冈天神LIVE・DJ酒吧",
      description: "public bar Bassic. 的LIVE、DJ活动、预约信息和活动日程。"
    },
    menu: {
      eyebrow: "Food & Drink",
      title: "适合音乐夜晚的料理和饮品。",
      lead: "到店前可查看人气料理、饮品和座位费信息。",
      titleMeta: "菜单 | 料理・饮品・座位费",
      description: "public bar Bassic. 的料理和饮品菜单，包含Fuzz Curry、Tacos和每人500日元座位费。"
    },
    party: {
      eyebrow: "Party & Rental",
      title: "包场派对和二次会。",
      lead: "可用于亲不孝通的包场派对、二次会和空间租借。",
      titleMeta: "包场・派对 | 天神私人活动",
      description: "public bar Bassic. 的包场、派对、二次会和租借使用信息。"
    },
    access: {
      eyebrow: "Access",
      title: "从天神站步行约4分钟。",
      lead: "到店前可查看地址、Google Map、电话、邮件、营业时间和吸烟信息。",
      titleMeta: "交通 | 从天神站步行约4分钟",
      description: "public bar Bassic. 位于福冈市中央区天神3-4-19 WITH天神5F。"
    }
  }
} as const;

export function isLocale(value: string): value is LocaleCode {
  return localeCodes.includes(value as LocaleCode);
}
