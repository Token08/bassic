import { createClient } from "microcms-js-sdk";
import { editableMedia } from "./editable-content";
import { fallbackContents } from "./fallback-data";
import { drinkMenuSheets, defaultMenuItems } from "./menu-data";
import { equipmentRentalInfo } from "./page-content";
import { site } from "./site";
import type {
  CmsContents,
  DrinkMenuSheet,
  EquipmentRental,
  EventItem,
  HeroSlide,
  HomeContent,
  MenuItem,
  PartyPlan,
  SiteSettings,
  SocialNotice
} from "./types";

const serviceDomain = process.env.MICROCMS_SERVICE_DOMAIN;
const apiKey = process.env.MICROCMS_API_KEY;

const client =
  serviceDomain && apiKey
    ? createClient({
        serviceDomain,
        apiKey
      })
    : null;

type MicroCmsList<T> = {
  contents: T[];
};

const heroPages: HeroSlide["page"][] = ["home", "events", "party", "menu", "access"];

const fallbackSiteSettings: SiteSettings = {
  address: site.address,
  phone: site.phone,
  hoursLabel: site.hoursLabel,
  eventHoursNote: site.eventHoursNote,
  smokingLabel: site.smokingLabel,
  chargeLabel: site.chargeLabel,
  googleMapsUrl: site.googleMapsUrl,
  directionsUrl: site.directionsUrl,
  instagramUrl: site.instagramUrl,
  facebookUrl: site.facebookUrl,
  xUrl: site.xUrl,
  onlineStoreUrl: site.onlineStoreUrl
};

const fallbackEquipmentRental: EquipmentRental = {
  title: equipmentRentalInfo.title,
  price: equipmentRentalInfo.price,
  body: equipmentRentalInfo.body,
  pdfUrl: "/assets/pdf/equipment-rental-list.pdf"
};

const fallbackHeroSlides: CmsContents["heroSlides"] = {
  home: editableMedia.homeHeroSlides.map((slide) => ({ page: "home", image: { url: slide.src, alt: slide.alt }, isPublished: true })),
  events: editableMedia.eventHeroSlides.map((slide) => ({ page: "events", image: { url: slide.src, alt: slide.alt }, isPublished: true })),
  party: editableMedia.partyHeroSlides.map((slide) => ({ page: "party", image: { url: slide.src, alt: slide.alt }, isPublished: true })),
  menu: [{ page: "menu", image: { url: editableMedia.pageHeroImages.menu.src, alt: editableMedia.pageHeroImages.menu.alt }, isPublished: true }],
  access: [{ page: "access", image: { url: editableMedia.pageHeroImages.access.src, alt: editableMedia.pageHeroImages.access.alt }, isPublished: true }]
};

function sortByDisplayOrder<T extends { displayOrder?: number }>(items: T[]) {
  return [...items].sort((a, b) => (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999));
}

function mergeHomeContent(home?: Partial<HomeContent> | null): HomeContent {
  return {
    ...fallbackContents.home!,
    ...home
  };
}

function mergeSiteSettings(settings?: Partial<SiteSettings> | null): SiteSettings {
  return {
    ...fallbackSiteSettings,
    ...settings,
    directionsUrl: settings?.directionsUrl || settings?.googleMapsUrl || fallbackSiteSettings.directionsUrl
  };
}

function visibleEvents(events?: EventItem[]) {
  return (events?.length ? events : fallbackContents.events!)
    .filter((event) => event.isPublished)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function withFallbackList<T>(items: T[] | undefined, fallback: T[]) {
  return items?.length ? items : fallback;
}

function visibleMenu(menu?: MenuItem[]) {
  return sortByDisplayOrder(withFallbackList(menu, defaultMenuItems)).filter((item) => item.isPublished !== false);
}

function visiblePartyPlans(plans?: PartyPlan[]) {
  return sortByDisplayOrder(withFallbackList(plans, fallbackContents.partyPlans as PartyPlan[])).filter(
    (plan) => plan.isPublished !== false
  );
}

function visibleDrinkMenuSheets(sheets?: DrinkMenuSheet[]) {
  const fallbackSheets = drinkMenuSheets.map((sheet, index) => ({
    title: sheet.title,
    src: sheet.src,
    displayOrder: index + 1,
    isPublished: true
  }));

  return sortByDisplayOrder(withFallbackList(sheets, fallbackSheets)).filter((sheet) => sheet.isPublished !== false);
}

function visibleSocialNotices(notices?: SocialNotice[]) {
  return (notices?.length ? notices : (fallbackContents.socialNotices as SocialNotice[]))
    .filter((notice) => notice.isPublished && notice.title && notice.url)
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

function heroSlidesByPage(slides?: HeroSlide[]): CmsContents["heroSlides"] {
  const visibleSlides = (slides || []).filter((slide) => slide.isPublished !== false && slide.image?.url);

  return heroPages.reduce((acc, page) => {
    const pageSlides = sortByDisplayOrder(visibleSlides.filter((slide) => slide.page === page));
    acc[page] = pageSlides.length ? pageSlides : fallbackHeroSlides[page];
    return acc;
  }, {} as CmsContents["heroSlides"]);
}

function normalizeContents(contents: Partial<CmsContents>): CmsContents {
  return {
    siteSettings: mergeSiteSettings(contents.siteSettings),
    home: mergeHomeContent(contents.home),
    heroSlides: heroSlidesByPage(contents.heroSlides ? (Object.values(contents.heroSlides).flat() as HeroSlide[]) : undefined),
    events: visibleEvents(contents.events),
    menu: visibleMenu(contents.menu),
    drinkMenuSheets: visibleDrinkMenuSheets(contents.drinkMenuSheets),
    partyPlans: visiblePartyPlans(contents.partyPlans),
    equipmentRental: {
      ...fallbackEquipmentRental,
      ...contents.equipmentRental
    },
    socialNotices: visibleSocialNotices(contents.socialNotices)
  };
}

export async function getCmsContents(): Promise<CmsContents> {
  if (!client) {
    return normalizeContents(fallbackContents);
  }

  const getObject = async <T>(endpoint: string, fallback: T): Promise<T> => {
    try {
      return await client.get<T>({ endpoint });
    } catch (error) {
      console.warn(`microCMS ${endpoint} fetch failed. Falling back to local content.`, error);
      return fallback;
    }
  };

  const getList = async <T>(endpoint: string, fallback: T[], queries = {}): Promise<T[]> => {
    try {
      const response = await client.get<MicroCmsList<T>>({ endpoint, queries });
      return response.contents;
    } catch (error) {
      console.warn(`microCMS ${endpoint} fetch failed. Falling back to local content.`, error);
      return fallback;
    }
  };

  const [siteSettings, home, heroSlides, events, menu, drinkSheets, partyPlans, equipmentRental, socialNotices] =
    await Promise.all([
      getObject<SiteSettings>("site-settings", fallbackSiteSettings),
      getObject<HomeContent>("home", fallbackContents.home!),
      getList<HeroSlide>("hero-slides", Object.values(fallbackHeroSlides).flat(), {
        orders: "displayOrder",
        filters: "isPublished[equals]true",
        limit: 100
      }),
      getList<EventItem>("events", fallbackContents.events!, {
        orders: "date",
        filters: "isPublished[equals]true",
        limit: 20
      }),
      getList<MenuItem>("menu", defaultMenuItems, { orders: "displayOrder", limit: 100 }),
      getList<DrinkMenuSheet>("drink-menu-sheets", [], {
        orders: "displayOrder",
        filters: "isPublished[equals]true",
        limit: 20
      }),
      getList<PartyPlan>("party-plans", fallbackContents.partyPlans as PartyPlan[], {
        orders: "displayOrder",
        filters: "isPublished[equals]true",
        limit: 20
      }),
      getObject<EquipmentRental>("equipment-rental", fallbackEquipmentRental),
      getList<SocialNotice>("social-notices", fallbackContents.socialNotices as SocialNotice[], {
        orders: "-date",
        filters: "isPublished[equals]true",
        limit: 12
      })
    ]);

  return normalizeContents({
    siteSettings,
    home,
    heroSlides: heroSlidesByPage(heroSlides),
    events,
    menu,
    drinkMenuSheets: drinkSheets,
    partyPlans,
    equipmentRental,
    socialNotices
  });
}
