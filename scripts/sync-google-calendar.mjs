import { readFile } from "node:fs/promises";
import path from "node:path";
import { google } from "googleapis";
import { upsertCalendarEvents } from "./calendar-upsert.mjs";
import { calendarDescription } from "../lib/calendar-event-content.mjs";
import { decodeEventFromStorage, mergeEventRecords } from "../lib/event-storage.mjs";

const root = process.cwd();
const inputPath = process.env.GOOGLE_CALENDAR_SYNC_INPUT || path.join(root, "public", "data", "facebook-events.json");
const writeCalendarId = process.env.GOOGLE_CALENDAR_ID?.trim();
const calendarId =
  writeCalendarId ||
  process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID ||
  "bpi41sabm94gp0sni0ps7vajkc@group.calendar.google.com";
const clearBeforeSync = process.env.GOOGLE_CALENDAR_CLEAR_BEFORE_SYNC === "true";
const syncTag = process.env.GOOGLE_CALENDAR_SYNC_TAG || "bassic-facebook-sync";
const timezone = process.env.GOOGLE_CALENDAR_TIMEZONE || "Asia/Tokyo";
const dryRun = process.env.GOOGLE_CALENDAR_SYNC_DRY_RUN === "true";
const cmsOnly = process.env.GOOGLE_CALENDAR_SYNC_CMS_ONLY === "true";
const failOnWarnings = process.env.GOOGLE_CALENDAR_SYNC_FAIL_ON_WARNINGS === "true";
const allowSyncWarnings = process.env.GOOGLE_CALENDAR_SYNC_ALLOW_WARNINGS === "true";
const siteUrl = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || "https://www.bassic.jp");
let skippedSyncEvents = [];
let inputFileWarning = "";

async function main() {
  if (clearBeforeSync) {
    throw new Error("カレンダーの一括削除は無効です。GOOGLE_CALENDAR_CLEAR_BEFORE_SYNC=false にしてください。");
  }
  if (!dryRun && !writeCalendarId) {
    throw new Error("書き込み先の GOOGLE_CALENDAR_ID を明示してください。");
  }
  const events = await readEvents();
  if (inputFileWarning && dryRun) {
    console.log(`警告: ${inputFileWarning}`);
  }
  if (!events.length) {
    if (inputFileWarning && !dryRun) {
      throw new Error(inputFileWarning);
    }
    if (skippedSyncEvents.length) {
      for (const skipped of skippedSyncEvents) {
        console.log(`警告: 公開中のイベント「${getEventLabel(skipped)}」は、イベント名または日付が未入力のため同期対象から外しました。`);
      }
      const message = `公開中イベント ${skippedSyncEvents.length} 件に、イベント名または日付の未入力があります。管理画面で直してから同期してください。`;
      if (dryRun && !failOnWarnings) {
        console.log(`\n確認のみ完了: 警告 ${skippedSyncEvents.length} 件。${message}`);
        return;
      }
      throw new Error(message);
    }
    console.log(`同期対象イベントがありません。Google Calendarは変更していません。入力元: ${inputPath}`);
    return;
  }

  if (dryRun) {
    let warningCount = skippedSyncEvents.length + (inputFileWarning ? 1 : 0);
    console.log(`確認のみ: ${events.length} 件のイベントを Google Calendar ${calendarId} へ同期予定です。`);
    for (const skipped of skippedSyncEvents) {
      console.log(`警告: 公開中のイベント「${getEventLabel(skipped)}」は、イベント名または日付が未入力のため同期対象から外しました。`);
    }
    events.forEach((event, index) => {
      const googleEvent = toGoogleCalendarEvent(event);
      console.log(`\n[${index + 1}/${events.length}] ${googleEvent.summary}`);
      for (const warning of collectEventWarnings(event)) {
        warningCount += 1;
        console.log(`警告: ${warning}`);
      }
      console.log(
        JSON.stringify(
          {
            summary: googleEvent.summary,
            visibility: googleEvent.visibility,
            start: googleEvent.start,
            end: googleEvent.end,
            source: googleEvent.source,
            description: googleEvent.description
          },
          null,
          2
        )
      );
    });
    if (warningCount) {
      console.log(`\n確認のみ完了: 警告 ${warningCount} 件。同期前に管理画面のイベント内容を直してください。`);
    } else {
      console.log("\n確認のみ完了: 警告はありません。");
    }
    if (warningCount && failOnWarnings) {
      throw new Error(`警告 ${warningCount} 件があります。Google Calendarへ反映する前にイベント内容を直してください。`);
    }
    return;
  }

  const auth = getAuthClient();
  const calendar = google.calendar({ version: "v3", auth });

  if (skippedSyncEvents.length) {
    throw new Error(
      `公開中イベント ${skippedSyncEvents.length} 件に、イベント名または日付の未入力があります。npm run sync:calendar:check で内容を確認し、管理画面で直してから同期してください。`
    );
  }

  const syncWarnings = collectSyncWarnings(events);
  if (syncWarnings.length && !allowSyncWarnings) {
    throw new Error(
      [
        `警告 ${syncWarnings.length} 件があります。npm run sync:calendar:check で内容を確認し、管理画面で直してから同期してください。`,
        ...syncWarnings.map((warning) => `- ${warning}`)
      ].join("\n")
    );
  }

  const result = await upsertCalendarEvents({
    calendar, calendarId, syncTag,
    entries: events.map(event => ({
      key: getEventDedupeKey(event),
      sourceId: event.sourceId || event.id || getEventDedupeKey(event),
      sourceUpdatedAt: event.updatedAt,
      body: toGoogleCalendarEvent(event)
    }))
  });
  console.log(`Google Calendar ${calendarId} へ追加 ${result.inserted} 件、更新 ${result.updated} 件、変更なし ${result.unchanged} 件。既存予定は削除していません。`);
}

async function readEvents() {
  const managedEvents = await readManagedFacebookEvents();
  const fileEvents = cmsOnly ? [] : await readInputFileEvents();
  const events = dedupeEvents([...managedEvents, ...fileEvents]);
  skippedSyncEvents = events.filter((event) => event.isPublished && (!event.title || !event.date));
  return events.filter((event) => event.isPublished && event.title && event.date);
}

async function readInputFileEvents() {
  try {
    const data = JSON.parse((await readFile(inputPath, "utf8")).replace(/^\uFEFF/, ""));
    return (data.events || []).map(normalizeEvent).filter(Boolean);
  } catch (error) {
    inputFileWarning = `カレンダー同期用入力ファイルを読み取れませんでした。${inputPath}: ${error instanceof Error ? error.message : String(error)}`;
    return [];
  }
}

async function readManagedFacebookEvents() {
  const serviceDomain = process.env.MICROCMS_SERVICE_DOMAIN;
  const apiKey = process.env.MICROCMS_API_KEY;

  if (!serviceDomain || !apiKey) {
    if (cmsOnly) throw new Error("CMSの接続情報がないため同期を停止しました。");
    return [];
  }

  async function readAll(endpoint) {
    const contents = [], ids = new Set();
    for (let offset = 0; ; offset += 100) {
      const response = await fetch(`https://${serviceDomain}.microcms.io/api/v1/${endpoint}?limit=100&offset=${offset}`, {
        headers: { "X-MICROCMS-API-KEY": apiKey },
        cache: "no-store",
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        throw new Error(`CMSイベントを取得できないため、カレンダー同期を停止しました (${response.status})。`);
      }

      const data = await response.json();
      if (!Array.isArray(data.contents)) {
        throw new Error("CMSイベントの応答形式が不正なため、カレンダー同期を停止しました。");
      }
      for (const item of data.contents) {
        if (!item || typeof item.id !== "string" || ids.has(item.id)) throw new Error("CMS一覧を最後まで確認できないため、カレンダー同期を停止しました。");
        ids.add(item.id);
      }
      contents.push(...data.contents);
      if (data.contents.length < 100 || contents.length >= data.totalCount) break;
    }
    return contents;
  }
  const contents = mergeEventRecords(await readAll("events"), await readAll("menu"));
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: timezone, dateStyle: "short" }).format(new Date());
  return contents
    .map(normalizeEvent)
    .filter((event) => event && event.isPublished === true && isFacebookEvent(event) && (!cmsOnly || !event.date || event.date >= today));
}

function normalizeEvent(event) {
  event = decodeEventFromStorage(event);
  if (!event || event.sourceType === "google_calendar") {
    return null;
  }

  return {
    ...event,
    date: normalizeDate(event.date),
    sourceType: event.sourceType || (isFacebookUrl(event.sourceUrl) ? "facebook" : event.sourceType),
    sourceUrl: typeof event.sourceUrl === "string" ? normalizeFacebookUrl(event.sourceUrl) || event.sourceUrl.trim() : event.sourceUrl
  };
}

function normalizeDate(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function isFacebookEvent(event) {
  return event.sourceType === "facebook" || isFacebookUrl(event.sourceUrl);
}

function isFacebookUrl(value) {
  return Boolean(getFacebookEventId(value));
}

function normalizeFacebookUrl(value) {
  const id = getFacebookEventId(value);
  return id ? `https://www.facebook.com/events/${id}/` : "";
}

function dedupeEvents(events) {
  const byKey = new Map();

  for (const event of events.filter(Boolean)) {
    const key = getEventDedupeKey(event);
    if (!byKey.has(key)) {
      byKey.set(key, event);
    }
  }

  return [...byKey.values()].sort((a, b) => `${a.date}${a.startTime || a.openTime || ""}`.localeCompare(`${b.date}${b.startTime || b.openTime || ""}`));
}

function getEventDedupeKey(event) {
  const sourceUrl = typeof event.sourceUrl === "string" ? event.sourceUrl.trim().replace(/\/$/, "") : "";
  const facebookEventId = getFacebookEventId(sourceUrl);
  return facebookEventId ? `facebook-${facebookEventId}` : event.sourceId ? `source-${event.sourceId}` : sourceUrl || event.id || `${event.date}-${event.title}`;
}

function getFacebookEventId(value) {
  if (!value) {
    return "";
  }

  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    if (host !== "facebook.com" && host !== "m.facebook.com" && host !== "mbasic.facebook.com" && host !== "fb.me") {
      return "";
    }

    const eventsPath = url.pathname.match(/\/events\/(.+)/)?.[1] || "";
    if (!eventsPath) {
      return "";
    }

    return [...eventsPath
      .split("/")
      .map((part) => part.trim())
      .filter(Boolean)]
      .reverse()
      .find((part) => /^\d{6,}$/.test(part)) || "";
  } catch {
    return "";
  }
}

function collectSyncWarnings(events) {
  const warnings = [];

  for (const event of events) {
    for (const warning of collectEventWarnings(event)) {
      warnings.push(`${getEventLabel(event)}: ${warning}`);
    }
  }

  return warnings;
}

function collectEventWarnings(event) {
  const warnings = [];

  if (event.sourceType === "facebook" && !getFacebookEventId(event.sourceUrl)) {
    warnings.push("FacebookイベントURLが個別イベントURLではない可能性があります。例: https://www.facebook.com/events/1234567890/");
  }

  if (cmsOnly && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(event.startTime || "")) {
    warnings.push("確認済みの開始時刻が必要です。管理画面でSTARTを入力してください。");
  } else if (!event.startTime && !event.openTime) {
    warnings.push("開始時間が未入力です。Google Calendarには20:00開始として登録されます。");
  }

  if (event.endTime && !extractTime(event.endTime)) {
    warnings.push("終了時間から時刻を読み取れません。例: 22:00");
  }

  if (!cmsOnly && event.sourceType === "facebook" && !event.image?.url) {
    warnings.push("画像URLが未入力です。Google Calendarの説明欄に画像リンクは入りません。");
  }

  if (event.image?.url && !isUsableCalendarImageUrl(event.image.url)) {
    warnings.push("画像URLは https:// で始まる外部URL、または / で始まるサイト内URLを指定してください。");
  }

  if (event.image?.url?.startsWith("/") && !siteUrl) {
    warnings.push("サイト内画像URLをGoogle Calendar用のURLに変換できません。NEXT_PUBLIC_SITE_URL または NEXT_PUBLIC_PUBLIC_SITE_URL を確認してください。");
  }

  return warnings;
}

function isUsableCalendarImageUrl(value) {
  if (typeof value !== "string") {
    return false;
  }

  const imageUrl = value.trim();
  return imageUrl.startsWith("https://") || imageUrl.startsWith("/");
}

function getAuthClient() {
  const credentials = getCredentials();
  return new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ["https://www.googleapis.com/auth/calendar"]
  });
}

function getCredentials() {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  }

  if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
    return {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, "\n")
    };
  }

  throw new Error(
    "Google Calendarへ書き込むための認証情報がありません。GOOGLE_SERVICE_ACCOUNT_JSON、または GOOGLE_SERVICE_ACCOUNT_EMAIL と GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY を設定してください。"
  );
}

function toGoogleCalendarEvent(event) {
  const startTime = extractTime(event.startTime) || extractTime(event.openTime) || "20:00";
  const endTime = extractTime(event.endTime);
  const startDateTime = `${event.date}T${startTime}:00`;
  const endDateTime = endTime ? getEndDateTime(event.date, startTime, endTime) : addHours(startDateTime, 2);

  return {
    summary: event.title,
    visibility: "public",
    description: calendarDescription(event, siteUrl),
    location: "public bar Bassic.",
    start: {
      dateTime: startDateTime,
      timeZone: timezone
    },
    end: {
      dateTime: endDateTime,
      timeZone: timezone
    },
    source: event.sourceUrl
      ? {
          title: event.sourceType === "facebook" ? "Facebookイベント" : "イベント詳細",
          url: event.sourceUrl
        }
      : undefined,
    extendedProperties: {
      private: {
        syncTag,
        sourceId: event.sourceId || event.id || getEventDedupeKey(event),
        sourceType: event.sourceType || "facebook"
      }
    }
  };
}

function extractTime(value) {
  if (!value) {
    return "";
  }

  const match = String(value).match(/(\d{1,2})\s*(?::|：)\s*(\d{2})|(\d{1,2})\s*時\s*(\d{1,2})?\s*分?/);
  if (!match) {
    return "";
  }

  const hour = match[1] || match[3];
  const minute = match[2] || match[4] || "00";
  if (!isValidClockTime(hour, minute)) {
    return "";
  }

  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

function isValidClockTime(hour, minute) {
  const hours = Number(hour);
  const minutes = Number(minute);
  return Number.isInteger(hours) && Number.isInteger(minutes) && hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

function normalizeSiteUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function getEventLabel(event) {
  return event.title || event.sourceUrl || event.id || event.sourceId || "タイトル未入力のイベント";
}

function getEndDateTime(date, startTime, endTime) {
  const start = new Date(`${date}T${startTime}:00+09:00`);
  const end = new Date(`${date}T${endTime}:00+09:00`);

  if (end <= start) {
    end.setDate(end.getDate() + 1);
  }

  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  })
    .format(end)
    .replace(" ", "T");
}

function addHours(localDateTime, hours) {
  const date = new Date(`${localDateTime}+09:00`);
  date.setHours(date.getHours() + hours);
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  })
    .format(date)
    .replace(" ", "T");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
