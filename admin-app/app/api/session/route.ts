import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({ authenticated: isAuthenticatedRequest(request) });
  } catch {
    return NextResponse.json({ authenticated: false, message: "管理画面のログイン設定が未完了です。担当者に連絡してください。" }, { status: 500 });
  }
}
