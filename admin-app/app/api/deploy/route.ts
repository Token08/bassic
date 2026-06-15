import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedRequest } from "@/lib/auth";
import { triggerDeploy } from "@/lib/github";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ ok: false, message: "ログインしてください。" }, { status: 401 });
  }

  try {
    const data = await triggerDeploy();

    return NextResponse.json({ ok: true, data });
  } catch {
    return NextResponse.json(
      { ok: false, message: "保存済み、反映だけ失敗しました。担当者に連絡してください。" },
      { status: 502 }
    );
  }
}
