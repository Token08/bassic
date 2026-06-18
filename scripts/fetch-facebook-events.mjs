import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const outputPath = path.join(root, "public", "data", "facebook-events.json");
const graphVersion = process.env.META_GRAPH_VERSION || "v23.0";
const pageId = process.env.FACEBOOK_PAGE_ID || "bar.Bassic";
const limit = Number(process.env.FACEBOOK_EVENTS_LIMIT || 20);

const emptyResult = {
  generatedAt: new Date().toISOString(),
  source: null,
  events: [],
  errors: {}
};

async function main() {
  const previous = await readPrevious();
  const result = structuredClone(emptyResult);

  const sources = [
    ["facebook", fetchMetaGraphEvents],
    ["facebook_ical", fetchFacebookIcalEvents],
    ["google_calendar", fetchGoogleCalendarEvents],
    ["facebook_browser", fetchBrowserEvents]
  ];

  for (const [source, fetcher] of sources) {
    try {
      const events = await fetcher();
      if (!events.length) {
        result.errors[source] = "No events returned";
        continue;
      }

      result.source = source;
      result.events = dedupeEvents(events).slice(0, limit);
      break;
    } catch (error) {
      result.errors[source] = error instanceof Error ? error.message : String(error);
    }
  }

  if (!result.events.length && previous?.events?.length) {
    result.source = previous.source || "previous_success";
    result.events = previous.events;
    result.previousGeneratedAt = previous.generatedAt || null;
    result.errors.previous_success = "Using previous successful event sync because all live sources failed";
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");

  console.log(`Facebook event sync written to ${outputPath}`);
  console.log(`Facebook event sync source: ${result.source || "none"}`);
  console.log(`Facebook event sync count: ${result.events.length}`);
  if (Object.keys(result.errors).length) {
    console.log(`Facebook event sync warnings: ${JSON.stringify(result.errors)}`);
  }
}

async function fetchMetaGraphEvents() {
  const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("FACEBOOK_PAGE_ACCESS_TOKEN is not set");
  }

  const data = await requestJson(`https://graph.facebook.com/${graphVersion}/${encodeURIComponent(pageId)}/events`, {
    fields: "id,name,start_time,end_time,description,cover,place,ticket_uri,timezone,updated_time",
    limit: String(limit),
    access_token: accessToken
  });

  return (data.data || []).map((item) => {
    const start = parseDateTime(item.start_time);
    return cleanEvent({
      id: `facebook-${item.id}`,
      sourceId: String(item.id),
      sourceType: "facebook",
      sourceUrl: `https://www.facebook.com/events/${item.id}/`,
      title: item.name,
      date: start.date,
      startTime: start.time,
      performers: trimText(item.description || ""),
      reservation: item.ticket_uri ? `予約・詳細: ${item.ticket_uri}` : `詳細: https://www.facebook.com/events/${item.id}/`,
      image: item.cover?.source ? { url: item.cover.source, alt: item.name } : undefined,
      isPublished: true
    });
  });
}

async function fetchFacebookIcalEvents() {
  const url = process.env.FACEBOOK_EVENTS_ICAL_URL;
  if (!url) {
    throw new Error("FACEBOOK_EVENTS_ICAL_URL is not set");
  }

  const text = await requestText(url);
  return parseIcs(text, "facebook_ical");
}

async function fetchGoogleCalendarEvents() {
  const explicitUrl = process.env.GOOGLE_CALENDAR_ICAL_URL;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const url = explicitUrl || (calendarId ? `https://calendar.google.com/calendar/ical/${encodeURIComponent(calendarId)}/public/basic.ics` : "");

  if (!url) {
    throw new Error("GOOGLE_CALENDAR_ICAL_URL or GOOGLE_CALENDAR_ID is not set");
  }

  const text = await requestText(url);
  return parseIcs(text, "google_calendar");
}

async function fetchBrowserEvents() {
  if (process.env.FACEBOOK_BROWSER_SYNC !== "true") {
    throw new Error("FACEBOOK_BROWSER_SYNC is not true");
  }

  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    throw new Error("playwright is not installed; install it only on the runner that uses FACEBOOK_BROWSER_SYNC");
  }

  const cookieJson = process.env.FACEBOOK_BROWSER_COOKIES_JSON;
  if (!cookieJson) {
    throw new Error("FACEBOOK_BROWSER_COOKIES_JSON is not set");
  }

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ locale: "ja-JP", timezoneId: "Asia/Tokyo" });
    await context.addCookies(JSON.parse(cookieJson));
    const page = await context.newPage();
    await page.goto(process.env.FACEBOOK_EVENTS_URL || "https://www.facebook.com/bar.Bassic/events", {
      waitUntil: "networkidle",
      timeout: 60000
    });

    const links = await page.locator('a[href*="/events/"]').evaluateAll((anchors) =>
      anchors
        .map((anchor) => ({
          href: anchor.href,
          text: anchor.textContent?.replace(/\s+/g, " ").trim() || ""
        }))
        .filter((item) => /\/events\/\d+/.test(item.href))
    );

    const events = [];
    const seen = new Set();
    for (const link of links) {
      const match = link.href.match(/\/events\/(\d+)/);
      const id = match?.[1];
      if (!id || seen.has(id)) continue;
      seen.add(id);

      await page.goto(`https://www.facebook.com/events/${id}/`, { waitUntil: "networkidle", timeout: 60000 });
      const meta = await page.evaluate(() => ({
        title: document.querySelector('meta[property="og:title"]')?.getAttribute("content") || document.title,
        image: document.querySelector('meta[property="og:image"]')?.getAttribute("content") || "",
        description: document.querySelector('meta[property="og:description"]')?.getAttribute("content") || ""
      }));

      const parsed = parseDateFromText(`${meta.title} ${meta.description} ${link.text}`);
      events.push(cleanEvent({
        id: `facebook-${id}`,
        sourceId: id,
        sourceType: "facebook",
        sourceUrl: `https://www.facebook.com/events/${id}/`,
        title: cleanFacebookTitle(meta.title || link.text || `Facebook event ${id}`),
        date: parsed.date,
        startTime: parsed.time,
        performers: trimText(meta.description || ""),
        reservation: `詳細: https://www.facebook.com/events/${id}/`,
        image: meta.image ? { url: meta.image, alt: meta.title || link.text } : undefined,
        isPublished: true
      }));
    }

    return events;
  } finally {
    await browser.close();
  }
}

function parseIcs(text, sourceType) {
  const events = [];
  const blocks = unfoldIcs(text).match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || [];

  for (const block of blocks) {
    const fields = parseIcsFields(block);
    const uid = first(fields.UID) || first(fields.URL) || first(fields.SUMMARY);
    const title = first(fields.SUMMARY);
    const sourceUrl = first(fields.URL) || findFacebookUrl(first(fields.DESCRIPTION) || "") || "";
    const start = parseIcsDate(first(fields.DTSTART));
    const imageUrl = first(fields.IMAGE) || first(fields.ATTACH);

    events.push(cleanEvent({
      id: `${sourceType}-${slugify(uid || `${start.date}-${title}`)}`,
      sourceId: String(uid || sourceUrl || `${start.date}-${title}`),
      sourceType,
      sourceUrl,
      title,
      date: start.date,
      startTime: start.time,
      performers: trimText(first(fields.DESCRIPTION) || ""),
      reservation: sourceUrl ? `詳細: ${sourceUrl}` : undefined,
      image: imageUrl ? { url: imageUrl, alt: title } : undefined,
      isPublished: true
    }));
  }

  return events;
}

function parseIcsFields(block) {
  const fields = {};
  for (const line of block.split(/\r?\n/)) {
    const index = line.indexOf(":");
    if (index === -1) continue;
    const rawKey = line.slice(0, index).split(";")[0];
    const key = rawKey.toUpperCase();
    const value = decodeIcsText(line.slice(index + 1));
    fields[key] ||= [];
    fields[key].push(value);
  }
  return fields;
}

function unfoldIcs(text) {
  return text.replace(/\r?\n[ \t]/g, "");
}

function decodeIcsText(value) {
  return String(value)
    .replace(/\\n/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
    .trim();
}

function parseIcsDate(value) {
  if (!value) return { date: "", time: undefined };
  const normalized = String(value).replace(/Z$/, "");
  const match = normalized.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2}))?/);
  if (!match) return { date: "", time: undefined };
  return {
    date: `${match[1]}-${match[2]}-${match[3]}`,
    time: match[4] ? `${match[4]}:${match[5]}` : undefined
  };
}

function parseDateTime(value) {
  if (!value) return { date: "", time: undefined };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: "", time: undefined };
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(date);
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    date: `${byType.year}-${byType.month}-${byType.day}`,
    time: `${byType.hour}:${byType.minute}`
  };
}

function parseDateFromText(text) {
  const normalized = String(text).replace(/\s+/g, " ");
  const jp = normalized.match(/(\d{4})[\/年.-](\d{1,2})[\/月.-](\d{1,2})日?.*?(\d{1,2})[:時](\d{2})?/);
  if (jp) {
    return {
      date: `${jp[1]}-${pad(jp[2])}-${pad(jp[3])}`,
      time: `${pad(jp[4])}:${pad(jp[5] || "00")}`
    };
  }

  const jpWithoutYear = normalized.match(/(?:^|[^\d])(\d{1,2})月(\d{1,2})日?.*?(午前|午後)?\s*(\d{1,2})(?::|：|時)?(\d{2})?/);
  if (jpWithoutYear) {
    const year = inferEventYear(jpWithoutYear[1], jpWithoutYear[2]);
    const hour = normalizeJapaneseHour(jpWithoutYear[4], jpWithoutYear[3]);
    return {
      date: `${year}-${pad(jpWithoutYear[1])}-${pad(jpWithoutYear[2])}`,
      time: `${pad(hour)}:${pad(jpWithoutYear[5] || "00")}`
    };
  }

  const iso = normalized.match(/(\d{4})-(\d{2})-(\d{2})(?:.*?(\d{2}):(\d{2}))?/);
  if (iso) {
    return {
      date: `${iso[1]}-${iso[2]}-${iso[3]}`,
      time: iso[4] ? `${iso[4]}:${iso[5]}` : undefined
    };
  }

  return { date: "", time: undefined };
}

function inferEventYear(monthValue, dayValue) {
  const now = new Date();
  let year = now.getFullYear();
  const month = Number.parseInt(monthValue, 10);
  const day = Number.parseInt(dayValue, 10);
  const candidate = new Date(year, month - 1, day);
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  if (candidate < sixMonthsAgo) {
    year += 1;
  }

  return String(year);
}

function normalizeJapaneseHour(value, period) {
  const hour = Number.parseInt(value, 10);
  if (Number.isNaN(hour)) {
    return "00";
  }

  if (period === "午後" && hour < 12) {
    return String(hour + 12);
  }

  if (period === "午前" && hour === 12) {
    return "00";
  }

  return String(hour);
}

function cleanEvent(event) {
  if (!event.title || !event.date) {
    return null;
  }

  return {
    ...event,
    title: trimText(event.title, 120),
    performers: event.performers ? trimText(event.performers, 280) : undefined
  };
}

function dedupeEvents(events) {
  const byKey = new Map();
  for (const event of events.filter(Boolean)) {
    const key = event.sourceId || `${event.date}-${event.title}`;
    byKey.set(key, event);
  }
  return [...byKey.values()].sort((a, b) => `${a.date}${a.startTime || ""}`.localeCompare(`${b.date}${b.startTime || ""}`));
}

async function requestJson(url, params) {
  const requestUrl = new URL(url);
  Object.entries(params).forEach(([key, value]) => requestUrl.searchParams.set(key, value));
  const response = await fetch(requestUrl);
  const text = await response.text();
  const body = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(`${response.status} ${body?.error?.message || response.statusText}`);
  }
  return body;
}

async function requestText(url) {
  const response = await fetch(url);
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return text;
}

async function readPrevious() {
  try {
    return JSON.parse(await readFile(outputPath, "utf8"));
  } catch {
    return null;
  }
}

function first(values) {
  return Array.isArray(values) ? values.find(Boolean) : values;
}

function findFacebookUrl(text) {
  return String(text).match(/https?:\/\/(?:www\.)?facebook\.com\/events\/[^\s)]+/)?.[0] || "";
}

function cleanFacebookTitle(title) {
  return String(title).replace(/\s*\|\s*Facebook\s*$/i, "").trim();
}

function trimText(text, max = 220) {
  return String(text).replace(/\s+/g, " ").trim().slice(0, max);
}

function slugify(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

function pad(value) {
  return String(value).padStart(2, "0");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
