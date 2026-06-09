import { createClient } from "microcms-js-sdk";
import { fallbackContents } from "./fallback-data";
import type { CmsContents, EventItem, HomeContent, MenuItem, PartyPlan } from "./types";

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

export async function getCmsContents(): Promise<CmsContents> {
  if (!client) {
    return fallbackContents;
  }

  try {
    const [home, events, menu, partyPlans] = await Promise.all([
      client.get<HomeContent>({ endpoint: "home" }),
      client.get<MicroCmsList<EventItem>>({
        endpoint: "events",
        queries: { orders: "date", filters: "isPublished[equals]true", limit: 20 }
      }),
      client.get<MicroCmsList<MenuItem>>({ endpoint: "menu", queries: { limit: 100 } }),
      client.get<MicroCmsList<PartyPlan>>({ endpoint: "party-plans", queries: { limit: 20 } })
    ]);

    return {
      home: home || fallbackContents.home,
      events: events.contents.length ? events.contents : fallbackContents.events,
      menu: menu.contents.length ? menu.contents : fallbackContents.menu,
      partyPlans: partyPlans.contents.length ? partyPlans.contents : fallbackContents.partyPlans
    };
  } catch (error) {
    console.error("microCMS fetch failed. Falling back to local content.", error);
    return fallbackContents;
  }
}
