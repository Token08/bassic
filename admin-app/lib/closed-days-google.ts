import { createSign } from "node:crypto";
import type { CalendarAccess, CalendarBody, CalendarItem } from "./closed-days";

export class GoogleClosedDays implements CalendarAccess {
  private deadline = Date.now() + 50000;
  private calendarId: string;
  private token: string;
  constructor(calendarId: string, token: string) { this.calendarId = calendarId; this.token = token; }
  private async request(path: string, init: RequestInit = {}) {
    const remaining = this.deadline - Date.now();
    if (remaining < 500) throw Error("確認に時間がかかっています。もう一度結果を確認してください。");
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(this.calendarId)}/events${path}`, {
      ...init, headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json", ...init.headers },
      signal: AbortSignal.timeout(Math.min(remaining, 8000)), redirect: "error", cache: "no-store"
    });
    if (!response.ok) throw Object.assign(Error(response.status === 412 ? "予定が変更されています。再読み込みしてください。" : "Googleカレンダーとの通信を確認できませんでした。"), { status: response.status });
    return response;
  }
  async list(from: string, until: string) {
    const items: CalendarItem[] = [];
    let pageToken = "";
    const seen = new Set<string>();
    do {
      const query = new URLSearchParams({ timeMin: from + "T00:00:00+09:00", timeMax: until + "T00:00:00+09:00", timeZone: "Asia/Tokyo", singleEvents: "true", orderBy: "startTime", maxResults: "250", ...(pageToken ? { pageToken } : {}) });
      const data = await (await this.request("?" + query)).json();
      if (!Array.isArray(data.items)) throw Error("予定を読み込めませんでした。");
      items.push(...data.items.filter((event: CalendarItem) => event.status !== "cancelled"));
      if (items.length > 5000 || (data.nextPageToken && seen.has(data.nextPageToken))) throw Error("予定の件数を確認できませんでした。");
      pageToken = data.nextPageToken || ""; seen.add(pageToken);
    } while (pageToken);
    return items;
  }
  async get(id: string): Promise<CalendarItem | null> {
    try { return await (await this.request("/" + encodeURIComponent(id))).json(); }
    catch (error) {
      if ((error as { status: number }).status === 410) return { id, etag: "", status: "cancelled" };
      if ((error as { status: number }).status === 404) return null;
      throw error;
    }
  }
  async insert(body: CalendarBody): Promise<CalendarItem> {
    return await (await this.request("?sendUpdates=none", { method: "POST", body: JSON.stringify(body) })).json();
  }
  async remove(id: string, etag: string) {
    try { await this.request("/" + encodeURIComponent(id) + "?sendUpdates=none", { method: "DELETE", headers: { "If-Match": etag } }); }
    catch (error) { if (![404, 410].includes((error as { status: number }).status)) throw error; }
  }
}

export async function calendarAccess(json: string, calendarId: string, write = false) {
  const config = JSON.parse(json);
  if (typeof config.client_email !== "string" || typeof config.private_key !== "string" || !calendarId.trim()) throw Error("カレンダーの接続設定を確認してください。");
  const issued = Math.floor(Date.now() / 1000);
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const tokenUrl = "https://oauth2.googleapis.com/token";
  const assertion = [encode({ alg: "RS256", typ: "JWT" }), encode({ iss: config.client_email,
    scope: "https://www.googleapis.com/auth/calendar.events" + (write ? "" : ".readonly"), aud: tokenUrl, iat: issued, exp: issued + 300 })].join(".");
  const signature = createSign("RSA-SHA256").update(assertion).sign(config.private_key).toString("base64url");
  const response = await fetch(tokenUrl, { method: "POST", redirect: "error", signal: AbortSignal.timeout(8000),
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: assertion + "." + signature }) });
  if (!response.ok) throw Error("カレンダーの接続を確認できませんでした。");
  const data = await response.json();
  if (typeof data.access_token !== "string" || !data.access_token) throw Error("カレンダーの接続を確認できませんでした。");
  return new GoogleClosedDays(calendarId, data.access_token);
}
