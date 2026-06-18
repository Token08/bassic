import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedRequest } from "@/lib/auth";

export const runtime = "nodejs";

type Preview = {
  title: string;
  imageUrl: string;
  description: string;
  date: string;
  startTime: string;
};

function unauthorized() {
  return NextResponse.json({ ok: false, message: "ログインしてください。" }, { status: 401 });
}

function isFacebookEventUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    return (host === "facebook.com" || host === "m.facebook.com" || host === "fb.me") && /\/events\/\d+/.test(url.pathname);
  } catch {
    return false;
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

function parseDateFromText(text: string) {
  const normalized = text.replace(/\s+/g, " ");
  const jp = normalized.match(/(\d{4})[\/年.-](\d{1,2})[\/月.-](\d{1,2})日?.*?(\d{1,2})[:時](\d{2})?/);
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

  if (!isFacebookEventUrl(url)) {
    return NextResponse.json(
      { ok: false, message: "FacebookイベントURLを入力してください。例: https://www.facebook.com/events/..." },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BassicAdmin/1.0)"
      },
      cache: "no-store"
    });
    const html = await response.text();

    if (!response.ok || !html) {
      throw new Error("Facebookを読み取れませんでした。");
    }

    const title = cleanTitle(readMeta(html, "og:title") || readMeta(html, "twitter:title"));
    const imageUrl = readMeta(html, "og:image") || readMeta(html, "twitter:image");
    const description = readMeta(html, "og:description") || readMeta(html, "description");
    const parsed = parseDateFromText(`${title} ${description}`);
    const preview: Preview = {
      title,
      imageUrl,
      description,
      date: parsed.date,
      startTime: parsed.startTime
    };

    return NextResponse.json({ ok: true, data: preview });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Facebookから読み取れませんでした。タイトル、日時、画像は手入力できます。" },
      { status: 502 }
    );
  }
}
