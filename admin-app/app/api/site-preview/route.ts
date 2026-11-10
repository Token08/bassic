import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedRequest } from "@/lib/auth";
import { resolvePublicUrl } from "@/lib/public-site-url";

const paths = new Set(["/", "/events/", "/menu/", "/party/", "/access/"]);

export async function GET(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) return new NextResponse(null, { status: 401 });
  const path = request.nextUrl.searchParams.get("path") || "/";
  if (!paths.has(path)) return new NextResponse(null, { status: 400 });

  try {
    const url = resolvePublicUrl(path, process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || "https://www.bassic.jp/");
    const upstream = await fetch(url, {
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(8000)
    });
    if (!upstream.ok || !upstream.headers.get("content-type")?.includes("text/html")) {
      return new NextResponse(null, { status: 502 });
    }
    return NextResponse.json({ html: await upstream.text(), url }, {
      headers: { "Cache-Control": "private, no-store" }
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
