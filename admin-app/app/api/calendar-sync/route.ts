import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedRequest } from "@/lib/auth";
import { getStoredItems } from "@/lib/microcms";
import { triggerDeploy } from "@/lib/github";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) return NextResponse.json({ ok: false }, { status: 401 });
  if (process.env.VERCEL_ENV === "preview" || process.env.GOOGLE_CALENDAR_SYNC_ENABLED !== "true")
    return NextResponse.json({ ok: false, message: "カレンダーの自動同期は未接続です。" }, { status: 403 });
  const { eventId } = (await request.json().catch(() => null)) || {};
  if (typeof eventId !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(eventId))
    return NextResponse.json({ ok: false, message: "保存済みのイベントを選んでください。" }, { status: 400 });
  try {
    const saved = (await getStoredItems("events")).find(item => item.id === eventId);
    if (saved?.isPublished !== true) return NextResponse.json({ ok: false, message: "公開中のイベントだけ再同期できます。" }, { status: 409 });
    const data = await triggerDeploy("bassic_calendar_sync");
    return NextResponse.json({ ok: true, data });
  } catch {
    return NextResponse.json({ ok: false, message: "カレンダーへの反映を依頼できませんでした。サイトの掲載内容は残っています。" }, { status: 502 });
  }
}
