import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Music2,
  Navigation,
  Store,
  UsersRound
} from "lucide-react";
import { PageHero } from "@/components/content";
import { SocialUpdates } from "@/components/social-updates";
import { VisitInfoGrid, type VisitInfoGridItem } from "@/components/visit-info";
import { editableMedia } from "@/lib/editable-content";
import { type LocaleCode, type LocalizedPageKey, localizedLabels, localizedPages } from "@/lib/i18n";
import { localizedPageImages } from "@/lib/page-content";
import { mailHref, site } from "@/lib/site";

const eventScheduleLinkLabels: Record<LocaleCode, string> = {
  en: "View event schedule",
  ko: "이벤트 일정 보기",
  "zh-hant": "查看活動日程",
  "zh-hans": "查看活动日程"
};

const localeCopy = {
  en: {
    firstVisitTitle: "High ceilings, soft light, and a comfortable night.",
    firstVisitLead:
      "Come alone, before or after a live show, or for an evening of easy conversation. On days without live events, Bassic. is open as a relaxed regular bar.",
    features: [
      ["A little room for music in Tenjin.", "Enjoy the afterglow of live shows, DJ nights, and events at your own pace."],
      ["Food-only and non-alcoholic visits are welcome.", "Fuzz Curry, tacos and potatoes, homemade sangria, and coffee shochu are popular choices."],
      ["For solo visits or groups.", "Use Bassic. for a quick drink, meeting up, or private parties."]
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
      ["텐진의 밤에 음악이라는 여백을.", "라이브, DJ, 이벤트의 여운까지 각자의 속도로 즐기실 수 있습니다."],
      ["논알코올도, 식사만도 환영합니다.", "명물 Fuzz Curry, 타코스와 포테이토, 홈메이드 상그리아와 커피 소주도 인기입니다."],
      ["혼자서도, 그룹으로도.", "가볍게 한 잔, 약속 장소, 대관 파티까지 용도에 맞게 이용하실 수 있습니다."]
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
      ["在天神的夜晚，留一點音樂的餘韻。", "LIVE、DJ、活動後的氣氛，都能依照自己的節奏享受。"],
      ["不喝酒、只用餐也歡迎。", "招牌 Fuzz Curry、Tacos & Potato、自家製 Sangria 與咖啡燒酎都很受歡迎。"],
      ["一個人或團體都可以。", "可用於小酌、會合、包場派對等不同用途。"]
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
      ["在天神的夜晚，留一点音乐的余韵。", "LIVE、DJ、活动后的气氛，都能按照自己的节奏享受。"],
      ["不喝酒、只用餐也欢迎。", "招牌 Fuzz Curry、Tacos & Potato、自制 Sangria 与咖啡烧酒都很受欢迎。"],
      ["一个人或团体都可以。", "可用于小酌、会合、包场派对等不同用途。"]
    ],
    socialTitle: "最新信息请看官方 SNS。",
    socialLead: "可在 Instagram、Facebook、X 查看活动、营业信息与店内氛围。",
    menuTitle: "料理和饮品，可先通过照片确认。",
    menuLead: "Fuzz Curry、Tacos、Cocktails 等详细内容请查看菜单页。",
    accessTitle: "从天神站步行约 4 分钟。使用 Google Map 不易迷路。",
    accessLead: "请上到 WITH 天神 5F。活动日的普通酒吧营业时间可能有所变动。"
  }
} as const;

const visitInfoTitles: Record<LocaleCode, { hours: string; events: string; smoking: string; charge: string; aria: string }> = {
  en: { hours: "Regular hours", events: "Event hours", smoking: "Smoking", charge: "Charge", aria: "Visit information" },
  ko: { hours: "일반 영업", events: "이벤트 영업", smoking: "흡연", charge: "차지", aria: "방문 정보" },
  "zh-hant": { hours: "一般營業", events: "活動營業", smoking: "吸菸", charge: "座席費", aria: "來店資訊" },
  "zh-hans": { hours: "普通营业", events: "活动营业", smoking: "吸烟", charge: "座位费", aria: "到店信息" }
};

const pageEyebrow: Record<LocaleCode, string> = {
  en: "English",
  ko: "한국어",
  "zh-hant": "繁體中文",
  "zh-hans": "简体中文"
};

function localizedHref(locale: LocaleCode, href: string) {
  if (/^https?:\/\//.test(href)) {
    return href;
  }

  const normalized = href === "/" ? "" : href.replace(/\/$/, "");
  return `/${locale}${normalized}/`;
}

function LocalizedVisitInfoCards({ locale, labels }: { locale: LocaleCode; labels: (typeof localizedLabels)[LocaleCode] }) {
  const titles = visitInfoTitles[locale];
  const items: VisitInfoGridItem[] = [
    { icon: "clock", title: titles.hours, text: labels.hours },
    { icon: "calendar", title: titles.events, text: labels.eventHours },
    { icon: "smoking", title: titles.smoking, text: labels.smoking },
    { icon: "charge", title: titles.charge, text: labels.charge }
  ];

  return <VisitInfoGrid ariaLabel={titles.aria} items={items} />;
}

function LocalizedFirstVisit({ locale }: { locale: LocaleCode }) {
  const copy = localeCopy[locale];
  const icons = [<Music2 key="music" />, <Store key="store" />, <UsersRound key="users" />];

  return (
    <section className="section intro intro-light">
      <div className="section-heading narrow-copy">
        <p className="eyebrow">First Visit</p>
        <h2>{copy.firstVisitTitle}</h2>
      </div>
      <p className="section-lead narrow-copy">{copy.firstVisitLead}</p>
      <div className="feature-grid">
        {copy.features.map(([title, text], index) => (
          <article key={title}>
            {icons[index]}
            <h3>{title}</h3>
            <p>{text}</p>
            <figure className="feature-photo">
              <Image src={editableMedia.atmosphereImages[index].src} alt={editableMedia.atmosphereImages[index].alt} fill sizes="(max-width: 900px) 100vw, 33vw" />
            </figure>
          </article>
        ))}
      </div>
    </section>
  );
}

function LocalizedSocialIntro({ locale }: { locale: LocaleCode }) {
  const copy = localeCopy[locale];

  return (
    <SocialUpdates title={copy.socialTitle} lead={copy.socialLead} instagramFallbackLabel="Instagram" xFallbackLabel="X" />
  );
}

function LocalizedMenuTeaser({ locale }: { locale: LocaleCode }) {
  const copy = localeCopy[locale];

  return (
    <section className="section home-menu-teaser">
      <div className="section-heading narrow-copy">
        <p className="eyebrow">Food & Drink</p>
        <h2>{copy.menuTitle}</h2>
        <p className="section-lead">{copy.menuLead}</p>
        <Link className="text-link" href={localizedHref(locale, "/menu")}>
          {localizedLabels[locale].menuLink} <ArrowRight size={16} />
        </Link>
      </div>
      <figure className="wide-photo">
        <Image src={editableMedia.foodTeaser.src} alt={editableMedia.foodTeaser.alt} fill sizes="100vw" />
      </figure>
    </section>
  );
}

function LocalizedAccessPreview({ locale }: { locale: LocaleCode }) {
  const labels = localizedLabels[locale];
  const copy = localeCopy[locale];
  const titles = visitInfoTitles[locale];

  return (
    <section className="section access-section">
      <div className="access-copy narrow-copy">
        <p className="eyebrow">Access</p>
        <h2>{copy.accessTitle}</h2>
        <p>{copy.accessLead}</p>
        <dl className="access-list">
          <dt>{labels.address}</dt>
          <dd>{site.address}</dd>
          <dt>{labels.phone}</dt>
          <dd>{site.phone}</dd>
          <dt>{labels.email}</dt>
          <dd>{site.email}</dd>
          <dt>{titles.hours}</dt>
          <dd>
            {labels.hours}
            <br />
            {labels.eventHours}
            <br />
            <Link className="inline-access-link" href={`/${locale}/events/`}>
              {eventScheduleLinkLabels[locale]}
            </Link>
          </dd>
          <dt>{titles.smoking}</dt>
          <dd>{labels.smoking}</dd>
        </dl>
        <div className="hero-actions">
          <a className="button primary" href={site.directionsUrl} target="_blank" rel="noreferrer">
            <Navigation size={18} />
            {labels.directions}
          </a>
          <a className="button" href={mailHref("Bassic. reservation")}>
            <CalendarDays size={18} />
            {labels.reserve}
          </a>
        </div>
      </div>
      <iframe
        title="public bar Bassic. Google Map"
        className="map"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        src="https://www.google.com/maps?q=public%20bar%20Bassic.%20福岡市中央区天神3-4-19%20WITH天神5F&output=embed"
      />
    </section>
  );
}

function LocalizedHomePage({ locale }: { locale: LocaleCode }) {
  const page = localizedPages[locale].home;
  const labels = localizedLabels[locale];

  return (
    <>
      <PageHero
        eyebrow={page.eyebrow}
        title={page.title}
        lead={page.lead}
        image={editableMedia.homeHeroImage.src}
        imageAlt={page.title}
        slides={editableMedia.homeHeroSlides}
        className="home-hero"
        actionLabels={{ mapLabel: labels.map, callLabel: labels.call, reserveLabel: labels.reserve }}
      />
      <LocalizedFirstVisit locale={locale} />
      <LocalizedVisitInfoCards locale={locale} labels={labels} />
      <LocalizedSocialIntro locale={locale} />
      <LocalizedMenuTeaser locale={locale} />
      <LocalizedAccessPreview locale={locale} />
    </>
  );
}

export function LocalizedPage({ locale, pageKey }: { locale: LocaleCode; pageKey: LocalizedPageKey }) {
  if (pageKey === "home") {
    return <LocalizedHomePage locale={locale} />;
  }

  const page = localizedPages[locale][pageKey];
  const labels = localizedLabels[locale];

  return (
    <>
      <PageHero
        eyebrow={page.eyebrow}
        title={page.title}
        lead={page.lead}
        image={localizedPageImages[pageKey]}
        imageAlt={page.title}
        className={`localized-hero localized-${pageKey}-hero`}
        actionLabels={{ mapLabel: labels.map, callLabel: labels.call, reserveLabel: labels.reserve }}
      />
      <section className="section intro intro-light localized-section">
        <div className="section-heading narrow-copy">
          <p className="eyebrow">{pageEyebrow[locale]}</p>
          <h2>{page.title}</h2>
          <p className="section-lead">{page.lead}</p>
        </div>
      </section>
      <LocalizedVisitInfoCards locale={locale} labels={labels} />
      {pageKey === "menu" ? <LocalizedMenuTeaser locale={locale} /> : null}
      {pageKey === "events" ? <LocalizedSocialIntro locale={locale} /> : null}
      {pageKey === "party" ? <LocalizedFirstVisit locale={locale} /> : null}
      {pageKey === "access" ? <LocalizedAccessPreview locale={locale} /> : null}
    </>
  );
}
