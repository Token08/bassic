import { createSign } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedRequest } from "@/lib/auth";

export const runtime = "nodejs";

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
  const { id, title, date, startTime } = (await request.json().catch(() => null)) || {};
  if (typeof id !== "string" || !/^\d{6,32}$/.test(id) || typeof title !== "string" || !title ||
      typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      typeof startTime !== "string" || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(startTime)) {
    return NextResponse.json({ ok: false, message: "イベントの日時を確認してください。" }, { status: 400 });
  }
  try {
    const token = await getReadToken(config);
    const syncTag = process.env.GOOGLE_CALENDAR_SYNC_TAG || "bassic-facebook-sync";
    const query = new URLSearchParams({ privateExtendedProperty: `syncKey=facebook-${id}`, maxResults: "20" });
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${query}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) throw new Error("Calendar lookup failed");
    const { items, nextPageToken } = await response.json();
    if (!Array.isArray(items)) throw new Error("Invalid calendar response");
    const matches = items.filter((item) => item.status !== "cancelled" && item.extendedProperties?.private?.syncTag === syncTag);
    const expected = Date.parse(`${date}T${startTime}:00+09:00`);
    const state = nextPageToken || matches.length > 1 ? "review" : matches.length === 0 ? "not-found" :
      matches[0].summary === title && Date.parse(matches[0].start?.dateTime) === expected ? "matched" : "review";
    return NextResponse.json({ ok: true, data: { state } });
  } catch {
    return NextResponse.json({ ok: false, message: "カレンダーの掲載結果を確認できませんでした。" }, { status: 502 });
  }
}
