import { NextResponse } from "next/server";
import { getAdminEnvChecks } from "@/lib/env";

export const runtime = "nodejs";

function getPublicSiteUrlStatus() {
  const rawUrl = process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || "https://www.bassic.jp/";

  try {
    const parsedUrl = new URL(rawUrl);
    const hostname = parsedUrl.hostname.toLowerCase();
    const isProduction = hostname === "www.bassic.jp";
    const isTemporary = hostname.endsWith("github.io") || hostname === "localhost" || hostname === "127.0.0.1";

    return {
      url: parsedUrl.toString(),
      isProduction,
      isTemporary,
      message: isProduction
        ? "本番URLに設定されています。"
        : isTemporary
          ? "仮URLです。本番公開前に https://www.bassic.jp/ へ変更してください。"
          : "本番URLと異なるため、公開前に確認してください。"
    };
  } catch {
    return {
      url: rawUrl,
      isProduction: false,
      isTemporary: false,
      message: "公開サイトURLの形式を確認してください。"
    };
  }
}

export async function GET() {
  const checks = getAdminEnvChecks();
  const missing = checks.filter((check) => !check.present);

  return NextResponse.json({
    ok: missing.length === 0,
    checks,
    missing,
    publicSiteUrl: getPublicSiteUrlStatus()
  });
}
