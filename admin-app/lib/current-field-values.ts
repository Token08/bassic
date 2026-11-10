import { editableMedia, editableSocialLinks } from "../../lib/editable-content";
import { fallbackContents } from "../../lib/fallback-data";
import { accessRouteTips, equipmentRentalInfo, firstVisitSection, localSearchSection, pageHeroes, socialUpdatesCopy, visitInfoItems } from "../../lib/page-content";
import { navItems, site } from "../../lib/site";

type Values = Record<string, unknown>;

function firstText(...values: unknown[]): string {
  return values.find((value): value is string => typeof value === "string" && Boolean(value.trim())) || "";
}

export function currentFieldDefaults(section: string, draft: Values, context?: Values): Values {
  const publishedHome = fallbackContents.home;
  const copy = (context?.copy || {}) as Values;
  const settings = (context?.settings || {}) as Values;
  if (section === "site-settings") {
    return {
      ...fallbackContents.siteSettings,
      email: site.email,
      directionsUrl: firstText(draft.googleMapsUrl, site.directionsUrl)
    };
  }
  if (section === "equipment-rental") {
    return { ...equipmentRentalInfo, pdfUrl: "/assets/pdf/equipment-rental-list.pdf" };
  }
  if (section === "page-copy") {
    const page = draft.page;
    if (page === "home") {
      return {
        heroEyebrow: site.tagline, heroTitle: publishedHome.heroTitle, heroLead: publishedHome.heroLead,
        introLead: publishedHome.firstVisitLead, accessNote: publishedHome.accessNote,
        socialTitleLine1: socialUpdatesCopy.titleLines[0], socialTitleLine2: socialUpdatesCopy.titleLines[1], socialLead: socialUpdatesCopy.lead
      };
    }
    const hero = pageHeroes[page as keyof typeof pageHeroes];
    return {
      heroEyebrow: hero?.eyebrow, heroTitle: hero?.title, heroLead: hero?.lead,
      ...(page === "access" ? { accessNote: publishedHome.accessNote } : {}),
      ...(page === "party" ? { rentalLead: equipmentRentalInfo.body } : {})
    };
  }
  if (section === "custom-sections") return { eyebrow: "Information" };
  if (section === "hero-slides") return { mobileImage: draft.image };
  if (section !== "home") return {};

  const heroTitle = firstText(copy.heroTitle, publishedHome.heroTitle);
  const defaults: Values = {
    ...publishedHome,
    heroEyebrow: site.tagline,
    homeHeroTitle: heroTitle,
    homeHeroLead: firstText(copy.heroLead, publishedHome.heroLead),
    heroMobileTitle: firstText(draft.homeHeroTitle, heroTitle),
    heroLogo: { url: "/assets/brand/index-logo.png", alt: site.name },
    heroMapLabel: "Google Mapで開く",
    heroCallLabel: "電話する",
    heroReserveLabel: "メール予約",
    firstVisitEyebrow: firstVisitSection.eyebrow,
    firstVisitTitle: firstVisitSection.title,
    firstVisitDescription: firstText(copy.introLead, publishedHome.firstVisitLead),
    visitInfoTitle: "初めての来店前に、知っておくと安心なこと。",
    visitInfoLead: "営業時間、テーブル・チャージ、喫煙可否、イベント日の営業について、来店前に迷いやすい情報をまとめました。",
    localSearchEyebrow: localSearchSection.eyebrow,
    localSearchTitle: localSearchSection.title,
    localSearchLead: localSearchSection.lead,
    socialEyebrow: "Social Updates",
    socialTitleLine1: firstText(copy.socialTitleLine1, socialUpdatesCopy.titleLines[0]),
    socialTitleLine2: firstText(copy.socialTitleLine2, socialUpdatesCopy.titleLines[1]),
    socialLead: firstText(copy.socialLead, socialUpdatesCopy.lead),
    socialInstagramButton: "Instagramで最新情報を見る",
    socialFacebookButton: "Facebookで最新情報を見る",
    socialXButton: "Xで最新情報を見る",
    socialInstagramDescription: "直近の写真、イベント告知、店内の空気感は公式Instagramで更新しています。",
    socialXDescription: "イベント告知や営業情報は公式Xでも更新しています。管理画面に投稿URLを登録すると、この欄にカード表示できます。",
    socialInstagramImage: { url: "/assets/brand/index-logo.png", alt: site.name },
    socialXImage: { url: "/assets/brand/b-logo-mark2.png", alt: site.name },
    homeAccessEyebrow: "Access",
    homeAccessTitle: "天神駅から徒歩約4分。\nGoogle Mapから迷わず来店。",
    homeAccessNote: firstText(copy.accessNote, publishedHome.accessNote),
    homeAccessAddressLabel: "住所",
    homeAccessPhoneLabel: "電話",
    homeAccessEmailLabel: "メール",
    homeAccessHoursLabel: "営業時間",
    homeAccessSmokingLabel: "喫煙",
    homeAccessEventsLabel: "イベントスケジュールページを見る",
    homeAccessDirectionsTitle: "Google Mapから来店する方へ",
    homeAccessDirectionsLabel: "現在地から向かう",
    homeAccessReserveLabel: "予約する",
    headerLogo: { url: "/assets/brand/b-logo-mark2.png", alt: site.name },
    headerBackground: { url: "/assets/brand/topbar.jpg" },
    footerBackground: { url: "/assets/brand/topbar.jpg" },
    footerStoreName: site.name,
    footerCopyright: `Copyright (C) 2009 - ${new Date().getFullYear()} bar Bassic. All Rights Reserved.`,
    mobileCallLabel: "電話",
    mobileMapLabel: "地図",
    mobileInstagramLabel: "Instagram",
    mobileReserveLabel: "予約"
  };
  for (const [index, feature] of firstVisitSection.features.entries()) {
    const prefix = "firstVisitCard" + (index + 1);
    const photo = editableMedia.atmosphereImages[index];
    defaults[prefix + "Title"] = feature.title;
    defaults[prefix + "Text"] = feature.text;
    defaults[prefix + "Image"] = { url: photo.src, alt: photo.alt };
  }
  const visitKeys = ["hoursLabel", "eventHoursNote", "smokingLabel", "chargeLabel"];
  for (const [index, item] of visitInfoItems.entries()) {
    const prefix = "visitInfoCard" + (index + 1);
    defaults[prefix + "Title"] = item.title;
    defaults[prefix + "Text"] = firstText(settings[visitKeys[index]], item.text);
  }
  for (const [index, item] of localSearchSection.cards.entries()) {
    const prefix = "localSearchCard" + (index + 1);
    defaults[prefix + "Title"] = item.title;
    defaults[prefix + "Text"] = item.text;
  }
  editableSocialLinks.forEach((link) => {
    defaults["social" + link.label + "Label"] = link.label;
    defaults["social" + link.label + "Account"] = link.account;
  });
  navItems.forEach((item, index) => { defaults["headerNav" + (index + 1) + "Label"] = item.label; });
  accessRouteTips.forEach((tip, index) => { defaults["homeAccessTip" + (index + 1)] = tip; });
  return defaults;
}
