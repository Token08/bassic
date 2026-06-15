import { NextResponse } from "next/server";
import { createSessionToken, setSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { password } = (await request.json().catch(() => ({}))) as { password?: string };
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedPassword) {
    return NextResponse.json({ ok: false, message: "管理画面のパスワード設定が未完了です。" }, { status: 500 });
  }

  if (!password || password !== expectedPassword) {
    return NextResponse.json({ ok: false, message: "パスワードが違います。" }, { status: 401 });
  }

  try {
    await setSessionCookie(createSessionToken());
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, message: "ログイン設定が未完了です。担当者に連絡してください。" }, { status: 500 });
  }
}
