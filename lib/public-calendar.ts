import { externalEmbeds } from "./editable-content";

export type PublicCalendarItem = {
  id: string;
  date: string;
  title: string;
  type: "event" | "holiday";
};

function unfoldIcs(value: string) {
  return value.replace(/\r?\n[ \t]/g, "");
}

function readField(block: string, name: string) {
  const match = block.match(new RegExp(`^${name}(?:;[^:]*)?:(.*)$`, "m"));
  return match?.[1]?.replace(/\\,/g, ",").replace(/\\n/g, " ").trim() || "";
}

function toDateKey(value: string) {
  const match = value.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!match) return "";
  return `${match[1]}-${match[2]}-${match[3]}`;
}

function isHoliday(title: string) {
  return /店休日|休業|休み|closed/i.test(title);
}

function todayKey() {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return formatter.format(new Date());
}

export function parsePublicCalendarIcs(ics: string, fromDate = todayKey()): PublicCalendarItem[] {
  const blocks = unfoldIcs(ics).split("BEGIN:VEVENT").slice(1);

  return blocks
    .map((block, index) => {
      const rawStart = readField(block, "DTSTART");
      const title = readField(block, "SUMMARY");
      const date = toDateKey(rawStart);
      if (!date || !title || date < fromDate) return null;

      return {
        id: readField(block, "UID") || `${date}-${index}`,
        date,
        title,
        type: isHoliday(title) ? "holiday" : "event"
      } satisfies PublicCalendarItem;
    })
    .filter((item): item is PublicCalendarItem => Boolean(item))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getPublicCalendarItems() {
  try {
    const response = await fetch(externalEmbeds.googleCalendarIcsUrl);

    if (!response.ok) return [];
    return parsePublicCalendarIcs(await response.text());
  } catch {
    return [];
  }
}
