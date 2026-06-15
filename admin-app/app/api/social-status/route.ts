import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedRequest } from "@/lib/auth";
import { getContent } from "@/lib/microcms";

export const runtime = "nodejs";

type SiteSettings = {
  instagramUrl?: string;
  facebookUrl?: string;
  xUrl?: string;
};

type HomeContent = {
  instagramWidgetSrc?: string;
};

type SocialNotice = {
  id?: string;
  isPublished?: boolean;
  updatedAt?: string;
  date?: string;
};

type ListResponse<T> = {
  contents?: T[];
};

function unauthorized() {
  return NextResponse.json({ ok: false, message: "ログインしてください。" }, { status: 401 });
}

function getPublicSiteUrl() {
  return (process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || "https://www.bassic.jp/").replace(/\/$/, "");
}

async function hasStaticFeed() {
  try {
    const response = await fetch(`${getPublicSiteUrl()}/data/social-feed.json`, { cache: "no-store" });

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as { feeds?: Record<string, unknown[]> };

    return Boolean(data.feeds && Object.values(data.feeds).some((items) => Array.isArray(items) && items.length > 0));
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return unauthorized();
  }

  try {
    const [siteSettings, home, socialNotices, staticFeedAvailable] = await Promise.all([
      getContent("site-settings") as Promise<SiteSettings>,
      getContent("home") as Promise<HomeContent>,
      getContent("social-notices") as Promise<ListResponse<SocialNotice>>,
      hasStaticFeed()
    ]);
    const notices = socialNotices.contents || [];
    const publishedCount = notices.filter((notice) => notice.isPublished !== false).length;
    const draftCount = notices.length - publishedCount;
    const latestUpdatedAt = notices
      .map((notice) => notice.updatedAt || notice.date || "")
      .filter(Boolean)
      .sort()
      .at(-1);

    return NextResponse.json({
      ok: true,
      data: {
        instagramUrlSet: Boolean(siteSettings.instagramUrl),
        facebookUrlSet: Boolean(siteSettings.facebookUrl),
        xUrlSet: Boolean(siteSettings.xUrl),
        instagramWidgetSet: Boolean(home.instagramWidgetSrc),
        publishedCount,
        draftCount,
        latestUpdatedAt,
        staticFeedAvailable
      }
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "SNS状況を確認できませんでした。時間をおいて再度お試しください。"
      },
      { status: 502 }
    );
  }
}
