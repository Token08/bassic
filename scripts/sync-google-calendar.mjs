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

async function main() {
  const events = await readEvents();
  if (!events.length) {
    console.log(`No events found in ${inputPath}. Google Calendar was not changed.`);
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
  const data = JSON.parse(await readFile(inputPath, "utf8"));
  return (data.events || []).filter((event) => event.isPublished && event.title && event.date);
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
  const startTime = event.startTime || event.openTime || "20:00";
  const startDateTime = `${event.date}T${startTime}:00`;
  const endDateTime = addHours(startDateTime, 2);

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
