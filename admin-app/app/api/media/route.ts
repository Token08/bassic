import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedRequest } from "@/lib/auth";
import { uploadMedia } from "@/lib/microcms";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ ok: false, message: "ログインしてください。" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, message: "画像ファイルを選んでください。" }, { status: 400 });
    }

    const data = await uploadMedia(file);

    return NextResponse.json({ ok: true, data });
  } catch {
    return NextResponse.json(
      { ok: false, message: "画像をアップロードできませんでした。microCMSのAPIキー設定を確認してください。" },
      { status: 502 }
    );
  }
}
