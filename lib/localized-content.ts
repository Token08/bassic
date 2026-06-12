import type { FeatureCardContent } from "./page-content";
import type { LocaleCode } from "./i18n";

export type LocalizedVisitInfoTitles = {
  hours: string;
  events: string;
  smoking: string;
  charge: string;
  aria: string;
};

export type LocalizedHomeSections = {
  firstVisitTitle: string;
  firstVisitLead: string;
  features: readonly FeatureCardContent[];
  socialTitle: string;
  socialLead: string;
  menuTitle: string;
  menuLead: string;
  accessTitle: string;
  accessLead: string;
};

export const eventScheduleLinkLabels: Record<LocaleCode, string> = {
  en: "View event schedule",
  ko: "이벤트 일정 보기",
  "zh-hant": "查看活動日程",
  "zh-hans": "查看活动日程"
};

export const localizedHomeSections: Record<LocaleCode, LocalizedHomeSections> = {
  en: {
    firstVisitTitle: "High ceilings, soft light, and a comfortable night.",
    firstVisitLead:
      "Come alone, before or after a live show, or for an evening of easy conversation. On days without live events, Bassic. is open as a relaxed regular bar.",
    features: [
      { icon: "music", title: "A little room for music in Tenjin.", text: "Enjoy the afterglow of live shows, DJ nights, and events at your own pace." },
      {
        icon: "store",
        title: "Food-only and non-alcoholic visits are welcome.",
        text: "Fuzz Curry, tacos and potatoes, homemade sangria, and coffee shochu are popular choices."
      },
      { icon: "users", title: "For solo visits or groups.", text: "Use Bassic. for a quick drink, meeting up, or private parties." }
    ],
    socialTitle: "Latest updates are on official SNS.",
    socialLead: "Check Instagram, Facebook, and X for events, opening updates, and the atmosphere of the bar.",
    menuTitle: "Food and drinks, visible before you visit.",
    menuLead: "Fuzz Curry, tacos, cocktails, and more. See the menu page for details.",
    accessTitle: "4 minutes from Tenjin Station. Arrive easily with Google Map.",
    accessLead: "Go up to WITH Tenjin 5F. Event days may have different regular bar hours."
  },
  ko: {
    firstVisitTitle: "높은 천장과 부드러운 조명, 편안한 밤.",
    firstVisitLead:
      "혼자 오셔도, 라이브 전후에도, 편하게 대화를 나누고 싶은 밤에도 좋습니다. 라이브 이벤트가 없는 날은 일반 바 타임으로 여유롭게 이용하실 수 있습니다.",
    features: [
      { icon: "music", title: "텐진의 밤에 음악이라는 여백을.", text: "라이브, DJ, 이벤트의 여운까지 각자의 속도로 즐기실 수 있습니다." },
      {
        icon: "store",
        title: "논알코올도, 식사만도 환영합니다.",
        text: "명물 Fuzz Curry, 타코스와 포테이토, 홈메이드 상그리아와 커피 소주도 인기입니다."
      },
      { icon: "users", title: "혼자서도, 그룹으로도.", text: "가볍게 한 잔, 약속 장소, 대관 파티까지 용도에 맞게 이용하실 수 있습니다." }
    ],
    socialTitle: "최신 정보는 공식 SNS에서.",
    socialLead: "Instagram, Facebook, X에서 이벤트, 영업 정보, 매장 분위기를 확인하실 수 있습니다.",
    menuTitle: "음식과 음료를 사진으로 먼저 확인하세요.",
    menuLead: "Fuzz Curry, 타코스, 칵테일 등 자세한 내용은 메뉴 페이지에서 확인하실 수 있습니다.",
    accessTitle: "텐진역에서 도보 약 4분. Google Map으로 쉽게 오세요.",
    accessLead: "WITH 텐진 빌딩 5층으로 올라와 주세요. 이벤트 날에는 일반 바 타임이 달라질 수 있습니다."
  },
  "zh-hant": {
    firstVisitTitle: "挑高天花與柔和燈光，讓夜晚慢慢展開。",
    firstVisitLead:
      "一個人來、LIVE 前後，或只是想輕鬆聊天的夜晚都很適合。沒有 LIVE 活動的日子，也可作為一般酒吧時段悠閒使用。",
    features: [
      { icon: "music", title: "在天神的夜晚，留一點音樂的餘韻。", text: "LIVE、DJ、活動後的氣氛，都能依照自己的節奏享受。" },
      { icon: "store", title: "不喝酒、只用餐也歡迎。", text: "招牌 Fuzz Curry、Tacos & Potato、自家製 Sangria 與咖啡燒酎都很受歡迎。" },
      { icon: "users", title: "一個人或團體都可以。", text: "可用於小酌、會合、包場派對等不同用途。" }
    ],
    socialTitle: "最新資訊請看官方 SNS。",
    socialLead: "可在 Instagram、Facebook、X 查看活動、營業資訊與店內氣氛。",
    menuTitle: "料理與飲品，可先透過照片確認。",
    menuLead: "Fuzz Curry、Tacos、Cocktails 等詳細內容請查看菜單頁。",
    accessTitle: "從天神站步行約 4 分鐘。使用 Google Map 不易迷路。",
    accessLead: "請上到 WITH 天神 5F。活動日的一般酒吧營業時間可能有所變動。"
  },
  "zh-hans": {
    firstVisitTitle: "高挑天花与柔和灯光，让夜晚慢慢展开。",
    firstVisitLead:
      "一个人来、LIVE 前后，或只是想轻松聊天的夜晚都很适合。没有 LIVE 活动的日子，也可作为普通酒吧时段悠闲使用。",
    features: [
      { icon: "music", title: "在天神的夜晚，留一点音乐的余韵。", text: "LIVE、DJ、活动后的气氛，都能按照自己的节奏享受。" },
      { icon: "store", title: "不喝酒、只用餐也欢迎。", text: "招牌 Fuzz Curry、Tacos & Potato、自制 Sangria 与咖啡烧酒都很受欢迎。" },
      { icon: "users", title: "一个人或团体都可以。", text: "可用于小酌、会合、包场派对等不同用途。" }
    ],
    socialTitle: "最新信息请看官方 SNS。",
    socialLead: "可在 Instagram、Facebook、X 查看活动、营业信息与店内氛围。",
    menuTitle: "料理和饮品，可先通过照片确认。",
    menuLead: "Fuzz Curry、Tacos、Cocktails 等详细内容请查看菜单页。",
    accessTitle: "从天神站步行约 4 分钟。使用 Google Map 不易迷路。",
    accessLead: "请上到 WITH 天神 5F。活动日的普通酒吧营业时间可能有所变动。"
  }
};

export const localizedVisitInfoTitles: Record<LocaleCode, LocalizedVisitInfoTitles> = {
  en: { hours: "Regular hours", events: "Event hours", smoking: "Smoking", charge: "Charge", aria: "Visit information" },
  ko: { hours: "일반 영업", events: "이벤트 영업", smoking: "흡연", charge: "차지", aria: "방문 정보" },
  "zh-hant": { hours: "一般營業", events: "活動營業", smoking: "吸菸", charge: "座席費", aria: "來店資訊" },
  "zh-hans": { hours: "普通营业", events: "活动营业", smoking: "吸烟", charge: "座位费", aria: "到店信息" }
};

export const localizedPageEyebrow: Record<LocaleCode, string> = {
  en: "English",
  ko: "한국어",
  "zh-hant": "繁體中文",
  "zh-hans": "简体中文"
};
