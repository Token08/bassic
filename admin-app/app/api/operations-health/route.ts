import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedRequest } from "@/lib/auth";
import { operationsHealth } from "@public/lib/operations-health.mjs";
export const runtime = "nodejs";
export const maxDuration = 15;
export async function GET(request: NextRequest) {
  const headers = { "Cache-Control": "private, no-store" };
  if (!isAuthenticatedRequest(request)) return NextResponse.json({ ok: false, message: "ログインしてください。" }, { status: 401, headers });
  try {
    const data = await operationsHealth({ token: process.env.GITHUB_DISPATCH_TOKEN, owner: process.env.GITHUB_OWNER || "Token08", repo: process.env.GITHUB_REPO || "bassic", calendarExpected: process.env.GOOGLE_CALENDAR_SYNC_ENABLED !== "false" });
    return NextResponse.json({ ok: true, data }, { headers });
  } catch { return NextResponse.json({ ok: false, message: "運用状況を確認できませんでした。もう一度確認してください。" }, { status: 502, headers }); }
}
