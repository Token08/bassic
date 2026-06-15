import { createClient } from "microcms-js-sdk";
import { editableMedia } from "./editable-content";
import { fallbackContents } from "./fallback-data";
import { drinkMenuSheets, defaultMenuItems } from "./menu-data";
import { equipmentRentalInfo, pageHeroes, socialUpdatesCopy } from "./page-content";
import { site } from "./site";
import type {
  CmsContents,
  CustomSection,
  DrinkMenuSheet,
  EquipmentRental,
  EventItem,
  HeroSlide,
  HomeContent,
  ManagedPage,
  MenuItem,
  PageCopy,
  PageSection,
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
const managedPages: ManagedPage[] = ["home", "events", "menu", "party", "access"];

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

const fallbackPageCopy: CmsContents["pageCopy"] = {
  home: {
    page: "home",
    heroTitle: fallbackContents.home!.heroTitle,
    heroLead: fallbackContents.home!.heroLead,
    introLead: fallbackContents.home!.firstVisitLead,
    accessNote: fallbackContents.home!.accessNote,
    socialTitleLine1: socialUpdatesCopy.titleLines[0],
    socialTitleLine2: socialUpdatesCopy.titleLines[1],
    socialLead: socialUpdatesCopy.lead,
    isPublished: true
  },
  events: {
    page: "events",
    heroEyebrow: pageHeroes.events.eyebrow,
    heroTitle: pageHeroes.events.title,
    heroLead: pageHeroes.events.lead,
    isPublished: true
  },
  menu: {
    page: "menu",
    heroEyebrow: pageHeroes.menu.eyebrow,
    heroTitle: pageHeroes.menu.title,
    heroLead: pageHeroes.menu.lead,
    drinkLead: "",
    foodLead: "",
    isPublished: true
  },
  party: {
    page: "party",
    heroEyebrow: pageHeroes.party.eyebrow,
    heroTitle: pageHeroes.party.title,
    heroLead: pageHeroes.party.lead,
    partyLead: "",
    rentalLead: equipmentRentalInfo.body,
    isPublished: true
  },
  access: {
    page: "access",
    heroEyebrow: pageHeroes.access.eyebrow,
    heroTitle: pageHeroes.access.title,
    heroLead: pageHeroes.access.lead,
    accessNote: fallbackContents.home!.accessNote,
    isPublished: true
  }
};

const fallbackPageSections: CmsContents["pageSections"] = {
  home: [
    { page: "home", sectionKey: "hero", displayOrder: 1, isPublished: true },
    { page: "home", sectionKey: "firstVisit", displayOrder: 2, isPublished: true },
    { page: "home", sectionKey: "visitInfo", displayOrder: 3, isPublished: true },
    { page: "home", sectionKey: "localSearch", displayOrder: 4, isPublished: true },
    { page: "home", sectionKey: "social", displayOrder: 5, isPublished: true },
    { page: "home", sectionKey: "access", displayOrder: 6, isPublished: true }
  ],
  events: [
    { page: "events", sectionKey: "hero", displayOrder: 1, isPublished: true },
    { page: "events", sectionKey: "eventList", displayOrder: 2, isPublished: false },
    { page: "events", sectionKey: "calendar", displayOrder: 2, isPublished: true }
  ],
  menu: [
    { page: "menu", sectionKey: "hero", displayOrder: 1, isPublished: true },
    { page: "menu", sectionKey: "drinkSheets", displayOrder: 2, isPublished: true },
    { page: "menu", sectionKey: "foodMenu", displayOrder: 3, isPublished: true }
  ],
  party: [
    { page: "party", sectionKey: "hero", displayOrder: 1, isPublished: true },
    { page: "party", sectionKey: "plans", displayOrder: 2, isPublished: true },
    { page: "party", sectionKey: "equipmentRental", displayOrder: 3, isPublished: true },
    { page: "party", sectionKey: "useCases", displayOrder: 4, isPublished: true }
  ],
  access: [
    { page: "access", sectionKey: "hero", displayOrder: 1, isPublished: true },
    { page: "access", sectionKey: "accessInfo", displayOrder: 2, isPublished: true },
    { page: "access", sectionKey: "googleMap", displayOrder: 3, isPublished: true }
  ]
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
  const visibleItems = (menu || []).filter((item) => item.isPublished !== false);
  const fallbackItems = defaultMenuItems.filter((item) => item.isPublished !== false);

  if (!visibleItems.length) {
    return sortByDisplayOrder(fallbackItems);
  }

  const visibleFoods = visibleItems.filter((item) => item.category === "food");
  const fallbackFoods = fallbackItems.filter((item) => item.category === "food");

  if (visibleFoods.length >= fallbackFoods.length) {
    return sortByDisplayOrder(visibleItems);
  }

  // Keep the full food menu visible while CMS menu data is still being filled in.
  const visibleNonFoods = visibleItems.filter((item) => item.category !== "food");
  return sortByDisplayOrder([...visibleNonFoods, ...fallbackFoods]);
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

function pageCopyByPage(copies?: PageCopy[]): CmsContents["pageCopy"] {
  return managedPages.reduce((acc, page) => {
    const pageCopies = sortByDisplayOrder((copies || []).filter((copy) => copy.page === page && copy.isPublished !== false));
    acc[page] = {
      ...fallbackPageCopy[page],
      ...(pageCopies.at(-1) || {})
    };
    return acc;
  }, {} as CmsContents["pageCopy"]);
}

function pageSectionsByPage(sections?: PageSection[]): CmsContents["pageSections"] {
  return managedPages.reduce((acc, page) => {
    const overrides = (sections || []).filter((section) => section.page === page);
    const merged = fallbackPageSections[page].map((fallbackSection) => ({
      ...fallbackSection,
      ...(overrides.find((section) => section.sectionKey === fallbackSection.sectionKey) || {})
    }));
    const customKeys = new Set(fallbackPageSections[page].map((section) => section.sectionKey));
    const additionalSections = overrides.filter((section) => !customKeys.has(section.sectionKey));

    acc[page] = sortByDisplayOrder([...merged, ...additionalSections]).filter((section) => section.isPublished !== false);
    return acc;
  }, {} as CmsContents["pageSections"]);
}

function customSectionsByPage(sections?: CustomSection[]): CmsContents["customSections"] {
  return managedPages.reduce((acc, page) => {
    acc[page] = sortByDisplayOrder(
      (sections || []).filter((section) => section.page === page && section.isPublished !== false && (section.title || section.body))
    );
    return acc;
  }, {} as CmsContents["customSections"]);
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
    socialNotices: visibleSocialNotices(contents.socialNotices),
    pageCopy: pageCopyByPage(contents.pageCopy ? (Object.values(contents.pageCopy) as PageCopy[]) : undefined),
    pageSections: pageSectionsByPage(contents.pageSections ? (Object.values(contents.pageSections).flat() as PageSection[]) : undefined),
    customSections: customSectionsByPage(contents.customSections ? (Object.values(contents.customSections).flat() as CustomSection[]) : undefined)
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

  const [siteSettings, home, heroSlides, events, menu, drinkSheets, partyPlans, equipmentRental, socialNotices, pageCopy, pageSections, customSections] =
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
      }),
      getList<PageCopy>("page-copy", Object.values(fallbackPageCopy), {
        orders: "page,displayOrder",
        limit: 100
      }),
      getList<PageSection>("page-sections", Object.values(fallbackPageSections).flat(), {
        orders: "page,displayOrder",
        limit: 100
      }),
      getList<CustomSection>("custom-sections", [], {
        orders: "page,displayOrder",
        filters: "isPublished[equals]true",
        limit: 100
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
    socialNotices,
    pageCopy: pageCopyByPage(pageCopy),
    pageSections: pageSectionsByPage(pageSections),
    customSections: customSectionsByPage(customSections)
  });
}
