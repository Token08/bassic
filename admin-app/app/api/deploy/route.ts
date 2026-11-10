import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedRequest } from "@/lib/auth";
import { getDeployStatus, triggerDeploy } from "@/lib/github";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ ok: false, message: "ログインしてください。" }, { status: 401 });
  }
  const id = request.nextUrl.searchParams.get("id") ?? "";
  const requestedAt = Date.parse(request.nextUrl.searchParams.get("requestedAt") ?? "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id) ||
      !Number.isFinite(requestedAt) || requestedAt > Date.now() + 60_000 || requestedAt < Date.now() - 7 * 86_400_000) {
    return NextResponse.json({ ok: false, message: "この公開依頼の状況は確認できません。" }, { status: 400 });
  }
  try {
    return NextResponse.json({ ok: true, data: await getDeployStatus(id, requestedAt) });
  } catch {
    return NextResponse.json({ ok: false, message: "反映状況を取得できません。" }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ ok: false, message: "ログインしてください。" }, { status: 401 });
  }
  if (process.env.VERCEL_ENV === "preview") {
    return NextResponse.json({ ok: false, message: "確認用の管理画面からはサイトへ公開できません。" }, { status: 403 });
  }

  try {
    const data = await triggerDeploy();

    return NextResponse.json({ ok: true, data });
  } catch {
    return NextResponse.json(
      { ok: false, message: "保存は完了しましたが、公開サイトへの反映に失敗しました。担当者へ連絡してください。" },
      { status: 502 }
    );
  }
}
