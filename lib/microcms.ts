import { createClient } from "microcms-js-sdk";
import { fallbackContents } from "./fallback-data";
import { defaultMenuItems } from "./menu-data";
import type { CmsContents, EventItem, HomeContent, MenuItem, PartyPlan, SocialNotice } from "./types";

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

function mergeHomeContent(home?: Partial<HomeContent> | null): HomeContent {
  return {
    ...fallbackContents.home,
    ...home
  };
}

function visibleEvents(events?: EventItem[]) {
  return (events?.length ? events : fallbackContents.events)
    .filter((event) => event.isPublished)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function withFallbackList<T>(items: T[] | undefined, fallback: T[]) {
  return items?.length ? items : fallback;
}

function visibleSocialNotices(notices?: SocialNotice[]) {
  return (notices?.length ? notices : fallbackContents.socialNotices)
    .filter((notice) => notice.isPublished && notice.title && notice.url)
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

function normalizeContents(contents: Partial<CmsContents>): CmsContents {
  return {
    home: mergeHomeContent(contents.home),
    events: visibleEvents(contents.events),
    menu: withFallbackList(contents.menu, fallbackContents.menu),
    partyPlans: withFallbackList(contents.partyPlans, fallbackContents.partyPlans),
    socialNotices: visibleSocialNotices(contents.socialNotices)
  };
}

export async function getCmsContents(): Promise<CmsContents> {
  if (!client) {
    return {
      ...normalizeContents(fallbackContents),
      menu: defaultMenuItems
    };
  }

  try {
    const socialNoticesRequest = client
      .get<MicroCmsList<SocialNotice>>({
        endpoint: "social-notices",
        queries: { orders: "-date", filters: "isPublished[equals]true", limit: 12 }
      })
      .catch((error) => {
        console.warn("microCMS social-notices fetch failed. Falling back to local social notice cards.", error);
        return { contents: fallbackContents.socialNotices };
      });

    const [home, events, menu, partyPlans, socialNotices] = await Promise.all([
      client.get<HomeContent>({ endpoint: "home" }),
      client.get<MicroCmsList<EventItem>>({
        endpoint: "events",
        queries: { orders: "date", filters: "isPublished[equals]true", limit: 20 }
      }),
      client.get<MicroCmsList<MenuItem>>({ endpoint: "menu", queries: { limit: 100 } }),
      client.get<MicroCmsList<PartyPlan>>({ endpoint: "party-plans", queries: { limit: 20 } }),
      socialNoticesRequest
    ]);

    return normalizeContents({
      home,
      events: events.contents,
      menu: menu.contents,
      partyPlans: partyPlans.contents,
      socialNotices: socialNotices.contents
    });
  } catch (error) {
    console.error("microCMS fetch failed. Falling back to local content.", error);
    return {
      ...normalizeContents(fallbackContents),
      menu: defaultMenuItems
    };
  }
}
