import { createSign } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedRequest } from "@/lib/auth";
import { calendarDescription } from "@public/lib/calendar-event-content.mjs";
import { externalEmbeds } from "@public/lib/editable-content";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) return NextResponse.json({ ok: false }, { status: 401 });
  const configured = process.env.GOOGLE_CALENDAR_SYNC_ENABLED === "true" &&
    Boolean(process.env.GOOGLE_CALENDAR_READ_SERVICE_ACCOUNT_JSON && process.env.GOOGLE_CALENDAR_ID);
  const calendarId = process.env.GOOGLE_CALENDAR_ID?.trim() || new URL(externalEmbeds.googleCalendarPublicUrl).searchParams.get("src") || "";
  return NextResponse.json({ ok: true, data: { configured, calendarId } }, { headers: { "Cache-Control": "private, no-store" } });
}

async function getReadToken(config: string) {
  const { client_email, private_key } = JSON.parse(config);
  if (typeof client_email !== "string" || typeof private_key !== "string") throw new Error("Invalid calendar configuration");
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const issuedAt = Math.floor(Date.now() / 1000);
  const tokenUrl = "https://oauth2.googleapis.com/token";
  const assertion = [encode({ alg: "RS256", typ: "JWT" }), encode({
    iss: client_email, scope: "https://www.googleapis.com/auth/calendar.events.readonly",
    aud: tokenUrl, iat: issuedAt, exp: issuedAt + 300
  })].join(".");
  const signature = createSign("RSA-SHA256").update(assertion).sign(private_key).toString("base64url");
  const response = await fetch(tokenUrl, {
    method: "POST", signal: AbortSignal.timeout(5000), redirect: "error",
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${assertion}.${signature}` })
  });
  if (!response.ok) throw new Error("Calendar authentication failed");
  const { access_token } = await response.json();
  if (typeof access_token !== "string" || !access_token) throw new Error("Calendar token missing");
  return access_token;
}

export async function POST(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) return NextResponse.json({ ok: false }, { status: 401 });
  const config = process.env.GOOGLE_CALENDAR_READ_SERVICE_ACCOUNT_JSON;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!config || !calendarId) return NextResponse.json({ ok: true, data: { state: "unconfigured" } });
  const input = (await request.json().catch(() => null)) || {};
  const { id, title, date, startTime, endTime, syncKey: suppliedKey } = input;
  const syncKey = suppliedKey === undefined ? `facebook-${id}` : suppliedKey;
  if (typeof id !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(id) || typeof title !== "string" || !title ||
      typeof syncKey !== "string" || !syncKey || syncKey.length > 500 ||
      ["sourceUrl", "imageUrl", "performers", "price", "reservation", "openTime"].some(key => input[key] !== undefined && typeof input[key] !== "string") ||
      typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      typeof startTime !== "string" || !/^(?:[01]?\d|2[0-3]):[0-5]\d$/.test(startTime) ||
      (endTime !== undefined && (typeof endTime !== "string" || (endTime && !/^(?:[01]?\d|2[0-3]):[0-5]\d$/.test(endTime)))) ||
      !Number.isFinite(Date.parse(date + "T00:00:00Z")) || new Date(date + "T00:00:00Z").toISOString().slice(0, 10) !== date) {
    return NextResponse.json({ ok: false, message: "イベントの日時を確認してください。" }, { status: 400 });
  }
  try {
    const token = await getReadToken(config);
    const syncTag = process.env.GOOGLE_CALENDAR_SYNC_TAG || "bassic-facebook-sync";
    const query = new URLSearchParams({ privateExtendedProperty: `syncKey=${syncKey}`, maxResults: "20" });
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${query}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) throw new Error("Calendar lookup failed");
    const { items, nextPageToken } = await response.json();
    if (!Array.isArray(items)) throw new Error("Invalid calendar response");
    const matches = items.filter((item) => item.status !== "cancelled" && item.extendedProperties?.private?.syncTag === syncTag);
    const padded = (time: string) => time.padStart(5, "0");
    const expected = Date.parse(`${date}T${padded(startTime)}:00+09:00`);
    let expectedEnd = endTime ? Date.parse(`${date}T${padded(endTime)}:00+09:00`) : expected + 2 * 3600000;
    if (expectedEnd <= expected) expectedEnd += 86400000;
    if (!Number.isFinite(expected) || !Number.isFinite(expectedEnd)) throw Error("Invalid event time");
    const state = nextPageToken || matches.length > 1 ? "review" : matches.length === 0 ? "not-found" :
      matches[0].summary === title && Date.parse(matches[0].start?.dateTime) === expected &&
      Date.parse(matches[0].end?.dateTime) === expectedEnd &&
      (suppliedKey === undefined || (matches[0].visibility === "public" && (matches[0].description || "") === calendarDescription(input, process.env.NEXT_PUBLIC_PUBLIC_SITE_URL))) ? "matched" : "review";
    return NextResponse.json({ ok: true, data: { state, ...(state === "review" ? { reason: nextPageToken || matches.length > 1 ? "duplicate" : "different" } : {}) } });
  } catch {
    return NextResponse.json({ ok: false, message: "カレンダーの掲載結果を確認できませんでした。" }, { status: 502 });
  }
}
