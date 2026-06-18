import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedRequest } from "@/lib/auth";

export const runtime = "nodejs";

type Preview = {
  title: string;
  imageUrl: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  sourceUrl: string;
};

function unauthorized() {
  return NextResponse.json({ ok: false, message: "ログインしてください。" }, { status: 401 });
}

function normalizeFacebookEventUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    const id = url.pathname.match(/\/events\/(\d+)/)?.[1] || "";
    if (!id || (host !== "facebook.com" && host !== "m.facebook.com" && host !== "mbasic.facebook.com" && host !== "fb.me")) {
      return "";
    }

    return `https://www.facebook.com/events/${id}/`;
  } catch {
    return "";
  }
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
    .trim();
}

function cleanTitle(value: string) {
  return value.replace(/\s*\|\s*Facebook\s*$/i, "").replace(/\s+/g, " ").trim();
}

function readJsonLdEvents(html: string) {
  const events: Array<Record<string, unknown>> = [];
  const blocks = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);

  for (const block of blocks) {
    try {
      const parsed = JSON.parse(decodeHtml(block[1]));
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

function parseDateTimeValue(value: string) {
  if (!value) {
    return { date: "", time: "" };
  }

  const match = value.match(/(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/);
  if (!match) {
    return { date: "", time: "" };
  }

  return {
    date: `${match[1]}-${match[2]}-${match[3]}`,
    time: match[4] ? `${match[4]}:${match[5]}` : ""
  };
}

function parseJsonLdEvent(html: string) {
  const event = readJsonLdEvents(html)[0];
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

function parseDateFromText(text: string) {
  const normalized = text.replace(/\s+/g, " ");
  const jp = normalized.match(/(\d{4})[\/年.-](\d{1,2})[\/月.-](\d{1,2})日?.*?(\d{1,2})(?::|：|時)?(\d{2})?/);
  if (jp) {
    return {
      date: `${jp[1]}-${pad(jp[2])}-${pad(jp[3])}`,
      startTime: `${pad(jp[4])}:${pad(jp[5] || "00")}`
    };
  }

  const iso = normalized.match(/(\d{4})-(\d{2})-(\d{2})(?:.*?(\d{2}):(\d{2}))?/);
  if (iso) {
    return {
      date: `${iso[1]}-${iso[2]}-${iso[3]}`,
      startTime: iso[4] ? `${iso[4]}:${iso[5]}` : ""
    };
  }

  return { date: "", startTime: "" };
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function pad(value: string) {
  return value.padStart(2, "0");
}

export async function POST(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return unauthorized();
  }

  const payload = (await request.json().catch(() => ({}))) as { url?: string };
  const url = String(payload.url || "").trim();
  const normalizedUrl = normalizeFacebookEventUrl(url);

  if (!normalizedUrl) {
    return NextResponse.json(
      { ok: false, message: "FacebookイベントURLを入力してください。例: https://www.facebook.com/events/1234567890/" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(normalizedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BassicAdmin/1.0)"
      },
      cache: "no-store"
    });
    const html = await response.text();

    if (!response.ok || !html) {
      throw new Error("Facebookを読み取れませんでした。");
    }

    const jsonLd = parseJsonLdEvent(html);
    const title = cleanTitle(jsonLd.title || readMeta(html, "og:title") || readMeta(html, "twitter:title"));
    const imageUrl = jsonLd.imageUrl || readMeta(html, "og:image") || readMeta(html, "twitter:image");
    const description = jsonLd.description || readMeta(html, "og:description") || readMeta(html, "description");
    const parsed = parseDateFromText(`${title} ${description}`);
    const preview: Preview = {
      title,
      imageUrl,
      description,
      date: jsonLd.date || parsed.date,
      startTime: jsonLd.startTime || parsed.startTime,
      endTime: jsonLd.endTime,
      sourceUrl: normalizedUrl
    };

    return NextResponse.json({ ok: true, data: preview });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Facebookから読み取れませんでした。タイトル、日時、画像は手入力できます。" },
      { status: 502 }
    );
  }
}
