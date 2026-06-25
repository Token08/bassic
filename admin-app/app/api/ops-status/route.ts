import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedRequest } from "@/lib/auth";
import { getContent } from "@/lib/microcms";

export const runtime = "nodejs";

type ListResponse<T> = {
  contents?: T[];
};

type ImageValue = string | { url?: string } | null | undefined;

type EventItem = {
  id?: string;
  title?: string;
  date?: string;
  startTime?: string;
  reservation?: string;
  sourceUrl?: string;
  image?: ImageValue;
  isPublished?: boolean;
};

type SocialNotice = {
  id?: string;
  title?: string;
  platform?: string;
  postText?: string;
  scheduledAt?: string;
  deliveryStatus?: string;
  externalPostId?: string;
  lastPublishError?: string;
  image?: ImageValue;
  isPublished?: boolean;
};

type SiteSettings = {
  instagramUrl?: string;
  facebookUrl?: string;
  xUrl?: string;
};

type OpsAlert = {
  id: string;
  severity: "warning" | "error";
  sectionId: "events" | "social-notices" | "site-settings";
  title: string;
  detail: string;
};

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getImageUrl(value: ImageValue) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  return getString(value.url);
}

function parseDate(value: string) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00+09:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseScheduledAt(value: string) {
  if (!value) {
    return null;
  }

  const normalized = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) ? `${value}:00+09:00` : value;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getMonthWindow(now: Date) {
  const start = new Date(now);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setMonth(end.getMonth() + 2);

  return { start, end };
}

function inCurrentOrNextMonth(dateValue: string, now: Date) {
  const date = parseDate(dateValue);
  if (!date) {
    return false;
  }

  const { start, end } = getMonthWindow(now);
  return date >= start && date < end;
}

function hasTokenForPlatform(platform: string) {
  if (platform === "facebook") {
    return Boolean(process.env.FACEBOOK_PAGE_ACCESS_TOKEN);
  }

  if (platform === "instagram") {
    return Boolean(process.env.INSTAGRAM_ACCESS_TOKEN || process.env.FACEBOOK_PAGE_ACCESS_TOKEN) && Boolean(process.env.INSTAGRAM_USER_ID);
  }

  if (platform === "x") {
    return Boolean(process.env.X_ACCESS_TOKEN || process.env.X_USER_ACCESS_TOKEN);
  }

  return true;
}

function addEventAlerts(alerts: OpsAlert[], events: EventItem[], now: Date) {
  for (const event of events) {
    if (event.isPublished === false || !inCurrentOrNextMonth(getString(event.date), now)) {
      continue;
    }

    const title = getString(event.title) || "公開イベント";
    const missing = [
      !getImageUrl(event.image) ? "画像" : "",
      !getString(event.startTime) ? "START" : "",
      !getString(event.reservation) && !getString(event.sourceUrl) ? "予約方法/詳細URL" : "",
      !getString(event.sourceUrl) ? "詳細URL" : ""
    ].filter(Boolean);

    if (missing.length) {
      alerts.push({
        id: `event-${event.id || title}-${missing.join("-")}`,
        severity: "warning",
        sectionId: "events",
        title: `${title} の公開前チェック`,
        detail: `不足: ${missing.join("、")}`
      });
    }
  }
}

function addSocialAlerts(alerts: OpsAlert[], notices: SocialNotice[], now: Date) {
  for (const notice of notices) {
    if (notice.isPublished === false) {
      continue;
    }

    const status = getString(notice.deliveryStatus);
    const platform = getString(notice.platform).toLowerCase();
    const title = getString(notice.title) || "SNS投稿";
    const postId = getString(notice.externalPostId);

    if (status === "failed") {
      alerts.push({
        id: `social-failed-${notice.id || title}`,
        severity: "error",
        sectionId: "social-notices",
        title: `${title} のSNS投稿に失敗`,
        detail: getString(notice.lastPublishError) || "投稿エラーを確認してください。"
      });
    }

    if (status !== "approved" || postId) {
      continue;
    }

    if (getString(notice.postText).length < 10) {
      alerts.push({
        id: `social-text-${notice.id || title}`,
        severity: "warning",
        sectionId: "social-notices",
        title: `${title} の投稿文が不足`,
        detail: "承認済みSNS投稿には投稿文が必要です。"
      });
    }

    if (platform === "instagram" && !getImageUrl(notice.image)) {
      alerts.push({
        id: `social-image-${notice.id || title}`,
        severity: "warning",
        sectionId: "social-notices",
        title: `${title} のInstagram画像が不足`,
        detail: "Instagram API投稿にはhttps画像URLが必要です。"
      });
    }

    if (!hasTokenForPlatform(platform)) {
      alerts.push({
        id: `social-token-${platform}-${notice.id || title}`,
        severity: "warning",
        sectionId: "social-notices",
        title: `${platform.toUpperCase()} 投稿設定が未完了`,
        detail: "APIトークンまたはアカウントIDが未設定です。投稿はスキップされます。"
      });
    }

    const scheduledAt = parseScheduledAt(getString(notice.scheduledAt));
    if (scheduledAt && scheduledAt.getTime() <= now.getTime()) {
      alerts.push({
        id: `social-overdue-${notice.id || title}`,
        severity: "warning",
        sectionId: "social-notices",
        title: `${title} の予約投稿時刻を過ぎています`,
        detail: "次回のSNS投稿ジョブで投稿対象になります。失敗が続く場合は投稿エラーを確認してください。"
      });
    }
  }
}

function addSiteSettingAlerts(alerts: OpsAlert[], settings: SiteSettings) {
  const missing = [
    !getString(settings.facebookUrl) ? "Facebook URL" : "",
    !getString(settings.instagramUrl) ? "Instagram URL" : "",
    !getString(settings.xUrl) ? "X URL" : ""
  ].filter(Boolean);

  if (missing.length) {
    alerts.push({
      id: "site-social-links",
      severity: "warning",
      sectionId: "site-settings",
      title: "店舗SNSリンクが未設定です",
      detail: `不足: ${missing.join("、")}`
    });
  }
}

function unauthorized() {
  return NextResponse.json({ ok: false, message: "ログインしてください。" }, { status: 401 });
}

export async function GET(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return unauthorized();
  }

  try {
    const [eventsResponse, noticesResponse, siteSettings] = await Promise.all([
      getContent("events") as Promise<ListResponse<EventItem>>,
      getContent("social-notices") as Promise<ListResponse<SocialNotice>>,
      getContent("site-settings") as Promise<SiteSettings>
    ]);
    const now = new Date();
    const alerts: OpsAlert[] = [];

    addEventAlerts(alerts, eventsResponse.contents || [], now);
    addSocialAlerts(alerts, noticesResponse.contents || [], now);
    addSiteSettingAlerts(alerts, siteSettings || {});

    return NextResponse.json({
      ok: true,
      data: {
        generatedAt: now.toISOString(),
        alerts
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Could not load operations status."
      },
      { status: 500 }
    );
  }
}
