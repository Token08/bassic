import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedRequest } from "@/lib/auth";
import { findFacebookEvents } from "@/lib/microcms";
import { parseDateFromText, parseDateTimeValue } from "@/lib/facebook-event-time";

export const runtime = "nodejs";

type Preview = {
  title: string;
  imageUrl: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  sourceId: string;
  sourceUrl: string;
  existingEvents: Array<Record<string, unknown>>;
};

function unauthorized() {
  return NextResponse.json({ ok: false, message: "ログインしてください。" }, { status: 401 });
}

function normalizeFacebookEventUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    const id = getFacebookEventIdFromPath(url.pathname);
    if (!id || (host !== "facebook.com" && host !== "m.facebook.com" && host !== "mbasic.facebook.com" && host !== "fb.me")) {
      return "";
    }

    return `https://www.facebook.com/events/${id}/`;
  } catch {
    return "";
  }
}

function getFacebookEventIdFromPath(pathname: string) {
  const eventsPath = pathname.match(/\/events\/(.+)/)?.[1] || "";
  if (!eventsPath) {
    return "";
  }

  return [...eventsPath
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean)]
    .reverse()
    .find((part) => /^\d{6,}$/.test(part)) || "";
}

function readMeta(html: string, property: string) {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${escapeRegExp(property)}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${escapeRegExp(property)}["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+name=["']${escapeRegExp(property)}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i")
  ];

  for (const pattern of patterns) {
    const value = html.match(pattern)?.[1];
    if (value) {
      return decodeHtml(value);
    }
  }

  return "";
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal: string) => String.fromCodePoint(Number.parseInt(decimal, 10)))
    .trim();
}

function cleanTitle(value: string) {
  const title = value.replace(/\s*\|\s*Facebook\s*$/i, "").replace(/\s+/g, " ").trim();
  return /^(?:Facebook|log\s*in|ログイン)(?:\s|$)/i.test(title) ? "" : title;
}

function readJsonLdEvents(html: string) {
  const events: Array<Record<string, unknown>> = [];
  const blocks = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);

  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block[1]);
      collectJsonLdEvents(parsed, events);
    } catch {
      // Facebook markup changes often. Ignore malformed JSON-LD and fall back to meta text.
    }
  }

  return events;
}

function collectJsonLdEvents(value: unknown, events: Array<Record<string, unknown>>) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectJsonLdEvents(item, events));
    return;
  }

  if (!value || typeof value !== "object") {
    return;
  }

  const item = value as Record<string, unknown>;
  const type = item["@type"];
  const types = Array.isArray(type) ? type : [type];

  if (types.some((entry) => String(entry).toLowerCase() === "event")) {
    events.push(item);
  }

  for (const key of ["@graph", "mainEntity", "itemListElement"]) {
    collectJsonLdEvents(item[key], events);
  }
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseJsonLdEvent(html: string, sourceId: string) {
  const events = readJsonLdEvents(html);
  const identify = (event: Record<string, unknown>) => {
    const url = readString(event.url) || readString(event["@id"]);
    return normalizeFacebookEventUrl(url) ? getFacebookEventIdFromPath(new URL(url).pathname) : "";
  };
  const matches = events.filter((event) => identify(event) === sourceId);
  const event = matches.length === 1 ? matches[0] : events.length === 1 && !identify(events[0]) ? events[0] : undefined;
  if (!event) {
    return { title: "", imageUrl: "", description: "", date: "", startTime: "", endTime: "" };
  }

  const start = parseDateTimeValue(readString(event.startDate));
  const end = parseDateTimeValue(readString(event.endDate));
  const image = event.image;
  const firstImage = Array.isArray(image) ? image[0] : image;
  const imageUrl =
    readString(firstImage) ||
    (firstImage && typeof firstImage === "object" ? readString((firstImage as Record<string, unknown>).url) : "");

  return {
    title: readString(event.name),
    imageUrl,
    description: readString(event.description),
    date: start.date,
    startTime: start.time,
    endTime: end.time
  };
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function POST(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return unauthorized();
  }

  const payload = (await request.json().catch(() => ({}))) as { url?: string };
  const url = String(payload.url || "").trim();
  const normalizedUrl = normalizeFacebookEventUrl(url);
  const sourceId = getFacebookEventIdFromPath(new URL(normalizedUrl || "https://www.facebook.com/").pathname);

  if (!normalizedUrl) {
    return NextResponse.json(
      { ok: false, message: "FacebookイベントURLを入力してください。例: https://www.facebook.com/events/1234567890/" },
      { status: 400 }
    );
  }

  const existingEvents = await findFacebookEvents(sourceId).catch(() => null);
  if (!existingEvents) {
    return NextResponse.json({ ok: false, message: "登録済みイベントを確認できません。時間をおいて読み直してください。" }, { status: 502 });
  }
  try {
    const response = await fetch(normalizedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BassicAdmin/1.0)"
      },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(8000)
    });
    const html = await response.text();

    if (!response.ok || !html) {
      throw new Error("Facebookを読み取れませんでした。");
    }

    const jsonLd = parseJsonLdEvent(html, sourceId);
    const title = cleanTitle(jsonLd.title || readMeta(html, "og:title") || readMeta(html, "twitter:title"));
    const imageUrl =
      jsonLd.imageUrl ||
      readMeta(html, "og:image") ||
      readMeta(html, "twitter:image") ||
      readMeta(html, "twitter:image:src");
    const description = jsonLd.description || readMeta(html, "og:description") || readMeta(html, "description");
    const parsed = parseDateFromText(`${title} ${description}`);
    const preview: Preview = {
      title,
      imageUrl: title && /^https:\/\//i.test(imageUrl) ? imageUrl : "",
      description,
      date: jsonLd.date || parsed.date,
      startTime: jsonLd.startTime || (!jsonLd.date || !parsed.date || jsonLd.date === parsed.date ? parsed.startTime : ""),
      endTime: jsonLd.endTime,
      sourceId,
      sourceUrl: normalizedUrl,
      existingEvents
    };

    return NextResponse.json({ ok: true, data: preview });
  } catch {
    return NextResponse.json({ ok: true, data: {
      title: "", imageUrl: "", description: "", date: "", startTime: "", endTime: "",
      sourceId, sourceUrl: normalizedUrl, existingEvents
    } satisfies Preview });
  }
}
