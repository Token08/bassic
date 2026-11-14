import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedRequest } from "@/lib/auth";
import { applyClosedDays, dayEvent, monthRange, overlaps, validDay, type DayChange } from "@/lib/closed-days";
import { calendarAccess } from "@/lib/closed-days-google";
import { closedDaysConnection } from "@/lib/closed-days-connection";

export const runtime = "nodejs";
export const maxDuration = 60;
const reply = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
export async function GET(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) return reply({ ok: false, message: "ログインしてください。" }, 401);
  try {
    const range = monthRange(request.nextUrl.searchParams.get("month") || "");
    const config = closedDaysConnection();
    if (!config.id || !config.reader) return reply({ ok: false, message: "カレンダーの接続設定を確認しています。担当者へ連絡してください。" }, 503);
    const calendar = await calendarAccess(config.reader, config.id);
    const events = (await calendar.list(range.start, range.end)).map(dayEvent);
    return reply({ ok: true, data: { month: range.start.slice(0, 7), events, canWrite: config.writable, timezone: "Asia/Tokyo" } });
  } catch { return reply({ ok: false, message: "予定を読み込めませんでした。もう一度読み込んでください。" }, 502); }
}
function validChanges(value: unknown): value is DayChange[] {
  if (!Array.isArray(value) || !value.length || value.length > 31) return false;
  const dates = new Set<string>();
  return value.every(change => {
    if (!change || typeof change.date !== "string" || !validDay(change.date) || dates.has(change.date) || !["add", "remove"].includes(change.action) || !Array.isArray(change.events)) return false;
    dates.add(change.date);
    if (change.action === "add") return change.events.length === 0;
    return change.events.length > 0 && change.events.length <= 20 && new Set(change.events.map((e: { id: string }) => e?.id)).size === change.events.length && change.events.every((event: Record<string, unknown>) =>
      event && typeof event.id === "string" && /^[a-zA-Z0-9_@-]{1,1024}$/.test(event.id) && typeof event.etag === "string" && event.etag.length > 0 && event.etag.length < 300 &&
      typeof event.title === "string" && typeof event.start === "string" && validDay(event.start) && typeof event.end === "string" && validDay(event.end) &&
      event.start < event.end && overlaps(event as unknown as DayChange["events"][number], change.date));
  });
}
export async function POST(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) return reply({ ok: false, message: "ログインしてください。" }, 401);
  const config = closedDaysConnection();
  if (!config.writable || !config.writer || !config.id) return reply({ ok: false, message: "店休日の変更はまだ接続されていません。担当者へ連絡してください。" }, 403);
  try {
    const body = await request.json();
    if (!body || typeof body.operation !== "string" || !/^[a-f0-9-]{36}$/.test(body.operation) || !validChanges(body.changes)) return reply({ ok: false, message: "変更する日付を確認してください。一度に31日まで反映できます。" }, 400);
    const calendar = await calendarAccess(config.writer, config.id, true);
    const results = await applyClosedDays(calendar, config.id, body.changes, body.operation);
    return reply({ ok: true, data: { results } });
  } catch { return reply({ ok: false, message: "反映結果を確認できませんでした。選択した内容は残っています。もう一度結果を確認してください。" }, 502); }
}
