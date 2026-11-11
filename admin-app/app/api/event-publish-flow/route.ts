import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedRequest } from "@/lib/auth";
import { createContent, facebookEventIdentity, getStoredItems } from "@/lib/microcms";

export const runtime = "nodejs";

type Draft = Record<string, unknown>;

const targetPlatforms = ["facebook", "instagram", "x"] as const;
type TargetPlatform = (typeof targetPlatforms)[number];

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
  return facebookEventIdentity(event) || getString(event.sourceId) || getString(event.id) || getString(event.sourceUrl);
}

function buildBaseEventLines(event: Draft) {
  return {
    title: getString(event.title),
    date: getString(event.date),
    startTime: getString(event.startTime),
    performers: getString(event.performers),
    reservation: getString(event.reservation),
    sourceUrl: getString(event.sourceUrl)
  };
}

function buildPostText(event: Draft, platform: TargetPlatform) {
  const { title, date, startTime, performers, reservation, sourceUrl } = buildBaseEventLines(event);
  const dateLine = date || startTime ? `${date}${startTime ? ` START ${startTime}` : ""}` : "";

  if (platform === "x") {
    return ["Bassic. Event", title, dateLine, performers, sourceUrl, "#Bassic #福岡 #天神 #親不孝通り"]
      .filter(Boolean)
      .join("\n");
  }

  if (platform === "instagram") {
    return [
      "public bar Bassic. event information",
      title,
      dateLine,
      performers,
      reservation,
      sourceUrl ? `詳細: ${sourceUrl}` : "",
      "#Bassic #福岡 #天神 #親不孝通り"
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  return [
    "public bar Bassic. event information",
    title,
    dateLine,
    performers,
    reservation,
    sourceUrl ? `詳細: ${sourceUrl}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

function buildNotice(event: Draft, platform: TargetPlatform) {
  const title = getString(event.title);
  const sourceUrl = getString(event.sourceUrl);
  const date = getString(event.date);
  const startTime = getString(event.startTime);
  const description = [date, startTime ? `START ${startTime}` : "", getString(event.performers)].filter(Boolean).join(" / ");

  return {
    platform,
    title: title ? `${title} (${platform.toUpperCase()})` : `Event announcement (${platform.toUpperCase()})`,
    description: description || title,
    postText: buildPostText(event, platform),
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
  const facebookId = facebookEventIdentity(event);

  return (
    getString(notice.platform) === platform &&
    ((eventKey && getString(notice.sourceEventId) === eventKey) ||
      (facebookId && [notice.sourceEventUrl, notice.url].some((url) => facebookEventIdentity({ sourceUrl: url }) === facebookId)) ||
      (sourceUrl && (getString(notice.sourceEventUrl) === sourceUrl || getString(notice.url) === sourceUrl)))
  );
}

function getPlatforms(values?: string[]) {
  if (!Array.isArray(values)) {
    return [...targetPlatforms];
  }

  const platforms = values.filter((platform): platform is TargetPlatform =>
    targetPlatforms.includes(platform as TargetPlatform)
  );

  return [...new Set(platforms.length ? platforms : targetPlatforms)];
}

export async function POST(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return unauthorized();
  }

  const payload = (await request.json().catch(() => ({}))) as {
    event?: Draft;
    platforms?: string[];
    allowDraftCreation?: boolean;
    eventId?: string;
  };
  let event = payload.event || {};
  if (payload.eventId) {
    try {
      const stored = (await getStoredItems("events")).find(item => item.id === payload.eventId);
      if (!stored) return NextResponse.json({ ok: false, message: "イベントが見つかりません。イベント一覧を確認してください。" }, { status: 404 });
      if (!stored.isPublished) return NextResponse.json({ ok: false, message: "このイベントは非公開です。SNS下書きは作成していません。" }, { status: 409 });
      event = stored;
    } catch {
      return NextResponse.json({ ok: false, message: "保存済みイベントを確認できません。入力を変えずに時間をおいて再確認してください。" }, { status: 502 });
    }
  }
  const platforms = getPlatforms(payload.platforms);

  if (!payload.allowDraftCreation && !event.isPublished) {
    return NextResponse.json({ ok: true, data: { created: [], skipped: ["event is not published"] } });
  }

  if (!getEventKey(event) || !getString(event.title) || !getString(event.date) || !getString(event.startTime)) {
    return NextResponse.json(
      { ok: false, message: "SNS下書きを作るには、イベント名・日付・STARTが必要です。" },
      { status: 400 }
    );
  }

  try {
    const notices = await getStoredItems("social-notices");
    const created: string[] = [];
    const skipped: string[] = [];
    const review: string[] = [];

    for (const platform of platforms) {
      const existing = notices.find((notice) => alreadyQueued(notice, event, platform));
      const candidate = buildNotice(event, platform);
      if (existing) {
        skipped.push(platform);
        if (getString(existing.postText) !== candidate.postText || getImageUrl(existing.image) !== getImageUrl(candidate.image)) {
          review.push(platform);
        }
        continue;
      }

      await createContent("social-notices", candidate);
      created.push(platform);
    }

    return NextResponse.json({ ok: true, data: { created, skipped, review } });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "SNS下書きの作成結果を確認できませんでした。SNS欄を確認してください。"
      },
      { status: 502 }
    );
  }
}
