import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedRequest } from "@/lib/auth";
import { createContent, getContent } from "@/lib/microcms";

export const runtime = "nodejs";

type Draft = Record<string, unknown>;

type ListResponse = {
  contents?: Array<Draft & { id?: string }>;
};

const targetPlatforms = ["facebook", "instagram", "x"] as const;

function unauthorized() {
  return NextResponse.json({ ok: false, message: "ログインしてください。" }, { status: 401 });
}

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getImageUrl(value: unknown) {
  if (typeof value === "object" && value && "url" in value) {
    return getString((value as { url?: unknown }).url);
  }

  return getString(value);
}

function getEventKey(event: Draft) {
  return getString(event.sourceId) || getString(event.id) || getString(event.sourceUrl);
}

function buildBaseEventLines(event: Draft) {
  const title = getString(event.title);
  const date = getString(event.date);
  const startTime = getString(event.startTime);
  const performers = getString(event.performers);
  const reservation = getString(event.reservation);
  const sourceUrl = getString(event.sourceUrl);

  return {
    title,
    date,
    startTime,
    performers,
    reservation,
    sourceUrl
  };
}

function buildPostText(event: Draft, platform: (typeof targetPlatforms)[number]) {
  const { title, date, startTime, performers, reservation, sourceUrl } = buildBaseEventLines(event);
  const lines = [
    platform === "x" ? "【Bassic. Event】" : "public bar Bassic. event information",
    title,
    date || startTime ? `${date}${startTime ? ` START ${startTime}` : ""}` : "",
    performers,
    reservation,
    sourceUrl ? `詳細: ${sourceUrl}` : ""
  ].filter(Boolean);

  const hashtags = platform === "x" ? "\n#Bassic #福岡 #天神 #親不孝通り" : "";
  return `${lines.join("\n")}${hashtags}`;
}

function buildNotice(event: Draft, platform: (typeof targetPlatforms)[number]) {
  const title = getString(event.title);
  const sourceUrl = getString(event.sourceUrl);
  const date = getString(event.date);
  const startTime = getString(event.startTime);
  const postText = buildPostText(event, platform);
  const description = [date, startTime ? `START ${startTime}` : "", getString(event.performers)].filter(Boolean).join(" / ");

  return {
    platform,
    title: title ? `${title} (${platform.toUpperCase()})` : `Event announcement (${platform.toUpperCase()})`,
    description: description || title,
    postText,
    url: sourceUrl,
    date,
    deliveryStatus: "draft",
    externalPostId: "",
    lastPublishError: "",
    sourceEventId: getEventKey(event),
    sourceEventUrl: sourceUrl,
    sourceEventTitle: title,
    image: getImageUrl(event.image) ? event.image : undefined,
    isPublished: false
  };
}

function alreadyQueued(notice: Draft, event: Draft, platform: string) {
  const eventKey = getEventKey(event);
  const sourceUrl = getString(event.sourceUrl);

  return (
    getString(notice.platform) === platform &&
    ((eventKey && getString(notice.sourceEventId) === eventKey) ||
      (sourceUrl && (getString(notice.sourceEventUrl) === sourceUrl || getString(notice.url) === sourceUrl)))
  );
}

export async function POST(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return unauthorized();
  }

  const payload = (await request.json().catch(() => ({}))) as { event?: Draft };
  const event = payload.event || {};

  if (!event.isPublished) {
    return NextResponse.json({ ok: true, data: { created: [], skipped: ["event is not published"] } });
  }

  if (!getString(event.title) || !getString(event.date) || !getString(event.startTime)) {
    return NextResponse.json(
      { ok: false, message: "SNS配信待ちを作るには、イベント名・日付・STARTが必要です。" },
      { status: 400 }
    );
  }

  try {
    const existing = (await getContent("social-notices")) as ListResponse;
    const notices = existing.contents || [];
    const created: string[] = [];
    const skipped: string[] = [];

    for (const platform of targetPlatforms) {
      if (notices.some((notice) => alreadyQueued(notice, event, platform))) {
        skipped.push(platform);
        continue;
      }

      await createContent("social-notices", buildNotice(event, platform));
      created.push(platform);
    }

    return NextResponse.json({ ok: true, data: { created, skipped } });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "SNS配信待ちの作成に失敗しました。"
      },
      { status: 502 }
    );
  }
}
