import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedRequest } from "@/lib/auth";
import { storePdf, validatePdf } from "@/lib/pdf-upload";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) return NextResponse.json({ ok: false, message: "ログインしてください。" }, { status: 401 });
  if (process.env.VERCEL_ENV === "preview") return NextResponse.json({ ok: false, message: "確認用環境ではアップロードできません。" }, { status: 403 });
  try {
    const file = (await request.formData()).get("file");
    if (!(file instanceof File)) return NextResponse.json({ ok: false, message: "PDFファイルを選んでください。" }, { status: 400 });
    const error = await validatePdf(file);
    if (error) return NextResponse.json({ ok: false, message: error }, { status: 400 });
    return NextResponse.json({ ok: true, data: await storePdf(file) });
  } catch {
    return NextResponse.json({ ok: false, message: "PDFをアップロードできませんでした。再度お試しください。直らない場合は担当者へ連絡してください。現在のPDFは残っています。" }, { status: 502 });
  }
}
