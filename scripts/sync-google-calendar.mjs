import { readFile } from "node:fs/promises";
import path from "node:path";
import { google } from "googleapis";

const root = process.cwd();
const inputPath = process.env.GOOGLE_CALENDAR_SYNC_INPUT || path.join(root, "public", "data", "facebook-events.json");
const calendarId =
  process.env.GOOGLE_CALENDAR_ID ||
  process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID ||
  "bpi41sabm94gp0sni0ps7vajkc@group.calendar.google.com";
const clearBeforeSync = process.env.GOOGLE_CALENDAR_CLEAR_BEFORE_SYNC === "true";
const syncTag = process.env.GOOGLE_CALENDAR_SYNC_TAG || "bassic-facebook-sync";
const timezone = process.env.GOOGLE_CALENDAR_TIMEZONE || "Asia/Tokyo";
const dryRun = process.env.GOOGLE_CALENDAR_SYNC_DRY_RUN === "true";
const failOnWarnings = process.env.GOOGLE_CALENDAR_SYNC_FAIL_ON_WARNINGS === "true";

async function main() {
  const events = await readEvents();
  if (!events.length) {
    console.log(`No events found in ${inputPath}. Google Calendar was not changed.`);
    return;
  }

  if (dryRun) {
    let warningCount = 0;
    console.log(`Dry run: ${events.length} event(s) would be synced to Google Calendar ${calendarId}`);
    events.forEach((event, index) => {
      const googleEvent = toGoogleCalendarEvent(event);
      console.log(`\n[${index + 1}/${events.length}] ${googleEvent.summary}`);
      for (const warning of collectEventWarnings(event)) {
        warningCount += 1;
        console.log(`Warning: ${warning}`);
      }
      console.log(
        JSON.stringify(
          {
            summary: googleEvent.summary,
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
    if (warningCount && failOnWarnings) {
      throw new Error(`Dry run found ${warningCount} warning(s). Fix the event data before syncing.`);
    }
    return;
  }

  const auth = getAuthClient();
  const calendar = google.calendar({ version: "v3", auth });

  if (clearBeforeSync) {
    await clearCalendar(calendar);
  } else {
    await clearSyncedEvents(calendar);
  }

  for (const event of events) {
    await calendar.events.insert({
      calendarId,
      requestBody: toGoogleCalendarEvent(event)
    });
  }

  console.log(`Synced ${events.length} event(s) to Google Calendar ${calendarId}`);
}

async function readEvents() {
  const managedEvents = await readManagedFacebookEvents();
  const fileEvents = await readInputFileEvents();
  return dedupeEvents([...managedEvents, ...fileEvents]).filter((event) => event.isPublished && event.title && event.date);
}

async function readInputFileEvents() {
  try {
    const data = JSON.parse(await readFile(inputPath, "utf8"));
    return (data.events || []).map(normalizeEvent).filter(Boolean);
  } catch {
    return [];
  }
}

async function readManagedFacebookEvents() {
  const serviceDomain = process.env.MICROCMS_SERVICE_DOMAIN;
  const apiKey = process.env.MICROCMS_API_KEY;

  if (!serviceDomain || !apiKey) {
    return [];
  }

  try {
    const response = await fetch(`https://${serviceDomain}.microcms.io/api/v1/events?limit=100&orders=-date`, {
      headers: {
        "X-MICROCMS-API-KEY": apiKey
      },
      cache: "no-store"
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return (data.contents || [])
      .map(normalizeEvent)
      .filter((event) => event && event.isPublished && isFacebookEvent(event));
  } catch {
    return [];
  }
}

function normalizeEvent(event) {
  if (!event) {
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
  return facebookEventId ? `facebook-${facebookEventId}` : sourceUrl || event.sourceId || event.id || `${event.date}-${event.title}`;
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

    return url.pathname.match(/\/events\/(\d+)/)?.[1] || "";
  } catch {
    return "";
  }
}

function collectEventWarnings(event) {
  const warnings = [];

  if (event.sourceType === "facebook" && !getFacebookEventId(event.sourceUrl)) {
    warnings.push("FacebookイベントURLが個別イベントURLではない可能性があります。例: https://www.facebook.com/events/1234567890/");
  }

  if (!event.startTime && !event.openTime) {
    warnings.push("開始時間が未入力です。Google Calendarには20:00開始として登録されます。");
  }

  if (event.endTime && !extractTime(event.endTime)) {
    warnings.push("終了時間から時刻を読み取れません。例: 22:00");
  }

  if (event.sourceType === "facebook" && !event.image?.url) {
    warnings.push("画像URLが未入力です。Google Calendarの説明欄に画像リンクは入りません。");
  }

  return warnings;
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
    "Google Calendar write credentials are missing. Set GOOGLE_SERVICE_ACCOUNT_JSON, or GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY."
  );
}

async function clearCalendar(calendar) {
  console.log(`Clearing all events from Google Calendar ${calendarId}`);
  await deleteEvents(calendar, {});
}

async function clearSyncedEvents(calendar) {
  await deleteEvents(calendar, { privateExtendedProperty: `syncTag=${syncTag}` });
}

async function deleteEvents(calendar, extraParams) {
  let pageToken;

  do {
    const response = await calendar.events.list({
      calendarId,
      maxResults: 2500,
      showDeleted: false,
      singleEvents: false,
      pageToken,
      ...extraParams
    });

    for (const event of response.data.items || []) {
      if (event.id) {
        await calendar.events.delete({ calendarId, eventId: event.id });
      }
    }

    pageToken = response.data.nextPageToken;
  } while (pageToken);
}

function toGoogleCalendarEvent(event) {
  const startTime = extractTime(event.startTime) || extractTime(event.openTime) || "20:00";
  const endTime = extractTime(event.endTime);
  const startDateTime = `${event.date}T${startTime}:00`;
  const endDateTime = endTime ? getEndDateTime(event.date, startTime, endTime) : addHours(startDateTime, 2);

  return {
    summary: event.title,
    description: buildDescription(event),
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
          title: "Facebook event",
          url: event.sourceUrl
        }
      : undefined,
    extendedProperties: {
      private: {
        syncTag,
        sourceId: event.sourceId || event.id,
        sourceType: event.sourceType || "facebook"
      }
    }
  };
}

function buildDescription(event) {
  return [
    event.performers,
    event.reservation,
    event.sourceUrl ? `Facebook: ${event.sourceUrl}` : "",
    event.image?.url ? `Image: ${event.image.url}` : ""
  ]
    .filter(Boolean)
    .join("\n\n");
}

function extractTime(value) {
  if (!value) {
    return "";
  }

  const match = String(value).match(/(\d{1,2})[:時](\d{2})?/);
  if (!match) {
    return "";
  }

  return `${match[1].padStart(2, "0")}:${(match[2] || "00").padStart(2, "0")}`;
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
